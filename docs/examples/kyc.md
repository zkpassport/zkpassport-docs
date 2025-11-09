---
sidebar_position: 6
---

# KYC

Full KYC verification (excluding AML/CTF checks) is in theory possible with ZKPassport, but there are some limitations that may prevent it from meeting all the legal requirements of a KYC:

- Neither the SDK nor the app checks whether the ID was reported stolen or lost
- While sanctions checks are conducted, no full AML/CTF checks are conducted

## Example of simple KYC

Even if not fully compliant with KYC, you can use ZKPassport to verify some information that can be useful for KYC:

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your identity",
  scope: "identity",
});

const { url, onResult } = queryBuilder
  .disclose("nationality")
  .disclose("birthdate")
  // Fullname includes middle names and secondary given names
  // while disclosing firstname and lastname will not include them
  .disclose("fullname")
  // The expiry date is checked during the proof generation
  // but in this context you may need to know when the ID will expire
  .disclose("expiry_date")
  // This is sensitive information, so be careful when handling it
  .disclose("document_number")
  // Check the user is not on any of the available sanctions lists (US, UK, EU, Switzerland)
  .sanctions()
  // Verify the person generating the proof is the one on the ID
  .facematch("strict")
  .done();

onResult(({ verified, result }) => {
  if (verified) {
    const nationality = result.nationality.disclose.result;
    const dateOfBirth = result.birthdate.disclose.result;
    const fullname = result.fullname.disclose.result;
    const expiryDate = result.expiry_date.disclose.result;
    const documentNumber = result.document_number.disclose.result;
    const faceMatchVerified = result.facematch.passed;
    const sanctionsVerified = result.sanctions.passed;
    if (!faceMatchVerified) {
      console.log("FaceMatch verification failed");
    }
    if (!sanctionsVerified) {
      console.log("Sanctions check failed");
    }
    console.log("User is verified", nationality, dateOfBirth, fullname, expiryDate, documentNumber);
  } else {
    console.log("Verification failed");
  }
});
```
