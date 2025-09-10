---
id: changelog
title: Changelog
sidebar_position: 6
---

# Changelog

This page documents all notable changes to ZKPassport SDK, particularly highlighting any breaking changes that developers should be aware of when upgrading.

## Upcoming release

### Breaking Changes

- None

### New Features

- None

### Bug Fixes

- None

## v0.8.3 - Latest release

### Breaking Changes

- New smart contract verifier with the validity period now set in seconds rather than days

### New Features

- Sanction list checks, for now only against the OFAC SDN list
- Proofs now support dates precise to the seconds (using Unix timestamps rather date strings)
- Facilitate the declaration of the domain name in ZKPassport constructor (the value is parsed to make sure it's a valid domain name)

### Bug Fixes

- None

## v0.7.1

### Breaking Changes

- None

### New Features

- Stronger types for the results returned by the SDK in the onResult callback

### Bug Fixes

- Fix some issues with date parsing and comparison for birthdate and expiry date related queries

## v0.7.0

### Breaking Changes

- The proving system for the proofs has been updated. Proofs generated with previous version of the mobile app (prior to 0.8.5) will not work with this version of the SDK.

### New Features

- None

### Bug Fixes

- None

## v0.6.0

### Breaking Changes

- The chain id is no longer included in the scope of the proof, which changes the logic of the smart contract verifier. So a new contract has been deployed.
- The derivation of the unique identifier has changed slightly to be more future proof, so unique identifiers will change between the previous versions of the SDK and this one.
- The proving system for the proofs has been updated. Proofs generated with previous version of the mobile app (prior to 0.8.0) will not work with this version of the SDK.

### New Features

- The `bind` method now accepts a `chain` parameter to bind the chain id to the proof.

### Bug Fixes

- None

## v0.5.5

### Breaking Changes

- The Solidity verifier now take slightly different parameters as `scope` was renamed to `domain` and `subscope` to `scope` to match the naming on the SDK and avoid confusion

### New Features

- None

### Bug Fixes

- None

## v0.5.4

### Breaking Changes

- None

### New Features

- Support new unique identifier of mock passports now set to 1 instead of 0

### Bug Fixes

- Fix an issue where the SDK would fail to verify proofs generated with a different versions of the proof than the latest one

## v0.5.3

### Breaking Changes

- None

### New Features

- Allow to specify a custom path for the writing directory of the verification artifacts to facilitate the use of the SDK in serverless environments such as Next.js functions

### Bug Fixes

- None

## v0.5.1

### Breaking Changes

- None

### New Features

- None

### Bug Fixes

- Fix an issue where sometimes the proof would not be received due to an incorrect processing of chunked websocket messages

## v0.5.0

### Breaking Changes

- Proofs generated with the version 0.7.2 and below of the mobile app may not work correctly with the new version of the SDK. You will need to update the mobile app to version 0.7.4 or higher to make it work with this version of the SDK.

### New Features

- The SDK now supports the circuit registry keeping track of the valid logic that can be used to generate proofs (aka circuits)
- When requesting an age verification, the SDK will warn explicitly when the value used is not in a valid range (i.e. not between 1 and 99)

### Bug Fixes

- None

## v0.4.3

### Breaking Changes

- None

### New Features

- None

### Bug Fixes

- Some certificate registry root were formatted incorrectly when querying the registry, this has been fixed

## v0.4.2

### Breaking Changes

- None

### New Features

- You can now specify a custom url for the cloud prover used to generate compressed proofs
- You can now specify a custom url for the websocket used to connect to the mobile app
- The SDK now sends the version of the SDK to the mobile app so the app can check if it's compatible with the current version of the SDK

### Bug Fixes

- None

## v0.4.1

### Breaking Changes

- With previous versions of the app (0.6.13 and lower), using the `bind` method may crash the app.

### New Features

- New `bind` method in the query builder to bind custom data to the proof (such as the user's ethereum address). User will need the version 0.6.14 or higher of the mobile app to use this feature.

### Bug Fixes

- None

## v0.4.0

### Breaking Changes

- The new websocket logic introduces some breaking changes that makes it incompatible with previous versions of the mobile app. To use this release of the SDK, you will need to have the version 0.6.13 or higher of the mobile app.
- The `verify` and `request` function need the `evmChain` parameter to be specified for proofs meant to be verified onchain, as the scope now depends of the chain id

### New Features

- Scope unique identifier to chain id in addition to the domain name for onchain verification

### Bug Fixes

- Stabilise websocket to prevent connection issues and message loss

## v0.3.4

### Breaking Changes

- None

### New Features

- None

### Bug Fixes

- Fix an issue where for unsupported IDs (i.e. not returning any proof), the SDK would return `verified` true. It now returns `verified` false.

## v0.3.2

### Breaking Changes

- None

### New Features

- The Solidity verifier is now connected to the onchain certificate registry
- Dev Mode allowing you to verify proofs from mock passports signed by the Zero Knowledge Republic (ZKR)

### Bug Fixes

- None

## v0.3.1

### Breaking Changes

- If you are using the `verify` function on the server-side after doing the main process on the client-side, then you will need to add the `scope` parameter to the `verify` function as it can be not inferred directly from the internal state of the SDK such as is the case for a fully client-side verification.

### New Features

- Verify the scopes of the proof in the verification process (both offchain and onchain)

### Bug Fixes

- None

## v0.3.0

### Breaking Changes

- This version of the SDK requires to have the version 0.6.0 or higher of the mobile app and will not work with previous versions.

### New Features

- Onchain verification for EVM chains with the relevant helper functions
- New recursive proof compressing all the multiple proofs previously returned by the SDK into a single proof

### Bug Fixes

- Update to Barretenberg 0.82.2 which patches a vulnerability in UltraHonk

---

**Note to maintainers**: When making releases, please update this changelog with relevant changes, moving items from the "Upcoming release" section to a new version section with the appropriate version number and release date.
