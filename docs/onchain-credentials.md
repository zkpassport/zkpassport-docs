# Onchain Credentials

Onchain credentials let a wallet hold proof that it passed your checks, as a token your contracts can read. You define the rules once in a **credential policy**, and any contract can then gate access with a single `balanceOf` call.

This guide is for policy owners, such as token issuers: how to create a policy, mint credentials for your users, and manage them.

:::note
A credential policy lives onchain and is not the same thing as a [dashboard policy](./getting-started/policies) (`pol_xyz`), which is a saved verification request.
:::

## Overview

A credential is a non-transferable ERC-1155 token held for a policy, valid until an expiry date. The token id is the policy id, so `balanceOf(wallet, policyId)` returns `1` while the wallet holds a valid credential and `0` otherwise.

A wallet can get a credential in two ways:

- The user proves they meet the policy with the ZKPassport app and calls `issue()` with the proof.
- You mint it for them without a proof, for example after your own KYC or KYB check.

| Role | Who | What they can do |
| --- | --- | --- |
| Policy owner | The address that creates the policy. It cannot be changed later, so use a multisig | Everything below, plus add and remove issuers, edit and retire the policy |
| Issuer | Any address the owner adds, typically a key held by your backend | Mint without a proof, for one wallet or many. Ban and unban wallets |
| User | Anyone | Mint for their own wallet with a ZKPassport proof. Give up their credential |

## Contract addresses

:::caution
The addresses for the version described on this page are not published yet.
:::

| Chain | `ZKPassportCredentials` |
| --- | --- |
| Ethereum Mainnet | To be published |
| Base Mainnet | To be published |
| Ethereum Sepolia | To be published |

The commands on this page use these variables:

```bash
export CREDENTIALS=<ZKPassportCredentials address>
export RPC=<your RPC URL>
```

## Create a policy

Send `createPolicy` from the address that should own the policy. The policy id is `keccak256(owner, salt)`, so it is known before the transaction lands.

| Setting | Meaning | Changeable later |
| --- | --- | --- |
| Salt | Any 32-byte value, unique per owner | No |
| Requirements | What a ZKPassport proof must show: minimum age, sanctions screening, FaceMatch, included or excluded nationalities, accepted verification methods | Only if owner editable |
| Credential duration | How long a credential stays valid after each issue or renewal, up to 10 years | Only if owner editable |
| Metadata URL | Token metadata, returned by `uri(policyId)` | Yes |
| Enforce uniqueness | One credential per passport for proof-based mints | No |
| Owner issuable | The owner and its issuers may mint without a proof. Required for admin and bulk minting | No |
| Owner bannable | The owner and its issuers may ban wallets, which removes their credential | No |
| Owner editable | The owner may change requirements and duration later | No |

:::caution
The three owner flags default to off and are fixed at creation, so decide them up front.
:::

### With Foundry

Clone [zkpassport-packages](https://github.com/zkpassport/zkpassport-packages) and run the script from `packages/onchain-credentials/contracts`:

```bash
export ZKPASSPORT_CREDENTIALS_ADDRESS=$CREDENTIALS
export POLICY_SALT=0x0000000000000000000000000000000000000000000000000000000000000001
export POLICY_METADATA_URL="https://example.com/policy.json"
export POLICY_DURATION_DAYS=365
export POLICY_MIN_AGE=18
export POLICY_SANCTIONS_MODE=strict
export POLICY_FACEMATCH_MODE=none
export POLICY_ENFORCE_UNIQUENESS=false
export POLICY_INCLUDED_NATIONALITIES=""
export POLICY_EXCLUDED_NATIONALITIES=""
export POLICY_ALLOWED_VERIFICATION_METHODS=""
export POLICY_OWNER_ISSUABLE=true
export POLICY_OWNER_BANNABLE=true
export POLICY_OWNER_EDITABLE=true

forge script script/CreatePolicy.s.sol --rpc-url $RPC --private-key <owner key> --broadcast
```

The script prints the policy id. Save it as `POLICY_ID` for the commands below.

### With TypeScript

```bash
npm install @zkpassport/onchain-credentials viem
```

```typescript
import {
  computePolicyId,
  createCredentialsContext,
  getCredentialsChain,
  submitCredentialsCall,
} from "@zkpassport/onchain-credentials";

const ctx = createCredentialsContext(getCredentialsChain("base"));
const { credentials } = ctx;

const policyId = computePolicyId(owner, salt);
const call = credentials.buildCreatePolicyCall({
  salt,
  credentialDuration: 365n * 24n * 60n * 60n,
  metadataURL: "https://example.com/policy.json",
  requirements: {
    minAge: 18,
    sanctionsMode: "strict",
    includedNationalities: [],
    excludedNationalities: [],
  },
  enforceUniqueness: false,
  ownerIssuable: true,
  ownerBannable: true,
  ownerEditable: true,
});
await submitCredentialsCall(ctx, call, { client: walletClient, account: owner });
```

## Add an issuer

An issuer is an address the owner authorises to mint and ban for one policy. Keep the owner key in a multisig and give your backend an issuer key. If the issuer key leaks, remove it and add a new one. The policy must have been created with owner issuable on.

Add an issuer, sent by the owner:

```bash
cast send $CREDENTIALS "addIssuer(address,uint256)" <issuer address> $POLICY_ID --rpc-url $RPC --private-key <owner key>
```

Remove an issuer, sent by the owner:

```bash
cast send $CREDENTIALS "removeIssuer(address,uint256)" <issuer address> $POLICY_ID --rpc-url $RPC --private-key <owner key>
```

Check whether an address is an issuer:

```bash
cast call $CREDENTIALS "isIssuer(address,uint256)(bool)" <issuer address> $POLICY_ID --rpc-url $RPC
```

There is no onchain list of issuers. To list them, read the `IssuerAdded` and `IssuerRemoved` events for the policy.

In TypeScript the calls are `buildAddIssuerCall(issuer, policyId)` and `buildRemoveIssuerCall(issuer, policyId)`.

## Issue credentials

The owner or any issuer can mint without a proof. Each mint sets the wallet's expiry to now plus the policy's credential duration. Minting again for a wallet that already holds a credential renews it.

One wallet:

```bash
cast send $CREDENTIALS "ownerIssue(address,uint256)" <wallet> $POLICY_ID --rpc-url $RPC --private-key <owner or issuer key>
```

Many wallets in one transaction:

```bash
cast send $CREDENTIALS "ownerIssueBatch(address[],uint256)" "[<wallet1>,<wallet2>,<wallet3>]" $POLICY_ID --rpc-url $RPC --private-key <owner or issuer key>
```

In TypeScript:

```typescript
const call = credentials.buildOwnerIssueBatchCall(wallets, policyId);
await submitCredentialsCall(ctx, call, { client: issuerClient, account: issuer });
```

- A batch is all or nothing. If any wallet is banned or is the zero address, the whole transaction reverts, so filter the list first.
- There is no fixed batch size limit. The block gas limit is the bound, so send large lists in chunks and simulate each one first.
- Each mint emits `CredentialIssuedBy(wallet, policyId, issuer, heldUntil)`, which records the address that minted.
- From a multisig owner, send the same calls through the multisig's transaction builder.

## Check and manage

Check whether a wallet holds a valid credential:

```bash
cast call $CREDENTIALS "balanceOf(address,uint256)(uint256)" <wallet> $POLICY_ID --rpc-url $RPC
```

Check when it expires:

```bash
cast call $CREDENTIALS "heldUntil(address,uint256)(uint64)" <wallet> $POLICY_ID --rpc-url $RPC
```

| Action | Function | Who | Needs |
| --- | --- | --- | --- |
| Ban a wallet and remove its credential | `ban(wallet, policyId)`, `banBatch(wallets, policyId)` | Owner or issuer | Owner bannable |
| Lift a ban | `unban(wallet, policyId)`, `unbanBatch(wallets, policyId)` | Owner or issuer | Owner bannable |
| Change requirements | `setRequirements(policyId, requirements)` | Owner | Owner editable |
| Change credential duration | `setCredentialDuration(policyId, seconds)` | Owner | Owner editable |
| Move to the latest evaluator | `migrateEvaluator(policyId, requirements)` | Owner | Owner editable |
| Change the metadata URL | `setMetadataURL(policyId, url)` | Owner | |
| Stop all new issuance for good | `retire(policyId)` | Owner | |
| Give up a credential | `renounce(policyId)` | The holder | |

Changes to requirements or duration apply to future issues and renewals. Credentials already held keep their expiry.

## Things to know

- Policy ownership cannot be transferred. Create the policy from a multisig whose signers you can rotate.
- Owner issuable, owner bannable, owner editable and enforce uniqueness are fixed at creation.
- The proof path is always open. Anyone whose ZKPassport proof meets the policy's requirements can mint for their own wallet, even if you only plan to mint yourself. Set the requirements to what you would accept from a self-serve user.
- Minting without a proof skips the one-per-passport check, so uniqueness for those wallets is your responsibility.
- Credentials are soulbound. They cannot be transferred or approved.
- A credential stops counting when it expires. `balanceOf` returns `0` until it is renewed.
- ZKPassport can pause issuance and policy creation in an emergency. Reads, bans and renounce keep working while paused.
