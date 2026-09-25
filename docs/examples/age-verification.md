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
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove you are 18+ years old"
  scope="adult"
  query={(queryBuilder) => queryBuilder.gte("age", 18).done()}
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
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are 18+ years old",
  scope: "adult",
  query: (queryBuilder) => queryBuilder.gte("age", 18).done(),
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

Use two bounds, or the `range` operator (both bounds inclusive). Only the `query` and result handling change — drop them into the same button and server code as above.

```typescript
// gte is greater than or equal to, lte is less than or equal to
const query = (queryBuilder) => queryBuilder.gte("age", 18).lte("age", 25).done();
// Alternatively, use the range operator (both bounds inclusive)
// const query = (queryBuilder) => queryBuilder.range("age", 18, 25).done();

// On your server, once verify() succeeds
const isBetween18And25 = result.age.gte.result && result.age.lte.result;
// const isBetween18And25 = result.age.range.result;
console.log("User is between 18 and 25 years old", isBetween18And25);
```
