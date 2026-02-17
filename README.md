# ipfs-service-provider

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Overview

This is a 'boilerplate' repository that consumes the [helia-coord](https://github.com/Permissionless-Software-Foundation/helia-coord) library to set up an IPFS node with REST API and JSON RPC endpoints, user management with [JWT tokens](https://jwt.io/), and other basic features. It's intended to be forked to start new projects.

Three major [Cash Stack](https://cashstack.info) infrastructure projects have been forked from this repository:

- [ipfs-file-pin-service](https://github.com/Permissionless-Software-Foundation/ipfs-file-pin-service) - Paid IPFS file pinning using the [Pin Claim protocol (PS010)](https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps010-file-pinning-protocol.md).
- [ipfs-bch-wallet-service](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service) - A censorship-resistant, IPFS-based microservice providing wallet access to the Bitcoin Cash blockchain.
- [ipfs-bch-wallet-consumer](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-consumer) - A localized REST API for consuming blockchain services provided by ipfs-bch-wallet-service over IPFS.

Other forks include:
- [colab-coinjoin-api](https://github.com/bch-coinjoin/colab-coinjoin-api) - Part of the [Collaborative CoinJoin](https://ccoinjoin.com) framework for financial privacy.

In addition to being forked as a boilerplate, it can also be run as a stand-alone application to create a [Circuit Relay](https://cashstack.info/docs/local-back-end/circuit-relay), which can support the [PSF](https://psfoundation.info) IPFS network. It can also be used for experimenting with [helia-coord](https://github.com/Permissionless-Software-Foundation/helia-coord) and the [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) command-line wallet.

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

If you are interested in creating your own service provider on the IPFS network, fork this repository and start building.

## IPFS node
This web server spins up an embedded IPFS ([Helia](https://github.com/ipfs/helia)) node. This node can be controlled and interrogated via the REST API. [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) is a command-line app (CLI) that can easily tap into this REST API in order to interact with the embedded IPFS node.

## Requirements

- node **^20.16.0**
- npm **^10.8.1**
- Docker **^24.0.7**
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

### Configuration

This app is intended to be started via a bash shell script. See the environment variables used to configure this app in the [config/env/common.js file](./config/env/common.js).

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
- [helia-coord](https://www.npmjs.com/package/helia-coord)

## IPFS

Snapshots pinned to IPFS will be listed here.

## License

[MIT](./LICENSE.md)
