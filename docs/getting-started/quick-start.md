---
sidebar_position: 1
---

# Quick Start

:::warning
This is experimental software that has not been audited yet. Use at your own risk.
:::

ZKPassport SDK is available as a package on [npm](https://www.npmjs.com/package/@zkpassport/sdk) and accessible publicly on [GitHub](https://github.com/zkpassport/zkpassport-sdk). It is meant to work both in the browser and in Node.js.

## Installation

You can install the SDK using npm (or any Javascript package manager such as yarn, pnpm or bun):

```bash
npm install @zkpassport/sdk
```

Once this is done, you can import the SDK in your project:

```typescript
import { ZKPassport } from "@zkpassport/sdk";
```

And that's it, that's all you need to do to get started. No API key, no need to create an account, just install the package and you're good to go.

To see how to use the SDK to request information from users, check out the [Basic Usage](./basic-usage) guide.
