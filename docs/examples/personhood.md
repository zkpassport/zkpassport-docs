---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Personhood

Each ID has its own unique identifier. This identifier doesn't reveal any information about the person nor their ID but is guaranteed to be unique and the same for the same ID. The identifier is scoped to your domain name and also to the scope you specified in the request (if you specified one). Learn more about the unique identifier [here](../faq.md#how-is-the-unique-identifier-derived).

Following this logic, you can use this as a base to check the personhood of the user, i.e. if the user is a real person and not a bot. However, there are a few limitations to this:

- A person can have multiple IDs, so if you want to have `one person <-> one account` for example, it won't be exactly that but more `one ID <-> one account`.
- If you want a truly robust proof of personhood, you should use [FaceMatch](./facematch.md) in your query. And for greater protection against spoofing, you should use the `strict` mode.
- The default identifier can be recomputed by anyone with complete knowledge of the ID chip data — including the government that issued the ID. For increased privacy, request a [salted unique identifier](./salted-identifiers.md) instead, which cannot be linked back to the ID by the issuing entity.

## Check uniqueness

To have a proof of unique ID, simply initiate a request with no information disclosure, then get the identifier back when you verify the proofs on your server.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove your personhood"
  scope="personhood"
  query={(queryBuilder) => queryBuilder.done()}
  onSuccess={async ({ proofs, result }) => {
    // Send the proofs to your server to verify them and register the user
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    return (await response.json()).registered;
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
  purpose: "Prove your personhood",
  scope: "personhood",
  query: (queryBuilder) => queryBuilder.done(),
  onSuccess: async ({ proofs, result }) => {
    // Send the proofs to your server to verify them and register the user
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    return (await response.json()).registered;
  },
});
```

</TabItem>
</Tabs>

On your server, recreate the query and verify the proofs (see [Quick Start](../getting-started/quick-start#verify-the-proofs-on-your-server)), then use the unique identifier:

```typescript
const { query } = zkPassport.createQuery().done();
const { verified, uniqueIdentifier } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "personhood",
});
if (!verified) return { registered: false };

// For example, check if the user is already registered under this identifier
if (await db.users.exists({ uniqueIdentifier })) {
  console.log("User is already registered");
  return { registered: false };
}
// If not registered yet, register the user with the new identifier
await db.users.insert({ uniqueIdentifier });
return { registered: true };
```
