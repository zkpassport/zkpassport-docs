---
sidebar_position: 7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Client-Server Implementation

This example demonstrates a pattern that uses ZKPassport on the client-side to gather proofs from the user and sends them to a server endpoint where they are verified before registering a user.

:::info
Implementing this pattern using serverless functions (e.g. Next.js API Routes) may not work at this moment, so you must have a dedicated server to verify the proofs. We are working on a solution to make this pattern work with serverless functions.
:::

## What you send to the server

To re-verify proofs server-side, the server needs three things, all available on the client:

- **`proofs`** — the raw proofs, provided on the `onResult` payload.
- **`queryResult`** — the result object (`result` on the `onResult` payload).
- **`query`** — the original query object. It's returned by `done()` as `query`, so capture it inside your `query` callback.

## Client-Side Implementation

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { useRef, useState } from "react";

function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Capture the original query so we can send it to the server for verification
  const queryRef = useRef(null);

  return (
    <div className="registration-form">
      <h2>Create an Account</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

      <ZKPassportQRCode
        name="YourApp"
        logo="https://yourapp.com/logo.png"
        purpose="Account verification for registration"
        scope="registration"
        query={(queryBuilder) => {
          // In this example we verify the user is 18+ and disclose their nationality
          const built = queryBuilder.gte("age", 18).disclose("nationality").done();
          // Keep the query object — the server needs it as `originalQuery`
          queryRef.current = built.query;
          return built;
        }}
        onRequestReceived={() => setStatus("request_received")}
        onGeneratingProof={() => setStatus("generating_proof")}
        onResult={async ({ verified, result: queryResult, proofs }) => {
          if (!verified) {
            setError("Verification failed on the client side");
            return;
          }
          try {
            setStatus("sending_to_server");
            const response = await fetch("https://yourapi.com/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password,
                verification: {
                  proofs,
                  query: queryRef.current,
                  queryResult,
                },
              }),
            });
            const data = await response.json();
            if (data.success) {
              setStatus("success");
            } else {
              setError(data.error || "Registration failed");
            }
          } catch (err) {
            setError("Error communicating with server");
          }
        }}
        onReject={() => setError("Verification request was rejected")}
        onError={(err) => setError(`Error during verification: ${err}`)}
      />

      {status !== "idle" && <p>Status: {status.replace(/_/g, " ")}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default RegistrationForm;
```

</TabItem>
<TabItem value="vanilla" label="Vanilla JS">

```ts
import { mount } from "@zkpassport/ui";

// Capture the original query so we can send it to the server for verification
let originalQuery = null;

mount(document.getElementById("zkpassport"), {
  name: "YourApp",
  logo: "https://yourapp.com/logo.png",
  purpose: "Account verification for registration",
  scope: "registration",
  query: (queryBuilder) => {
    const built = queryBuilder.gte("age", 18).disclose("nationality").done();
    originalQuery = built.query; // the server needs this as `originalQuery`
    return built;
  },
  onResult: async ({ verified, result: queryResult, proofs }) => {
    if (!verified) {
      console.error("Verification failed on the client side");
      return;
    }
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const response = await fetch("https://yourapi.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
        verification: { proofs, query: originalQuery, queryResult },
      }),
    });
    const data = await response.json();
    console.log(data.success ? "Registered" : data.error);
  },
});
```

</TabItem>
</Tabs>

## Server-Side Implementation

On the server, pass the `proofs`, the original `query` (as `originalQuery`), and the `queryResult` to `verify()`.

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

    if (!verification || !verification.proofs || !verification.query || !verification.queryResult) {
      return res.status(400).json({
        success: false,
        error: "Missing ZKPassport verification data",
      });
    }

    // Initialize the ZKPassport SDK on the server.
    // This must be the same domain as the client-side implementation, and you
    // cannot skip it as it isn't auto-detected outside the browser.
    const zkPassport = new ZKPassport("your-domain.com");

    // Verify the proofs
    const { verified, queryResultErrors, uniqueIdentifier } = await zkPassport.verify({
      proofs: verification.proofs,
      // The original query object returned by done() on the client
      originalQuery: verification.query,
      queryResult: verification.queryResult,
    });

    if (!verified) {
      console.error("Verification failed:", queryResultErrors);
      return res.status(400).json({ success: false, error: "Identity verification failed" });
    }

    if (!uniqueIdentifier) {
      return res.status(400).json({ success: false, error: "Could not extract the unique identifier" });
    }

    // Extract any disclosed information
    const nationality = verification.queryResult.nationality?.disclose?.result;

    // Create a user in your database with the uniqueIdentifier
    const user = await createUser({
      email,
      password, // Remember to hash this password!
      id: uniqueIdentifier,
      nationality: nationality || null,
    });

    return res.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Server error during registration" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Security Considerations

1. **Never trust client-side verification alone** — Always verify proofs on your server as the client-side verification can be tampered with by the user.
2. **Use HTTPS** — All communication between client and server should be encrypted.
3. **Match the domain and scope** — The server's `ZKPassport` instance must use the same domain you verified against, and if you set a custom `scope` on the request, pass the same `scope` to `verify()`.
