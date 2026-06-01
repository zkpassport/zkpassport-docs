---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Basic Usage

This guide covers the **self-served** flow: you describe your app and build the query in code. (If you'd rather manage the request from the dashboard, see [Dashboard & Policies](./policies).)

There are two layers you can work with:

- **[`@zkpassport/ui`](https://www.npmjs.com/package/@zkpassport/ui)** — the drop-in card that renders the QR code and manages the flow for you. This is the recommended starting point and what [Quick Start](./quick-start) uses.
- **[`@zkpassport/sdk`](https://www.npmjs.com/package/@zkpassport/sdk)** — the underlying SDK (`request()`, the query builder, and the lifecycle callbacks). Use it directly when you want to build your own UI.

Both share the exact same query builder and callbacks, so everything below applies whichever layer you use.

## Building your query

Inside the `query` callback you receive a **query builder** and chain the attributes or conditions you want to verify. In this example we disclose the user's firstname, verify they are over 18, and that they are an EU citizen but not from Scandinavia.

```typescript
import { EU_COUNTRIES } from "@zkpassport/sdk";

const query = (queryBuilder) =>
  queryBuilder
    // Disclose the user's firstname
    .disclose("firstname")
    // Verify the user's age is greater than or equal to 18
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

`done()` finalizes the query. See the [API Reference](../api) for the full list of builder methods (`eq`, `gte`, `gt`, `lte`, `lt`, `range`, `in`, `out`, `disclose`, `bind`, `sanctions`, `facematch`).

## Rendering the verification card

Pass your app details and the `query` callback to the card. All of the information below (except the scope) is displayed to the user in the ZKPassport app.

:::info
The `scope` is an optional parameter that constrains the result's unique identifier (more on this [here](../examples/personhood)) to a specific use case. If omitted, it defaults to your domain.
:::

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { EU_COUNTRIES } from "@zkpassport/sdk";

export default function VerifyPage() {
  return (
    <ZKPassportQRCode
      name="Your App Name"
      logo="https://your-domain.com/logo.png"
      purpose="Prove you are an adult from the EU but not from Scandinavia"
      scope="eu-adult-not-scandinavia"
      query={(queryBuilder) =>
        queryBuilder
          .disclose("firstname")
          .gte("age", 18)
          .in("nationality", EU_COUNTRIES)
          .out("nationality", ["Sweden", "Denmark"])
          .done()
      }
      onResult={({ verified, result, uniqueIdentifier }) => {
        if (!verified) return;
        console.log("firstname", result.firstname.disclose.result);
        console.log("age over 18", result.age.gte.result);
        console.log("unique identifier", uniqueIdentifier);
      }}
    />
  );
}
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";
import { EU_COUNTRIES } from "@zkpassport/sdk";

const handle = mount(document.getElementById("zkpassport"), {
  name: "Your App Name",
  logo: "https://your-domain.com/logo.png",
  purpose: "Prove you are an adult from the EU but not from Scandinavia",
  scope: "eu-adult-not-scandinavia",
  query: (queryBuilder) =>
    queryBuilder
      .disclose("firstname")
      .gte("age", 18)
      .in("nationality", EU_COUNTRIES)
      .out("nationality", ["Sweden", "Denmark"])
      .done(),
  onResult: ({ verified, result, uniqueIdentifier }) => {
    if (!verified) return;
    console.log("firstname", result.firstname.disclose.result);
    console.log("age over 18", result.age.gte.result);
    console.log("unique identifier", uniqueIdentifier);
  },
});
```

</TabItem>
</Tabs>

The card takes the same options as `request()` as props (`name`, `logo`, `purpose`, `scope`, `mode`, `devMode`, `validity`, …) plus a `domain` and a `theme` (`"light"`, `"dark"`, or `"auto"`), and all of the lifecycle callbacks below.

## Handling the verification lifecycle

The flow emits callbacks at each stage. With `@zkpassport/ui` you pass these as props/options; with the SDK directly you register them on the object returned by `done()`. They have the same signatures either way.

### Request received

Triggered when the user has scanned the QR code (or clicked the link) and now sees the request popup on their device with your app details and the attributes you requested.

```typescript
onRequestReceived(() => {
  console.log("Request received");
});
```

### Proof generation started

Triggered when the user has accepted the request and the proof is being generated. Expect this to take up to ~10 seconds on a decent connection.

```typescript
onGeneratingProof(() => {
  console.log("Generating proof");
});
```

### Individual proof generated

Triggered each time one of the underlying proofs is generated. You usually don't need this — expect at least 4 proofs, sometimes more depending on what you requested.

```typescript
onProofGenerated(({ proof, vkeyHash, version, name }) => {
  console.log("Proof generated", proof);
});
```

### Final result

The main callback. Triggered once all proofs have been generated and verified by the SDK. You get the results, whether everything verified successfully, and the unique identifier tied to the user's ID (see [Personhood](../examples/personhood)).

:::warning
If `verified` is `false`, you should not trust the results and `uniqueIdentifier` will be `undefined`. Check the console warnings to see which checks failed.
:::

```typescript
onResult(
  ({ uniqueIdentifier, verified, result, proofs }) => {
    // Access the verification results
    console.log("firstname", result.firstname.disclose.result);
    console.log("age over 18", result.age.gte.result);
    console.log("nationality in EU", result.nationality.in.result);
    console.log("nationality not from Scandinavia", result.nationality.out.result);

    // Access the original request parameters
    console.log("age over", result.age.gte.expected);

    // Verify proof validity and get the unique identifier
    console.log("proofs are valid", verified);
    console.log("unique identifier", uniqueIdentifier);

    // `proofs` are the raw proofs — useful if you want to re-verify them server-side
    // (see the Client-Server example)
  }
);
```

The `onResult` response also includes `uniqueIdentifierType`, the raw `proofs` array, and `sdkInstance` (the SDK instance that produced the result).

### Rejection and errors

```typescript
onReject(() => console.log("User rejected the request"));
onError((error) => console.log("Error during verification", error));
```

And that's it! Use the `uniqueIdentifier` to identify the user in your database and the results to drive your logic. For more, see the [examples](../examples) section.

## Using the SDK directly

If you need full control over the UI, skip `@zkpassport/ui` and use the SDK directly. Initialize it with your domain, call `request()`, build the query, and use the returned `url` to render your own QR code or link.

```typescript
import { ZKPassport, EU_COUNTRIES } from "@zkpassport/sdk";

// In Node.js (or to override detection) pass your domain explicitly.
// In the browser you can omit it — it's inferred from window.location.
const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "Your App Name",
  logo: "https://your-domain.com/logo.png",
  purpose: "Prove you are an adult from the EU but not from Scandinavia",
  scope: "eu-adult-not-scandinavia",
});

const { url, onResult, onRequestReceived, onError } = queryBuilder
  .disclose("firstname")
  .gte("age", 18)
  .in("nationality", EU_COUNTRIES)
  .out("nationality", ["Sweden", "Denmark"])
  .done();

// `url` links to the ZKPassport app. Encode it in a QR code with a library
// such as `qrcode`, or render it as a link if the user is on their phone:
//   <a href={url}>Verify with ZKPassport</a>

onResult(({ verified, result, uniqueIdentifier }) => {
  if (verified) console.log("Verified", uniqueIdentifier);
});
```

## Additional configuration

`request()` (and the corresponding props on `@zkpassport/ui`) accept a few more options:

- **`mode`** — the proof mode: `"fast"` (default), `"compressed"`, or `"compressed-evm"` (required for [onchain verification](./onchain)).
- **`validity`** — how many seconds ago the proof checking the ID's expiry date may have been generated. Defaults to 7 days.
- **`devMode`** — accept mock proofs from the dev-mode passports. See [Dev Mode](./dev-mode).
- **`uniqueIdentifierType`** / **`oprfKeyId`** — opt into a salted unique identifier. A salted identifier requires `.facematch("strict")` in the query.

See the [API Reference](../api) for the complete list and exact types.
