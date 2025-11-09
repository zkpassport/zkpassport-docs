---
sidebar_position: 5
---

# Personhood

Each ID will have its own unique identifier. This identifier doesn't reveal any information about the person nor their ID but is guaranteed to be unique and the same for the same ID. The identifier is scoped to your domain name and also to the scope you specified in the request (if you specified one).

Following this logic, you can use this as a base to check the personhood of the user, i.e. if the user is a real person and not a bot. However, there are a few limitations to this:

- A person can have multiple IDs, so if you want to have `one person <-> one account` for example, it won't be exactly that but more `one ID <-> one account`.
- If you want to have a truly robust proof of personhood, you should use facematch in your query. And for greater protection against spoofing, you should use the `strict` mode.

## Check uniqueness

To have a proof of unique ID, you can simply initiate a request with no information disclosure and get back the identifier.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

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
