---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nationality

You may need to check if someone is from a given country or a group of countries.

These examples use the [`@zkpassport/ui`](../getting-started/quick-start) verify button and verify the proofs on your server. For the first example we show the full button and server code; the others only change the `query` and result handling, so drop them into the same code.

## Check EU citizenship

You can check if the user is a citizen of a group of countries like the European Union. You will not learn their actual nationality, only that they are a citizen of that group of countries.

The SDK provides some common groups of countries like the European Union, Schengen Area, ASEAN, Mercosur, etc.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";
import { EU_COUNTRIES } from "@zkpassport/sdk";

<VerifyWithZKPassport
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove you are a citizen of the European Union"
  scope="eu-citizen"
  query={(queryBuilder) => queryBuilder.in("nationality", EU_COUNTRIES).done()}
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
import { EU_COUNTRIES } from "@zkpassport/sdk";

mountVerifyButton(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are a citizen of the European Union",
  scope: "eu-citizen",
  query: (queryBuilder) => queryBuilder.in("nationality", EU_COUNTRIES).done(),
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
import { EU_COUNTRIES } from "@zkpassport/sdk";

const { query } = zkPassport.createQuery().in("nationality", EU_COUNTRIES).done();
const { verified } = await zkPassport.verify({
  proofs,
  originalQuery: query,
  queryResult: result,
  scope: "eu-citizen",
});

if (verified) {
  const isEuCitizen = result.nationality.in.result;
  console.log("User is a citizen of the European Union", isEuCitizen);
} else {
  console.log("Verification failed");
}
```

## Check sanctioned countries exclusion

Check if the user is not from a list of countries — a common use case is excluding sanctioned countries.

```typescript
import { SANCTIONED_COUNTRIES } from "@zkpassport/sdk";

const query = (queryBuilder) => queryBuilder.out("nationality", SANCTIONED_COUNTRIES).done();

// On your server, once verify() succeeds
const isNotFromSanctionedCountry = result.nationality.out.result;
console.log("User is not from a sanctioned country", isNotFromSanctionedCountry);
```

## Disclose the nationality

Disclose the user's actual nationality.

```typescript
const query = (queryBuilder) => queryBuilder.disclose("nationality").done();

// On your server, once verify() succeeds
const nationality = result.nationality.disclose.result;
console.log("User's nationality", nationality);
```

## Check the inclusion in a group of countries

Check if the user is from a custom list of countries. The expected input is an array of country names or alpha-3 codes — the TypeScript autocomplete will help you with the valid values.

```typescript
const query = (queryBuilder) =>
  queryBuilder.in("nationality", ["France", "Germany", "United Kingdom"]).done();

// On your server, once verify() succeeds
const isFromList = result.nationality.in.result;
console.log("User is from France, Germany or the United Kingdom", isFromList);
```
