---
sidebar_position: 8
---

# Private FaceMatch

When verifying a user, you can request ZKPassport to conduct a Private FaceMatch of the user. What this does is that prior to completing the verification process, ZKPassport will make the user perform a face scan using the camera of their device and compare it to the photo on their ID. If the face matches, the verification process can continue. The whole process is conducted locally via ML models running directly on the user's device.

The mode of the FaceMatch can be set to `strict` or `regular`. The strict mode will trigger a more extensive liveness check to prevent spoofing (e.g. using someone else's photo or the ID photo in front of the camera) while the regular mode does not provide the same level of protection against spoofing but is faster.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove you are the person on the ID",
  scope: "facematch",
});

const { url, onResult } = queryBuilder
  .facematch("strict")
  //.facematch() without any arguments will use the regular mode
  .done();

onResult(({ verified, result }) => {
  if (verified) {
    const faceMatchVerified = result.facematch.passed;
    if (faceMatchVerified) {
      console.log("FaceMatch verification passed");
    } else {
      console.log("FaceMatch verification failed");
    }
  } else {
    console.log("Verification failed");
  }
});
```
