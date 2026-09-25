---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Residency

ZKPassport is not only limited to passports or even national (or citizen) IDs, but also supports some residence permits. Electronic residence permits are not as common as electronic passports or national IDs, but they exist. France and Germany are examples of countries that issue electronic residence permits.

These examples use the [`@zkpassport/ui`](../getting-started/quick-start) verify button and verify the proofs on your server.

## Check residency

Check if the user is resident of a specific country. France is used as an example here since `Titre de Séjour` are now electronic residence permits.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove you are resident in France"
  scope="france-resident"
  query={(queryBuilder) =>
    queryBuilder.eq("document_type", "residence_permit").eq("issuing_country", "France").done()
  }
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
  purpose: "Prove you are resident in France",
  scope: "france-resident",
  query: (queryBuilder) =>
    queryBuilder.eq("document_type", "residence_permit").eq("issuing_country", "France").done(),
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
const { query } = zkPassport
  .createQuery()
  .eq("document_type", "residence_permit")
  .eq("issuing_country", "France")
  .done();
const { verified } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "france-resident",
});

if (verified) {
  const isResidentInFrance = result.document_type.eq.result && result.issuing_country.eq.result;
  console.log("User is resident in France", isResidentInFrance);
} else {
  console.log("Verification failed");
}
```

## Check EU residency

Check if the user is resident of a group of countries. EU is used as an example here, as there are multiple countries in the EU issuing electronic residence permits. Only the `query` and result handling change — drop them into the same button and server code as above.

```typescript
import { EU_COUNTRIES } from "@zkpassport/sdk";

const query = (queryBuilder) =>
  queryBuilder.eq("document_type", "residence_permit").in("issuing_country", EU_COUNTRIES).done();

// On your server, once verify() succeeds
const isEUResident = result.document_type.eq.result && result.issuing_country.in.result;
console.log("User is resident in EU", isEUResident);
```
