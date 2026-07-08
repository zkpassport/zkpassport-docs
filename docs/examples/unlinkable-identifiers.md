---
sidebar_position: 9
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Unlinkable Unique Identifiers (OPRF)

Every verification result comes with a [unique identifier](./personhood.md) tied to the user's ID. By default, it is derived purely from the ID data, your domain, and the request scope — which means anyone with complete knowledge of the ID chip data (for example the government that issued the ID) could recompute it and recognize the user.

**Unlinkable identifiers** — called *salted* identifiers in the API (`NullifierType.SALTED`) — close this gap. The user's device derives the identifier with the help of an extra secret (the "salt") held by an independent network of servers, using a technique called an OPRF (Oblivious Pseudo-Random Function):

- The servers never see the user's data — they only receive a blinded value.
- No single server holds the whole secret, so nobody can recompute the identifier on their own — not even with full knowledge of the ID data.
- The result is still deterministic: the same ID yields the same identifier for your app, so you can still recognize returning users.

Use this when the identifier itself is sensitive — for example anonymous voting, whistleblowing platforms, or any [personhood](./personhood.md) check where users must not be linkable to their real-world identity by anyone.

To request one:

- Set `uniqueIdentifierType` to `NullifierType.SALTED` — available both on the SDK's `request()` method and as a prop on the `@zkpassport/ui` QR code component (shown below).
- Add `.facematch("strict")` to your query. Unlinkable identifiers require the strict [FaceMatch](./facematch.md) mode, which confirms the ID is being used by its actual holder; the request throws an error without it.

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode, NullifierType } from "@zkpassport/ui/react";

<ZKPassportQRCode
  name="ZKPassport"
  logo="https://zkpassport.id/logo.png"
  purpose="Prove your personhood"
  scope="personhood"
  uniqueIdentifierType={NullifierType.SALTED}
  query={(queryBuilder) => queryBuilder.facematch("strict").done()}
  onResult={({ verified, uniqueIdentifier }) => {
    if (verified) console.log("Unique identifier", uniqueIdentifier);
  }}
/>;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount, NullifierType } from "@zkpassport/ui";

mount(document.getElementById("zkpassport"), {
  name: "ZKPassport",
  logo: "https://zkpassport.id/logo.png",
  purpose: "Prove your personhood",
  scope: "personhood",
  uniqueIdentifierType: NullifierType.SALTED,
  query: (queryBuilder) => queryBuilder.facematch("strict").done(),
  onResult: ({ verified, uniqueIdentifier }) => {
    if (verified) console.log("Unique identifier", uniqueIdentifier);
  },
});
```

</TabItem>
</Tabs>

:::info
The `onResult` callback also reports the identifier's type as `uniqueIdentifierType`. In [dev mode](../getting-started/dev-mode), mock proofs return `NullifierType.SALTED_MOCK` instead of `NullifierType.SALTED`, so you can tell real unlinkable identifiers apart from test ones.
:::
