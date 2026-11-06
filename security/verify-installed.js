#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function fail(message, code = 1) {
  console.error('INSTALLED_INTEGRITY=FAILED');
  console.error('REASON=' + message);
  process.exit(code);
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const home = process.env.HOME || '/data/data/com.termux/files/home';
const prefix = process.env.PREFIX || '/data/data/com.termux/files/usr';
const metadata = path.join(home, '.ai-wadb', 'release-integrity');
const manifestPath = path.join(metadata, 'installed-files.json');
const signaturePath = path.join(metadata, 'installed-files.json.sig');
const publicKeyPath = path.join(metadata, 'release-ed25519-public.pem');
const pinPath = path.join(metadata, 'trusted-key-fingerprint.txt');
const argumentPin = arg('--expected-fingerprint');
const environmentPin = process.env.WADB_TRUSTED_RELEASE_KEY_SHA256 || '';
const expectedPin = (argumentPin || environmentPin).toLowerCase().replace(/^sha256:/, '');
if (!expectedPin) fail('An independently obtained release-key fingerprint is required on every check. Supply --expected-fingerprint or WADB_TRUSTED_RELEASE_KEY_SHA256.');

function safeRelative(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('\\') &&
    !path.posix.isAbsolute(value) && path.posix.normalize(value) === value &&
    value.split('/').every(part => part && part !== '.' && part !== '..');
}

function requireRealDirectoryChain(parts, label) {
  let current = path.resolve(parts[0]);
  const first = fs.lstatSync(current);
  if (first.isSymbolicLink() || !first.isDirectory()) fail('Unsafe directory root for ' + label + ': ' + current);
  for (const part of parts.slice(1)) {
    current = path.join(current, part);
    const st = fs.lstatSync(current);
    if (st.isSymbolicLink() || !st.isDirectory()) fail('Unsafe directory component for ' + label + ': ' + current);
  }
  return current;
}

function targetBase(kind) {
  switch (kind) {
    case 'PREFIX_BIN':
      return requireRealDirectoryChain([prefix, 'bin'], kind);
    case 'PREFIX_LIBEXEC':
      return requireRealDirectoryChain([prefix, 'libexec', 'ai-wadb'], kind);
    case 'TERMUX_HOME':
      return requireRealDirectoryChain([home], kind);
    case 'TERMUX_HOME_DOCS':
      return requireRealDirectoryChain([home, 'AI_WADB_DOCS'], kind);
    case 'PRIVATE_HOME':
      return requireRealDirectoryChain([home, '.ai-wadb'], kind);
    default: fail('Unknown installed target kind: ' + kind);
  }
}

function assertNoSymlink(base, relative) {
  let current = base;
  const baseStat = fs.lstatSync(current);
  if (baseStat.isSymbolicLink() || !baseStat.isDirectory()) fail('Unsafe target base: ' + base);
  const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    const st = fs.lstatSync(current);
    if (st.isSymbolicLink()) fail('Symbolic link in installed target: ' + relative);
    if (i < parts.length - 1 && !st.isDirectory()) fail('Non-directory path component: ' + relative);
    if (i === parts.length - 1 && !st.isFile()) fail('Installed target is not a regular file: ' + relative);
  }
  return current;
}

try {
  requireRealDirectoryChain([home, '.ai-wadb', 'release-integrity'], 'installed integrity metadata');
  const metadataStat = fs.lstatSync(metadata);
  if (metadataStat.isSymbolicLink() || !metadataStat.isDirectory()) fail('Installed integrity metadata directory is not a real directory.');
  for (const filePath of [manifestPath, signaturePath, publicKeyPath, pinPath]) {
    const st = fs.lstatSync(filePath);
    if (st.isSymbolicLink() || !st.isFile()) fail('Installed integrity metadata file is not a regular file: ' + path.basename(filePath));
    if (st.size > 1024 * 1024) fail('Installed integrity metadata file is unexpectedly large: ' + path.basename(filePath));
  }

  const pin = expectedPin;
  const pinSource = argumentPin ? 'EXPLICIT_ARGUMENT' : 'EXPLICIT_ENVIRONMENT';
  if (!/^[0-9a-f]{64}$/.test(pin)) fail('Expected fingerprint must be 64 hexadecimal characters.', 2);
  const storedPinText = fs.readFileSync(pinPath, 'utf8').trim();
  const storedPinMatch = /^SHA256\s+([0-9a-f]{64})$/i.exec(storedPinText);
  if (!storedPinMatch || storedPinMatch[1].toLowerCase() !== pin) {
    fail('Local identity record does not match the independently supplied fingerprint.');
  }

  const publicKey = crypto.createPublicKey(fs.readFileSync(publicKeyPath));
  if (publicKey.asymmetricKeyType !== 'ed25519') fail('Installed release key is not Ed25519.');
  const der = publicKey.export({ type: 'spki', format: 'der' });
  const fingerprint = crypto.createHash('sha256').update(der).digest('hex');
  if (fingerprint !== pin) fail('Installed release public key does not match the trusted fingerprint.');

  const manifest = fs.readFileSync(manifestPath);
  const signature = fs.readFileSync(signaturePath);
  if (signature.length !== 64 || !crypto.verify(null, manifest, publicKey, signature)) {
    fail('Installed-file inventory signature is invalid.');
  }

  const data = JSON.parse(manifest.toString('utf8'));
  if (data.schema !== 2 || data.name !== 'AI Termux WADB Toolkit' ||
      data.version !== '1.0.3' ||
      data.signature_algorithm !== 'Ed25519' ||
      data.release_key_sha256 !== fingerprint ||
      !Array.isArray(data.targets) || data.targets.length < 1 || data.targets.length > 512) {
    fail('Installed-file inventory schema or signed identity is invalid.');
  }

  const failures = [];
  let totalBytes = 0;
  const seenTargets = new Set();
  let checked = 0;
  for (const item of data.targets) {
    const identity = item && typeof item.kind === 'string' && typeof item.path === 'string'
      ? item.kind + '/' + item.path : '';
    if (!identity || seenTargets.has(identity)) fail('Duplicate or missing installed-file target: ' + identity);
    seenTargets.add(identity);
    if (!item || !safeRelative(item.path) || !/^[0-9a-f]{64}$/.test(item.sha256 || '') ||
        !/^[0-7]{3,4}$/.test(String(item.mode || ''))) {
      fail('Unsafe or malformed installed-file inventory entry.');
    }
    const base = targetBase(item.kind);
    let absolute;
    try {
      absolute = assertNoSymlink(base, item.path);
    } catch (error) {
      failures.push({ target: item.kind + '/' + item.path, reason: error.message });
      continue;
    }
    const fileStat = fs.lstatSync(absolute);
    if (fileStat.size > 64 * 1024 * 1024) {
      failures.push({ target: item.kind + '/' + item.path, reason: 'File exceeds 64 MiB safety limit' });
      continue;
    }
    totalBytes += fileStat.size;
    if (totalBytes > 128 * 1024 * 1024) fail('Installed inventory exceeds the 128 MiB total safety limit.');
    const actual = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    const actualMode = (fileStat.mode & 0o777).toString(8).padStart(3, '0');
    checked++;
    if (actual !== item.sha256) failures.push({ target: item.kind + '/' + item.path, reason: 'SHA256 mismatch' });
    if (actualMode !== String(item.mode).padStart(3, '0')) {
      failures.push({ target: item.kind + '/' + item.path, reason: 'Mode mismatch (expected ' + item.mode + ', found ' + actualMode + ')' });
    }
  }

  console.log('RELEASE_VERSION=' + String(data.version || 'unknown'));
  console.log('RELEASE_KEY_SHA256=' + fingerprint);
  console.log('SIGNATURE=VALID');
  console.log('TRUST_PIN_SOURCE=' + pinSource);
  console.log('TRUST_PIN_MATCH=YES');
  console.log('FILES_CHECKED=' + checked);
  console.log('FILES_FAILED=' + failures.length);
  for (const item of failures) console.log('MODIFIED=' + item.target + ' (' + item.reason + ')');
  if (failures.length) {
    console.log('INSTALLED_INTEGRITY=TAMPERED');
    process.exit(3);
  }
  console.log('INSTALLED_INTEGRITY=VERIFIED');
} catch (error) {
  if (error && error.message && !String(error.message).includes('INSTALLED_INTEGRITY=FAILED')) {
    fail(error.message);
  }
  process.exit(1);
}
