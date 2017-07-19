// @ts-check
const getpass = require('getpass').getPass;

/**
 * Asks for password and returns a promise
 * resolving to buffer with this passphrase.
 *
 * @param {boolean} [confirm]
 * @returns Promise<Buffer>
 */
function askPassphrase(confirm) {
    return new Promise((fulfill, reject) => {
        getpass({prompt: 'Passphrase'}, (err, passphrase) => {
            if (err) return reject(err);
            if (confirm) {
                getpass({prompt: 'Confirm'}, (err, confirmed) => {
                    if (err) return reject(err);
                    if (confirmed !== passphrase)
                        return reject('Passphrases do not match');
                    fulfill(Buffer.from(confirmed, 'utf8'));
                });
            } else {
                fulfill(Buffer.from(passphrase, 'utf8'));
            }
        });
    });
}

module.exports = askPassphrase;
