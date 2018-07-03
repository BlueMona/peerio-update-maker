const expect = require('chai').expect;
const askPassphrase = require('../passphrase');

describe('read password', () => {

    it('should read password', (done) => {
        console.log('Enter 123');
        askPassphrase().then(passphrase => {
            if (passphrase.toString() !== '123') {
                return done(new Error('Password is not 123'));
            }
            done();
        });
    })
});
