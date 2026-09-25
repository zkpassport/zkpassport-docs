---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quick Start

The fastest way to add ZKPassport to your app is the **Verify with ZKPassport** button from [`@zkpassport/ui`](https://www.npmjs.com/package/@zkpassport/ui). Clicking it opens ZKPassport's hosted verification page in a popup, which guides the user through the verification with the ZKPassport app and hands the proofs back to your page. You then verify the proofs on your server with [`@zkpassport/sdk`](https://www.npmjs.com/package/@zkpassport/sdk). It works in React and in any vanilla JS / framework setup.

## Installation

Install the UI package alongside the SDK using npm (or any JavaScript package manager such as yarn, pnpm or bun):

```bash
npm install @zkpassport/sdk @zkpassport/ui
```

No API key and no account are required to get started — just install the packages and you're good to go.

## Add the verify button

The button takes your app details and a `query` callback where you describe what to verify. Below we verify the user is 18 or older. When the user is done, `onSuccess` receives the proofs and the result, which you send to your server to be verified.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

export default function VerifyPage() {
  return (
    <VerifyWithZKPassport
      name="Your App Name"
      logo="https://your-domain.com/logo.png"
      purpose="Prove you are 18+ years old"
      scope="adult"
      query={(queryBuilder) => queryBuilder.gte("age", 18).done()}
      onSuccess={async ({ proofs, result }) => {
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proofs, result }),
        });
        const { verified } = await response.json();
        // Returning false shows the button's error state instead of success
        return verified;
      }}
    />
  );
}
```

In the Next.js App Router, the React entry is marked `"use client"`, so import it from a client component.

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mountVerifyButton } from "@zkpassport/ui/button";

// Renders into an existing element, e.g. <div id="zkpassport"></div>
const handle = mountVerifyButton(document.getElementById("zkpassport"), {
  name: "Your App Name",
  logo: "https://your-domain.com/logo.png",
  purpose: "Prove you are 18+ years old",
  scope: "adult",
  query: (queryBuilder) => queryBuilder.gte("age", 18).done(),
  onSuccess: async ({ proofs, result }) => {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    const { verified } = await response.json();
    // Returning false shows the button's error state instead of success
    return verified;
  },
});

// handle.update(nextOptions) — swap options
// handle.unmount()           — remove the button
```

The vanilla `mountVerifyButton()` works the same in plain JS, Vue, Svelte, Solid, Astro, or any bundler-based stack.

</TabItem>
</Tabs>

The `query` callback receives the SDK's query builder — chain any conditions you need and return `queryBuilder.done()`.

## Verify the proofs on your server

The proofs are not verified in the browser, where the result could be tampered with. On your server, recreate the same query with `createQuery()` and pass it to `verify()` along with the proofs, the result, and the scope you used. The button always uses the domain of the page it runs on, so create the `ZKPassport` instance with that domain.

```ts
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

// Call this from the route behind POST /api/verify with the request body
export async function verifyProofs({ proofs, result }) {
  // Recreate the query rather than accepting it from the browser
  const { query } = zkPassport.createQuery().gte("age", 18).done();

  const { verified, uniqueIdentifier } = await zkPassport.verify({
    proofs,
    originalQuery: query,
    queryResult: result,
    scope: "adult",
  });

  if (verified) {
    console.log("User is 18+", result.age.gte.result);
    // The same ID always gets the same identifier for your domain and scope
    console.log("Unique identifier", uniqueIdentifier);
  }
  return { verified };
}
```

That's a complete, working verification flow. See the [Client-Server example](../examples/client-server) for a full server.

## Where to go next

- **[Basic Usage](./basic-usage)** — build richer queries, understand the full lifecycle callbacks, and drop down to the SDK directly when you need custom UI.
- **[Dashboard & Policies](./policies)** — manage branding and the exact request from the [ZKPassport Dashboard](https://dashboard.zkpassport.id) and reference it by its policy id instead of building the query in code.
- **[Examples](../examples)** — age, nationality, residency, personhood, KYC, FaceMatch, and client-server verification.

:::tip
Prefer a full project to start from? Check out our Next.js boilerplate [here](https://github.com/zkpassport/zkpassport-sdk-example).
:::
