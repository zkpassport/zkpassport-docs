---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Dev Mode

If you don't have a valid passport or national ID to test ZKPassport with, you can enable the dev mode in the mobile app and the SDK to generate and verify proofs with mock passports.

Mock passports are signed by the Zero Knowledge Republic (ZKR), a mock issuer we use to issue mock passports for the dev mode. The root certificates (CSCs) of the ZKR are included in our certificate registry on Ethereum Sepolia. However, they won't be included in mainnet versions of our registry. All mock passport proofs have 1 as unique identifier value, and their unique identifier type is `NullifierType.NON_SALTED_MOCK`.

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

## What Dev Mode Can't Test

- **Verify against Sepolia.** In dev mode, `verify()` checks mock passports against the certificate registry on Ethereum Sepolia. If you pass your own RPC provider in `config.rpcUrl`, it must be a Sepolia RPC: with a mainnet one, every mock proof is refused with "The ID was signed by an unrecognized root certificate".
- **No FaceMatch.** FaceMatch compares the person holding the phone with the mock passport's photo, so it can't pass with a mock ID. Leave `.facematch()` out of dev mode requests, and don't use a policy that asks for one.
- **No salted identifier.** A salted unique identifier requires `.facematch("strict")`, so dev mode requests use a non-salted identifier. Expect `NullifierType.NON_SALTED_MOCK` from `verify()`.

So a dev mode request checks your integration (the query, binding, scope, `verify()` and its configuration), but not FaceMatch or a salted identifier. Test those with a real ID.
