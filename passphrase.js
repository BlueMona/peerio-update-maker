// @ts-check

const readline = require('readline');

/**
 * Asks for password and returns a promise
 * resolving to buffer with this passphrase.
 *
 * @param {boolean} [confirm]
 * @returns Promise<Buffer>
 */
function askPassphrase(confirm) {
    return new Promise((fulfill, reject) => {
        getpass({ prompt: 'Passphrase' }, (err, passphrase) => {
            if (err) return reject(err);
            if (confirm) {
                getpass({ prompt: 'Confirm' }, (err, confirmed) => {
                    if (err) return reject(err);
                    if (confirmed !== passphrase)
                        return reject(new Error('Passphrases do not match'));
                    fulfill(Buffer.from(confirmed, 'utf8'));
                });
            } else {
                fulfill(Buffer.from(passphrase, 'utf8'));
            }
        });
    });
}

function getpass(opts, cb) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question((opts.prompt || 'Password') + ': ', answer => {
        cb(null, answer);
        rl.close();
    });
}

module.exports = askPassphrase;
