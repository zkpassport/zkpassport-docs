---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Dev Mode

If you don't have a valid passport or national ID to test ZKPassport with, you can enable the dev mode in the mobile app and the SDK to generate and verify proofs with mock passports.

Mock passports are signed by the Zero Knowledge Republic (ZKR), a mock issuer we use to issue mock passports for the dev mode. The root certificates (CSCs) of the ZKR are included in our certificate registry on Ethereum Sepolia. However, they won't be included in mainnet versions of our registry. All mock passport proofs have 1 as unique identifier.

## Enable Dev Mode in the Mobile App

If you've just installed the app and don't have any ID loaded yet, you'll land on the welcome screen. Enable dev mode from here by long pressing the empty area just above the **Scan your ID** button (highlighted below).

<img src="/img/dev-mode-0.webp" alt="Welcome screen with the long press area highlighted above the Scan your ID button" width="200" />

If you already have an ID loaded, open the **Settings** screen instead by tapping the gear icon in the top right corner of the main "Your IDs" screen, then tap **Developer Options**.

<img src="/img/dev-mode-1.webp" alt="Settings screen" width="200" />

In Developer Options, toggle **Enable Developer Mode** on. This lets you skip the passport scanning step and use simulated data.

<img src="/img/dev-mode-2.webp" alt="Developer Options screen" width="200" />

Once enabled, mock IDs issued by the Zero Knowledge Republic (with different data and configurations) will be loaded into your "Your IDs" screen, which you can swipe through and use to generate mock proofs.

<img src="/img/dev-mode-3.webp" alt="Mock ID loaded in Your IDs" width="200" />

## Enable Dev Mode in the SDK

To enable dev mode, set `devMode` to `true`. Without it, proofs from mock passports are considered invalid. It's available under `service` on the `@zkpassport/ui` button and as an option on `request()` when using the SDK directly. When you verify the proofs on your server, pass `devMode: true` to `verify()` as well.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  purpose="Your Purpose"
  // Enable dev mode here
  service={{ scope: "your-scope", devMode: true }}
  query={{ age: { min: 18 } }}
  onSuccess={({ proofs, result }) => {
    // Verify on your server with verify({ ..., devMode: true })
  }}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { VerifyWithZKPassport } from "@zkpassport/ui/button";

VerifyWithZKPassport.render("#zkpassport", {
  purpose: "Your Purpose",
  // Enable dev mode here
  service: { scope: "your-scope", devMode: true },
  query: { age: { min: 18 } },
  onSuccess: ({ proofs, result }) => {
    // Verify on your server with verify({ ..., devMode: true })
  },
});
```

</TabItem>
<TabItem value="sdk" label="SDK">

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "Your App Name",
  logo: "https://your-domain.com/logo.png",
  purpose: "Your Purpose",
  scope: "your-scope",
  // Enable dev mode here
  devMode: true,
});
```

</TabItem>
</Tabs>

## What Works and Its Limitations

Dev mode is for trying the flow with mock IDs. Some features can't be tried with them, so plan your dev-mode request around these.

### Run your site on `localhost`, not a `.localhost` subdomain

ZKPassport's verification window trusts a page served from `localhost` or `127.0.0.1` with any domain. So locally you can name your production domain, and its dashboard policy, as you would in production. For example, serve at `http://localhost:3000`.

A name under `.localhost`, such as `http://myapp.localhost:3000`, doesn't work. Browsers send it to your machine, but to ZKPassport it's a different site from `localhost`, and its origin can't be verified as one of your allowed origins. Use plain `localhost` or `127.0.0.1` instead.

### What works

A request with `devMode: true`, a non-salted unique identifier, and **no FaceMatch** works end to end with a mock ID from the iOS app. For example, with a query that only asks for `age` 18 or over:

- the app makes the proofs;
- `verify({ ..., devMode: true })` returns `verified: true`;
- `uniqueIdentifierType` is `NullifierType.NON_SALTED_MOCK`.

### Verifying locally needs a Sepolia RPC

The root certificates of mock IDs are only in the certificate registry on Ethereum Sepolia (see above). With `devMode: true`, `verify()` reads the registry on Sepolia, so when you verify with `verifierMode: "local"` and your own RPC in `config.rpcUrl`, that RPC must be a **Sepolia** one.

With a mainnet RPC, the proofs are made but `verify()` returns `verified: false`. `queryResultErrors` then has `sig_check_dsc` and the message "The ID was signed by an unrecognized root certificate".

```typescript
const result = await zkPassport.verify({
  proofs,
  originalQuery,
  queryResult,
  devMode: true,
  verifierMode: "local",
  // A Sepolia RPC: mock IDs' root certificates are only in the Sepolia registry
  config: { rpcUrl: "https://sepolia.infura.io/v3/<your-key>" },
});
```

If you use one RPC for production and another for dev mode, choose it from the same flag you use for `devMode`.

### FaceMatch can't pass with a mock ID

FaceMatch compares the person scanning with the photo on the ID, in dev mode too. A mock ID's photo isn't the tester's face, so FaceMatch, regular or strict, can't confirm a match. The app shows "Private FaceMatch timed out" ("We couldn't confirm that your face matches the ID used for this verification"), and no proof is sent.

Leave FaceMatch out of your dev-mode request.

### Salted identifiers and policies with FaceMatch can't be tried with mock IDs

[Salted identifiers](../examples/salted-identifiers) require FaceMatch. In dev mode, `regular` is allowed instead of `strict`, but some FaceMatch is still required, and the request throws without it. As FaceMatch can't pass with a mock ID, a salted identifier can't be tried end to end with one. The same goes for a dashboard policy that asks for FaceMatch.

To try the rest of your flow in dev mode:

- ask for a non-salted identifier (`uniqueIdentifierType: "non-salted"`, or `NullifierType.NON_SALTED` on the SDK);
- send a query without FaceMatch, instead of a policy that has it;
- try FaceMatch and salted identifiers with a real ID, outside dev mode.

### Summary

| Request in dev mode, with a mock ID | Result |
| --- | --- |
| Non-salted, no FaceMatch, Sepolia RPC for `verify()` | ✅ `verified: true`, `NON_SALTED_MOCK` |
| Non-salted, no FaceMatch, mainnet RPC for `verify()` | ❌ "The ID was signed by an unrecognized root certificate" (`sig_check_dsc`) |
| Salted, regular FaceMatch | ❌ "Private FaceMatch timed out" in the app |
| Salted, strict FaceMatch (for example a policy with FaceMatch) | ❌ The app doesn't complete the request |
| Salted, no FaceMatch | ❌ The request throws: salted identifiers require FaceMatch |
