---
sidebar_position: 5
---

# Frequently Asked Questions

## General Questions

### What is ZKPassport?

ZKPassport is a privacy-preserving identity verification solution that allows users to prove specific attributes from their passports, ID cards, or residence permits without revealing all their personal information. It uses zero-knowledge proofs to enable selective disclosure of identity attributes such as age, nationality, or name.

### How does ZKPassport work?

With the ZKPassport mobile application, you can scan the chip of your passport, ID card, or residence permit using NFC. From this, the application extracts the relevant information, and then generates zero-knowledge proofs that can verify specific claims (like age, nationality, or name) without revealing any other personal data while guaranteeing the authenticity of the identity document. Everything is done locally on the device to ensure complete privacy from both the service and us.

### What are zero-knowledge proofs?

Zero-knowledge proofs are cryptographic methods that allow one party (the prover) to prove to another party (the verifier) that a statement is true without revealing any additional information beyond the validity of the statement itself.

In the context of ZKPassport, this means users (acting as provers) will prove attributes about their identity without revealing their actual ID. Web applications (acting as verifiers) can verify these claims without knowing anything more than what they are interested in while being sure that the identity document used for these claims is authentic.

### Is my personal data transferred or stored anywhere?

No, ZKPassport is designed with privacy as a core principle. Your personal data is encrypted and processed locally on your device and never leaves it. Only the proofs, along with the information you choose to share, are shared with the web application requesting your information.

### How is the unique identifier derived?

The unique identifier is derived from the ID data (retrieved from the chip). This data is combined with the domain name and the scope the service specified and hashed using Poseidon2. The resulting hash is used as the unique identifier. This ensures the unique identifier is the same for the same ID while differing between different services. And thanks to the one-way property of hash functions, it's not possible to derive the ID data from the unique identifier.

However, it's possible to derive the unique identifier from the ID data if you have complete knowledge of the ID chip data, the domain name and scope. This could include the issuing government (if they keep a record of all the IDs they signed). In order to prevent this, we are currently working on supporting salted unique identifiers, i.e. adding a secret to the derivation process using vOPRFs (Verifiable Oblivious Pseudo-Random Functions).

### Which identity documents are supported?

ZKPassport currently supports most passports, national IDs, and residence permits that comply with ICAO 9303 standards, which includes most modern electronic IDs with NFC capabilities.

### Face Tips and Tricks

Private Facematch in ZKPassport compares your live face to the image stored in the chip of your biometric ID.
There are five steps to complete this facematch process:

1. Look directly at the camera with a neutral expression.
2. Slowly rotate your face slightly to the left using your neck (make sure you can still see the phone screen). The app will provide on-screen instructions to guide you if you need to adjust your direction.
3. Repeat the same process while looking up.
4. Repeat while looking right.
5. Repeat while looking down.

#### Reasons Why Private Facematch Might Fail

To ensure that the process is performed correctly and on a trusted device, ZKPassport uses Google Play Integrity on Android and the App Attestation Service on Apple devices.
The ZKPassport mobile app will not generate a Private Facematch Proof if your device is NOT regarded as being highly trustworthy by the services above.
Possible reasons include:

1. The device is jailbroken or rooted.
2. The device is running GrapheneOS.
3. The device’s certificate is listed among the blacklisted certificates maintained by Google
4. The manufacturer uses a signature scheme that we do not support.
5. The security guarantees provided by the device are not high enough.

### Why is the app over 400MB?

The ZKPassport mobile app packages a few things directly in its binary in order to provide fully local verification. This includes:

- A 128MB SRS from Aztec trusted setup to cover ZK proof generation for circuits up to the 2^21 subgroup size
- A 180MB of ML models to perform Private FaceMatch locally on the device
- Other artifacts such as images, fonts, videos/animations, and the ZK prover binary

## Troubleshooting

### The MRZ scan is not working. How can I proceed?

If your MRZ (the 2 lines at the bottom of passports or 3 lines at the bottom of ID cards) is not being recognized, ensure you have a clear view of the MRZ on the camera when scanning it. Make sure the **lighting conditions are good** as poorly lit environments can make it harder to read the MRZ. Try to avoid glares on the MRZ that can appear if you shine a light directly on it.

If everything else fails, you can manually enter the MRZ data by clicking on the "Enter Manually" button. There you can enter the document's expiry date, your birthdate and your document number. On ID cards, it is common to have multiple numbers, so make sure to only enter the document number as the others are not relevant for this process. You can tell which of the numbers on the front of the ID is the correct one to enter by looking at the MRZ on the back, it will be the one immediately following your document type and country code (e.g. after `IDFRA...`, `IDD<<...`, `IDESP...`, `C<ITA...`, `I<PRT...`).

### I can't scan the chip of my passport/ID card. What should I do?

If the label on the NFC modal (titled Ready to scan) doesn't change to "Hold still", then it means the chip has not been detected by your phone. Most likely, you need to move your phone around while maintaining **direct physical contact** between your phone and the ID.

Also, note that some passports have a protective shield in their cover and they require to be opened on the photo page to be scanned. Those that don't have such shield can be scanned from the outside directly on the front cover or back cover.

When you see the NFC modal changes to "Hold still", it means the chip has been detected by your phone and you should stop moving your phone immediately until the process is completed, otherwise you may lose the connection to the chip and the scan will fail. Generally, **laying your ID on a flat surface and leaving your phone on it during the process is the best way to ensure a successful scan**.

If the app redirects you to the MRZ page and invites you to enter the MRZ data manually, it means your MRZ was misread and the authentication with the chip failed. You can enter the MRZ data manually as described in the previous question.

If problems persist, notably if the scan starts but seems to fail in the middle of the process, remove the case of your phone and try again.

If you are using an iPhone, and connection to the chip keeps on failing still, a workaround can be to disable temporarily WiFi or even turn on airplane mode to prevent any interference with the NFC communication channel.

### How can I report an issue I'm facing with the app?

You can report issues by submitting a detailed description of the issue and the steps to reproduce it [here](https://zkpassport.featurebase.app/), including what type of ID you have (i.e. passport, ID card, residence permit) and its country of issuance along with the version of the app you are using and your device brand and model. Make sure to not include any sensitive information in your report.

## Integration Questions

### How can I integrate ZKPassport into my application?

You can integrate ZKPassport using our SDK. Check out the [Quick Start Guide](/getting-started/quick-start) and [Basic Usage](/getting-started/basic-usage) sections for detailed instructions.

### Are there any example implementations available?

Yes, we provide several examples demonstrating different use cases. See our [Examples](/examples) section for implementations of age verification, nationality verification, residency verification, and more. If you want to try it out, you can use our [demo page](https://demo.zkpassport.id).

### Can I use the proofs in my Noir circuits?

Yes, you can use the proofs in your Noir circuits if you are using Barretenberg as the proving backend by using the [`verify_proof`](https://noir-lang.org/docs/noir/standard_library/recursion#verifying-recursive-proofs) function from the standard library. You would need to use the helper functions from our [internal utils library](https://github.com/zkpassport/zkpassport-utils) to get the necessary information about the proof and its verification key. We'll provide more information on how to do it soon.

### I'm encountering errors during integration. Where can I get help?

Check our [API Reference](/api) for detailed documentation on all available methods and parameters. If you're still experiencing issues, you can open an issue on our [GitHub repository](https://github.com/zkpassport/zkpassport-sdk).

### How can I report a bug or request a feature?

You can report bugs or request features by opening an issue on our [GitHub repository](https://github.com/zkpassport/zkpassport-sdk). We appreciate your feedback and contributions to improve ZKPassport.

## Technical Questions

### What proving system is used by ZKPassport?

ZKPassport uses UltraHonk proofs by leveraging the [Barretenberg](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) backend from [Aztec](https://aztec.network/) to generate proofs natively on mobile devices, and [Noir](https://noir-lang.org/) as the language for writing the logic of the proofs (aka circuits).

### Is the code of ZKPassport open source?

Yes, our circuits written in Noir are open source (Apache 2.0 license) and available on [GitHub](https://github.com/zkpassport/circuits). Same for the [SDK](https://github.com/zkpassport/zkpassport-sdk). The mobile app will be open sourced when out of the testing phase and publicly listed on the App Store and Google Play Store.

### How fast is the proof generation?

ZKPassport generates at least 4 subproofs to have a complete proof of identity. The first 3 are the base proofs, including 2 proofs to verify the signatures of the issuing country over the ID data and 1 proof to verify the integrity of the ID data. The 4th proof is the disclosure proof using the ID data to selectively disclose the requested attributes. There can be more than 1 disclosure proof depending what kind of information is requested from the user.

The 3 base proofs are generated right after the user scans their ID while the disclosure proofs are generated when the user approve a request to share specific attributes. The 3 base proofs can take from 10s to 50s to generate depending on the type of signature algorithm used by the issuing country and the mobile device used. The disclosure proofs generally take from less than 1s to 10s to generate, depending on the mobile device used and the kind of attributes requested.

As the 3 base proofs are generated right after the ID is scanned and cached for later use, the actual proof generation time the user will experience is the time it takes to generate the disclosure proofs, so it's pretty fast.

### How much RAM does ZKPassport use?

Proof generation is a memory intensive operation. How much RAM is used depends primarly on the signature algorithm used by the ID which can be either RSA or ECDSA. If using RSA, the RAM usage should not go over 1GB (even for RSA 4096 bits with SHA-512) and thus can run on most mobile devices including low-end ones. ECDSA can be more memory intensive, especially for over 500 bits curve such as P521 or Brainpool P512r1 that are often paired with SHA-512, but still then it should not exceed 2GB of RAM, which may get close to the limit of some low-end devices, but will still work on mid-range and high-end ones.

Note that the proofs verifying the signatures only need to be generated once after scanning the ID and are cached for later use. Disclosure proofs have a negligible memory footprint.
