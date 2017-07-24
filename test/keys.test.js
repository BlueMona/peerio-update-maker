const expect = require('chai').expect;
const keys = require('../keys');

describe('keys', () => {

    it('should unlock secret key and get public key from it', () => {
        const good = {
            secret: 'RWRCSwAAACo53Ul7/1MhdQZMt+uRf1FUWsKAGMGvFR400KRVaZ64guDld+e481zjf2gL' +
            'kteStVS2F9meAe1sWAwKD+96jQIi8KYeJOpirdeuC5ead0iEmHQrT21NNqLH9FSyAILovTw=',
            public: 'RWQ00KRVaZ64gk1Q6bkiPBxxjYL624eBd1vuCo79JJPbYmzBntIwxYrn'
        };
        const unlocked = keys.unlockKey(Buffer.from('123', 'utf8'), good.secret);
        expect(unlocked).to.be.a('string');
        const public = keys.getPublicKey(unlocked);
        expect(public).to.equal(good.public);
    })
});
