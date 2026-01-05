---
id: limitations
title: Limitations
sidebar_position: 7
---

# Limitations

When integrating ZKPassport into your application, please make sure to take into account the limitations listed below.

## Supported Identity Documents

ZKPassport does not support all identity documents. Only passports, national IDs, and residence permits that comply with ICAO 9303 standards whose issuing country publish their signing certificates are supported. You can have a look at our coverage map [here](https://registry.zkpassport.id/map) to see the countries and documents that are supported. Note that some countries may have started to issue supported IDs only recently (e.g. Indian passports, EU National IDs).

As such, we recommend either making ZKPassport checks optional or using a fallback mechanism to ensure the user can still access the service if their ID is not supported. The different privacy guarantees between ZKPassport and different solutions should also be stated clearly to the user.

:::info
The requirements we set for the supported identity documents are not arbitrary. They are based on the minimum cryptographic requirements we need to derive sufficient guarantees for our identity proofs (necessary due to the fully private nature of ZKPassport). This guarantee is provided by the chip of electronic IDs. However, relying on the photo of a passport or ID card within a ZK proof provides close to no guarantee on whether the ID is authentic or not.
:::

## FaceMatch support

Private FaceMatch verifies that the user going through the verification process is the same person as the one on the ID. However, its support is more limited than other checks provided by ZKPassport due to a combination of the following reasons:

- The app needs to be executed on a trustable device to perform the face scan. iPhones can provide this with good guarantees. On Android, the app may refuse to perform the face scan on some devices considered untrustworthy.
- The user's photo extracted from the ID may not be retrieved or parsed properly, so the face scan cannot be performed. We are currently working on fixing it for the few IDs going through this issue.
- (Android only) The device relies on unsupported signature algorithms for the attestation phase. We have not yet received any reports of this happening, but we anticipate it may happen on rare occasions.
- Other edge cases which we will address as they are reported and identified.
