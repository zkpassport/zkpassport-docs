---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Dashboard & Policies

The [ZKPassport Dashboard](https://dashboard.zkpassport.id) lets you define a verification request — its query and branding — in one place and reference it from your code by id. A saved request is called a **policy**.

Applying a policy with `.policy("pol_xyz")` produces the same verification flow as a [self-served](./basic-usage) request; the difference is that the request lives in the dashboard, so you can change it without redeploying, reuse it across apps, and get auditable proof storage.

## Setup

Register your domain at [dashboard.zkpassport.id](https://dashboard.zkpassport.id), set your branding, and create a policy. You'll get a policy id like `pol_xyz` to use below.

:::note
Register the exact domain your site is served from. The verify button always uses the domain of the page it runs on, so a site served from `www.example.com` needs `www.example.com` registered, not `example.com`.
:::

## Applying a policy

Pass your policy id instead of chaining builder methods — as `policyId` on the button, or with `.policy()` on the SDK. The query and branding come from the dashboard, so you don't repeat them in code.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

export default function VerifyPage() {
  return (
    <VerifyWithZKPassport
      policyId="pol_xyz"
      query={(queryBuilder) => queryBuilder.done()}
      onSuccess={({ proofs, result }) => {
        // Send the proofs and the result to your server and verify them there
      }}
    />
  );
}
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mountVerifyButton } from "@zkpassport/ui/button";

mountVerifyButton(document.getElementById("zkpassport"), {
  policyId: "pol_xyz",
  query: (queryBuilder) => queryBuilder.done(),
  onSuccess: ({ proofs, result }) => {
    // Send the proofs and the result to your server and verify them there
  },
});
```

</TabItem>
<TabItem value="sdk" label="SDK">

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

// name/logo/purpose are optional — they default to your dashboard branding and policy
const queryBuilder = await zkPassport.request({});

const { url, onSuccess } = queryBuilder.policy("pol_xyz").done();

onSuccess(({ proofs, result }) => {
  // Send the proofs and the result to your server and verify them there
});
```

</TabItem>
</Tabs>

On your server, verify the proofs as in the [Quick Start](./quick-start#verify-the-proofs-on-your-server): recreate the policy's query with `createQuery()` and pass the policy id as the `scope` (or your own `scope`, if the request sets one). The dashboard shows ready-to-use client and server code for each policy.

## What a policy locks

A policy is immutable: the SDK fetches it from the dashboard by domain and locks the request. The query is fixed, branding defaults to your dashboard project, and the scope defaults to the policy id (e.g. `pol_xyz`), which the user's [unique identifier](../examples/personhood) is tied to. You can still override `purpose` (and `scope`) in code.

Because the query is fixed, `.policy()` must be called **first** and **only once**. The exception is [`bind`](../api#bind): bound values (like the user's wallet address) are only known at request time, so they are never part of a policy and can be added after `.policy()`:

```typescript
queryBuilder.gte("age", 18).policy("pol_xyz").done(); // ❌ can't combine with builder methods
queryBuilder.policy("pol_abc").policy("pol_xyz").done(); // ❌ can't call twice
queryBuilder.policy("pol_xyz").done(); // ✅
queryBuilder.policy("pol_xyz").bind("user_address", address).done(); // ✅ .bind() may follow
```

With the button's `policyId`, the policy is already applied to the builder your `query` callback receives, so return `queryBuilder.done()`, optionally after `.bind()`.

If the domain isn't registered or the id doesn't match a policy, `.policy()` throws with a clear message — register the domain (or check the id) in the dashboard, or fall back to the [self-served flow](./basic-usage).
