---
sidebar_position: 4
---

# Onchain Verification

ZKPassport allows you to verify passport and national ID proofs directly on EVM chains. As of today, our verifier is deployed on the following chains:

- Ethereum Mainnet
- Ethereum Sepolia
- Base Mainnet

If you need a specific chain, please [reach out to us](mailto:company@zkpassport.id).

The following guide explains how to use ZKPassport proofs in your smart contracts.

## Overview

Onchain verification enables your smart contracts to:

- Verify user identity proofs without requiring centralized servers
- Create unique identifiers linked to real-world identity
- Apply age, nationality, or other ID-based restrictions to on-chain actions

## Verifier Contract

ZKPassport maintains a deployed [`ZKPassportVerifier`](https://etherscan.io/address/0x1D000001000EFD9a6371f4d90bB8920D5431c0D8#code) contract at this address `0x1D000001000EFD9a6371f4d90bB8920D5431c0D8` that handles the verification of the proofs on all the chains listed above. Your contracts will interact with this verifier. Since the verifier address is deterministic, it is the same for all networks.

## Integration Steps

### 1. Build your query for onchain verification

```typescript
import { ZKPassport } from "@zkpassport/sdk";

const zkPassport = new ZKPassport("your-domain.com");

// Create a request with your app details
const queryBuilder = await zkPassport.request({
  name: "Your App Name",
  // A path to your app's logo
  logo: "https://your-domain.com/logo.png",
  // A description of the purpose of the request
  purpose: "Doing something",
  // Optional scope for the user's unique identifier
  scope: "my-scope",
  // To verify proofs on EVM chains, you need to set the mode to "compressed-evm"
  mode: "compressed-evm",
});

// Build your query with the required attributes or conditions you want to verify
const {
  url,
  requestId,
  onRequestReceived,
  onGeneratingProof,
  onProofGenerated,
  onResult,
  onReject,
  onError,
} = queryBuilder
  // Disclose the user's nationality
  .disclose("nationality")
  // Disclose the user's document type
  .disclose("document_type")
  // Verify the user's age is greater than or equal to 18
  .gte("age", 18)
  // Bind the user's address to the proof
  .bind("user_address", "0x1234567890123456789012345678901234567890")
  // Bind to the chain where the proof will be verified
  // This is strongly typed to the networks we support and plan to support in the near future
  .bind("chain", "ethereum")
  // Bind custom data to the proof
  .bind("custom_data", "my-custom-data")
  // Finalize the query
  .done();
```

### 2. Get Verifier Contract Details

Use the SDK's `getSolidityVerifierDetails` method to get verifier contract details:

```typescript
const {
  // The address of the deployed verifier contract
  // Since it's deterministic, it will be the same for all networks
  address,
  // The function name to call on the verifier contract
  functionName,
  // The ABI of the verifier contract
  abi,
} = zkPassport.getSolidityVerifierDetails();
```

### 3. Generate Verification Parameters from Proof

When a user completes a verification in your app, use `getSolidityVerifierParameters` to prepare the parameters to pass to the verifier contract:

```typescript
let proof: ProofResult;
// Use the proofResult from the onProofGenerated callback to get the proof
onProofGenerated((proofResult: ProofResult) => {
  proof = proofResult;
});

onResult(
  ({
    uniqueIdentifier,
    verified,
    result,
  }: {
    uniqueIdentifier: string;
    verified: boolean;
    result: QueryResult;
  }) => {
    if (!verified) {
      // If the proof is not verified, save yourself some gas and return straight away
      console.log("Proof is not verified");
      return;
    }

    // Get the verification parameters
    const verifierParams = zkPassport.getSolidityVerifierParameters({
      proof: proof,
      // Use the same scope as the one you specified with the request function
      scope: "my-scope",
      // Enable dev mode if you want to use mock passports, otherwise keep it false
      devMode: false,
    });

    // Get the wallet provider
    const walletProvider = await getWalletProvider();

    // Verify the proof on-chain
    // The function is defined in the next steps below
    await verifyOnChain(
      verifierParams,
      walletProvider,
      // Use the document type to determine if the proof is for an ID card or passport
      // Residence permit are essentially like ID cards as they follow the same structure
      result.document_type.disclose.result !== "passport"
    );
  }
);
```

### 4. Create Your Smart Contract

Create a contract that interacts with the verifier:

```solidity
pragma solidity ^0.8.21;

/**
 * @notice The data that can be bound to the proof
 */
struct BoundData {
  // The address of the ID holder
  senderAddress: address;
  // The chain id (block.chainid)
  chainId: uint256;
  // The custom data (encoded as ASCII string)
  customData: string;
}

/**
 * @notice The data that can be disclosed by the proof
 */
struct DisclosedData {
    // The name of the ID holder (includes the angular brackets from the MRZ)
    string name;
    // The issuing country of the ID
    string issuingCountry;
    // The nationality of the ID holder
    string nationality;
    // The gender of the ID holder
    string gender;
    // The birth date of the ID holder
    string birthDate;
    // The expiry date of the ID
    string expiryDate;
    // The document number of the ID
    string documentNumber;
    // The type of the document
    string documentType;
}

// ProofVerificationParams
// │
// ├── bytes32 version                        // Version identifier of the verifier
// │
// ├── ProofVerificationData proofVerificationData
// │   ├── bytes32 vkeyHash                   // Verification key hash
// │   ├── bytes proof                        // The actual ZK proof
// │   └── bytes32[] publicInputs             // Array of public inputs (7+ elements)
// │       │                                  // Use PublicInputsCast.asStruct() for structured access:
// │       ├── [0] certificate_registry_root  // Field - struct.certificateRegistryRoot
// │       ├── [1] circuit_registry_root      // Field - struct.circuitRegistryRoot
// │       ├── [2] current_date               // u64 - PublicInputsCast.getCurrentDate(struct)
// │       ├── [3] service_scope              // Field - struct.serviceScope
// │       ├── [4] service_subscope           // Field - struct.serviceSubscope
// │       ├── [5:5+N] param_commitments      // Field[N] - PublicInputsCast.getParamCommitment(array, index)
// │       ├── [5+N] nullifier_type           // u8 - PublicInputsCast.getNullifierType(array, paramCount)
// │       └── [6+N] scoped_nullifier         // Field - PublicInputsCast.getScopedNullifier(array, paramCount)
// │
// ├── bytes committedInputs              // Preimages of param_commitments
// │
// └── ServiceConfig serviceConfig
//     ├── uint256 validityPeriodInSeconds    // How long the proof is valid
//     ├── string domain                      // Service domain
//     ├── string scope                       // Service scope
//     └── bool devMode                       // Development mode flag
struct ProofVerificationParams {
  bytes32 version;
  ProofVerificationData proofVerificationData;
  bytes committedInputs;
  ServiceConfig serviceConfig;
}

struct ProofVerificationData {
  bytes32 vkeyHash;
  bytes proof;
  bytes32[] publicInputs;
}

struct ServiceConfig {
  uint256 validityPeriodInSeconds;
  string domain;
  string scope;
  bool devMode;
}

/**
 * @notice The public interface for the ZKPassport verifier contract
 */
interface IZKPassportVerifier {
  /**
   * @notice Verifies a proof from ZKPassport
   * @param params The proof verification parameters
   * @return isValid True if the proof is valid, false otherwise
   * @return uniqueIdentifier The unique identifier associated to the identity document that generated the proof
   * @return helper The ZKPassportHelper contract that can be used to verify the information or conditions that are checked by the proof
   */
  function verify(ProofVerificationParams calldata params) external returns (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper helper);
}

/**
 * @notice You can use to helper contract verifying the information or conditions that are checked by the proof
 */
interface IZKPassportHelper {
  /**
   * @notice Verifies that the proof was generated for the given domain and scope
   * @param publicInputs The public inputs of the proof
   * @param domain The domain to check against (must match exactly the domain you specified in the SDK)
   * @param scope The scope to check against (must match exactly the scope you specified in the request using the TypeScript SDK)
   * @return True if the proof was generated for the given domain and scope, false otherwise
   */
  function verifyScopes(bytes32[] calldata publicInputs, string calldata domain, string calldata scope) external pure returns (bool);

  // ===== Helper functions to get the information revealed by the proof =====

  // ===== Retrieve the disclosed data =====

  /**
   * @notice Gets the data disclosed by the proof
   * @param committedInputs The committed inputs
   * @param isIDCard Whether the proof is an ID card
   * @return disclosedData The data disclosed by the proof
   */
  function getDisclosedData(bytes calldata committedInputs, bool isIDCard) external pure returns (DisclosedData);

  // ===== Retrieve the bound data =====

  /**
   * @notice Gets the data bound to the proof
   * @param committedInputs The committed inputs
   * @return boundData The data bound to the proof
   */
  function getBoundData(bytes calldata committedInputs) external pure returns (BoundData);

  // ===== Age verification =====

    /**
   * @notice Checks if the age is above or equal to the given age
   * @param minAge The age must be above or equal to this age
   * @param committedInputs The committed inputs
   * @return True if the age is above or equal to the given age, false otherwise
   */
  function isAgeAboveOrEqual(uint8 minAge, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the age is above the given age
   * @param minAge The age must be above this age
   * @param committedInputs The committed inputs
   * @return True if the age is above the given age, false otherwise
   */
  function isAgeAbove(
    uint8 minAge,
    bytes calldata committedInputs
  ) external pure returns (bool);

  /**
   * @notice Checks if the age is in the given range
   * @param minAge The age must be greater than or equal to this age
   * @param maxAge The age must be less than or equal to this age
   * @param params The proof verification parameters
   * @param committedInputs The committed inputs
   * @return True if the age is in the given range, false otherwise
   */
  function isAgeBetween(uint8 minAge, uint8 maxAge, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the age is below or equal to the given age
   * @param maxAge The age must be below or equal to this age
   * @param committedInputs The committed inputs
   * @return True if the age is below or equal to the given age, false otherwise
   */
  function isAgeBelowOrEqual(uint8 maxAge, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the age is below the given age
   * @param maxAge The age must be below this age
   * @param committedInputs The committed inputs
   * @return True if the age is below the given age, false otherwise
   */
  function isAgeBelow(uint8 maxAge, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the age is equal to the given age
   * @param age The age must be equal to this age
   * @param committedInputs The committed inputs
   * @return True if the age is equal to the given age, false otherwise
   */
  function isAgeEqual(uint8 age, bytes calldata committedInputs) external pure returns (bool);

  // ===== Birthdate comparison =====

  /**
   * @notice Checks if the birthdate is after or equal to the given date
   * @param minDate The birthdate must be after or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is after or equal to the given date, false otherwise
   */
  function isBirthdateAfterOrEqual(uint256 minDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the birthdate is after the given date
   * @param minDate The birthdate must be after this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is after the given date, false otherwise
   */
  function isBirthdateAfter(uint256 minDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the birthdate is between the given dates
   * @param minDate The birthdate must be after or equal to this date
   * @param maxDate The birthdate must be before or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is between the given dates, false otherwise
   */
  function isBirthdateBetween(uint256 minDate, uint256 maxDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the birthdate is before or equal to the given date
   * @param maxDate The birthdate must be before or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is before or equal to the given date, false otherwise
   */
  function isBirthdateBeforeOrEqual(uint256 maxDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the birthdate is before the given date
   * @param maxDate The birthdate must be before this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is before the given date, false otherwise
   */
  function isBirthdateBefore(uint256 maxDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the birthdate is equal to the given date
   * @param date The birthdate must be equal to this date
   * @param committedInputs The committed inputs
   * @return True if the birthdate is equal to the given date, false otherwise
   */
  function isBirthdateEqual(uint256 date, bytes calldata committedInputs) external pure returns (bool);

  // ===== Expiry date comparison =====

  /**
   * @notice Checks if the expiry date is after or equal to the given date
   * @param minDate The expiry date must be after or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is after or equal to the given date, false otherwise
   */
  function isExpiryDateAfterOrEqual(uint256 minDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the expiry date is after the given date
   * @param minDate The expiry date must be after this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is after the given date, false otherwise
   */
  function isExpiryDateAfter(uint256 minDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the expiry date is between the given dates
   * @param minDate The expiry date must be after or equal to this date
   * @param maxDate The expiry date must be before or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is between the given dates, false otherwise
   */
  function isExpiryDateBetween(
    uint256 minDate,
    uint256 maxDate,
    bytes calldata committedInputs
  ) external pure returns (bool);

  /**
   * @notice Checks if the expiry date is before or equal to the given date
   * @param maxDate The expiry date must be before or equal to this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is before or equal to the given date, false otherwise
   */
  function isExpiryDateBeforeOrEqual(uint256 maxDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the expiry date is before the given date
   * @param maxDate The expiry date must be before this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is before the given date, false otherwise
   */
  function isExpiryDateBefore(uint256 maxDate, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the expiry date is equal to the given date
   * @param date The expiry date must be equal to this date
   * @param committedInputs The committed inputs
   * @return True if the expiry date is equal to the given date, false otherwise
   */
  function isExpiryDateEqual(uint256 date, bytes calldata committedInputs) external pure returns (bool);

  // ===== Country inclusion =====

  /**
   * @notice Checks if the nationality is in the list of countries
   * @param countryList The list of countries (needs to match exactly the list of countries in the proof)
   * @param committedInputs The committed inputs
   * @return True if the nationality is in the list of countries, false otherwise
   */
  function isNationalityIn(string[] memory countryList, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the issuing country is in the list of countries
   * @param countryList The list of countries (needs to match exactly the list of countries in the proof)
   * @param committedInputs The committed inputs
   * @return True if the issuing country is in the list of countries, false otherwise
   */
  function isIssuingCountryIn(string[] memory countryList, bytes calldata committedInputs) external pure returns (bool);

  // ===== Country exclusion =====

  /**
   * @notice Checks if the nationality is not in the list of countries
   * @param countryList The list of countries (needs to match exactly the list of countries in the proof)
   * Note: The list of countries must be sorted in alphabetical order
   * @param committedInputs The committed inputs
   * @return True if the nationality is not in the list of countries, false otherwise
   */
  function isNationalityOut(string[] memory countryList, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Checks if the issuing country is not in the list of countries
   * @param countryList The list of countries (needs to match exactly the list of countries in the proof)
   * Note: The list of countries must be sorted in alphabetical order
   * @param committedInputs The committed inputs
   * @return True if the issuing country is not in the list of countries, false otherwise
   */
  function isIssuingCountryOut(string[] memory countryList, bytes calldata committedInputs) external pure returns (bool);

  // ===== Sanction checks =====

    /**
   * @notice Checks if the sanctions root is valid against the expected sanction list(s)
   * Does not revert if the sanctions check fails but returns false instead.
   * @param currentTimestamp The current timestamp (preferably from the proof rather than the block timestamp).
   * This is used to check the validity of the sanctions root at that specific time.
   * @param isStrict Whether the sanctions check was strict or not
   * @param committedInputs The committed inputs
   * @return True if the sanctions root is valid against the expected sanction list(s), false otherwise
   */
  function isSanctionsRootValid(uint256 currentTimestamp, bool isStrict, bytes calldata committedInputs) external pure returns (bool);

  /**
   * @notice Enforces that the proof checks against the expected sanction list(s)
   * Reverts if the sanctions check fails
   * @param currentTimestamp The current timestamp (preferably from the proof rather than the block timestamp).
   * This is used to check the validity of the sanctions root at that specific time.
   * @param isStrict Whether the sanctions check was strict or not
   * @param committedInputs The committed inputs
   */
  function enforceSanctionsRoot(uint256 currentTimestamp, bool isStrict, bytes calldata committedInputs) external view;

  /**
   * @notice Checks if the proof is tied to a FaceMatch verification
   * @param faceMatchMode The FaceMatch mode expected to be used in the verification
   * @param os The operating system on which the proof should have been generated (Any (0), iOS (1), Android (2))
   * @param committedInputs The committed inputs
   * @return True if the proof is tied to a valid FaceMatch verification, false otherwise
   */
  function isFaceMatchVerified(FaceMatchMode faceMatchMode, OS os, bytes calldata committedInputs)
    external pure returns (bool);

  /**
   * @notice Gets the timestamp the proof was generated at
   * @param publicInputs The public inputs of the proof
   * @return The timestamp the proof was generated at
   */
  function getProofTimestamp(bytes32[] calldata publicInputs) external pure returns (uint256);
}

contract YourContract {
    IZKPassportVerifier public zkPassportVerifier;

    // Map users to their verified unique identifiers
    mapping(address => bytes32) public userIdentifiers;

    constructor(address _verifierAddress) {
        zkPassportVerifier = IZKPassportVerifier(_verifierAddress);
    }

    function register(ProofVerificationParams calldata params, bool isIDCard) public returns (bytes32) {
        // Verify the proof
        (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper helper) = zkPassportVerifier.verifyProof(params);
        require(verified, "Proof is invalid");

        // Check the proof was generated using your domain name (scope) and the subscope
        // you specified
        require(
          helper.verifyScopes(params.proofVerificationData.publicInputs, "your-domain.com", "my-scope"),
          "Invalid scope"
        );

        // Check if the user is at least 18 years old
        bool isAgeAboveOrEqual = helper.isAgeAboveOrEqual(
          18,
          params.committedInputs
        );

        // Get the disclosed data to retrieve the nationality
        DisclosedData memory disclosedData = helper.getDisclosedData(
          params.committedInputs,
          isIDCard
        );
        // Alpha 3 code of the nationality (e.g. FRA, USA, etc.)
        // Warning: as it is the raw MRZ bytes, Germany will be "D<<" and not "DEU"
        // Other countries follow the standard ISO 3166-1 alpha-3 code format.
        string memory nationality = disclosedData.nationality;

        // Use the getBoundData function to get the data bound to the proof
        BoundData memory boundData = helper.getBoundData(params.committedInputs);
        // Make sure the user's address is the one that is calling the contract
        require(boundData.senderAddress == msg.sender, "Not the expected sender");
        // Make sure the chain id is the same as the one you specified in the query builder
        require(boundData.chainId == block.chainid, "Invalid chain id");
        // You could also check the custom data if you bound any to the proof
        require(boundData.customData == "my-custom-data", "Invalid custom data");
        // If you didn't specify any custom data, make sure the string is empty
        // require(bytes(boundData.customData).length == 0, "Custom data should be empty");

        // Store the unique identifier
        userIdentifiers[msg.sender] = uniqueIdentifier;

        return uniqueIdentifier;
    }

    // Your contract functionality using the verification
    function restrictedFunction() public view {
        require(userIdentifiers[msg.sender] != bytes32(0), "Not verified");
        // Function logic for verified users
    }
}
```

### 5. Use the SDK to connect your frontend and your smart contract

Connect your frontend to the smart contract using the SDK:

```typescript
import { ZKPassport } from "@zkpassport/sdk";
import { createWalletClient, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { custom } from "viem/wallet";

async function verifyOnChain(proofResult, walletProvider, isIDCard) {
  const zkPassport = new ZKPassport("your-domain.com");

  // Get verification parameters
  const verifierParams = zkPassport.getSolidityVerifierParameters({
    proof: proofResult,
    // Use the same scope as the one you specified with the request function
    scope: "my-scope",
    // Enable dev mode if you want to use mock passports, otherwise keep it false
    devMode: false,
  });

  // Create wallet client
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: custom(walletProvider),
  });

  // Get the account
  const [account] = await walletClient.getAddresses();

  // Create a public client
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  // Call your contract with the verification parameters
  const hash = await walletClient.writeContract({
    address: YOUR_CONTRACT_ADDRESS,
    abi: YOUR_CONTRACT_ABI,
    functionName: "register",
    args: [verifierParams, isIDCard],
    account,
  });

  // Wait for the transaction
  await publicClient.waitForTransactionReceipt({ hash });

  console.log("Verification completed on-chain!");
}
```
