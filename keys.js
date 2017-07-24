// @ts-check
// Converts encrypted secret key from signify format
// to the "unlocked" format accepted by Manifest.

/**
 * Unlocks Signify secret key encrypted with
 * password (kdf rounds > 0), converting it to
 * unencrypted key (kdf rounds == 0) suitable
 * for passing to sign().
 *
 * Secret key format:
 *
 *  2 bytes - signature algorithm ('E', 'd')
 *  2 bytes - kdf algorithm ('B', 'K')
 *  4 bytes - kdf rounds, big-endian
 * 16 bytes - salt
 *  8 bytes - checksum (SHA512(secret key))
 *  8 bytes - key num (random bytes, embedded in signature and public key)
 * 64 bytes - secret key (XOR kdf output if rounds > 0)
 *
 */

const fs = require('fs');
const crypto = require('crypto');
const nacl = require('tweetnacl');
const { generateKeyPair } = require('peerio-updater/signing');
const deriveKey = require('./bcrypt_pbkdf');

const DEFAULT_ROUNDS = 42;

function deserialize(secretKey) {
    const k = Buffer.from(secretKey, 'base64');

    if (k.length !== 2 + 2 + 4 + 16 + 8 + 8 + 64) {
        throw new Error('Incorrect secret key length');
    }

    // Check signature algorithm.
    if (k[0] !== 69 /* 'E' */ || k[1] !== 100 /* 'd' */) {
        throw new Error('Unknown signature algorithm');
    }

    // Check KDF algorithm
    if (k[2] !== 66 /* 'B' */ || k[3] !== 75 /* 'K' */) {
        throw new Error('Unsupported KDF algorithm');
    }

    return {
        algo: k.slice(0, 2),
        kdfalgo: k.slice(2, 4),
        rounds: k.slice(4, 8).readUInt32BE(0),
        salt: k.slice(8, 24),
        checksum: k.slice(24, 32),
        num: k.slice(32, 40),
        key: k.slice(40, 104)
    };
}

function serialize(parts) {
    const binrounds = Buffer.alloc(4);
    binrounds.writeUInt32BE(parts.rounds, 0);
    return Buffer.concat([
        parts.algo,
        parts.kdfalgo,
        binrounds,
        parts.salt,
        parts.checksum,
        parts.num,
        parts.key
    ]).toString('base64');
}

function getPublicKey(secretKey) {
    const k = deserialize(secretKey);

    if (k.rounds !== 0) {
        throw new Error('Key is locked');
    }

    // Verify key checksum.
    if (!nacl.verify(k.checksum, nacl.hash(k.key).subarray(0, 8))) {
        throw new Error('Key checksum verification failure');
    }

    return Buffer.concat([
        k.algo,
        k.num,
        k.key.slice(32, 64)
    ]).toString('base64');
}

function unlockKey(passphrase, secretKey) {
    const k = deserialize(secretKey);

    if (k.rounds > 0) {
        // Decrypt key.
        const mask = deriveKey(passphrase, k.salt, k.rounds, k.key.length);
        for (var i = 0; i < mask.length; i++) {
            k.key[i] ^= mask[i];
        }
        k.rounds = 0;
    }

    // Verify key checksum.
    if (!nacl.verify(k.checksum, nacl.hash(k.key).subarray(0, 8))) {
        throw new Error('Key checksum verification failure');
    }

    return serialize(k);
}

function lockKey(passphrase, secretKey) {
    const k = deserialize(secretKey);

    if (k.rounds !== 0) {
        throw new Error('Key already locked?');
    }

    // Verify key checksum.
    if (!nacl.verify(k.checksum, nacl.hash(k.key).subarray(0, 8))) {
        throw new Error('Key checksum verification failure');
    }

    // Generate salt.
    k.salt = crypto.randomBytes(16);
    k.rounds = DEFAULT_ROUNDS;

    // Derive mask key and encrypt key with it.
    const mask = deriveKey(passphrase, k.salt, k.rounds, 64);
    for (var i = 0; i < 64; i++) {
        k.key[i] ^= mask[i];
    }

    return serialize(k);
}

function readKeyFile(filename, passphrase) {
    return new Promise((fulfill, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) return reject(err);
            const lines = data.split('\n').map(l => l.trim());
            if (lines.length < 2) {
                return reject(new Error('Bad key file format'));
            }
            // First line is untrusted comment, second line is the key.
            const key = lines[1];
            // Validate base64 encoding.
            if (!(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(key))) {
                return reject(new Error('Invalid encoding key file encoding'));
            }
            fulfill(unlockKey(passphrase, key));
        });
    });
}

function writeKeyFile(filename, passphrase, secretKey) {
    return new Promise((fulfill, reject) => {
        const key = lockKey(passphrase, secretKey);
        const data = `untrusted comment: Peerio Updater secret key\n${key}\n`;
        if (filename === '-') {
            process.stdout.write(data, 'utf8');
            fulfill(filename);
            return;
        }
        fs.writeFile(filename, data, 'utf8', err => {
            if (err) return reject(err);
            fulfill(filename);
        });
    });
}

module.exports = {
    getPublicKey,
    lockKey,
    unlockKey,
    readKeyFile,
    writeKeyFile,
    generateKeyPair
};
