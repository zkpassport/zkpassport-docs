---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Age Verification

You can verify someone's age without learning their date of birth nor their actual age.

These examples use the [`@zkpassport/ui`](../getting-started/quick-start) verify button and verify the proofs on your server. The query you build is what matters — see [Basic Usage](../getting-started/basic-usage) for how to use the SDK directly instead.

## Verify if the user is over 18 years old

You will not learn their date of birth nor their actual age, only that they are 18+.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  purpose="Prove you are 18+ years old"
  service={{ scope: "adult" }}
  query={{ age: { min: 18 } }}
  onSuccess={async ({ proofs, result }) => {
    // Send the proofs to your server to verify them
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    return (await response.json()).verified;
  }}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mountVerifyButton } from "@zkpassport/ui/button";

mountVerifyButton(document.getElementById("zkpassport"), {
  purpose: "Prove you are 18+ years old",
  service: { scope: "adult" },
  query: { age: { min: 18 } },
  onSuccess: async ({ proofs, result }) => {
    // Send the proofs to your server to verify them
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

On your server, recreate the query and verify the proofs (see [Quick Start](../getting-started/quick-start#verify-the-proofs-on-your-server)):

```typescript
const { query } = zkPassport.createQuery().gte("age", 18).done();
const { verified } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "adult",
});

if (verified) {
  const isOver18 = result.age.gte.result;
  console.log("User is 18+ years old", isOver18);
} else {
  console.log("Verification failed");
}
```

## Verify if the user is between 18 and 25 years old

Set both bounds (they are inclusive). Only the `query` and result handling change — drop them into the same button and server code as above.

```typescript
const query = { age: { min: 18, max: 25 } };
// On your server: .gte("age", 18).lte("age", 25)

// Once verify() succeeds
const isBetween18And25 = result.age.gte.result && result.age.lte.result;
console.log("User is between 18 and 25 years old", isBetween18And25);
```

:::note
Using the SDK directly, you can also express this with the `range` operator — `.range("age", 18, 25)`, read back as `result.age.range.result`. The button's `min`/`max` always map to `gte`/`lte`, so recreate it with those.
:::
