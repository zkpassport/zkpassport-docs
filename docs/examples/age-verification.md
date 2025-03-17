---
sidebar_position: 2
---

# Age Verification

You can verify someone's age without learning their date of birth nor their actual age.

:::info
The lower bound for age comparison is inclusive, but the upper bound is exclusive. Hence, the available operators for age are `gte` (greater than or equal to) and `lt` (less than).

You can also use the `range` operator to verify if the user's age is between two values. Similarly, the lower bound is inclusive and the upper bound is exclusive.
:::

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
// lt is less than
// Note that the upper bound is exclusive
const { url, onResult } = queryBuilder.gte("age", 18).lt("age", 26).done();
// Alternatively, you can use the range operator
// Again, the upper bound is exclusive
// If the user's 26th birthday is tomorrow,
// they will still be considered to be between 18 and 25
const { url, onResult } = queryBuilder.range("age", 18, 26).done();

onResult(({ verified, result }) => {
  if (verified) {
    const isBetween18And25 = result.age.gte.result && result.age.lt.result;
    console.log("User is between 18 and 25 years old", isBetween18And25);
  } else {
    console.log("Verification failed");
  }
});
```
