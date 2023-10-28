# ipfs-service-provider

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Overview

This is a 'boilerplate' repository. It's intended to be forked to start new projects. Some code projects that are forks of this repository and regularly pull in changes:
- [pay-to-write database (P2WDB)](https://p2wdb.com/)
- [ipfs-bch-wallet-consumer](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-consumer)
- [ipfs-bch-wallet-service](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service)
- [colab-coinjoin-api](https://github.com/bch-coinjoin/colab-coinjoin-api)


In addition to being forked as a boilerplate, it can also be run as a stand-alone application to create a [Circuit Relay](https://cashstack.info/docs/local-back-end/circuit-relay), which can support the [PSF](https://psfoundation.info) IPFS network. It can also be used for experimenting with [helia-coord](https://github.com/Permissionless-Software-Foundation/helia-coord) and the [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) command-line wallet.

### Video Demo

A video demo shows you how to quickly setup ipfs-service-provider and start interacting with its IPFS node using the [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) command-line app.

- [ipfs-service-provider Demo Video](https://youtu.be/_9Xvh3aMrFg)

## Boilerplate

This repository has been forked from the [koa-api-boilerplate](https://github.com/christroutner/koa-api-boilerplate). It has all the same features as that boilerplate:

- [Koa](https://koajs.com/) framework for REST APIs
- User management
- Access and rate-limit control (authentication and authorization) using [JWT tokens](https://jwt.io/)
- Logging system with API access
- Email contact integration

This boilerplate extends that code to provide the basic features required to be a 'service provider' on the [IPFS](https://ipfs.io) network. This is a core concept in the [web3 Cash Stack](https://cashstack.info). These basic features include:

- [helia-coord](https://github.com/Permissionless-Software-Foundation/helia-coord) for coordinating service providers and consumers across the IPFS network.
- JSON RPC for creating an API between providers and consumers.

If you are interested in creating your own service provider on the IPFS network, fork this repository and start building. This repository is used in serveral PSF projects:

- [P2WDB](https://github.com/Permissionless-Software-Foundation/ipfs-p2wdb-service) - the [pay-to-write database](https://p2wdb.com) is a censorship-resistent, p2p database for storing data and pinning files to the IPFS network.
- [ipfs-bch-wallet-consumer](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-consumer) and [ipfs-bch-wallet-service](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service) creates a web3, censorship-resistent API for apps to communicate with a blockchain. This software is documented in [the Cash Stack](https://cashstack.info).
- [colab-coinjoin-api](https://github.com/bch-coinjoin/colab-coinjoin-api) is part of the [Collaborative CoinJoin](https://ccoinjoin.com) framework to allow wallets to easily integrate CoinJoin transaction forming, to create financial privacy.

## IPFS node
This web server spins up an embedded IPFS ([Helia](https://github.com/ipfs/helia)) node. This node can be controlled and interrogated via the REST API. [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) is a command-line app (CLI) that can easily tap into this REST API in order to interact with the embedded IPFS node.

- *Video link will be added here*

## Requirements

- node **^16.20.2**
- npm **^8.19.4**
- Docker **^20.10.8**
- Docker Compose **^1.27.4**

## Installation

### Production Environment

The [docker](./production/docker) directory contains a Dockerfile for building a production deployment.

```
docker-compose pull
docker-compose up -d
```

- You can bring the containers down with `docker-compose down`
- You can bring the containers back up with `docker-compose up -d`.

### Development Environment

A development environment will allow you modify the code on-the-fly and contribute to the code base of this repository. Ubuntu v20 is the recommended OS for creating a dev environment. Other operating systems may cause issues.

```bash
git clone https://github.com/Permissionless-Software-Foundation/ipfs-service-provider
cd ipfs-service-provider
./install-mongo-sh
npm install
npm start
```

## File Structure

The file layout of this repository follows the file layout of [Clean Architecture](https://christroutner.github.io/trouts-blog/blog/clean-architecture). Understaning the principles laid out this article will help developers navigate the code base.

## Usage

- `npm start` Start server on live mode
- `npm run docs` Generate API documentation
- `npm test` Run mocha tests

## Documentation

API documentation is written inline and generated by [apidoc](http://apidocjs.com/). Docs can be generated with this command:
- `npm run docs`

Visit `http://localhost:5020/` to view docs

There is additional developer documentation in the [dev-docs directory](./dev-docs).

## Dependencies

- [koa2](https://github.com/koajs/koa/tree/v2.x)
- [koa-router](https://github.com/alexmingoia/koa-router)
- [koa-bodyparser](https://github.com/koajs/bodyparser)
- [koa-generic-session](https://github.com/koajs/generic-session)
- [koa-logger](https://github.com/koajs/logger)
- [MongoDB](http://mongodb.org/)
- [Mongoose](http://mongoosejs.com/)
- [Passport](http://passportjs.org/)
- [Nodemon](http://nodemon.io/)
- [Mocha](https://mochajs.org/)
- [apidoc](http://apidocjs.com/)
- [ESLint](http://eslint.org/)
- [ipfs-coord](https://www.npmjs.com/package/ipfs-coord)

## IPFS

Snapshots pinned to IPFS will be listed here.

## License

[MIT](./LICENSE.md)
