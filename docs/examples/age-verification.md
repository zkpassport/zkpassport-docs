---
sidebar_position: 2
---

# Age Verification

You can verify someone's age without learning their date of birth nor their actual age.

## Verify if the user is over 18 years old

You can verify if the user is over 18 years old. You will not learn their date of birth nor their actual age, only that they are 18+.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are 18+ years old",
  scope: "adult",
});

const { url, onResult } = queryBuilder.gte("age", 18).done();

onResult(({ verified, result }) => {
  if (verified) {
    const isOver18 = result.age.gte.result;
    console.log("User is 18+ years old", isOver18);
  } else {
    console.log("Verification failed");
  }
});
```

## Verify if the user is between 18 and 25 years old

You can verify if the user is between 18 and 25 years old. You will not learn their date of birth nor their actual age, only that they are between 18 and 25 years old.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are between 18 and 25 years old",
  scope: "young-adult",
});

// gte is greater than or equal to
// lte is less than or equal to
const { url, onResult } = queryBuilder.gte("age", 18).lte("age", 25).done();
// Alternatively, you can use the range operator
// Both bounds are inclusive
const { url, onResult } = queryBuilder.range("age", 18, 25).done();

onResult(({ verified, result }) => {
  if (verified) {
    const isBetween18And25 = result.age.gte.result && result.age.lte.result;
    // const isBetween18And25 = result.age.range.result;
    console.log("User is between 18 and 25 years old", isBetween18And25);
  } else {
    console.log("Verification failed");
  }
});
```
