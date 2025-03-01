---
sidebar_position: 5
---

# Frequently Asked Questions

## General Questions

### What is ZKPassport?

ZKPassport is a privacy-preserving identity verification solution that allows users to prove specific attributes from their passports, ID cards, or residence permits without revealing all their personal information. It uses zero-knowledge proofs to enable selective disclosure of identity attributes such as age, nationality, or name.

### How does ZKPassport work?

With the ZKPassport mobile application, you can scan the chip of your passport, ID card, or residence permit using NFC. From this, the application extracts the relevant information, and then generates zero-knowledge proofs that can verify specific claims (like age, nationality, or name) without revealing any other personal data while guaranteeing the authenticity of the identity document. Everything is done locally on the device to ensure complete privacy.

### What are zero-knowledge proofs?

Zero-knowledge proofs are cryptographic methods that allow one party (the prover) to prove to another party (the verifier) that a statement is true without revealing any additional information beyond the validity of the statement itself.

In the context of ZKPassport, this means users (acting as provers) will prove attributes about their identity without revealing their actual ID. Web applications (acting as verifiers) can verify these claims without knowing anything more than what they are interested in while being sure that the identity document used for these claims is authentic.

### Is my personal data transferred or stored anywhere?

No, ZKPassport is designed with privacy as a core principle. Your personal data is encrypted and processed locally on your device and never leaves it. Only the proofs, along with the information you choose to share, are shared with the web application requesting your information.

### Which identity documents are supported?

ZKPassport currently supports most passports, national IDs, and residence permits that comply with ICAO 9303 standards, which includes most modern electronic IDs with NFC capabilities.

## Integration Questions

### How can I integrate ZKPassport into my application?

You can integrate ZKPassport using our SDK. Check out the [Quick Start Guide](/getting-started/quick-start) and [Basic Usage](/getting-started/basic-usage) sections for detailed instructions.

### Are there any example implementations available?

Yes, we provide several examples demonstrating different use cases. See our [Examples](/examples) section for implementations of age verification, nationality verification, residency verification, and more. If you want to try it out, you can use our [demo page](https://demo.zkpassport.id).

### How can I integrate ZKPassport with my smart contracts?

At this time, ZKPassport SDK only provides a way to verify proofs in a web application (either browser or server-side). However, we are currently working on the infrastructure necessary to verify proofs on-chain. Stay tuned!

## Troubleshooting

### My passport/ID card is not being recognized. What should I do?

Ensure that your device has NFC capabilities and that they are enabled. Make sure your passport/ID card is placed correctly on the NFC reader area of your device. If problems persist, check if your document is supported.

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
