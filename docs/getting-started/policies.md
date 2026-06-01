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

## Applying a policy

Call `.policy()` with your policy id instead of chaining builder methods. The query and branding come from the dashboard, so you don't repeat them in code.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";

export default function VerifyPage() {
  return (
    <ZKPassportQRCode
      query={(queryBuilder) => queryBuilder.policy("pol_xyz").done()}
      onResult={({ verified, uniqueIdentifier }) => {
        if (verified) console.log("Verified", uniqueIdentifier);
      }}
    />
  );
}
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";

mount(document.getElementById("zkpassport"), {
  query: (queryBuilder) => queryBuilder.policy("pol_xyz").done(),
  onResult: ({ verified, uniqueIdentifier }) => {
    if (verified) console.log("Verified", uniqueIdentifier);
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

const { url, onResult } = queryBuilder.policy("pol_xyz").done();

onResult(({ verified, uniqueIdentifier }) => {
  if (verified) console.log("Verified", uniqueIdentifier);
});
```

</TabItem>
</Tabs>

## What a policy locks

A policy is immutable: the SDK fetches it from the dashboard by domain and locks the request. The query is fixed, branding defaults to your dashboard project, and the scope is locked to `<policy-id>:<version>` (e.g. `pol_xyz:1`) — which keeps the user's [unique identifier](../examples/personhood) stable until you bump the policy version. You can still override `purpose` in code for a request-specific message.

Because the query is fixed, `.policy()` must be called **on its own** and **only once**:

```typescript
queryBuilder.gte("age", 18).policy("pol_xyz").done(); // ❌ can't combine with builder methods
queryBuilder.policy("pol_abc").policy("pol_xyz").done(); // ❌ can't call twice
queryBuilder.policy("pol_xyz").done(); // ✅
```

If the domain isn't registered or the id doesn't match a policy, `.policy()` throws with a clear message — register the domain (or check the id) in the dashboard, or fall back to the [self-served flow](./basic-usage).
