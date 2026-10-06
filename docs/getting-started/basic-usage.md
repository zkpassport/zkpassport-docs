---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Basic Usage

This guide covers the **self-served** flow: you describe your app and build the query in code. (If you'd rather manage the request from the dashboard, see [Dashboard & Policies](./policies).)

There are two layers you can work with:

- **[`@zkpassport/ui`](https://www.npmjs.com/package/@zkpassport/ui)** — the drop-in **Verify with ZKPassport** button, which opens ZKPassport's hosted verification page in a popup and manages the flow for you. This is the recommended starting point and what [Quick Start](./quick-start) uses.
- **[`@zkpassport/sdk`](https://www.npmjs.com/package/@zkpassport/sdk)** — the underlying SDK (`request()`, the query builder, the lifecycle callbacks, and `verify()`). Use it directly when you want to build your own UI, and on your server to verify the proofs.

The two layers describe the query differently: the button takes a plain object, the SDK takes a chainable builder. Both are shown below.

## Building your query

With the button, `query` is a plain object — one entry per attribute. In this example we disclose the user's firstname, verify they are over 18, and that they are an EU citizen but not from Scandinavia.

```typescript
import { EU_COUNTRIES } from "@zkpassport/sdk";

const query = {
  // Disclose the user's firstname
  firstname: { disclose: true },
  // Verify the user's age is greater than or equal to 18
  age: { min: 18 },
  // EU_COUNTRIES is a constant exported by the SDK containing all the EU countries,
  // and Scandinavian countries are excluded (note: Norway is not an EU country)
  nationality: { included: EU_COUNTRIES, excluded: ["Sweden", "Denmark"] },
};
```

The shape is the same for every attribute:

- **`min` / `max`** — inclusive bounds, on `age`, `birthdate` and `expiry_date`. Dates are day-granular, so "under 65" is `{ max: 64 }` and "born before 2007" is `{ max: new Date("2006-12-31") }`.
- **`included` / `excluded`** — country sets, on `nationality` and `issuing_country`. Both accept country names or alpha-3 codes.
- **`disclose: true`** — reveal the value. Available on `firstname`, `lastname`, `fullname`, `gender`, `document_number`, `document_type`, `birthdate`, `expiry_date`, `nationality` and `issuing_country`.
- **`sanctions: true`** — check the user against the available sanctions lists.
- **`facematch: true`** (or `{ mode: "regular" }`) — verify the person generating the proof is the one on the ID.

:::note
Whenever the button's query discloses anything, it also discloses `document_type` — that's what makes the other disclosed values decodable. Add `.disclose("document_type")` when you recreate the query on your server, or verification fails.
:::

Using the SDK directly, you chain the same conditions on a **query builder** instead:

```typescript
const { query } = zkPassport
  .createQuery()
  .disclose("firstname")
  .gte("age", 18)
  .in("nationality", EU_COUNTRIES)
  .out("nationality", ["Sweden", "Denmark"])
  .done();
```

`done()` finalizes the query. The builder is also what you use on your server to recreate the query for `verify()`. See the [API Reference](../api) for the full list of builder methods (`eq`, `gte`, `gt`, `lte`, `lt`, `range`, `in`, `out`, `disclose`, `bind`, `sanctions`, `facematch`); the button's object covers the common subset of these.

## Rendering the verify button

Pass the `purpose` and the `query` to the button. The purpose is displayed to the user in the ZKPassport app, alongside your app's name and logo, which come from your [dashboard](https://dashboard.zkpassport.id) project for the domain the button runs on.

:::info
The `scope` goes under `service` and is optional. It constrains the result's unique identifier (more on this [here](../examples/personhood)) to a specific use case; if omitted, it defaults to your domain.
:::

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";
import { EU_COUNTRIES } from "@zkpassport/sdk";

export default function VerifyPage() {
  return (
    <VerifyWithZKPassport
      purpose="Prove you are an adult from the EU but not from Scandinavia"
      service={{ scope: "eu-adult-not-scandinavia" }}
      query={{
        firstname: { disclose: true },
        age: { min: 18 },
        nationality: { included: EU_COUNTRIES, excluded: ["Sweden", "Denmark"] },
      }}
      onSuccess={async ({ proofs, result }) => {
        // Verify the proofs on your server (see Quick Start)
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proofs, result }),
        });
        return (await response.json()).verified;
      }}
    />
  );
}
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mountVerifyButton } from "@zkpassport/ui/button";
import { EU_COUNTRIES } from "@zkpassport/sdk";

const handle = mountVerifyButton(document.getElementById("zkpassport"), {
  purpose: "Prove you are an adult from the EU but not from Scandinavia",
  service: { scope: "eu-adult-not-scandinavia" },
  query: {
    firstname: { disclose: true },
    age: { min: 18 },
    nationality: { included: EU_COUNTRIES, excluded: ["Sweden", "Denmark"] },
  },
  onSuccess: async ({ proofs, result }) => {
    // Verify the proofs on your server (see Quick Start)
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    return (await response.json()).verified;
  },
});
```

</TabItem>
</Tabs>

Alongside `purpose` and `query`, the button takes what your service accepts under `service` (`scope`, `devMode`, `validity`, `uniqueIdentifierType`), per-user values to commit into the proof under `bind`, and the button's own appearance under `style` (`variant: "filled" | "outline"` and `label`). It always uses the domain of the page it runs on. See the [API Reference](../api#zkpassportui-the-verify-button) for the full list.

## Handling the verification lifecycle

The flow emits callbacks at each stage. With the SDK you register them on the object returned by `done()`. The button reports the intermediate stages in its own UI, so it takes only the two terminal callbacks: `onSuccess` and `onError`.

### Request received (SDK)

Triggered when the user has scanned the QR code (or clicked the link) and now sees the request popup on their device with your app details and the attributes you requested.

```typescript
onRequestReceived(() => {
  console.log("Request received");
});
```

### Proof generation started (SDK)

Triggered when the user has accepted the request and the proof is being generated. Expect this to take up to ~10 seconds on a decent connection.

```typescript
onGeneratingProof(() => {
  console.log("Generating proof");
});
```

### Individual proof generated (SDK)

Triggered each time one of the underlying proofs is generated. You usually don't need this — expect at least 4 proofs, sometimes more depending on what you requested.

```typescript
onProofGenerated(({ proof, vkeyHash, version, name }) => {
  console.log("Proof generated", proof);
});
```

### Success

The main callback. Triggered once all proofs have been generated. You get the raw `proofs` and the `result` of your query.

:::warning
The proofs aren't verified yet. Verify them on your server with [`verify()`](../api#verify) before trusting the result — see [Quick Start](./quick-start#verify-the-proofs-on-your-server). `verify()` also returns the unique identifier tied to the user's ID (see [Personhood](../examples/personhood)).
:::

```typescript
onSuccess(({ proofs, result }) => {
  // Access the query results
  console.log("firstname", result.firstname.disclose.result);
  console.log("age over 18", result.age.gte.result);
  console.log("nationality in EU", result.nationality.in.result);
  console.log("nationality not from Scandinavia", result.nationality.out.result);

  // Access the original request parameters
  console.log("age over", result.age.gte.expected);

  // Send the proofs and the result to your server to verify them
});
```

With the button, your `onSuccess` handler decides the final state: return `false` (or throw) to show the error state, for example when your server rejects the proofs.

`onResult` is deprecated in favor of `onSuccess`, and the button doesn't support it.

### Rejection and errors

With the SDK, a rejection and an error are separate callbacks:

```typescript
onReject(() => console.log("User rejected the request"));
onError((message) => console.log("Error during verification", message));
```

The button folds both into `onError`, which receives a `ZKPassportError`. Its `kind` says what happened (`"rejected"`, `"closed"`, `"bridge-lost"`, `"failed"` or `"blocked"`), and `cancelled` is true when the user simply didn't finish — handy for keeping those out of your error reporting:

```typescript
onError((error) => {
  if (error.cancelled) return; // the user declined or closed the window
  console.log("Verification failed", error.kind, error.message);
});
```

And that's it! Use the `uniqueIdentifier` returned by `verify()` to identify the user in your database and the results to drive your logic. For more, see the [examples](../examples) section.

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

const { url, onSuccess, onRequestReceived, onError } = queryBuilder
  .disclose("firstname")
  .gte("age", 18)
  .in("nationality", EU_COUNTRIES)
  .out("nationality", ["Sweden", "Denmark"])
  .done();

// `url` links to the ZKPassport app. Encode it in a QR code with a library
// such as `qrcode`, or render it as a link if the user is on their phone:
//   <a href={url}>Verify with ZKPassport</a>

onSuccess(({ proofs, result }) => {
  // Send the proofs and the result to your server and verify them there
});
```

## Additional configuration

`request()` (and the corresponding props on `@zkpassport/ui`) accept a few more options:

- **`mode`** — the proof mode: `"fast"` (default), `"compressed"`, or `"compressed-evm"` (required for [onchain verification](./onchain)).
- **`validity`** — how many seconds ago the proof checking the ID's expiry date may have been generated. Defaults to 7 days.
- **`devMode`** — accept mock proofs from the dev-mode passports. See [Dev Mode](./dev-mode).
- **`uniqueIdentifierType`** / **`oprfKeyId`** — opt into a salted unique identifier. A salted identifier requires strict [FaceMatch](../examples/facematch) in the query. See [Salted Unique Identifiers (OPRF)](../examples/salted-identifiers).

On the button, `devMode`, `validity` and `uniqueIdentifierType` go under `service`; `mode` stays a top-level option.

See the [API Reference](../api) for the complete list and exact types.
