// @ts-check
const fs = require('fs');
const path = require('path');
const Manifest = require('@peerio/updater/manifest');
const { calculateHash } = require('@peerio/updater/hash');
const { calculateSize } = require('@peerio/updater/size');
const { readKeyFile } = require('./keys');
const askPassphrase = require('./passphrase');

class ManifestMaker {
    constructor(version, isMandatory) {
        this.files = [];
        this.manifest = new Manifest();
        this.manifest.version = version;
        this.manifest.date = new Date();
        this.manifest.isMandatory = isMandatory;
    }

    addFile(platform, path, url) {
        this.files.push({ platform, path, url });
    }

    /**
     * Add file that will be available as release download on GitHub.
     *
     * @param {string} platform
     * @param {string} filepath
     * @param {string} repo GitHub repository name in 'username/project' format
     */
    addGitHubFile(platform, filepath, repo) {
        const version = this.manifest.version;
        const filename = path.basename(filepath); // TODO: must be 'safe filename' for URL?
        this.addFile(
            platform,
            filepath,
            `https://github.com/${repo}/releases/download/v${version}/${filename}`
        );
    }

    _prepareFiles() {
        return Promise.all(this.files.map(file => {
            return calculateSize(file.path).then(size => {
                file.size = size;
                return calculateHash(file.path);
            }).then(hash => {
                file.hash = hash;
                return file;
            });
        }));
    }

    generate(secretKey) {
        return this._prepareFiles().then(files => {
            files.forEach(file => {
                this.manifest.setFile(file.platform, file.url);
                this.manifest.setSize(file.platform, file.size);
                this.manifest.setSha512(file.platform, file.hash);
            });
            return this.manifest.serialize(secretKey);
        });
    }

    generateWithKeyFile(keyFilename, passphrase) {
        return Promise.resolve(passphrase || process.env.UPDATER_PASSPHRASE)
            .then(passphrase => passphrase || askPassphrase())
            .then(passphrase => readKeyFile(keyFilename, passphrase))
            .then(secretKey => this.generate(secretKey));
    }
}

module.exports = ManifestMaker;
