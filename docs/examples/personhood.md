---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Personhood

Each ID has its own unique identifier. This identifier doesn't reveal any information about the person nor their ID but is guaranteed to be unique and the same for the same ID. The identifier is scoped to your domain name and also to the scope you specified in the request (if you specified one). Learn more about the unique identifier [here](../faq.md#how-is-the-unique-identifier-derived).

Following this logic, you can use this as a base to check the personhood of the user, i.e. if the user is a real person and not a bot. However, there are a few limitations to this:

- A person can have multiple IDs, so if you want to have `one person <-> one account` for example, it won't be exactly that but more `one ID <-> one account`.
- If you want a truly robust proof of personhood, you should use [FaceMatch](./facematch.md) in your query. And for greater protection against spoofing, you should use the `strict` mode.

## Check uniqueness

To have a proof of unique ID, simply initiate a request with no information disclosure and get back the identifier.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";

<ZKPassportQRCode
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove your personhood"
  scope="personhood"
  query={(queryBuilder) => queryBuilder.done()}
  onResult={async ({ verified, uniqueIdentifier }) => {
    if (!verified) {
      console.log("Verification failed");
      return;
    }
    console.log("Unique identifier", uniqueIdentifier);
    // For example, check if the user is already registered under this identifier
    const response = await fetch(`/api/registered/${uniqueIdentifier}`);
    const { registered } = await response.json();
    if (registered) {
      console.log("User is already registered");
    } else {
      // If not registered yet, register the user with the new identifier
      await fetch(`/api/register`, {
        method: "POST",
        body: JSON.stringify({ uniqueIdentifier }),
      });
      console.log("User registered");
    }
  }}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";

mount(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your personhood",
  scope: "personhood",
  query: (queryBuilder) => queryBuilder.done(),
  onResult: async ({ verified, uniqueIdentifier }) => {
    if (!verified) {
      console.log("Verification failed");
      return;
    }
    console.log("Unique identifier", uniqueIdentifier);
    const response = await fetch(`/api/registered/${uniqueIdentifier}`);
    const { registered } = await response.json();
    if (registered) {
      console.log("User is already registered");
    } else {
      await fetch(`/api/register`, {
        method: "POST",
        body: JSON.stringify({ uniqueIdentifier }),
      });
      console.log("User registered");
    }
  },
});
```

</TabItem>
</Tabs>

:::tip
This example trusts the client-side result. For anything security-sensitive, verify the proofs on your server before registering the user — see the [Client-Server](./client-server.md) example.
:::
