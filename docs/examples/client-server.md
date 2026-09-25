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

To verify proofs server-side, the server needs two things from the client, both provided on the `onSuccess` payload:

- **`proofs`** — the raw proofs.
- **`queryResult`** — the result object (`result` on the `onSuccess` payload).

The server also needs the original query: recreate it there with `createQuery()` instead of taking it from the browser.

## Client-Side Implementation

<Tabs groupId="framework">
<TabItem value="react" label="React" default>

```tsx
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";
import { useState } from "react";

function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  return (
    <div className="registration-form">
      <h2>Create an Account</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

      <VerifyWithZKPassport
        name="YourApp"
        logo="https://yourapp.com/logo.png"
        purpose="Account verification for registration"
        scope="registration"
        // In this example we verify the user is 18+ and disclose their nationality
        query={(queryBuilder) => queryBuilder.gte("age", 18).disclose("nationality").done()}
        onRequestReceived={() => setStatus("request_received")}
        onGeneratingProof={() => setStatus("generating_proof")}
        onSuccess={async ({ proofs, result: queryResult }) => {
          try {
            setStatus("sending_to_server");
            const response = await fetch("https://yourapi.com/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password,
                verification: { proofs, queryResult },
              }),
            });
            const data = await response.json();
            if (data.success) {
              setStatus("success");
            } else {
              setError(data.error || "Registration failed");
            }
            // Returning false shows the button's error state
            return data.success;
          } catch (err) {
            setError("Error communicating with server");
            return false;
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
import { mountVerifyButton } from "@zkpassport/ui/button";

mountVerifyButton(document.getElementById("zkpassport"), {
  name: "YourApp",
  logo: "https://yourapp.com/logo.png",
  purpose: "Account verification for registration",
  scope: "registration",
  query: (queryBuilder) => queryBuilder.gte("age", 18).disclose("nationality").done(),
  onSuccess: async ({ proofs, result: queryResult }) => {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const response = await fetch("https://yourapi.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
        verification: { proofs, queryResult },
      }),
    });
    const data = await response.json();
    console.log(data.success ? "Registered" : data.error);
    return data.success;
  },
});
```

</TabItem>
</Tabs>

## Server-Side Implementation

On the server, recreate the original query and pass it to `verify()` (as `originalQuery`) along with the `proofs`, the `queryResult`, and the scope of the request.

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

    // Initialize the ZKPassport SDK on the server.
    // This must be the same domain as the client-side implementation, and you
    // cannot skip it as it isn't auto-detected outside the browser.
    const zkPassport = new ZKPassport("your-domain.com");

    // Recreate the same query as the client instead of accepting it from the request
    const { query } = zkPassport.createQuery().gte("age", 18).disclose("nationality").done();

    // Verify the proofs
    const { verified, queryResultErrors, uniqueIdentifier } = await zkPassport.verify({
      proofs: verification.proofs,
      originalQuery: query,
      queryResult: verification.queryResult,
      // The same scope as the request
      scope: "registration",
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
