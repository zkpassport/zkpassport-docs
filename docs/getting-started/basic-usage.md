---
sidebar_position: 2
---

# Basic Usage

Learn how to use ZKPassport SDK in your application with these basic examples.

## Basic Implementation

Here's a basic example of how to use the ZKPassport SDK:

```typescript
import { ZKPassport, EU_COUNTRIES } from "@zkpassport/sdk";

// Initialize ZKPassport with your domain
// If running this in a browser, you can skip the domain parameter
// as it will be inferred automatically by the SDK
const zkPassport = new ZKPassport("demo.zkpassport.id");

// Create a request with your app details
const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are an adult from the EU but not from Scandinavia",
  // Optional scope for the user's unique identifier
  scope: "eu-adult-not-scandinavia",
});

// Build your query with the required attributes or conditions you want to verify
const {
  url,
  requestId,
  onRequestReceived,
  onGeneratingProof,
  onProofGenerated,
  onResult,
  onReject,
  onError,
} = queryBuilder
  .disclose("firstname")
  .gte("age", 18)
  .in("nationality", EU_COUNTRIES)
  .out("nationality", ["Sweden", "Denmark"])
  .done();
```

## Using the URL

The URL is a link redirecting the user to the ZKPassport app to show them your request. You can either show it in a QR code or as a link on your website (if the user is visiting directly from their phone).

### Generate a QR code

You can use a library such as [qrcode](https://www.npmjs.com/package/qrcode) to generate a QR code from the URL.

```typescript
import qrcode from "qrcode";

// This assuming you have a canvas tag with id canvas on your HTML page
// i.e. <canvas id="canvas"></canvas>
qrcode.toCanvas(document.getElementById("canvas"), url);
```

### Add a link to the URL

```html
<a href="{url}">Verify with ZKPassport</a>
```

## Handling Events

The SDK provides several callbacks to handle different stages of the verification process:

```typescript
// Request received callback
// i.e. the user has scanned the QR code and now sees the request
// popup on their mobile device
onRequestReceived(() => {
  console.log("Request received");
});

// Proof generation started
// i.e. the user has accepted the request and the proof is being generated
onGeneratingProof(() => {
  console.log("Generating proof");
});

// Individual proof generated
// i.e. the proof has been generated for one of the verifications
onProofGenerated(({ proof, vkeyHash, version, name }: ProofResult) => {
  console.log("Proof generated", proof);
  console.log("Verification key hash", vkeyHash);
  console.log("Version", version);
  console.log("Name", name);
});

// Final result callback
// i.e. the proofs have been generated and the result is ready
onResult(
  ({
    uniqueIdentifier,
    verified,
    result,
  }: {
    uniqueIdentifier: string;
    verified: boolean;
    result: QueryResult;
  }) => {
    // Access the verification results
    console.log("firstname", result.firstname.disclose.result);
    console.log("age over 18", result.age.gte.result);
    console.log("nationality in EU", result.nationality.in.result);
    console.log("nationality not from Scandinavia", result.nationality.out.result);

    // Access the original request parameters
    console.log("age over", result.age.gte.expected);
    console.log("nationality in", result.nationality.in.expected);
    console.log("nationality not in", result.nationality.out.expected);

    // Verify proof validity
    console.log("proofs are valid", verified);

    // Get unique identifier
    console.log("unique identifier", uniqueIdentifier);
  }
);
```
