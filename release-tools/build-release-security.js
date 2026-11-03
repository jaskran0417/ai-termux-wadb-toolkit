#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(process.argv[2] || '');
const privateKeyPath = path.resolve(process.argv[3] || '');
if (!root || !privateKeyPath || !fs.existsSync(root) || !fs.existsSync(privateKeyPath)) {
  console.error('Usage: node build-release-security.js CANDIDATE_ROOT PRIVATE_KEY_PATH');
  process.exit(2);
}
if (privateKeyPath.startsWith(root + path.sep) || privateKeyPath === root) {
  console.error('Refusing to use a private key located inside the candidate package.');
  process.exit(2);
}
const keyDir = path.dirname(privateKeyPath);
const keyDirStat = fs.lstatSync(keyDir);
if (keyDirStat.isSymbolicLink() || !keyDirStat.isDirectory() || (keyDirStat.mode & 0o077) !== 0) {
  console.error('Private key directory must be a real directory with mode 700 or stricter.');
  process.exit(2);
}
const keyStat = fs.lstatSync(privateKeyPath);
if (keyStat.isSymbolicLink() || !keyStat.isFile() || (keyStat.mode & 0o077) !== 0) {
  console.error('Private key must be a regular file with mode 600 or stricter.');
  process.exit(2);
}

const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
if (privateKey.asymmetricKeyType !== 'ed25519') {
  console.error('Release signing key must be Ed25519.');
  process.exit(2);
}
const publicKey = crypto.createPublicKey(privateKey);
const publicDer = publicKey.export({ type: 'spki', format: 'der' });
const fingerprint = crypto.createHash('sha256').update(publicDer).digest('hex');
const packagedPublicPath = path.join(root, 'trust', 'release-ed25519-public.pem');
const packagedFingerprintPath = path.join(root, 'trust', 'RELEASE_KEY_FINGERPRINT.txt');
const packagedPublicKey = crypto.createPublicKey(fs.readFileSync(packagedPublicPath));
const packagedDer = packagedPublicKey.export({ type: 'spki', format: 'der' });
const packagedFingerprint = crypto.createHash('sha256').update(packagedDer).digest('hex');
if (packagedFingerprint !== fingerprint) {
  console.error('Packaged public key does not correspond to the selected private key.');
  process.exit(2);
}
const fingerprintRecord = fs.readFileSync(packagedFingerprintPath, 'utf8').trim();
if (fingerprintRecord !== 'SHA256 ' + fingerprint) {
  console.error('Packaged fingerprint record does not match the selected signing key.');
  process.exit(2);
}

function sha(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function read(rel) {
  const full = path.join(root, ...rel.split('/'));
  const st = fs.lstatSync(full);
  if (!st.isFile() || st.isSymbolicLink()) throw new Error('Expected regular source file: ' + rel);
  return fs.readFileSync(full);
}
function addTarget(targets, kind, targetPath, sourcePath, overrideBytes) {
  const bytes = overrideBytes === undefined ? read(sourcePath) : overrideBytes;
  targets.push({ kind, path: targetPath, sha256: sha(bytes) });
}

const binCommands = [
  'ai-info', 'phone-capabilities', 'wireless-debug-on', 'wireless-debug-off',
  'wireless-debug-status', 'adb-mdns-discover', 'wireless-adb-connect', 'wadb-bootstrap',
  'wadb-local-on', 'wadb-local-status', 'wadb-local-off', 'wadb-local-shell',
  'wadb-integrity-check',
  'wadb-mcp-start', 'wadb-mcp-stop', 'wadb-mcp-restart', 'wadb-mcp-status', 'wadb-mcp-log',
  'wadb-mcp-logout', 'wadb-mcp-watchdog', 'wadb-mcp-watchdog-start', 'wadb-mcp-job', 'wadb-notify',
  'wadb-mcp-github-sync', 'wadb-mcp-github-config', 'wadb-mcp-github-test',
  'wadb-mcp-recovery-setup', 'wadb-mcp-recovery-disable', 'wadb-toolkit-uninstall'
];

const targets = [];
for (const name of binCommands) addTarget(targets, 'PREFIX_BIN', name, 'scripts/' + name);
for (const name of ['wadb-common', 'mcp-recovery-common', 'github-control-fetch']) {
  addTarget(targets, 'PREFIX_LIBEXEC', name, 'scripts/' + name);
}
addTarget(targets, 'PREFIX_LIBEXEC', 'wadb-local-bridge', 'native/wadb-local-bridge');
addTarget(targets, 'PREFIX_LIBEXEC', 'verify-installed.js', 'security/verify-installed.js');
addTarget(targets, 'TERMUX_HOME', 'AI_ENVIRONMENT.md', 'AI_ENVIRONMENT.md');

for (const name of fs.readdirSync(path.join(root, 'docs')).filter(x => x.endsWith('.md')).sort()) {
  addTarget(targets, 'TERMUX_HOME_DOCS', name, 'docs/' + name);
}
for (const [targetPath, sourcePath] of [
  ['README.md', 'README.md'],
  ['toolkit-manifest.json', 'toolkit-manifest.json']
]) addTarget(targets, 'TERMUX_HOME_DOCS', targetPath, sourcePath);
addTarget(targets, 'PRIVATE_HOME', 'wadb-bridge.apk', 'apk/wadb-bridge.apk');

const verifierHash = sha(read('security/verify-release.js'));
fs.writeFileSync(path.join(root, 'trust', 'BOOTSTRAP_VERIFIER_SHA256.txt'), 'SHA256 ' + verifierHash + ' security/verify-release.js\n');

const apkHash = sha(read('apk/wadb-bridge.apk'));
const apkHashFile = Buffer.from(apkHash + '  wadb-bridge.apk\n', 'utf8');
addTarget(targets, 'PREFIX_LIBEXEC', 'wadb-bridge.apk.sha256', null, apkHashFile);

for (const target of targets) {
  if (target.kind === 'PREFIX_BIN') target.mode = '755';
  else if (target.kind === 'PREFIX_LIBEXEC') target.mode = target.path === 'wadb-bridge.apk.sha256' ? '644' : '755';
  else if (target.kind === 'PRIVATE_HOME') target.mode = '600';
  else target.mode = '644';
}
targets.sort((a, b) => (a.kind + '/' + a.path).localeCompare(b.kind + '/' + b.path));
const installed = {
  schema: 2,
  name: 'AI Termux WADB Toolkit',
  version: '1.0.2',
  signature_algorithm: 'Ed25519',
  release_key_sha256: fingerprint,
  targets
};
const installedBytes = Buffer.from(JSON.stringify(installed, null, 2) + '\n', 'utf8');
const securityDir = path.join(root, 'security');
fs.mkdirSync(securityDir, { recursive: true });
fs.writeFileSync(path.join(securityDir, 'installed-files.json'), installedBytes);
fs.writeFileSync(path.join(securityDir, 'installed-files.json.sig'), crypto.sign(null, installedBytes, privateKey));

function walk(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // A developer's local Git metadata is never part of the distributable package.
    if (entry.isDirectory() && entry.name === '.git') continue;
    if (entry.name.includes(String.fromCharCode(92)) || entry.name.split('').some(ch => ch.charCodeAt(0) < 32)) throw new Error('Unsupported character in release filename.');
    const rel = prefix ? prefix + '/' + entry.name : entry.name;
    const full = path.join(dir, entry.name);
    const st = fs.lstatSync(full);
    if (st.isSymbolicLink()) throw new Error('Release packages must not contain symlinks: ' + rel);
    if (st.isDirectory()) out.push(...walk(full, rel));
    else if (st.isFile()) out.push(rel);
    else throw new Error('Unsupported filesystem object: ' + rel);
  }
  return out;
}

const forbiddenName = /(^|\/)(?:.*\.(?:p12|pfx|jks|keystore)|key\.b64|(?:apksigner|keystore)\.pass|.*PRIVATE.*)$/i;
const all = walk(root);
for (const name of all) if (forbiddenName.test(name)) throw new Error('Potential private signing material in package: ' + name);

const manifestLines = [];
for (const rel of all.filter(x => x !== 'MANIFEST.sha256' && x !== 'MANIFEST.sha256.sig').sort()) {
  manifestLines.push(sha(read(rel)) + '  ./' + rel);
}
const manifestBytes = Buffer.from(manifestLines.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'MANIFEST.sha256'), manifestBytes);
fs.writeFileSync(path.join(root, 'MANIFEST.sha256.sig'), crypto.sign(null, manifestBytes, privateKey));

console.log('SIGNING=ED25519');
console.log('RELEASE_KEY_SHA256=' + fingerprint);
console.log('INSTALLED_TARGETS=' + targets.length);
console.log('PACKAGE_FILES=' + manifestLines.length);
console.log('PRIVATE_KEY_IN_PACKAGE=no');
console.log('SIGNED_MANIFEST=created');
