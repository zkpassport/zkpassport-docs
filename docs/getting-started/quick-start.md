---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quick Start

:::warning
This is experimental software. While it has undergone external review, it has not yet received a formal security audit. Please use with caution and at your own risk in production environments.
:::

The fastest way to add ZKPassport to your app is the drop-in QR card from [`@zkpassport/ui`](https://www.npmjs.com/package/@zkpassport/ui). It renders the QR code, manages the whole verification flow (connecting, scanning, generating, retrying), and hands you the result. It works in React and in any vanilla JS / framework setup.

## Installation

Install the UI package alongside the SDK using npm (or any JavaScript package manager such as yarn, pnpm or bun):

```bash
npm install @zkpassport/sdk @zkpassport/ui
```

No API key and no account are required to get started — just install the packages and you're good to go.

## Add the verification card

The card takes your app details and a `query` callback where you describe what to verify. Below we verify the user is 18 or older. Everything else — the QR code, status transitions, and retry — is handled for you.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";

export default function VerifyPage() {
  return (
    <ZKPassportQRCode
      name="Your App Name"
      logo="https://your-domain.com/logo.png"
      purpose="Prove you are 18+ years old"
      scope="adult"
      query={(queryBuilder) => queryBuilder.gte("age", 18).done()}
      onResult={({ verified, result, uniqueIdentifier }) => {
        if (verified) {
          console.log("User is 18+", result.age.gte.result);
          console.log("Unique identifier", uniqueIdentifier);
        } else {
          console.log("Verification failed");
        }
      }}
    />
  );
}
```

In the Next.js App Router, the React entry is marked `"use client"`, so import it from a client component.

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";

// Renders into an existing element, e.g. <div id="zkpassport"></div>
const handle = mount(document.getElementById("zkpassport"), {
  name: "Your App Name",
  logo: "https://your-domain.com/logo.png",
  purpose: "Prove you are 18+ years old",
  scope: "adult",
  query: (queryBuilder) => queryBuilder.gte("age", 18).done(),
  onResult: ({ verified, result, uniqueIdentifier }) => {
    if (verified) {
      console.log("User is 18+", result.age.gte.result);
      console.log("Unique identifier", uniqueIdentifier);
    } else {
      console.log("Verification failed");
    }
  },
});

// handle.update(nextOptions) — swap options
// handle.retry()             — rebuild the request
// handle.unmount()           — tear it all down
```

The vanilla `mount()` works the same in plain JS, Vue, Svelte, Solid, Astro, or any bundler-based stack.

</TabItem>
</Tabs>

That's a complete, working verification flow. The `query` callback receives the SDK's query builder — chain any conditions you need and return `queryBuilder.done()`.

## Where to go next

- **[Basic Usage](./basic-usage)** — build richer queries, understand the full lifecycle callbacks, and drop down to the SDK directly when you need custom UI.
- **[Dashboard & Policies](./policies)** — manage branding and the exact request from the [ZKPassport Dashboard](https://dashboard.zkpassport.id) and reference it with `.policy("pol_xyz")` instead of building the query in code.
- **[Examples](../examples)** — age, nationality, residency, personhood, KYC, FaceMatch, and client-server verification.

:::tip
Prefer a full project to start from? Check out our Next.js boilerplate [here](https://github.com/zkpassport/zkpassport-sdk-example).
:::
