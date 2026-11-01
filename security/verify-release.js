#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function fail(message, code = 1) {
  console.error('RELEASE_VERIFY=FAILED');
  console.error('REASON=' + message);
  process.exit(code);
}

function readArg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const rootArg = readArg('--root') || path.dirname(__dirname);
const expectedArg = (readArg('--expected-fingerprint') || '').toLowerCase().replace(/^sha256:/, '');
const root = path.resolve(rootArg);
const manifestPath = path.join(root, 'MANIFEST.sha256');
const signaturePath = path.join(root, 'MANIFEST.sha256.sig');
const publicKeyPath = path.join(root, 'trust', 'release-ed25519-public.pem');

if (!/^[0-9a-f]{64}$/.test(expectedArg)) {
  fail('An independently obtained 64-character SHA-256 public-key fingerprint is required. Pass --expected-fingerprint.', 2);
}

function insideRoot(relativePath) {
  if (!relativePath || relativePath.includes(String.fromCharCode(92)) ||
      relativePath.split('').some(ch => ch.charCodeAt(0) < 32) ||
      path.posix.isAbsolute(relativePath)) return false;
  const normal = path.posix.normalize(relativePath);
  if (normal !== relativePath || normal === '.' || normal.startsWith('../') || relativePath.split('/').some(p => p === '..' || p === '')) return false;
  const absolute = path.resolve(root, ...relativePath.split('/'));
  return absolute.startsWith(root + path.sep);
}

function walk(directory, prefix = '') {
  const found = [];
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    // Local Git metadata belongs to the checkout, not to the distributable package.
    if (item.isDirectory() && item.name === '.git') continue;
    if (item.name.includes(String.fromCharCode(92)) || item.name.split('').some(ch => ch.charCodeAt(0) < 32)) fail('Unsupported character in release filename.');
    const rel = prefix ? prefix + '/' + item.name : item.name;
    const absolute = path.join(directory, item.name);
    const st = fs.lstatSync(absolute);
    if (st.isSymbolicLink()) fail('Symbolic links are not permitted in a release package: ' + rel);
    if (st.isDirectory()) found.push(...walk(absolute, rel));
    else if (st.isFile()) found.push(rel);
    else fail('Unsupported filesystem object in release package: ' + rel);
  }
  return found;
}

try {
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail('Release root must be a real directory.');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(signaturePath) || !fs.existsSync(publicKeyPath)) {
    fail('Missing signed manifest, detached signature, or release public key.');
  }

  const publicKey = crypto.createPublicKey(fs.readFileSync(publicKeyPath));
  if (publicKey.asymmetricKeyType !== 'ed25519') fail('Release public key is not Ed25519.');
  const publicDer = publicKey.export({ type: 'spki', format: 'der' });
  const fingerprint = crypto.createHash('sha256').update(publicDer).digest('hex');

  console.log('RELEASE_KEY_SHA256=' + fingerprint);
  if (fingerprint !== expectedArg) fail('Public-key fingerprint does not match the independently supplied trust pin.');

  const manifestStat = fs.lstatSync(manifestPath);
  const signatureStat = fs.lstatSync(signaturePath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size > 1024 * 1024) {
    fail('Manifest must be a regular file no larger than 1 MiB.');
  }
  if (!signatureStat.isFile() || signatureStat.isSymbolicLink() || signatureStat.size !== 64) {
    fail('Detached Ed25519 signature must be a 64-byte regular file.');
  }
  const manifestBytes = fs.readFileSync(manifestPath);
  const signature = fs.readFileSync(signaturePath);
  if (signature.length !== 64) fail('Ed25519 signature has an invalid length.');
  if (!crypto.verify(null, manifestBytes, publicKey, signature)) fail('Detached Ed25519 signature is invalid.');
  const fingerprintRecord = fs.readFileSync(path.join(root, 'trust', 'RELEASE_KEY_FINGERPRINT.txt'), 'utf8').trim();
  if (fingerprintRecord !== 'SHA256 ' + fingerprint) fail('Packaged release fingerprint record does not match the verified public key.');

  const manifestText = manifestBytes.toString('utf8');
  if (!manifestText.endsWith('\n')) fail('Manifest must end with a newline.');
  const expected = new Map();
  for (const line of manifestText.split('\n')) {
    if (!line) continue;
    const match = /^([0-9a-f]{64})  \.\/(.+)$/.exec(line);
    if (!match) fail('Malformed manifest line.');
    const hash = match[1];
    const rel = match[2];
    if (!insideRoot(rel)) fail('Unsafe manifest path: ' + rel);
    if (expected.has(rel)) fail('Duplicate manifest path: ' + rel);
    expected.set(rel, hash);
  }
  if (expected.size === 0) fail('Manifest contains no file entries.');
  if (expected.size > 512) fail('Release manifest exceeds the 512-file safety limit.');

  let totalBytes = 0;
  for (const [rel, wantedHash] of expected) {
    const absolute = path.resolve(root, ...rel.split('/'));
    const st = fs.lstatSync(absolute);
    if (!st.isFile() || st.isSymbolicLink()) fail('Manifest target is not a regular file: ' + rel);
    if (st.size > 64 * 1024 * 1024) fail('Release file exceeds the 64 MiB safety limit: ' + rel);
    totalBytes += st.size;
    if (totalBytes > 128 * 1024 * 1024) fail('Release package exceeds the 128 MiB unpacked safety limit.');
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    if (actualHash !== wantedHash) fail('Hash mismatch: ' + rel);
  }

  const actualFiles = walk(root).filter(rel => rel !== 'MANIFEST.sha256' && rel !== 'MANIFEST.sha256.sig').sort();
  const expectedFiles = [...expected.keys()].sort();
  if (actualFiles.length !== expectedFiles.length) {
    const extras = actualFiles.filter(x => !expected.has(x));
    const missing = expectedFiles.filter(x => !actualFiles.includes(x));
    fail('File inventory mismatch. Unlisted=' + extras.join(',') + '; missing=' + missing.join(','));
  }
  for (const rel of actualFiles) if (!expected.has(rel)) fail('Unlisted file: ' + rel);

  console.log('SIGNATURE=VALID');
  console.log('MANIFEST_FILES=' + expected.size);
  console.log('CONTENT=ALL_FILES_MATCH');
  console.log('TRUST_PIN=MATCH');
  console.log('RELEASE_VERIFY=PASSED');
} catch (error) {
  if (error && error.message && !String(error.message).includes('RELEASE_VERIFY=FAILED')) {
    fail(error.message);
  }
  process.exit(1);
}
