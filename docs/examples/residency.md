---
sidebar_position: 4
---

# Residency

ZKPassport is not only limited to passports or even national (or citizen) IDs, but also support some residence permits. Electronic residence permits are not as common as electronic passports or national IDs, but they exist. France and Germany are examples of countries that issue electronic residence permits.

## Check residency

You can check if the user is resident of a specific country. France is used as an example here since `Titre de Séjour` are now electronic residence permits.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are resident in France",
  scope: "france-resident",
});

const { url, onResult } = queryBuilder
  .eq("document_type", "residence_permit")
  .eq("issuing_country", "France")
  .done();

onResult(({ verified, result }) => {
  if (verified) {
    const isResidentInFrance = result.document_type.eq.result && result.issuing_country.eq.result;
    console.log("User is resident in France", isResidentInFrance);
  } else {
    console.log("Verification failed");
  }
});
```

## Check EU residency

You can check if the user is resident of a group of countries. EU is used as an example here, as there are multiple countries in the EU issuing electronic residence permits.

```typescript
import { ZKPassport, EU_COUNTRIES } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are resident in France",
  scope: "eu-resident",
});

const { url, onResult } = queryBuilder
  .eq("document_type", "residence_permit")
  .in("issuing_country", EU_COUNTRIES)
  .done();

onResult(({ verified, result }) => {
  if (verified) {
    const isEUResident = result.document_type.eq.result && result.issuing_country.in.result;
    console.log("User is resident in EU", isEUResident);
  } else {
    console.log("Verification failed");
  }
});
```
