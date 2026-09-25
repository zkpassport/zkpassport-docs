---
sidebar_position: 9
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Salted Unique Identifiers (OPRF)

Every verification result comes with a [unique identifier](./personhood.md) tied to the user's ID. By default, it is derived purely from the ID data, your domain, and the request scope — which means anyone with complete knowledge of the ID chip data (for example the government that issued the ID) could recompute it and recognize the user.

**Salted unique identifiers** (`NullifierType.SALTED`) close this gap. The user's device derives the identifier with the help of an extra secret (the "salt") held by an independent network of servers, using a technique called an OPRF (Oblivious Pseudo-Random Function):

- The servers never see the user's data — they only receive a blinded value.
- No single server holds the whole secret, so nobody can recompute the identifier on their own — not even with full knowledge of the ID data.
- The result is still deterministic: the same ID yields the same identifier for your app, so you can still recognize returning users.

Use this when the identifier itself is sensitive — for example anonymous voting, whistleblowing platforms, or any [personhood](./personhood.md) check where users must not be linkable to their real-world identity by anyone.

To request one:

- Set `uniqueIdentifierType` to `NullifierType.SALTED` — available both on the SDK's `request()` method and as a prop on the `@zkpassport/ui` verify button (shown below).
- Add `.facematch("strict")` to your query. Salted identifiers require the strict [FaceMatch](./facematch.md) mode, which confirms the ID is being used by its actual holder; the request throws an error without it.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";
import { NullifierType } from "@zkpassport/sdk";

<VerifyWithZKPassport
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove your personhood"
  scope="personhood"
  uniqueIdentifierType={NullifierType.SALTED}
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
import { NullifierType } from "@zkpassport/sdk";

mountVerifyButton(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your personhood",
  scope: "personhood",
  uniqueIdentifierType: NullifierType.SALTED,
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

On your server, recreate the query and verify the proofs (see [Quick Start](../getting-started/quick-start#verify-the-proofs-on-your-server)). Pass the same `uniqueIdentifierType` to `verify()` so proofs with a different type of identifier fail verification:

```typescript
import { NullifierType } from "@zkpassport/sdk";

const { query } = zkPassport.createQuery().facematch("strict").done();
const { verified, uniqueIdentifier } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "personhood",
  uniqueIdentifierType: NullifierType.SALTED,
});
if (verified) console.log("Unique identifier", uniqueIdentifier);
```

:::info
`verify()` also returns the identifier's type as `uniqueIdentifierType`. In [dev mode](../getting-started/dev-mode), mock proofs return `NullifierType.SALTED_MOCK` instead of `NullifierType.SALTED`, so you can tell real salted identifiers apart from test ones.
:::
