const program = require('commander');
const askPassphrase = require('./passphrase');
const keys = require('./keys');

program
    .usage('[-gp] <filename>')
    .option('-g --generate <filename>', 'Generate a new key pair')
    .option('-p --public <filename>', 'Print public key from the secret key file')
    .parse(process.argv);


if (program.generate != null) {
    generate(program.generate).catch(err => {
        console.log(err.message);
        process.exit(1);
    });
} else if (program.public != null) {
    printPublic(program.public).catch(err => {
        console.log(err.message);
        process.exit(1);
    });
} else {
    program.outputHelp();
    process.exit(1);
}

function generate(filename) {
    return askPassphrase(true).then(passphrase => {
        const keypair = keys.generateKeyPair();
        console.log('Public key:', keypair.publicKey);
        return keys.writeKeyFile(filename, passphrase, keypair.secretKey);
    });
}

function printPublic(filename) {
    return askPassphrase()
        .then(passphrase => keys.readKeyFile(filename, passphrase))
        .then(secretKey => keys.getPublicKey(secretKey))
        .then(publicKey => console.log(`untrusted comment: Peerio Updater public key\n${publicKey}`));
}
