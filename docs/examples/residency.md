---
sidebar_position: 4
---

# Residency

ZKPassport is not only limited to passports or even national (or citizen) IDs, but also support some residence permits. Electronic residence permits are not as common as electronic passports or national IDs, but they exist. France and Germany are examples of countries that issue electronic residence permits.

## Check residency

You can check if the user is resident of a specific country. France is used as an example here since `Titre de Séjour` are now electronic residence permits.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport();

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are resident in France",
  scope: "france-resident",
});

const { url } = queryBuilder
  .eq("document_type", "residence_permit")
  .eq("issuing_country", "France")
  .done();
```
