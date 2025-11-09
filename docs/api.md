---
sidebar_position: 4
---

# API Reference

This section provides detailed documentation for the ZKPassport SDK's public API, including classes, methods, types, and constants.

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
  name: string;
  logo: string;
  purpose: string;
  scope?: string;
  validity?: number;
  devMode?: boolean;
  cloudProverUrl?: string;
  bridgeUrl?: string;
}): Promise<QueryBuilder>
```

Initiates a new verification request.

Parameters:

- `name`: Your application name
- `logo`: URL to your application's logo
- `purpose`: Description of why you're requesting verification
- `scope` (optional): Scope for the unique identifiers
- `validity` (optional): Number of days ago the ID should have been last scanned (defaults to 180 days)
- `devMode` (optional): Whether to enable dev mode (defaults to false). Dev mode will accept mock proofs generated from the mock passports in the app.
- `cloudProverUrl` (optional): The url of the cloud prover to use for compressed proofs. Defaults to ZKPassport's Cloud Prover.
- `bridgeUrl` (optional): The url of the websocket to use to connect to the mobile app. Defaults to ZKPassport's Bridge.

Returns a `QueryBuilder` instance for building the verification query.

#### verify

```typescript
async verify({
  proofs,
  queryResult,
  scope,
  devMode,
  validity,
}: {
  proofs: Array<ProofResult>;
  queryResult: QueryResult;
  scope?: string;
  devMode?: boolean;
  validity?: number;
}): Promise<{
  uniqueIdentifier: string | undefined;
  verified: boolean;
  queryResultErrors?: QueryResultErrors;
}>
```

Verifies the proofs received from the mobile app. You can store the proofs and query result and use this method to verify them later, for example server-side after running the SDK logic client-side.

Parameters:

- `proofs`: The proofs to verify
- `queryResult`: The query result to verify against
- `scope` (optional): The scope used when requesting the proof
- `devMode` (optional): Whether to enable dev mode (defaults to false). Dev mode will accept mock proofs generated from the mock passports in the app.
- `validity` (optional): Number of days ago the ID should have been last scanned (defaults to 180 days)

Returns an object containing:

- `uniqueIdentifier`: The unique identifier associated with the user
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
  validityPeriodInDays,
  domain,
  scope,
  devMode,
}: {
  proof: ProofResult
  validityPeriodInDays?: number
  domain?: string
  scope?: string
  devMode?: boolean
}): SolidityVerifierParameters
```

Returns the parameters needed to call the Solidity verifier.

Parameters:

- `proof`: The proof to verify
- `validityPeriodInDays`: The validity period of the proof in days
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

#### done

```typescript
done(): {
  url: string;
  requestId: string;
  onRequestReceived: (callback: () => void) => void;
  onGeneratingProof: (callback: () => void) => void;
  onProofGenerated: (callback: (result: ProofResult) => void) => void;
  onResult: (callback: (response: {
    uniqueIdentifier: string | undefined;
    verified: boolean;
    result: QueryResult;
    queryResultErrors?: QueryResultErrors;
  }) => void) => void;
  onReject: (callback: () => void) => void;
  onError: (callback: (error: string) => void) => void;
  onBridgeConnect: (callback: () => void) => void;
  isBridgeConnected: () => boolean;
  requestReceived: () => boolean;
}
```

Finalizes the query and returns an object containing:

- `url`: URL to redirect users to the ZKPassport app
- `requestId`: Unique identifier for this request
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

### onResult

```typescript
onResult(callback: (response: {
  uniqueIdentifier: string | undefined;
  verified: boolean;
  result: QueryResult;
  queryResultErrors?: QueryResultErrors;
}) => void): void
```

Called when all proofs have been generated and verified. This is the main callback you'll use to handle the verification results. The callback receives a response object containing:

- `uniqueIdentifier`: A unique identifier for the user's ID (undefined if verification failed)
- `verified`: Whether all proofs were successfully verified
- `result`: The result of the verification
- `queryResultErrors`: Detailed error information if verification fails (undefined if verification succeeds)

:::warning
If `verified` is `false`, you should not trust any of the results and `uniqueIdentifier` will be undefined.
:::

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
  name: string; // Your application name
  logo: string; // URL to your application's logo
  purpose: string; // Description of why you're requesting verification
  mode?: ProofMode; // Specify the type of proof to request
  scope?: string; // Optional scope for the unique identifier
  validity?: number; // Optional number of days ago the ID should have been last scanned
  // (defaults to 180)
  devMode?: boolean; // Optional flag to enable dev mode (defaults to false)
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
  facematch?: {
    mode?: "regular" | "strict"; // Defaults to "regular"
  };
  // Note: as of today, the checks are done against all of the lists,
  // but in the future, it is planned to support checking against specific lists.
  sanctions?: {
    countries?: Alpha2Code[] | "all";
    lists?: string[] | "all";
    // Whether the sanctions check should do a check against the last name and first name only
    // Otherwise, it will do a check against name + date of birth and passport number + country
    // The strict mode increases the likelihood of a false positive, so use with caution.
    strict?: boolean; // Defaults to false
  };
}
```

### QueryBuilderResult

```typescript
interface QueryBuilderResult {
  url: string; // URL to redirect users to the ZKPassport app
  requestId: string; // Unique identifier for this request
  onRequestReceived: (callback: () => void) => void; // Called when request is received
  onGeneratingProof: (callback: () => void) => void; // Called when proof generation starts
  onBridgeConnect: (callback: () => void) => void; // Called when bridge connects
  onProofGenerated: (callback: (proof: ProofResult) => void) => void; // Called for each proof
  onResult: (
    callback: (response: {
      // Called with final results
      uniqueIdentifier: string | undefined;
      verified: boolean;
      result: QueryResult;
    }) => void
  ) => void;
  onReject: (callback: () => void) => void; // Called if user rejects
  onError: (callback: (error: string) => void) => void; // Called if error occurs
  isBridgeConnected: () => boolean; // Check if bridge is connected
  requestReceived: () => boolean; // Check if request was received
}
```

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
type SupportedChain = "ethereum" | "ethereum_sepolia"; // Type for supported chains

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
