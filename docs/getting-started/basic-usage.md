---
sidebar_position: 2
---

# Basic Usage

With the SDK now installed in your project, you can use it to request information related to the identity of your users. Follow along in this guide to learn how to do so.

## Building your first request

First, you need to initialize the SDK with your domain

```typescript
// Note `EU_COUNTRIES` as it will be used later below
import { ZKPassport, EU_COUNTRIES } from "@zkpassport/sdk";

// Initialize ZKPassport with your domain
const zkPassport = new ZKPassport("your-domain.com");
```

If you are running this in a browser, you can skip the domain parameter as it will be inferred automatically by the SDK.

```typescript
// The SDK will fill in your domain from you using the window location object behind the scenes
const zkPassport = new ZKPassport();
```

Once this is done, you need to create a request giving some necessary details about your app and your purpose.
All of this information (except the scope) will be displayed to the user in the ZKPassport app.

:::info
The scope is an optional parameter you can specify if you want to constrain the result's unique identifier (more on this [here](../examples/personhood)) to a specific use case.
:::

```typescript
// Create a request with your app details
const queryBuilder = await zkPassport.request({
  name: "Your App Name",
  // A path to your app's logo
  logo: "https://your-domain.com/logo.png",
  // A description of the purpose of the request
  purpose: "Prove you are an adult from the EU but not from Scandinavia",
  // Optional scope for the user's unique identifier
  scope: "eu-adult-not-scandinavia",
});
```

Now, using the `queryBuilder` object, you can build your query with the required attributes or conditions you want to verify. In this example, we want to disclose the user's firstname, verify they are over 18 and that they are a citizen of a country in the EU but not from Scandinavia.

```typescript
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
  // Disclose the user's firstname
  .disclose("firstname")
  // Verify the user is greater than or equal to 18
  .gte("age", 18)
  // Verify the user's nationality is in the European Union
  // EU_COUNTRIES is a constant exported by the SDK containing all the EU countries
  .in("nationality", EU_COUNTRIES)
  // Verify the user's nationality is not from a Scandinavian country
  // Note: Norway is not an EU country
  .out("nationality", ["Sweden", "Denmark"])
  // Finalize the query
  .done();
```

The function `done()` at the end finalizes the query and returns the URL to the ZKPassport app along with the callbacks you can use to handle the different stages of the verification process.

## Using the URL

The URL is a link redirecting the user to the ZKPassport app to show them your request. You can either show it in a QR code or as a link on your website (if the user is visiting directly from their phone).

### Generate a QR code

You can use a library such as [qrcode](https://www.npmjs.com/package/qrcode) to generate a QR code from the URL.

```typescript
import qrcode from "qrcode";

// This is assuming you have a canvas tag with id canvas on your HTML page
// i.e. <canvas id="canvas"></canvas>
qrcode.toCanvas(document.getElementById("canvas"), url);
```

### Add a link to the URL

```html
<a href="{url}">Verify with ZKPassport</a>
```

## Handling Events

The SDK provides several callbacks to handle different stages of the verification process:

### Request received

This callback is triggered when the user has scanned the QR code (or clicked the link) and now sees the request popup on their mobile device with your app details, the purpose of the request and the attributes you are requesting.

```typescript
// No parameters are passed to the callback
// You can use this to update your UI to show the user you know they received the request
onRequestReceived(() => {
  console.log("Request received");
});
```

### Proof generation started

This callback is triggered when the user has accepted the request and the proof is being generated.

```typescript
// No parameters are passed to the callback
// You can use this to update your UI to show a progress indicator as now the proof is being generated
// Expect it to take up to 10 seconds to get the results back if the connection is decent
onGeneratingProof(() => {
  console.log("Generating proof");
});
```

### Individual proof generated

This callback is triggered when one of the proofs has been generated for one of the verifications.
You may not need this callback as what these proofs represent is a bit involved. But you can use it to update your UI as you should expect at least 4 proofs to be generated (but it can be more depending on what information you requested).

```typescript
// You can get the proof, the verification key hash, the version and the name of the proof
onProofGenerated(({ proof, vkeyHash, version, name }: ProofResult) => {
  console.log("Proof generated", proof);
  console.log("Verification key hash", vkeyHash);
  console.log("Version", version);
  console.log("Name", name);
});
```

### Final result callback

This callback is triggered when the proofs have been generated, the proofs have been verified by the SDK and the result is ready. This is the final step of the verification process. You can get the results of your request, whether everything verified successfully or not, and the unique identifier tied to the user's ID (c.f. [Personhood](../examples/personhood)).

:::warning
If `verified` is `false`, you should not trust the results and the `uniqueIdentifier` will be undefined. You can look at the console logs in the warnings to see what checks failed.
:::

```typescript
// That's the most important callback
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

And that's it! You can now use the `uniqueIdentifier` to identify the user in your database and use the results of the verifications to make decisions in your logic.

If you want to see more examples of what you can do with the SDK, you can check out the [examples](../examples) section.
