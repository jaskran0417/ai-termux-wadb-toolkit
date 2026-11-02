#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error('INSTALL_PATH_PREFLIGHT=FAILED');
  console.error('REASON=' + message);
  process.exit(1);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const prefixInput = arg('--prefix') || process.env.PREFIX || '';
const homeInput = arg('--home') || process.env.HOME || '';
const rootInput = arg('--root') || '';
if (!prefixInput || !homeInput || !rootInput ||
    !path.isAbsolute(prefixInput) || !path.isAbsolute(homeInput) || !path.isAbsolute(rootInput)) {
  fail('PREFIX, HOME, and release root must be explicit absolute directories.');
}
const prefix = path.resolve(prefixInput);
const home = path.resolve(homeInput);
const root = path.resolve(rootInput);
if (prefix === path.parse(prefix).root || home === path.parse(home).root) {
  fail('PREFIX and HOME cannot be filesystem root directories.');
}

function checkDirectoryChain(target, label, mustExist = false) {
  const resolved = path.resolve(target);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  let missing = false;
  for (const part of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let st;
    try {
      st = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') {
        missing = true;
        continue;
      }
      fail('Cannot inspect ' + label + ' path component: ' + current + ' (' + error.message + ')');
    }
    if (missing) fail('Path reappears after a missing component for ' + label + ': ' + current);
    if (st.isSymbolicLink()) fail('Symbolic-link directory component for ' + label + ': ' + current);
    if (!st.isDirectory()) fail('Non-directory path component for ' + label + ': ' + current);
  }
  if (mustExist && missing) fail('Required directory does not exist: ' + resolved);
}

function checkDirectory(target, label, mustExist = false) {
  checkDirectoryChain(target, label, mustExist);
}

function checkFile(target, label, allowedLinkTarget = null) {
  checkDirectoryChain(path.dirname(target), label + ' parent', false);
  let st;
  try {
    st = fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    fail('Cannot inspect ' + label + ': ' + error.message);
  }
  if (st.isSymbolicLink()) {
    if (allowedLinkTarget !== null) {
      const link = fs.readlinkSync(target);
      const absoluteLink = path.isAbsolute(link) ? path.resolve(link) : path.resolve(path.dirname(target), link);
      if (absoluteLink === path.resolve(allowedLinkTarget)) return;
    }
    fail('Symbolic link is not permitted at managed file path ' + label + ': ' + target);
  }
  if (!st.isFile()) fail('Managed file path is not a regular file: ' + label + ': ' + target);
}

checkDirectory(root, 'release root', true);
checkDirectory(prefix, 'Termux PREFIX', true);
checkDirectory(path.join(prefix, 'bin'), 'PREFIX/bin', true);
checkDirectory(home, 'Termux HOME', true);
checkDirectory(path.join(prefix, 'libexec'), 'PREFIX/libexec', false);
checkDirectory(path.join(prefix, 'libexec', 'ai-wadb'), 'PREFIX/libexec/ai-wadb', false);
checkDirectory(path.join(home, '.ai-wadb'), 'HOME/.ai-wadb', false);
checkDirectory(path.join(home, '.ai-wadb', 'backups'), 'HOME/.ai-wadb/backups', false);
checkDirectory(path.join(home, 'AI_WADB_DOCS'), 'HOME/AI_WADB_DOCS', false);
checkDirectory(path.join(home, '.ai-wadb', 'release-integrity'), 'HOME/.ai-wadb/release-integrity', false);

const commands = [
  'ai-info', 'phone-capabilities', 'wireless-debug-on', 'wireless-debug-off',
  'wireless-debug-status', 'adb-mdns-discover', 'wireless-adb-connect', 'wadb-bootstrap',
  'wadb-local-on', 'wadb-local-status', 'wadb-local-off', 'wadb-local-shell',
  'wadb-integrity-check',
  'wadb-mcp-start', 'wadb-mcp-stop', 'wadb-mcp-restart', 'wadb-mcp-status', 'wadb-mcp-log',
  'wadb-mcp-logout', 'wadb-mcp-watchdog', 'wadb-mcp-watchdog-start', 'wadb-mcp-job', 'wadb-notify',
  'wadb-mcp-github-sync', 'wadb-mcp-github-config', 'wadb-mcp-github-test',
  'wadb-mcp-recovery-setup', 'wadb-mcp-recovery-disable', 'wadb-toolkit-uninstall'
];
for (const name of commands) checkFile(path.join(prefix, 'bin', name), 'PREFIX/bin/' + name);

for (const name of [
  'wadb-common', 'mcp-recovery-common', 'github-control-fetch',
  'wadb-local-bridge', 'verify-installed.js', 'wadb-bridge.apk.sha256'
]) checkFile(path.join(prefix, 'libexec', 'ai-wadb', name), 'PREFIX/libexec/ai-wadb/' + name);

const docsSource = path.join(root, 'docs');
const docsStat = fs.lstatSync(docsSource);
if (docsStat.isSymbolicLink() || !docsStat.isDirectory()) fail('Release docs source is not a real directory.');
for (const name of fs.readdirSync(docsSource).filter(name => name.endsWith('.md'))) {
  checkFile(path.join(home, 'AI_WADB_DOCS', name), 'HOME/AI_WADB_DOCS/' + name);
}
for (const name of ['toolkit-manifest.json']) {
  checkFile(path.join(home, 'AI_WADB_DOCS', name), 'HOME/AI_WADB_DOCS/' + name);
}

checkFile(path.join(home, 'AI_ENVIRONMENT.md'), 'HOME/AI_ENVIRONMENT.md');
checkFile(path.join(home, '.bashrc'), 'HOME/.bashrc');
checkFile(path.join(home, '.ai-wadb', 'wadb-bridge.apk'), 'HOME/.ai-wadb/wadb-bridge.apk');
checkFile(path.join(home, '.ai-wadb', 'pairing.pending'), 'HOME/.ai-wadb/pairing.pending');
checkFile(path.join(home, '.ai-wadb.install.lock'), 'HOME/.ai-wadb.install.lock');
checkFile(
  path.join(home, 'AI_READ_ME_FIRST.md'),
  'HOME/AI_READ_ME_FIRST.md',
  path.join(home, 'AI_ENVIRONMENT.md')
);

console.log('INSTALL_PATH_PREFLIGHT=PASS');
console.log('PREFIX_DIRECTORY_CHAIN=REAL');
console.log('HOME_DIRECTORY_CHAIN=REAL');
console.log('MANAGED_TARGETS=NO_UNSAFE_SYMLINKS');
