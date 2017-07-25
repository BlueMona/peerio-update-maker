# Peerio Update Maker

A library for creating update manifests and a command-line tool
to generate key pairs for [peerio-updater](https://github.com/PeerioTechnologies/peerio-updater).

## Installation

*TODO: will be published on npm*

    npm install -g github:PeerioTechnologies/peerio-update-maker


## Generating key pair

    peerio-update-maker -g filename

You'll be asked to enter password and confirm it: you will need to use this
password to decrypt secret key to sign updates.

The public key will be printed, the secret key will be written to filename.


## Extracting public key from secret key

    peerio-update-maker -p filename


## Compatibility with `signify`

Signify utility requires `untrusted comment:` line before key line. Both secret
key and public key printed with `-p` follow this format. `peerio-updater`, on
the other hand, requires just the actual key line to be included in the
configuration.
