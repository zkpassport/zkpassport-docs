---
sidebar_position: 4
---

# Onchain Verification

ZKPassport allows you to verify passport and national ID proofs directly on EVM chains. As of today, our verifier is only deployed on Ethereum Sepolia. If you need a specific chain, please [reach out to us](mailto:company@zkpassport.id).

The following guide explains how to use ZKPassport proofs in your smart contracts.

## Overview

Onchain verification enables your smart contracts to:

- Verify user identity proofs without requiring centralized servers
- Create unique identifiers linked to real-world identity
- Apply age, nationality, or other ID-based restrictions to on-chain actions

## Verifier Contract

ZKPassport maintains a deployed [`ZKPassportVerifier`](https://sepolia.etherscan.io/address/0x8c6982d77f7a8f60ae3133ca9b2faa6f3e78c394#code) contract on Sepolia that handles all proof verification. Your contracts will interact with this verifier.

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
  // Specify the EVM chain where the proof will be verified, for now only `ethereum_sepolia` is supported
  evmChain: "ethereum_sepolia",
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
  address,
  // The function name to call on the verifier contract
  functionName,
  // The ABI of the verifier contract
  abi,
} = zkPassport.getSolidityVerifierDetails("ethereum_sepolia");
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
      result.document_type.disclose.result !== "passport"
    );
  }
);
```

### 4. Create Your Smart Contract

Create a contract that interacts with the verifier:

```solidity
pragma solidity ^0.8.21;

enum ProofType {
  DISCLOSE,
  AGE,
  BIRTHDATE,
  EXPIRY_DATE,
  NATIONALITY_INCLUSION,
  NATIONALITY_EXCLUSION,
  ISSUING_COUNTRY_INCLUSION,
  ISSUING_COUNTRY_EXCLUSION
}

struct ProofVerificationParams {
  bytes32 vkeyHash;
  bytes proof;
  bytes32[] publicInputs;
  bytes committedInputs;
  uint256[] committedInputCounts;
  uint256 validityPeriodInDays;
  string scope;
  string subscope;
  bool devMode;
}

interface IZKPassportVerifier {
  // Verify the proof
  function verifyProof(ProofVerificationParams calldata params) external returns (bool verified, bytes32 uniqueIdentifier);
  // Get the inputs for the age proof
  function getAgeProofInputs(bytes calldata committedInputs, uint256[] calldata committedInputCounts) external view returns (uint256 currentDate, uint8 minAge, uint8 maxAge);
  // Get the inputs for the disclose proof
  function getDiscloseProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts
  ) external pure returns (bytes memory discloseMask, bytes memory discloseBytes);
  // Get the disclosed data from the proof
  function getDisclosedData(
    bytes calldata discloseBytes,
    bool isIDCard
  ) external view returns (
    string memory name,
    string memory issuingCountry,
    string memory nationality,
    string memory gender,
    string memory birthDate,
    string memory expiryDate,
    string memory documentNumber,
    string memory documentType
  );
  // Get the inputs for the nationality/issuing country inclusion and exclusion proofs
  function getCountryProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts,
    ProofType proofType
  ) external pure returns (string[] memory countryList);
  // Get the inputs for the birthdate and expiry date proofs
  function getDateProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts,
    ProofType proofType
  ) external pure returns (uint256 currentDate, uint256 minDate, uint256 maxDate);
  // Verify the scope of the proof
  function verifyScopes(bytes32[] calldata publicInputs, string calldata domain, string calldata scope) external view returns (bool);
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
        (bool verified, bytes32 uniqueIdentifier) = zkPassportVerifier.verifyProof(params);
        require(verified, "Proof is invalid");

        // Check the proof was generated using your domain name (scope) and the subscope
        // you specified
        require(
          zkPassportVerifier.verifyScopes(params.publicInputs, "your-domain.com", "my-scope"),
          "Invalid scope"
        );

        // Get the age condition checked in the proof
        (uint256 currentDate, uint8 minAge, uint8 maxAge) = zkPassportVerifier.getAgeProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Make sure the date used for the proof makes sense
        require(block.timestamp >= currentDate, "Date used in proof is in the future");
        // This is the condition for checking the age is 18 or above
        // Max age is set to 0 and therefore ignored in the proof, so it's equivalent to no upper limit
        // Min age is set to 18, so the user needs to be at least 18 years old
        require(minAge == 18 && maxAge == 0, "User needs to be above 18");

        // Get the disclosed bytes of data from the proof
        (, bytes memory disclosedBytes) = zkPassportVerifier.getDiscloseProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Get the nationality from the disclosed data and ignore the rest
        // Passing the disclosed bytes returned by the previous function
        // this function will format it for you so you can use the data you need
        (, , string memory nationality, , , , , ) = zkPassportVerifier.getDisclosedData(
          disclosedBytes,
          isIDCard
        );


        // Get the raw data bound to the proof
        // This is the data you bound to the proof using the bind method in the query builder
        bytes memory data = zkPassportVerifier.getBindProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Use the getBoundData function to get the formatted data
        // which includes the user's address and any custom data
        (address userAddress, string memory customData) = zkPassportVerifier.getBoundData(data);
        // Make sure the user's address is the one that is calling the contract
        require(userAddress == msg.sender, "Not the expected sender");
        // You could also check the custom data if you bound any to the proof
        // require(customData == "my-custom-data", "Invalid custom data");

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
import { sepolia } from "viem/chains";
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
    chain: sepolia,
    transport: custom(walletProvider),
  });

  // Get the account
  const [account] = await walletClient.getAddresses();

  // Create a public client
  const publicClient = createPublicClient({
    chain: sepolia,
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
