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
  purpose="Prove you are resident in France"
  service={{ scope: "france-resident" }}
  query={{
    issuing_country: { included: ["France"] },
    // Disclose the document type and check it on your server
    document_type: { disclose: true },
  }}
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
  purpose: "Prove you are resident in France",
  service: { scope: "france-resident" },
  query: {
    issuing_country: { included: ["France"] },
    // Disclose the document type and check it on your server
    document_type: { disclose: true },
  },
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
  .in("issuing_country", ["France"])
  .disclose("document_type")
  .done();
const { verified } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "france-resident",
});

if (verified) {
  const isResidentInFrance =
    result.issuing_country.in.result &&
    result.document_type.disclose.result === "residence_permit";
  console.log("User is resident in France", isResidentInFrance);
} else {
  console.log("Verification failed");
}
```

:::note
With the SDK you can prove the document type without revealing it — `.eq("document_type", "residence_permit")`. The button's query can only disclose it.
:::

## Check EU residency

Check if the user is resident of a group of countries. EU is used as an example here, as there are multiple countries in the EU issuing electronic residence permits. Only the `query` and result handling change — drop them into the same button and server code as above.

```typescript
import { EU_COUNTRIES } from "@zkpassport/sdk";

const query = {
  issuing_country: { included: EU_COUNTRIES },
  document_type: { disclose: true },
};
// On your server: .in("issuing_country", EU_COUNTRIES).disclose("document_type")

// Once verify() succeeds
const isEUResident =
  result.issuing_country.in.result && result.document_type.disclose.result === "residence_permit";
console.log("User is resident in EU", isEUResident);
```
