---
sidebar_position: 5
---

# Personhood

Each ID will have its own unique identifier. This identifier doesn't reveal any information about the person nor their ID but is guaranteed to be unique and the same for the same ID. The identifier is scoped to your domain name and also to the scope you specified in the request (if you specified one).

Following this logic, you can use this as a base to check the personhood of the user, i.e. if the user is a real person and not a bot. However, there are a few limitations to this:

- A person can have multiple IDs, so if you want to have `one person <-> one account` for example, it won't be exactly that but more `one ID <-> one account`.
- ZKPassport does not provide a proof of face match with liveness check just yet, so you have no hard guarantee the person who generated the proof is the same person as on the ID. There is a biometric check done locally on the app before each proof generation, preventing the scanned ID in the app from being used by someone else than the phone's owner. But, a user could still scan someone else's ID in their app and go through Face ID each time. However, it is in our plans to add a face match with liveness check in the near future to make this more robust.

## Check uniqueness

To have a proof of unique ID, you can simply initiate a request with no information disclosure and get back the identifier.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport();

const queryBuilder = await zkPassport.request({
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your personhood",
  scope: "personhood",
});

const { url, onResult } = queryBuilder.done();

onResult(async ({ verified, uniqueIdentifier }) => {
  if (verified) {
    console.log("Unique identifier", uniqueIdentifier);
    // For example, you can set up an endpoint to check if the user is registered under
    // this unique identifier in your database
    const response = await fetch(`/sampe/api/registered/${uniqueIdentifier}`);
    const { registered } = await response.json();
    if (registered) {
      console.log("User is already registered");
    } else {
      console.log("User is not registered");
      // If not already registered, you can register the user
      // with the newly received unique identifier
      const response = await fetch(`/sampe/api/register`, {
        method: "POST",
        body: JSON.stringify({
          uniqueIdentifier,
        }),
      });
      const { registered } = await response.json();
      console.log("User is registered", registered);
    }
  } else {
    console.log("Verification failed");
  }
});
```
