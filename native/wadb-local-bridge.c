#define _GNU_SOURCE
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <poll.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

#define TOKEN_LEN 64
#define MAX_CMD (1024 * 1024)
#define MAX_OUT (16 * 1024 * 1024)
#define MAGIC "WB01"
#define MAX_CLIENTS 8
#define AUTH_TIMEOUT_MS 2000
#define FRAME_TIMEOUT_MS 10000
#define RESPONSE_TIMEOUT_MS 10000
#define COMMAND_TIMEOUT_MS 120000

static volatile sig_atomic_t keep_running = 1;
static volatile sig_atomic_t worker_changed = 0;

static int64_t monotonic_ms(void) {
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0) return -1;
    return (int64_t)ts.tv_sec * 1000 + (int64_t)(ts.tv_nsec / 1000000);
}

static ssize_t read_full_timeout(int fd, void *buf, size_t n, int timeout_ms) {
    size_t off = 0;
    int64_t start = monotonic_ms();
    if (start < 0) return -1;
    int64_t deadline = start + timeout_ms;

    while (off < n) {
        int64_t now = monotonic_ms();
        if (now < 0 || now >= deadline) {
            errno = ETIMEDOUT;
            return -1;
        }
        int64_t remaining = deadline - now;
        int wait_ms = remaining > 2147483647 ? 2147483647 : (int)remaining;
        struct pollfd pfd = { .fd = fd, .events = POLLIN, .revents = 0 };
        int ready = poll(&pfd, 1, wait_ms);
        if (ready == 0) {
            errno = ETIMEDOUT;
            return -1;
        }
        if (ready < 0) {
            if (errno == EINTR) continue;
            return -1;
        }

        ssize_t r = recv(fd, (char *)buf + off, n - off, 0);
        if (r == 0) return -1;
        if (r < 0) {
            if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
            return -1;
        }
        off += (size_t)r;
    }
    return (ssize_t)off;
}

static int write_full_timeout(int fd, const void *buf, size_t n, int timeout_ms) {
    size_t off = 0;
    int64_t start = monotonic_ms();
    if (start < 0) return -1;
    int64_t deadline = start + timeout_ms;

    while (off < n) {
        int64_t now = monotonic_ms();
        if (now < 0 || now >= deadline) {
            errno = ETIMEDOUT;
            return -1;
        }
        int64_t remaining = deadline - now;
        int wait_ms = remaining > 2147483647 ? 2147483647 : (int)remaining;
        struct pollfd pfd = { .fd = fd, .events = POLLOUT, .revents = 0 };
        int ready = poll(&pfd, 1, wait_ms);
        if (ready == 0) {
            errno = ETIMEDOUT;
            return -1;
        }
        if (ready < 0) {
            if (errno == EINTR) continue;
            return -1;
        }

        ssize_t w = send(fd, (const char *)buf + off, n - off, MSG_NOSIGNAL);
        if (w < 0) {
            if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
            return -1;
        }
        if (w == 0) return -1;
        off += (size_t)w;
    }
    return 0;
}

static int token_equal(const char *a, const char *b) {
    unsigned char diff = 0;
    for (int i = 0; i < TOKEN_LEN; ++i) diff |= (unsigned char)(a[i] ^ b[i]);
    return diff == 0;
}

static int load_token(const char *path, char out[TOKEN_LEN + 1]) {
    int fd = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return -1;
    ssize_t n = read(fd, out, TOKEN_LEN + 1);
    close(fd);
    if (n < TOKEN_LEN) return -1;
    out[TOKEN_LEN] = 0;
    for (int i = 0; i < TOKEN_LEN; ++i) {
        char c = out[i];
        if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))) return -1;
    }
    return 0;
}

static void daemonize(void) {
    pid_t p = fork();
    if (p < 0) exit(2);
    if (p > 0) exit(0);
    if (setsid() < 0) exit(3);
    signal(SIGHUP, SIG_IGN);
    signal(SIGPIPE, SIG_IGN);
    p = fork();
    if (p < 0) exit(4);
    if (p > 0) exit(0);
    chdir("/");
    int n = open("/dev/null", O_RDWR);
    if (n >= 0) {
        dup2(n, STDIN_FILENO);
        dup2(n, STDOUT_FILENO);
        dup2(n, STDERR_FILENO);
        if (n > STDERR_FILENO) close(n);
    }
    umask(077);
    prctl(PR_SET_NAME, "wadb_local_br", 0, 0, 0);
}

static void stop_handler(int sig) {
    (void)sig;
    keep_running = 0;
}

static void child_handler(int sig) {
    (void)sig;
    worker_changed = 1;
}

static int send_response(int fd, int status, const char *data, uint32_t len) {
    uint32_t s = htonl((uint32_t)status);
    uint32_t l = htonl(len);
    if (write_full_timeout(fd, MAGIC, 4, RESPONSE_TIMEOUT_MS) < 0) return -1;
    if (write_full_timeout(fd, &s, 4, RESPONSE_TIMEOUT_MS) < 0) return -1;
    if (write_full_timeout(fd, &l, 4, RESPONSE_TIMEOUT_MS) < 0) return -1;
    if (len && write_full_timeout(fd, data, len, RESPONSE_TIMEOUT_MS) < 0) return -1;
    return 0;
}

static void terminate_command_group(pid_t pid) {
    if (pid > 0) {
        if (kill(-pid, SIGKILL) != 0) kill(pid, SIGKILL);
    }
}

static void handle_client(int c, const char token[TOKEN_LEN + 1], pid_t server_pid) {
    struct sockaddr_in peer;
    socklen_t plen = sizeof(peer);
    if (getpeername(c, (struct sockaddr *)&peer, &plen) != 0 ||
        peer.sin_family != AF_INET ||
        ntohl(peer.sin_addr.s_addr) != INADDR_LOOPBACK) {
        return;
    }

    int flags = fcntl(c, F_GETFL, 0);
    if (flags < 0 || fcntl(c, F_SETFL, flags | O_NONBLOCK) < 0) return;

    char supplied[TOKEN_LEN];
    if (read_full_timeout(c, supplied, TOKEN_LEN, AUTH_TIMEOUT_MS) < 0 ||
        !token_equal(token, supplied)) {
        return;
    }

    uint32_t ncmd;
    if (read_full_timeout(c, &ncmd, 4, FRAME_TIMEOUT_MS) < 0) return;
    uint32_t cmdlen = ntohl(ncmd);
    if (cmdlen == 0 || cmdlen > MAX_CMD) return;

    char *cmd = calloc(1, (size_t)cmdlen + 1);
    if (!cmd) return;
    if (read_full_timeout(c, cmd, cmdlen, FRAME_TIMEOUT_MS) < 0) {
        free(cmd);
        return;
    }

    if (strcmp(cmd, "__WADB_BRIDGE_PING__") == 0) {
        char b[256];
        int n = snprintf(b, sizeof(b),
                         "WADB_SECURE_BRIDGE_OK uid=%d gid=%d pid=%d ppid=%d\n",
                         getuid(), getgid(), getpid(), getppid());
        if (n > 0 && (size_t)n < sizeof(b)) send_response(c, 0, b, (uint32_t)n);
        free(cmd);
        return;
    }

    if (strcmp(cmd, "__WADB_BRIDGE_STOP__") == 0) {
        const char *m = "WADB_SECURE_BRIDGE_STOPPING\n";
        if (send_response(c, 0, m, (uint32_t)strlen(m)) == 0) {
            (void)kill(server_pid, SIGTERM);
        }
        free(cmd);
        return;
    }

    int pfd[2];
    if (pipe2(pfd, O_CLOEXEC) != 0) {
        const char *m = "bridge pipe failed\n";
        send_response(c, 126, m, (uint32_t)strlen(m));
        free(cmd);
        return;
    }

    pid_t p = fork();
    if (p < 0) {
        close(pfd[0]); close(pfd[1]);
        const char *m = "bridge fork failed\n";
        send_response(c, 126, m, (uint32_t)strlen(m));
        free(cmd);
        return;
    }

    if (p == 0) {
        (void)setpgid(0, 0);
        dup2(pfd[1], STDOUT_FILENO);
        dup2(pfd[1], STDERR_FILENO);
        close(pfd[0]); close(pfd[1]);
        execl("/system/bin/sh", "sh", "-c", cmd, (char *)NULL);
        _exit(127);
    }
    (void)setpgid(p, p);
    close(pfd[1]);

    size_t cap = 8192, used = 0;
    char *out = malloc(cap);
    int truncated = 0;
    int timed_out = 0;
    if (!out) {
        close(pfd[0]);
        terminate_command_group(p);
        waitpid(p, NULL, 0);
        const char *m = "bridge memory failed\n";
        send_response(c, 126, m, (uint32_t)strlen(m));
        free(cmd);
        return;
    }

    int64_t start = monotonic_ms();
    int64_t deadline = start < 0 ? 0 : start + COMMAND_TIMEOUT_MS;
    for (;;) {
        int64_t now = monotonic_ms();
        if (now < 0 || now >= deadline) {
            timed_out = 1;
            terminate_command_group(p);
            break;
        }
        int64_t remaining = deadline - now;
        int wait_ms = remaining > 2147483647 ? 2147483647 : (int)remaining;
        struct pollfd opfd = { .fd = pfd[0], .events = POLLIN, .revents = 0 };
        int ready = poll(&opfd, 1, wait_ms);
        if (ready == 0) {
            timed_out = 1;
            terminate_command_group(p);
            break;
        }
        if (ready < 0) {
            if (errno == EINTR) continue;
            terminate_command_group(p);
            break;
        }

        char sink[4096];
        void *dest = used < cap ? (void *)(out + used) : (void *)sink;
        size_t room = used < cap ? cap - used : sizeof(sink);
        if (used >= MAX_OUT) {
            truncated = 1;
            terminate_command_group(p);
            break;
        }
        ssize_t r = read(pfd[0], dest, room);
        if (r > 0) {
            if (used < cap) {
                used += (size_t)r;
                if (used == cap && cap < MAX_OUT) {
                    size_t next = cap * 2;
                    if (next > MAX_OUT) next = MAX_OUT;
                    char *tmp = realloc(out, next);
                    if (tmp) {
                        out = tmp;
                        cap = next;
                    } else {
                        truncated = 1;
                        terminate_command_group(p);
                        break;
                    }
                }
            }
            continue;
        }
        if (r == 0) break;
        if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
        break;
    }

    close(pfd[0]);
    int st = 0;
    if (timed_out || truncated) terminate_command_group(p);
    while (waitpid(p, &st, 0) < 0 && errno == EINTR) {}
    int rc = WIFEXITED(st) ? WEXITSTATUS(st)
                           : (WIFSIGNALED(st) ? 128 + WTERMSIG(st) : 125);
    if (truncated) rc = 125;
    if (timed_out) rc = 124;
    (void)send_response(c, rc, out, (uint32_t)used);
    free(out);
    free(cmd);
}

static void reap_workers(pid_t workers[MAX_CLIENTS]) {
    for (int i = 0; i < MAX_CLIENTS; ++i) {
        if (workers[i] <= 0) continue;
        int status = 0;
        pid_t r = waitpid(workers[i], &status, WNOHANG);
        if (r == workers[i] || (r < 0 && errno == ECHILD)) workers[i] = 0;
    }
}

int main(int argc, char **argv) {
    if (argc < 2 || argc > 3) return 64;

    int port = argc == 3 ? atoi(argv[2]) : 47173;
    if (port < 1024 || port > 65535) return 64;

    char token[TOKEN_LEN + 1];
    if (load_token(argv[1], token) != 0) return 65;
    unlink(argv[1]);

    daemonize();
    pid_t server_pid = getpid();

    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = stop_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    if (sigaction(SIGTERM, &sa, NULL) != 0 || sigaction(SIGINT, &sa, NULL) != 0) return 66;
    struct sigaction child_sa;
    memset(&child_sa, 0, sizeof(child_sa));
    child_sa.sa_handler = child_handler;
    sigemptyset(&child_sa.sa_mask);
    child_sa.sa_flags = SA_NOCLDSTOP;
    if (sigaction(SIGCHLD, &child_sa, NULL) != 0) return 66;

    int s = socket(AF_INET, SOCK_STREAM | SOCK_CLOEXEC, 0);
    if (s < 0) return 70;

    int one = 1;
    (void)setsockopt(s, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one));

    struct sockaddr_in a;
    memset(&a, 0, sizeof(a));
    a.sin_family = AF_INET;
    a.sin_port = htons((uint16_t)port);
    a.sin_addr.s_addr = htonl(INADDR_LOOPBACK);

    if (bind(s, (struct sockaddr *)&a, sizeof(a)) != 0) {
        close(s);
        return 71;
    }
    if (listen(s, 16) != 0) {
        close(s);
        return 72;
    }

    pid_t workers[MAX_CLIENTS] = {0};
    while (keep_running) {
        reap_workers(workers);
        worker_changed = 0;

        int c = accept4(s, NULL, NULL, SOCK_CLOEXEC);
        if (c < 0) {
            if (errno == EINTR) continue;
            if (!keep_running) break;
            sleep(1);
            continue;
        }

        // Reap again after accept so a worker that exited while accept was
        // waking cannot leave this incoming request using a stale full-slot count.
        reap_workers(workers);
        int slot = -1;
        for (int i = 0; i < MAX_CLIENTS; ++i) {
            if (workers[i] == 0) { slot = i; break; }
        }
        if (slot < 0) {
            close(c);
            continue;
        }

        pid_t p = fork();
        if (p < 0) {
            close(c);
            continue;
        }
        if (p == 0) {
            close(s);
            handle_client(c, token, server_pid);
            close(c);
            memset(token, 0, sizeof(token));
            _exit(0);
        }
        workers[slot] = p;
        close(c);
    }

    close(s);
    for (int i = 0; i < MAX_CLIENTS; ++i) {
        if (workers[i] > 0) {
            while (waitpid(workers[i], NULL, 0) < 0 && errno == EINTR) {}
        }
    }
    memset(token, 0, sizeof(token));
    return 0;
}
