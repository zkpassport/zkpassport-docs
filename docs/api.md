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
}): Promise<QueryBuilder>
```

Initiates a new verification request.

Parameters:

- `name`: Your application name
- `logo`: URL to your application's logo
- `purpose`: Description of why you're requesting verification
- `scope` (optional): Scope for the unique identifier
- `validity` (optional): Number of days ago the ID should have been last scanned (defaults to 180 days)

Returns a `QueryBuilder` instance for building the verification query.

#### verify

```typescript
async verify(
  requestId: string,
  proofs?: Array<ProofResult>,
  queryResult?: QueryResult
): Promise<{
  uniqueIdentifier: string | undefined;
  verified: boolean;
  queryResultErrors?: QueryResultErrors;
}>
```

Verifies the proofs received from the mobile app.

Parameters:

- `requestId`: The request ID
- `proofs`: The proofs to verify
- `queryResult`: The query result to verify against

Returns an object containing:

- `uniqueIdentifier`: The unique identifier associated with the user
- `verified`: Whether the proofs were successfully verified
- `queryResultErrors`: Detailed error information if verification fails (undefined if verification succeeds)

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
lt<T extends "age">(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a numeric field is less than a value.

Currently only supported for:

- `age`: Check if the user is younger than a certain age

#### lte (Less Than or Equal)

```typescript
lte<T extends "birthdate" | "expiry_date">(key: T, value: IDCredentialValue<T>): QueryBuilder
```

Verifies if a date field is less than or equal to a value.

Currently supported for:

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

Verifies if a numeric field is within a range (inclusive start, exclusive end).

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
- `version`: Version of the proof system
- `name`: Name of the proof

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
interface RequestOptions {
  name: string; // Your application name
  logo: string; // URL to your application's logo
  purpose: string; // Description of why you're requesting verification
  scope?: string; // Optional scope for the unique identifier
  validity?: number; // Optional number of days ago the ID should have been last scanned (defaults to 180)
  topicOverride?: string; // Optional override for the request ID
  keyPairOverride?: {
    // Optional override for the ECDH key pair
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  };
}
```

### ProofResult

```typescript
interface ProofResult {
  proof: string; // The generated zero-knowledge proof
  vkeyHash: string; // Hash of the verification key
  version: string; // Version of the proof system
  name: string; // Name of the proof
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

### Additional Types

```typescript
type CountryName = string; // Type for country names
type Alpha3Code = string; // Type for ISO 3166-1 alpha-3 country codes
type IDCredential = string; // Type for ID credential fields

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
    key: IDCredential | "sig_check_dsc" | "sig_check_id_data" | "data_check_integrity" | "disclose"
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
SANCTIONNED_COUNTRIES: string[];
```

:::note
The expected format for countries are alpha-3 country codes. However, the SDK automatically handles conversion between country names and codes when using the `in` and `out` methods.
:::
