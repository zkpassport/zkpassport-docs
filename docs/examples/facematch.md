---
sidebar_position: 8
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Private FaceMatch

When verifying a user, you can request ZKPassport to conduct a Private FaceMatch of the user. Prior to completing the verification, ZKPassport makes the user perform a face scan using their device camera and compares it to the photo on their ID. If the face matches, the verification process continues. The whole process is conducted locally via ML models running directly on the user's device.

The FaceMatch mode can be `strict` or `regular`. The strict mode triggers a more extensive liveness check to prevent spoofing (e.g. using someone else's photo or holding the ID photo in front of the camera), while the regular mode does not provide the same level of protection but is faster.

This example uses the [`@zkpassport/ui`](../getting-started/quick-start) verify button and verifies the proofs on your server.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove you are the person on the ID"
  scope="facematch"
  // .facematch() without arguments uses the strict mode
  query={(queryBuilder) => queryBuilder.facematch("strict").done()}
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
  purpose: "Prove you are the person on the ID",
  scope: "facematch",
  // .facematch() without arguments uses the strict mode
  query: (queryBuilder) => queryBuilder.facematch("strict").done(),
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
const { query } = zkPassport.createQuery().facematch("strict").done();
const { verified } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "facematch",
});

if (verified) {
  console.log(result.facematch.passed ? "FaceMatch passed" : "FaceMatch failed");
} else {
  console.log("Verification failed");
}
```
