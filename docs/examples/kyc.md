---
sidebar_position: 6
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# KYC

Full KYC verification (excluding AML/CTF checks) is in theory possible with ZKPassport, but there are some limitations that may prevent it from meeting all the legal requirements of a KYC:

- Neither the SDK nor the app checks whether the ID was reported stolen or lost
- While sanctions checks can be conducted, no full AML/CTF checks are conducted

## Example of simple KYC

Even if not fully compliant with KYC, you can use ZKPassport to verify a lot of useful information. This example uses the [`@zkpassport/ui`](../getting-started/quick-start) card.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";

<ZKPassportQRCode
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove your identity"
  scope="identity"
  query={(queryBuilder) =>
    queryBuilder
      .disclose("nationality")
      .disclose("birthdate")
      // Fullname includes middle names and secondary given names
      .disclose("fullname")
      // The expiry date is checked during proof generation, but you may want to store it
      .disclose("expiry_date")
      // This is sensitive information, so be careful when handling it
      .disclose("document_number")
      // Check the user is not on any of the available sanctions lists (US, UK, EU, Switzerland)
      .sanctions()
      // Verify the person generating the proof is the one on the ID
      .facematch("strict")
      .done()
  }
  onResult={handleResult}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";

mount(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your identity",
  scope: "identity",
  query: (queryBuilder) =>
    queryBuilder
      .disclose("nationality")
      .disclose("birthdate")
      .disclose("fullname")
      .disclose("expiry_date")
      .disclose("document_number")
      .sanctions()
      .facematch("strict")
      .done(),
  onResult: handleResult,
});
```

</TabItem>
</Tabs>

Read the disclosed data and the FaceMatch / sanctions outcomes in the result handler:

```typescript
function handleResult({ verified, result }) {
  if (!verified) {
    console.log("Verification failed");
    return;
  }
  const nationality = result.nationality.disclose.result;
  const dateOfBirth = result.birthdate.disclose.result;
  const fullname = result.fullname.disclose.result;
  const expiryDate = result.expiry_date.disclose.result;
  const documentNumber = result.document_number.disclose.result;
  const faceMatchPassed = result.facematch.passed;
  const sanctionsPassed = result.sanctions.passed;

  if (!faceMatchPassed) console.log("FaceMatch verification failed");
  if (!sanctionsPassed) console.log("Sanctions check failed");

  console.log("User is verified", nationality, dateOfBirth, fullname, expiryDate, documentNumber);
}
```
