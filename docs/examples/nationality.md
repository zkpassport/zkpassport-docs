---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Nationality

You may need to check if someone is from a given country or a group of countries.

These examples use the [`@zkpassport/ui`](../getting-started/quick-start) card. For the first example we show the full card; the others only change the `query` and result handling, so drop them into the same card.

## Check EU citizenship

You can check if the user is a citizen of a group of countries like the European Union. You will not learn their actual nationality, only that they are a citizen of that group of countries.

The SDK provides some common groups of countries like the European Union, Schengen Area, ASEAN, Mercosur, etc.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { EU_COUNTRIES } from "@zkpassport/sdk";

<ZKPassportQRCode
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove you are a citizen of the European Union"
  scope="eu-citizen"
  query={(queryBuilder) => queryBuilder.in("nationality", EU_COUNTRIES).done()}
  onResult={({ verified, result }) => {
    if (verified) {
      const isEuCitizen = result.nationality.in.result;
      console.log("User is a citizen of the European Union", isEuCitizen);
    } else {
      console.log("Verification failed");
    }
  }}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";
import { EU_COUNTRIES } from "@zkpassport/sdk";

mount(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are a citizen of the European Union",
  scope: "eu-citizen",
  query: (queryBuilder) => queryBuilder.in("nationality", EU_COUNTRIES).done(),
  onResult: ({ verified, result }) => {
    if (verified) {
      const isEuCitizen = result.nationality.in.result;
      console.log("User is a citizen of the European Union", isEuCitizen);
    } else {
      console.log("Verification failed");
    }
  },
});
```

</TabItem>
</Tabs>

## Check sanctioned countries exclusion

Check if the user is not from a list of countries — a common use case is excluding sanctioned countries.

```typescript
import { SANCTIONED_COUNTRIES } from "@zkpassport/sdk";

const query = (queryBuilder) => queryBuilder.out("nationality", SANCTIONED_COUNTRIES).done();

const onResult = ({ verified, result }) => {
  if (verified) {
    const isNotFromSanctionedCountry = result.nationality.out.result;
    console.log("User is not from a sanctioned country", isNotFromSanctionedCountry);
  }
};
```

## Disclose the nationality

Disclose the user's actual nationality.

```typescript
const query = (queryBuilder) => queryBuilder.disclose("nationality").done();

const onResult = ({ verified, result }) => {
  if (verified) {
    const nationality = result.nationality.disclose.result;
    console.log("User's nationality", nationality);
  }
};
```

## Check the inclusion in a group of countries

Check if the user is from a custom list of countries. The expected input is an array of country names or alpha-3 codes — the TypeScript autocomplete will help you with the valid values.

```typescript
const query = (queryBuilder) =>
  queryBuilder.in("nationality", ["France", "Germany", "United Kingdom"]).done();

const onResult = ({ verified, result }) => {
  if (verified) {
    const isFromList = result.nationality.in.result;
    console.log("User is from France, Germany or the United Kingdom", isFromList);
  }
};
```
