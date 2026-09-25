---
sidebar_position: 4
---

# API Reference

This section provides detailed documentation for the ZKPassport SDK's public API, including classes, methods, types, and constants.

For the drop-in verify button, see the [`@zkpassport/ui`](#zkpassportui-the-verify-button) section at the bottom of this page.

## ZKPassport Class

The main class for interacting with the ZKPassport SDK.

### Constructor

```typescript
constructor(domain?: string)
```

Creates a new instance of the ZKPassport SDK.

- `domain` (optional): Your application's domain. If not provided in a browser environment, it will be automatically inferred from the window location.

### Methods

#### request

```typescript
async request(options: {
  name?: string;
  logo?: string;
  purpose?: string;
  scope?: string;
  mode?: ProofMode;
  projectID?: string;
  validity?: number;
  devMode?: boolean;
  uniqueIdentifierType?: NullifierType.NON_SALTED | NullifierType.SALTED | NullifierType.NONE;
  oprfKeyId?: string;
  topicOverride?: string;
  keyPairOverride?: { privateKey: Uint8Array; publicKey: Uint8Array };
  cloudProverUrl?: string;
  bridgeUrl?: string;
}): Promise<QueryBuilder>
```

Initiates a new verification request and returns a `QueryBuilder`.

Parameters:

- `name` (optional): Your application name. Defaults to your dashboard project branding, then your domain.
- `logo` (optional): URL to your application's logo. Defaults to your dashboard project branding.
- `purpose` (optional): Description of why you're requesting verification. Defaults to the policy's purpose (if a policy is applied), then a generic message.
- `scope` (optional): Scope for the unique identifier. Defaults to your domain, or to the policy id when you apply a policy with [`.policy()`](#policy).
- `mode` (optional): The proof mode — `"fast"` (default), `"compressed"`, or `"compressed-evm"` (required for [onchain verification](./getting-started/onchain)).
- `projectID` (optional): The project ID of your service.
- `validity` (optional): How many seconds ago the proof checking the ID's expiry date may have been generated. Defaults to 7 days.
- `devMode` (optional): Whether to enable dev mode (defaults to false). Dev mode accepts mock proofs generated from the mock passports in the app.
- `uniqueIdentifierType` (optional): `NullifierType.NON_SALTED` (default), `NullifierType.SALTED`, or `NullifierType.NONE` for proofs without a unique identifier. A salted identifier requires `.facematch("strict")` in the query — see [Salted Unique Identifiers (OPRF)](./examples/salted-identifiers).
- `oprfKeyId` (optional): OPRF key identifier; implies a salted unique identifier.
- `topicOverride`, `keyPairOverride`, `cloudProverUrl`, `bridgeUrl` (optional): Advanced configuration. `cloudProverUrl` overrides the cloud prover for compressed proofs and `bridgeUrl` overrides the websocket bridge to the mobile app. Contact us if you need these.

:::tip
To apply a policy defined in the [dashboard](./getting-started/policies), chain `.policy("pol_xyz")` on the returned `QueryBuilder` instead of building the query with the other methods. Most of the options above (name, logo, purpose, scope) then default to your dashboard configuration.
:::

Returns a `QueryBuilder` instance for building the verification query.

#### createQuery

```typescript
createQuery(): QueryBuilder
```

Creates a query without starting a request: it doesn't connect to the mobile app, and `done()` only returns `{ query }`. Use it on your server to recreate the original query you pass to [`verify()`](#verify), so a tampered client can't get proofs for a weaker query accepted.

#### verify

```typescript
async verify({
  proofs,
  originalQuery,
  queryResult,
  validity,
  scope,
  devMode,
  oprfKeyId,
  uniqueIdentifierType,
  verifierMode,
}: {
  proofs: Array<ProofResult>;
  originalQuery: Query;
  queryResult: QueryResult;
  validity?: number;
  scope?: string;
  devMode?: boolean;
  oprfKeyId?: string;
  uniqueIdentifierType?: NullifierType.NON_SALTED | NullifierType.SALTED | NullifierType.NONE;
  verifierMode?: "auto" | "local" | "api";
}): Promise<{
  uniqueIdentifier: string | undefined;
  uniqueIdentifierType: NullifierType | undefined;
  verified: boolean;
  queryResultErrors?: QueryResultErrors;
}>
```

Verifies the proofs received from the mobile app. You can store the proofs, the original query, and the query result and use this method to verify them later, for example server-side after running the SDK logic client-side (see the [Client-Server example](./examples/client-server)).

Parameters:

- `proofs`: The proofs to verify
- `originalQuery`: The original query object. On your server, recreate it with [`createQuery()`](#createquery) rather than accepting it from the client. **Required.**
- `queryResult`: The query result to verify against
- `validity` (optional): How many seconds ago the proof checking the ID's expiry date may have been generated. Defaults to 7 days.
- `scope` (optional): The scope used when requesting the proof (the policy id for a policy-driven request, unless the request set its own scope). Proofs for a different scope fail verification.
- `devMode` (optional): Whether to enable dev mode (defaults to false). Dev mode accepts mock proofs generated from the mock passports in the app.
- `oprfKeyId` (optional): The OPRF key id, if a salted unique identifier was requested
- `uniqueIdentifierType` (optional): The unique identifier type requested. Proofs with a different type fail verification.
- `verifierMode` (optional): `"auto"` (default) verifies locally and falls back to the ZKPassport verifier API when the local result is not verified; `"local"` and `"api"` force one or the other.

Returns an object containing:

- `uniqueIdentifier`: The unique identifier associated with the user
- `uniqueIdentifierType`: The type of unique identifier (see [`NullifierType`](#additional-types))
- `verified`: Whether the proofs were successfully verified
- `queryResultErrors`: Detailed error information if verification fails (undefined if verification succeeds)

#### getSolidityVerifierDetails

```typescript
getSolidityVerifierDetails(): {
  address: `0x${string}`
  functionName: string
  abi: {
    type: "function" | "event" | "constructor"
    name: string
    inputs: { name: string; type: string; internalType: string }[]
    outputs: { name: string; type: string; internalType: string }[]
  }[]
}
```

Returns the details of the Solidity verifier.

Returns an object containing:

- `address`: The address of the verifier (same for all networks)
- `functionName`: The name of the function to call on the verifier
- `abi`: The ABI of the verifier

#### getSolidityVerifierParameters

```typescript
getSolidityVerifierParameters({
  proof,
  validityPeriodInSeconds,
  domain,
  scope,
  devMode,
}: {
  proof: ProofResult
  validityPeriodInSeconds?: number
  domain?: string
  scope?: string
  devMode?: boolean
}): SolidityVerifierParameters
```

Returns the parameters needed to call the Solidity verifier.

Parameters:

- `proof`: The proof to verify
- `validityPeriodInSeconds`: The validity period of the proof in seconds
- `domain`: The domain of the request
- `scope`: The scope of the request
- `devMode`: Whether to use dev mode (use it if you're verifying mock proofs)

Returns an object containing:

- `version`: The version of the proof
- `proofVerificationData`: The proof verification data (i.e. vkey hash, proof, public inputs)
- `committedInputs`: The committed inputs to the proof
- `serviceConfig`: The service configuration (i.e. validity period, domain, scope, dev mode)

#### getUrl

```typescript
getUrl(requestId: string): string
```

Returns the URL of the request that can be used to generate a QR code or direct link.

Parameters:

- `requestId`: The request ID

#### cancelRequest

```typescript
cancelRequest(requestId: string): void
```

Cancels a request by closing the WebSocket connection and cleaning up associated data.

Parameters:

- `requestId`: The request ID to cancel

#### clearAllRequests

```typescript
clearAllRequests(): void
```

Cancels all active requests and cleans up associated resources. This method:

- Closes all active WebSocket connections
- Clears all stored request data
- Removes all event handlers
- Resets the SDK state

Use this method when you want to clean up all pending requests, for example when your application is shutting down or when you want to reset the SDK state.

## QueryBuilder Interface

Used to construct verification queries by chaining methods. Each method returns a new `QueryBuilder` instance, allowing for method chaining.

### Methods

#### disclose

```typescript
disclose(field: DisclosableIDCredential): QueryBuilder
```

Requests disclosure of a specific field from the ID.

Available fields:

- `nationality`: The nationality of the ID holder
- `birthdate`: The date of birth of the ID holder
- `fullname`: The full name as it appears on the ID (including middle names and secondary given names)
- `firstname`: The first name of the ID holder (doesn't include secondary given names nor middle names)
- `lastname`: The last name of the ID holder
- `expiry_date`: The expiration date of the ID document
- `document_number`: The unique number of the ID document (handle with care as it's sensitive information)
- `document_type`: The type of document (e.g., "passport", "residence_permit", "id_card")
- `issuing_country`: The country that issued the ID document
- `gender`: The gender as it appears on the ID

#### gte (Greater Than or Equal)

```typescript
gte<T extends NumericalIDCredential>(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a numeric field is greater than or equal to a value.

Currently supported for:

- `age`: Check if the user is at least a certain age
- `birthdate`: Check if the birthdate is after a specific date
- `expiry_date`: Check if the ID expires after a specific date

#### gt (Greater Than)

```typescript
gt<T extends NumericalIDCredential>(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a numeric field is strictly greater than a value. Supported for the same fields as `gte`.

#### lt (Less Than)

```typescript
lt<T extends NumericalIDCredential>(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a numeric field is strictly less than a value.

Currently supported for:

- `age`: Check if the user is younger than a certain age
- `birthdate`: Check if the birthdate is before a specific date
- `expiry_date`: Check if the ID expires before a specific date

#### lte (Less Than or Equal)

```typescript
lte<T extends NumericalIDCredential>(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a numeric field is less than or equal to a value.

Currently supported for:

- `age`: Check if the user is at most a certain age
- `birthdate`: Check if the birthdate is before or on a specific date
- `expiry_date`: Check if the ID expires before or on a specific date

#### range

```typescript
range<T extends NumericalIDCredential>(
  key: T,
  start: IDCredentialValue<T>,
  end: IDCredentialValue<T>
): QueryBuilder
```

Verifies if a numeric field is within a range (inclusive start and end).

Currently supported for:

- `age`: Check if the user's age is within a range
- `birthdate`: Check if the birthdate is within a range
- `expiry_date`: Check if the ID expiry date is within a range

#### in

```typescript
in<T extends "nationality" | "issuing_country">(key: T, value: IDCredentialValue<T>[]): QueryBuilder
```

Verifies if a field's value is in a set of values.

Currently only supported for:

- `nationality`: Check if the user is a citizen of one of several countries
- `issuing_country`: Check if the user's ID was issued by one of several countries

#### out

```typescript
out<T extends "nationality" | "issuing_country">(key: T, value: IDCredentialValue<T>[]): QueryBuilder
```

Verifies if a field's value is not in a set of values.

Currently only supported for:

- `nationality`: Check if the user is not a citizen of certain countries
- `issuing_country`: Check if the user's ID was not issued by certain countries

#### eq

```typescript
eq<T extends IDCredential>(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a field exactly matches a value.

Can be used with any ID credential field:

- `document_type`: Check for a specific document type
- `issuing_country`: Check if the ID was issued by a specific country
- `nationality`: Check for a specific nationality
- `gender`: Check for a specific gender
- And any other field that can be disclosed

#### bind

```typescript
bind(key: "user_address" | "chain" | "custom_data", value: string): QueryBuilder
```

Binds data to the proof.

Note: The total size of the data cannot exceed 500 bytes.

Currently supported:

- `user_address`: The user's address such as an Ethereum address. This is treated as raw bytes.
- `chain`: The chain where the proof will be verified. This is converted to the appropriate chain id.
- `custom_data`: Custom data to be attached to the proof. This is treated as ASCII encoded text.

#### sanctions

```typescript
sanctions(
  countries?: SanctionsCountries,
  lists?: SanctionsLists,
  options?: { strict?: boolean }
): QueryBuilder
```

Requires that the ID holder is not part of any of the specified sanction lists. See the [KYC example](./examples/kyc).

- `countries` (optional): The country or list of countries whose sanction lists to check against. Defaults to `"all"`.
- `lists` (optional): The specific lists to check against. Defaults to `"all"`.
- `options.strict` (optional): When `true`, the check is done against the last name and first name only, which has a higher false-positive rate but is harder to evade. When `false` (default), matches need to include the date of birth and name, or the passport number and nationality.

:::note
As of today, checks run against all of the available lists (US, UK, EU, Switzerland), so `countries` and `lists` accept `"all"`. Support for specific lists is planned.
:::

#### facematch

```typescript
facematch(mode?: FacematchMode): QueryBuilder
```

Requires that the ID holder's face matches the photo on the ID, verified locally on the device. See the [Private FaceMatch example](./examples/facematch).

- `mode` (optional): `"strict"` (default) runs an extensive liveness check for higher-security flows such as KYC; `"regular"` runs a basic liveness check and is faster.

#### policy

```typescript
policy(id: string): QueryBuilder
```

Applies an immutable [policy](./getting-started/policies) fetched from the [dashboard](https://dashboard.zkpassport.id). The policy's query is applied, the scope defaults to the policy id (unless the request sets its own `scope`), and branding/purpose default to the dashboard configuration.

- `id`: The policy id (e.g. `"pol_xyz"`).

Constraints (throws otherwise): `.policy()` can only be called once per request and cannot be combined with builder methods like `.gte()` / `.disclose()`. The one exception is [`.bind()`](#bind), which may be chained after `.policy()` — bound values (like the user's wallet address) are only known at request time, so they are never part of a policy.

#### done

```typescript
done(): {
  url: string;
  query: Query;
  requestId: string;
  policy?: string;
  onRequestReceived: (callback: () => void) => void;
  onGeneratingProof: (callback: () => void) => void;
  onBridgeConnect: (callback: () => void) => void;
  onProofGenerated: (callback: (result: ProofResult) => void) => void;
  onSuccess: (callback: (response: {
    proofs: ProofResult[];
    result: QueryResult;
  }) => void) => void;
  // Deprecated: use onSuccess
  onResult: (callback: (response: {
    uniqueIdentifier: string | undefined;
    uniqueIdentifierType: NullifierType | undefined;
    verified: boolean;
    result: QueryResult;
    queryResultErrors?: QueryResultErrors;
    proofs: ProofResult[];
    sdkInstance: ZKPassport;
  }) => void) => void;
  onReject: (callback: () => void) => void;
  onError: (callback: (error: string) => void) => void;
  isBridgeConnected: () => boolean;
  requestReceived: () => boolean;
}
```

Finalizes the query and returns an object containing:

- `url`: URL to redirect users to the ZKPassport app
- `query`: The query object sent to the mobile app. To verify on your server, recreate the same query there with [`createQuery()`](#createquery)
- `requestId`: Unique identifier for this request
- `policy`: The policy id used to build the request, if one was applied with [`.policy()`](#policy)
- Event handlers (see Event Handlers section below)

## Event Handlers

The SDK provides several event handlers to track the progress of a verification request:

### onRequestReceived

```typescript
onRequestReceived(callback: () => void): void
```

Called when the user has scanned the QR code or clicked the link and sees the request popup on their mobile device. Use this to update your UI to show that the request has been received.

### onGeneratingProof

```typescript
onGeneratingProof(callback: () => void): void
```

Called when the user has accepted the request and the proof generation has started. The proof generation typically takes up to 10 seconds with a good connection.

### onProofGenerated

```typescript
onProofGenerated(callback: (result: ProofResult) => void): void
```

Called when an individual proof has been generated. Multiple proofs may be generated for a single request. The callback receives a `ProofResult` object containing:

- `proof`: The generated proof
- `vkeyHash`: Hash of the verification key
- `version`: Version of the circuit used to generate the proof
- `name`: Name of the circuit used to generate the proof
- `index`: The index of the proof (starting from 0)
- `total`: The total number of proofs that should be sent back by the mobile app

### onSuccess

```typescript
onSuccess(callback: (response: {
  proofs: ProofResult[];
  result: QueryResult;
}) => void): void
```

Called when the user has completed the request and all proofs were received. This is the main callback you'll use to handle the verification results. The callback receives:

- `proofs`: The raw proofs
- `result`: The result of the query

:::warning
The proofs are not verified at this point, and a result checked in the browser can be tampered with. Send the `proofs` and the `result` to your server and verify them there with [`verify()`](#verify), which also returns the `uniqueIdentifier`.
:::

### onResult

:::warning Deprecated
Use [`onSuccess`](#onsuccess) and verify the proofs on your server instead. The `verified` flag is computed in the browser, so it can't be trusted.
:::

```typescript
onResult(callback: (response: {
  uniqueIdentifier: string | undefined;
  uniqueIdentifierType: NullifierType | undefined;
  verified: boolean;
  result: QueryResult;
  queryResultErrors?: QueryResultErrors;
  proofs: ProofResult[];
  sdkInstance: ZKPassport;
}) => void): void
```

Called when all proofs have been generated and verified in the browser. The callback receives a response object containing:

- `uniqueIdentifier`: A unique identifier for the user's ID (undefined if verification failed)
- `uniqueIdentifierType`: The type of unique identifier (see [`NullifierType`](#additional-types))
- `verified`: Whether all proofs were successfully verified
- `result`: The result of the verification
- `queryResultErrors`: Detailed error information if verification fails (undefined if verification succeeds)
- `proofs`: The raw proofs
- `sdkInstance`: The `ZKPassport` instance that produced this result

### onReject

```typescript
onReject(callback: () => void): void
```

Called when the user rejects the verification request.

### onError

```typescript
onError(callback: (error: string) => void): void
```

Called if an error occurs during the verification process.

## Types

### RequestOptions

```typescript
// The type of proof to request
// fast: Fast proof generation, slightly less privacy in regards to the issuing country
// and not verifiable on-chain
// compressed: Compressed proof generation, full privacy in regards to the issuing country
// but not verifiable on EVM chains
// compressed-evm: Compressed proof generation, full privacy in regards to the issuing country
// and verifiable on EVM chains
type ProofMode = "fast" | "compressed" | "compressed-evm";

interface RequestOptions {
  name?: string; // Your application name (defaults to dashboard branding, then domain)
  logo?: string; // URL to your application's logo (defaults to dashboard branding)
  purpose?: string; // Why you're requesting verification (defaults to the policy's purpose, then generic)
  scope?: string; // Optional scope for the unique identifier (defaults to your domain)
  mode?: ProofMode; // Specify the type of proof to request (defaults to "fast")
  projectID?: string; // The project ID of your service
  validity?: number; // (Optional) How many seconds ago the proof should have been generated
  // (defaults to 7 days in seconds)
  devMode?: boolean; // Optional flag to enable dev mode (defaults to false)
  // SALTED requires .facematch("strict"); NONE omits the unique identifier
  uniqueIdentifierType?: NullifierType.NON_SALTED | NullifierType.SALTED | NullifierType.NONE;
  oprfKeyId?: string; // OPRF key identifier; implies a salted unique identifier
  topicOverride?: string; // Optional override for the request ID
  keyPairOverride?: {
    // Optional override for the ECDH key pair
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  };
  // Advanced configuration: feel free to contact us if you need to use these options
  cloudProverUrl?: string; // Optional override for the cloud prover URL
  bridgeUrl?: string; // Optional override for the bridge URL
}
```

### ProofResult

```typescript
interface ProofResult {
  proof: string; // The generated zero-knowledge proof
  vkeyHash: string; // Hash of the verification key
  version: string; // Version of the proof system
  name: string; // Name of the proof
  index: number; // Index of the proof (starting from 0)
  total: number; // Total number of proofs that should be sent back by the mobile app
}
```

### QueryResult

```typescript
interface QueryResult {
  [field: string]: {
    disclose?: {
      result: string | number | Date; // Result of a disclosure query
    };
    gte?: {
      result: boolean;
      expected: number | Date; // Expected value for greater-than-or-equal query
    };
    gt?: {
      result: boolean;
      expected: number | Date; // Expected value for greater-than query
    };
    lt?: {
      result: boolean;
      expected: number; // Expected value for less-than query
    };
    lte?: {
      result: boolean;
      expected: Date; // Expected value for less-than-or-equal query
    };
    range?: {
      result: boolean;
      expected: [number | Date, number | Date]; // Expected range values
    };
    in?: {
      result: boolean;
      expected: string[]; // Expected values for inclusion query
    };
    out?: {
      result: boolean;
      expected: string[]; // Expected values for exclusion query
    };
    eq?: {
      result: boolean;
      expected: string | number | Date; // Expected value for equality query
    };
  };
  bind?: {
    user_address?: string;
    chain?: SupportedChain;
    custom_data?: string;
  };
  // Present when .facematch() was requested
  facematch?: {
    mode: "regular" | "strict";
    passed: boolean; // Whether the FaceMatch check passed
  };
  // Present when .sanctions() was requested
  sanctions?: {
    passed: boolean; // Whether all sanction checks passed
    isStrict: boolean; // Whether the check ran in strict mode
    countries?: Record<string, { passed: boolean }>;
    lists?: Record<string, { passed: boolean }>;
  };
}
```

### QueryBuilderResult

```typescript
interface QueryBuilderResult {
  url: string; // URL to redirect users to the ZKPassport app
  query: Query; // The query object sent to the mobile app
  requestId: string; // Unique identifier for this request
  policy?: string; // The policy id, if .policy() was applied
  onRequestReceived: (callback: () => void) => void; // Called when request is received
  onGeneratingProof: (callback: () => void) => void; // Called when proof generation starts
  onBridgeConnect: (callback: () => void) => void; // Called when bridge connects
  onProofGenerated: (callback: (proof: ProofResult) => void) => void; // Called for each proof
  // Called with the unverified proofs and result
  onSuccess: (callback: (response: { proofs: ProofResult[]; result: QueryResult }) => void) => void;
  onResult: (
    callback: (response: {
      // Deprecated: use onSuccess
      uniqueIdentifier: string | undefined;
      uniqueIdentifierType: NullifierType | undefined;
      verified: boolean;
      result: QueryResult;
      queryResultErrors?: QueryResultErrors;
      proofs: ProofResult[];
      sdkInstance: ZKPassport;
    }) => void
  ) => void;
  onReject: (callback: () => void) => void; // Called if user rejects
  onError: (callback: (error: string) => void) => void; // Called if error occurs
  isBridgeConnected: () => boolean; // Check if bridge is connected
  requestReceived: () => boolean; // Check if request was received
}
```

### Policy

```typescript
type Policy = {
  id: string; // e.g. "pol_xyz"
  name: string;
  purpose: string; // Default purpose shown to the user
  projectId: string | null;
  query: Query; // The immutable query the policy applies
};

type DashboardConfig = {
  project: {
    name: string;
    domain: string;
    logoUrl: string | null;
    allowedOrigins: string[];
  };
  policies: Policy[];
};
```

Policies are managed in the [ZKPassport Dashboard](https://dashboard.zkpassport.id) and applied with [`.policy(id)`](#policy). See [Dashboard & Policies](./getting-started/policies).

### IDCredentialValue

```typescript
type IDCredentialValue<T> = T extends "nationality" | "issuing_country"
  ? CountryName | Alpha3Code
  : T extends "birthdate" | "expiry_date"
  ? Date
  : T extends "age"
  ? number
  : string;
```

### SolidityVerifierParameters

```typescript
type SolidityProofVerificationData = {
  vkeyHash: string;
  proof: string;
  publicInputs: string[];
};

type SolidityServiceConfig = {
  validityPeriodInSeconds: number;
  domain: string;
  scope: string;
  devMode: boolean;
};

type SolidityVerifierParameters = {
  version: string;
  proofVerificationData: SolidityProofVerificationData;
  committedInputs: string;
  serviceConfig: SolidityServiceConfig;
};
```

### Additional Types

```typescript
type CountryName = string; // Type for country names
type Alpha3Code = string; // Type for ISO 3166-1 alpha-3 country codes
type Alpha2Code = string; // Type for ISO 3166-1 alpha-2 country codes
type IDCredential = string; // Type for ID credential fields

// Values accepted by the `chain` argument of .bind() (this is the full type
// exported by the SDK). Note: on-chain verification is only available where the
// ZKPassportVerifier is deployed — see Onchain Verification for the current list.
type SupportedChain =
  // Mainnets
  | "ethereum" | "base" | "arbitrum" | "optimism" | "polygon"
  | "celo" | "gnosis" | "scroll" | "linea" | "world_chain"
  // Testnets
  | "ethereum_sepolia" | "base_sepolia" | "arbitrum_sepolia" | "polygon_amoy"
  | "celo_sepolia" | "gnosis_chiado" | "scroll_sepolia" | "linea_sepolia"
  | "world_chain_sepolia" | "local";

// The kind of unique identifier (nullifier) tied to the result
enum NullifierType {
  NON_SALTED = 0,
  SALTED = 1,
  NON_SALTED_MOCK = 2,
  SALTED_MOCK = 3,
  NONE = 4, // No unique identifier
}

// Type for numerical fields that can be compared
type NumericalIDCredential = "age" | "birthdate" | "expiry_date";

// Type for fields that can be disclosed
type DisclosableIDCredential =
  | "nationality"
  | "birthdate"
  | "fullname"
  | "firstname"
  | "lastname"
  | "expiry_date"
  | "document_number"
  | "document_type"
  | "issuing_country"
  | "gender";

interface QueryResultErrors {
  [
    key:
      | IDCredential
      | "sig_check_dsc"
      | "sig_check_id_data"
      | "data_check_integrity"
      | "disclose"
      | "bind"
  ]: {
    disclose?: QueryResultError<string | number | Date>;
    gte?: QueryResultError<number | Date>;
    lte?: QueryResultError<number | Date>;
    lt?: QueryResultError<number | Date>;
    range?: QueryResultError<[number | Date, number | Date]>;
    in?: QueryResultError<string[]>;
    out?: QueryResultError<string[]>;
    eq?: QueryResultError<string | number | Date>;
    commitment?: QueryResultError<string>;
    date?: QueryResultError<string>;
    certificate?: QueryResultError<string>;
  };
}

interface QueryResultError<T> {
  expected?: T;
  received?: T;
  message: string;
}
```

The `QueryResultErrors` type provides detailed error information when verification fails. It includes:

- Error details for each credential field
- Specific error messages for different types of verification checks
- Expected vs received values for debugging
- Error messages for signature checks and data integrity

## Constants

The SDK exports several predefined country lists that can be used with the `in` and `out` methods:

### Country Lists

```typescript
/**
 * List of European Union member countries
 */
EU_COUNTRIES: string[];

/**
 * List of European Economic Area countries
 */
EEA_COUNTRIES: string[];

/**
 * List of Schengen Area countries
 */
SCHENGEN_COUNTRIES: string[];

/**
 * List of Association of Southeast Asian Nations (ASEAN) member countries
 */
ASEAN_COUNTRIES: string[];

/**
 * List of Southern Common Market (Mercosur) member countries
 */
MERCOSUR_COUNTRIES: string[];

/**
 * List of countries under international sanctions
 */
SANCTIONED_COUNTRIES: string[];
```

:::note
The expected format for countries are alpha-3 country codes. However, the SDK automatically handles conversion between country names and codes when using the `in` and `out` methods.
:::

## @zkpassport/ui (the verify button)

[`@zkpassport/ui`](https://www.npmjs.com/package/@zkpassport/ui) provides the **Verify with ZKPassport** button, built on top of the SDK. Clicking it opens ZKPassport's hosted verification page (`verify.zkpassport.id`) in a popup, which guides the user through the verification with the ZKPassport app and hands the proofs back to your page. Install it alongside the SDK:

```bash
npm install @zkpassport/sdk @zkpassport/ui
```

The button always uses the domain of the page it runs on, so verify the proofs on your server with a `ZKPassport` instance created for that same domain.

### React — `VerifyWithZKPassport`

```typescript
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

function VerifyWithZKPassport(
  props: VerifyWithZKPassportOptions & {
    // Render your own trigger instead of the default button
    children?: (verification: {
      status: "idle" | "in-progress" | "success" | "error";
      error: string | null;
      isLoading: boolean;
      verify: () => void;
    }) => ReactNode;
  }
): ReactElement
```

In the Next.js App Router, the React entry is marked `"use client"`, so import it from a client component.

### Vanilla — `mountVerifyButton`

```typescript
import { mountVerifyButton } from "@zkpassport/ui/button";

function mountVerifyButton(element: HTMLElement, options: VerifyWithZKPassportOptions): VerifyButtonHandle

type VerifyButtonHandle = {
  update(next: VerifyWithZKPassportOptions): void; // swap options
  unmount(): void; // remove the button
};
```

### Options

```typescript
type VerifyWithZKPassportOptions = {
  // Request options, as on request()
  name?: string;
  logo?: string;
  purpose?: string;
  scope?: string;
  mode?: ProofMode;
  devMode?: boolean;
  validity?: number;
  uniqueIdentifierType?: NullifierType.NON_SALTED | NullifierType.SALTED;
  oprfKeyId?: string;

  // Required: receives a QueryBuilder, applies gates, returns queryBuilder.done()
  query: (queryBuilder: QueryBuilder) => QueryBuilderResult;
  // Dashboard policy id, applied to the builder before `query` runs
  policyId?: string;

  // Button display
  label?: string; // Defaults to "Verify with ZKPassport"
  size?: "small" | "medium" | "large"; // Defaults to "medium"
  theme?: "light" | "dark" | "auto"; // Defaults to "light"; "auto" follows the OS
  showErrorMessage?: boolean; // Set to false to hide the error line and rely on onError
  classes?: { root?: string; button?: string; error?: string };
  windowMode?: "popup" | "tab"; // Defaults to "popup"

  // Callbacks
  onRequestReceived?: () => void;
  onGeneratingProof?: () => void;
  onProofGenerated?: (progress: { index?: number; total?: number; name?: string }) => void;
  // Return false (or throw) to show the error state instead of success
  onSuccess?: (response: {
    proofs: ProofResult[];
    result: QueryResult;
  }) => void | boolean | Promise<void | boolean>;
  onReject?: () => void;
  onError?: (message: string) => void;
  onClose?: () => void; // The user closed the popup before a result
};
```

The button waits for your `onSuccess` handler before showing its success state, so it can send the proofs to your server and return whether they were accepted. The proofs are not verified in the browser — verify them on your server with [`verify()`](#verify).

:::note
The button's styles are injected as a `<style>` tag. To restyle it, set the `--zkp-btn-*` CSS custom properties (for example `--zkp-btn-bg`, `--zkp-btn-fg`, `--zkp-btn-radius` or `--zkp-btn-font-size`) on the mount element or any ancestor, or pass a function as `children` to render your own trigger.
:::

To apply a dashboard policy, pass its id as `policyId` and return `queryBuilder.done()` from the `query` callback. See [Dashboard & Policies](./getting-started/policies).
