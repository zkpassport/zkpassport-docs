---
id: changelog
title: Changelog
sidebar_position: 6
---

# Changelog

This page documents all notable changes to ZKPassport SDK, particularly highlighting any breaking changes that developers should be aware of when upgrading.

## Upcoming release (v0.4.0) - Planned for 2025-05-16

### Breaking Changes

- The new websocket logic introduces some breaking changes that makes it incompatible with previous versions of the mobile app. To use this release of the SDK, you will need to have the version 0.6.13 or higher of the mobile app.

### New Features

- None currently

### Bug Fixes

- Stabilise websocket to prevent connection issues and message loss

## v0.3.4 - Latest release

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
