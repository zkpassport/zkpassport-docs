---
sidebar_position: 3
---

# Nationality

You may need to check if someone is from a given country or a group of countries.

## Check EU citizenship

You can check if the user is a citizen of a group of countries like the European Union. You will not learn their actual nationality, only that they are a citizen of that group of countries.

The SDK provides some common groups of countries like the European Union, Schengen Area, ASEAN, Mercosur, etc.

```typescript
import { ZKPassport, EU_COUNTRIES } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are a citizen of the European Union",
  scope: "eu-citizen",
});

const { url, onResult } = queryBuilder.in("nationality", EU_COUNTRIES).done();

onResult(({ verified, result }) => {
  if (verified) {
    const isEuCitizen = result.nationality.in.result;
    console.log("User is a citizen of the European Union", isEuCitizen);
  } else {
    console.log("Verification failed");
  }
});
```

## Check sanctioned countries exclusion

You can check if the user is not from a list of countries. A common use case is to check if the user is not from a list of sanctioned countries.

```typescript
import { ZKPassport, SANCTIONED_COUNTRIES } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are not from a list of sanctioned countries",
  scope: "not-sanctioned-country",
});

const { url, onResult } = queryBuilder.out("nationality", SANCTIONED_COUNTRIES).done();

onResult(({ verified, result }) => {
  if (verified) {
    const isNotFromSanctionedCountry = result.nationality.out.result;
    console.log("User is not from a sanctioned country", isNotFromSanctionedCountry);
  } else {
    console.log("Verification failed");
  }
});
```

## Disclose the nationality

You can disclose the nationality of the user. This is useful if you want to verify that the user is from a specific country.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your nationality",
  scope: "nationality",
});

const { url, onResult } = queryBuilder.disclose("nationality").done();

onResult(({ verified, result }) => {
  if (verified) {
    const nationality = result.nationality.disclose.result;
    console.log("User's nationality", nationality);
  } else {
    console.log("Verification failed");
  }
});
```

## Check the inclusion in a group of countries

You can check if the user is from a list of countries that you define.

The expected input is an array of country names or alpha 3 codes. Don't worry, the TypeScript type autocomplete will help you with that.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are from a list of countries",
  scope: "country-list",
});

const { url, onResult } = queryBuilder
  .in("nationality", ["France", "Germany", "United Kingdom"])
  .done();

onResult(({ verified, result }) => {
  if (verified) {
    const isFromList = result.nationality.in.result;
    console.log("User is from France, Germany or the United Kingdom", isFromList);
  } else {
    console.log("Verification failed");
  }
});
```
