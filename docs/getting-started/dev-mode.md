---
sidebar_position: 3
---

# Dev Mode

If you don't have a valid passport or national ID to test ZKPassport with, you can enable the dev mode in the mobile app and the SDK to generate and verify proofs with mock passports.

Mock passports are signed by the Zero Knowledge Republic (ZKR), a mock issuer we use to issue mock passports for the dev mode. The root certificates (CSCs) of the ZKR are included in our certificate registry on Ethereum Sepolia. However, they won't be included in mainnet versions of our registry. All mock passport proofs have 1 as unique identifier.

## Enable Dev Mode in the Mobile App

To enable dev mode in the mobile app, you need to go on the first screen of the app. It's the screen you see when you open the app for the first time, with the `Scan your ID` button.

<img src="/img/dev-mode-1.jpeg" alt="Dev Mode" width="200" />

On this page, to enable dev mode, you need to long press at the bottom of the screen. A popup will appear asking you to confirm that you want to enable dev mode.

<img src="/img/dev-mode-2.jpeg" alt="Dev Mode" width="200" />

Once you confirm, 6 mock passports (with different data and configurations) will be loaded into the app. Which you can use to generate mock proofs.

<img src="/img/dev-mode-3.jpeg" alt="Dev Mode" width="200" />

## Enable Dev Mode in the SDK

To enable dev mode in the SDK, you need to set the `devMode` parameter to `true` when building up your query with the `request` function. Without this, proofs from mock passports will be considered as invalid by the SDK.

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

const request = await zkPassport.request({
  name: "Your App Name",
  // A path to your app's logo
  logo: "https://your-domain.com/logo.png",
  // A description of the purpose of the request
  purpose: "Your Purpose",
  // Optional scope for the user's unique identifier
  scope: "your-scope",
  // Enable dev mode here
  devMode: true,
});
```
