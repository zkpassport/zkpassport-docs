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

Even if not fully compliant with KYC, you can use ZKPassport to verify a lot of useful information. This example uses the [`@zkpassport/ui`](../getting-started/quick-start) verify button and verifies the proofs on your server.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

<VerifyWithZKPassport
  purpose="Prove your identity"
  service={{ scope: "identity" }}
  query={{
    nationality: { disclose: true },
    birthdate: { disclose: true },
    // Fullname includes middle names and secondary given names
    fullname: { disclose: true },
    // The expiry date is checked during proof generation, but you may want to store it
    expiry_date: { disclose: true },
    // This is sensitive information, so be careful when handling it
    document_number: { disclose: true },
    // Check the user is not on any of the available sanctions lists (US, UK, EU, Switzerland)
    sanctions: true,
    // Verify the person generating the proof is the one on the ID
    facematch: true,
  }}
  onSuccess={sendToServer}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mountVerifyButton } from "@zkpassport/ui/button";

mountVerifyButton(document.getElementById("zkpassport"), {
  purpose: "Prove your identity",
  service: { scope: "identity" },
  query: {
    nationality: { disclose: true },
    birthdate: { disclose: true },
    fullname: { disclose: true },
    expiry_date: { disclose: true },
    document_number: { disclose: true },
    sanctions: true,
    facematch: true,
  },
  onSuccess: sendToServer,
});
```

</TabItem>
</Tabs>

`sendToServer` sends the proofs and the result to your server:

```typescript
async function sendToServer({ proofs, result }) {
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proofs, result }),
  });
  return (await response.json()).verified;
}
```

On your server, recreate the query and verify the proofs (see [Quick Start](../getting-started/quick-start#verify-the-proofs-on-your-server)), then read the disclosed data and the FaceMatch / sanctions outcomes:

```typescript
async function handleResult({ proofs, result }) {
  const { query } = zkPassport
    .createQuery()
    .disclose("nationality")
    .disclose("birthdate")
    .disclose("fullname")
    .disclose("expiry_date")
    .disclose("document_number")
    // Disclosing anything also discloses the document type, so ask for it here too
    .disclose("document_type")
    // sanctions: true on the button is the strict check
    .sanctions("all", "all", { strict: true })
    .facematch("strict")
    .done();
  const { verified } = await zkPassport.verify({
    proofs,
    originalQuery: query,
    queryResult: result,
    scope: "identity",
  });
  if (!verified) {
    console.log("Verification failed");
    return { verified: false };
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
  return { verified: true };
}
```
