---
sidebar_position: 7
---

# Client-Server Implementation

This example demonstrates an implementation pattern that uses the ZKPassport SDK on the client-side to gather proofs from the user and sends them to a server endpoint where they are verified before registering a user.

:::info
Implementing this pattern using serverless functions (e.g. Next.js API Routes) may not work at this moment, so you must have a dedicated server to verify the proofs. We are working on a solution to make this pattern work with serverless functions.
:::

## Client-Side Implementation

```tsx
import { ZKPassport } from "@zkpassport/sdk";
import { useState } from "react";
import QRCode from "react-qr-code"; // For QR code generation

function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("idle");
  const [error, setError] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [requestId, setRequestId] = useState("");
  let zkPassport: ZKPassport | null = null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerificationStatus("initiating");

    try {
      // Initialize the ZKPassport SDK
      if (!zkPassport) {
        zkPassport = new ZKPassport();
      }

      // Create a verification request
      const query = await zkPassport.request({
        name: "YourApp",
        logo: "https://yourapp.com/logo.png",
        purpose: "Account verification for registration",
      });

      // Build your verification query - in this example we verify the user is 18+ and disclose nationality
      const {
        url,
        requestId,
        onRequestReceived,
        onGeneratingProof,
        onProofGenerated,
        onResult,
        onReject,
        onError,
      } = query.gte("age", 18).disclose("nationality").done();

      // Save the URL and requestId to display and for potential cancellation
      setVerificationUrl(url);
      setRequestId(requestId);

      // Update status to show we're waiting for the user to scan the QR code
      setVerificationStatus("awaiting_scan");

      // Register event handlers
      onRequestReceived(() => {
        setVerificationStatus("request_received");
      });

      onGeneratingProof(() => {
        setVerificationStatus("generating_proof");
      });

      // Store the proofs and query result to send to the server
      const proofs = [];

      onProofGenerated((proof) => {
        proofs.push(proof);
      });

      onResult(async ({ verified, result: queryResult }) => {
        setVerificationStatus("proof_generated");

        if (!verified) {
          setError("Verification failed on client-side");
          setVerificationStatus("failed");
          return;
        }

        try {
          // Send the proofs and query result to your server for verification
          setVerificationStatus("sending_to_server");

          const response = await fetch("https://yourapi.com/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              verification: {
                proofs,
                queryResult,
              },
            }),
          });

          const data = await response.json();

          if (data.success) {
            setVerificationStatus("success");
            // Here you can redirect to the user's profile or home page
          } else {
            setError(data.error || "Registration failed");
            setVerificationStatus("failed");
          }
        } catch (err) {
          setError("Error communicating with server");
          setVerificationStatus("failed");
        }
      });

      onReject(() => {
        setError("Verification request was rejected");
        setVerificationStatus("rejected");
      });

      onError((error) => {
        setError(`Error during verification: ${error}`);
        setVerificationStatus("error");
      });
    } catch (err) {
      setError(`Failed to initialize verification: ${err.message}`);
      setVerificationStatus("error");
    }
  };

  // Function to cancel a verification request
  const cancelVerification = () => {
    if (requestId) {
      zkPassport.cancelRequest(requestId);
      setVerificationStatus("idle");
      setVerificationUrl("");
      setRequestId("");
    }
  };

  return (
    <div className="registration-form">
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {verificationStatus === "idle" ? (
          <button type="submit">Verify with ZKPassport</button>
        ) : (
          <div className="verification-container">
            <div className="verification-status">
              <p>Status: {verificationStatus.replace(/_/g, " ")}</p>
            </div>

            {verificationUrl && verificationStatus === "awaiting_scan" && (
              <div className="qr-code-container">
                <h3>Scan this QR code with the ZKPassport app</h3>
                <QRCode value={verificationUrl} size={256} />

                <div className="verification-options">
                  <p>
                    <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                      Open in ZKPassport app
                    </a>
                  </p>
                  <button type="button" onClick={cancelVerification} className="cancel-button">
                    Cancel Verification
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setVerificationStatus("idle");
                    setVerificationUrl("");
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default RegistrationForm;
```

## Server-Side Implementation

```javascript
// server.js (Node.js with Express)
const express = require("express");
const { ZKPassport } = require("@zkpassport/sdk");
const bodyParser = require("body-parser");
const { createUser } = require("./db"); // Your database logic

const app = express();
app.use(bodyParser.json());

app.post("/register", async (req, res) => {
  try {
    const { email, password, verification } = req.body;

    if (!verification || !verification.proofs || !verification.queryResult) {
      return res.status(400).json({
        success: false,
        error: "Missing ZKPassport verification data",
      });
    }

    // Initialize the ZKPassport SDK on the server
    // Note: This should be the same domain as the client-side implementation
    // and you cannot skip it unlike in the browser where it's automatically detected
    const zkPassport = new ZKPassport("your-domain.com");

    // Verify the proofs
    const { verified, queryResultErrors, uniqueIdentifier } = await zkPassport.verify({
      proofs: verification.proofs,
      queryResult: verification.queryResult,
    });

    if (!verified) {
      console.error("Verification failed:", queryResultErrors);
      return res.status(400).json({
        success: false,
        error: "Identity verification failed",
      });
    }

    if (!uniqueIdentifier) {
      return res.status(400).json({
        success: false,
        error: "Could not extract the unique identifier",
      });
    }

    // Extract any disclosed information
    const nationality = verification.queryResult.nationality?.disclose?.result;

    // Create a user in your database with the uniqueIdentifier
    const user = await createUser({
      email,
      password, // Remember to hash this password!
      id: uniqueIdentifier,
      nationality: nationality || null,
      // Add other registration fields as needed
    });

    return res.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Security Considerations

1. **Never trust client-side verification alone** - Always verify proofs on your server as the client-side verification can be tampered with by the user.
2. **Use HTTPS** - All communication between client and server should be encrypted.
