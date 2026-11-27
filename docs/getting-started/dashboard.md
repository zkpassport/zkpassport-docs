---
sidebar_position: 4
---

# Dashboard Screens

This page walks through each screen of the [ZKPassport Dashboard](https://dashboard.zkpassport.id) and what its options do. For how to use a policy from your code, see [Dashboard & Policies](./policies).

Every screen shares the same header:

- **Overview**, **Policies**, **Verifications** and **Verification Links** switch between the four screens.
- **Project switcher** (your registered domain, such as `example.com`): picks which project you are looking at. Each project belongs to one domain.
- **Account menu** (your initial): your signed-in account.

The footer links to this **Documentation** and to **Contact support**.

## Overview

A summary of the verification requests made to your project.

| Option | What it does |
| --- | --- |
| **All time**, **30 days**, **7 days**, **24h** | The time range the screen covers |
| **Refresh** | Reloads the figures |
| **Daily requests** | A chart of how many requests were made each day in the range |
| **Requests** | The total number of requests in the range |
| **Pass Rate** | The share of requests that passed, with the count of **Successful** and **Failed** ones |

## Policies

A policy is what you ask users to prove about themselves, such as being over 18 or holding a valid passport. A project can have several policies when your checks need to differ, such as a different age limit per country.

The list shows each policy's **Policy ID**, **Purpose**, **Requests**, **Pass Rate**, **On-chain credentials** and when it was last **Updated**.

| Option | What it does |
| --- | --- |
| **New Policy** | Opens the policy editor, described below |
| **Import from chain** | Creates a policy from an on-chain one, described below |

### New Policy

The left side of the editor defines the policy. The right side lets you try it and shows the code to use it.

| Option | What it does |
| --- | --- |
| **Policy ID** | The id you use in your integration code, such as `policy-1`. The pencil icon changes it. Allowed characters are `a-z`, `0-9` and `-`. It can't be changed once the policy is created |
| **Purpose** (required) | Shown to users in the ZKPassport app when they approve the request, e.g. "Age verification for content access" |

**Checks** are the conditions a user must meet to pass. Tick any of them:

| Check | What it does | Settings |
| --- | --- | --- |
| **Minimum Age** | The user must be at least this old | The age, 18 by default |
| **Nationality** | Limits which nationalities are accepted | **Only these** or **All except**, then **Select countries** |
| **Issuing Country** | Limits which countries can have issued the document | **Only these** or **All except**, then **Select countries** |
| **Sanctions Check** | The user must not be on a sanctions list. See [`sanctions`](../api#sanctions) | None |
| **FaceMatch** | The user's face must match their ID photo, with a strict liveness check. See [Private FaceMatch](../examples/facematch) | None |

**Reveal** lists the fields the user discloses to you when they pass. Tick only the ones you need: **Full Name**, **First Name**, **Last Name**, **Date of Birth**, **Gender**, **Nationality**, **Issuing Country**, **Document Type**, **Document Number** and **Expiry Date**.

| Option | What it does |
| --- | --- |
| **Proof storage: Store proofs** | Keeps each proof for as long as the policy exists |
| **Button: Filled** or **Outline** | The style of the verify button the policy shows |
| **Create policy** | Saves the policy. Its query is then fixed (see [What a policy locks](./policies#what-a-policy-locks)) |

The tabs on the right:

- **Try it** opens the same ZKPassport window your users see. Scan it with the ZKPassport app to run the checks against your own ID. Test runs are never recorded. At least one check must be ticked.
- **Server verification** shows the frontend code (**React** or **Vanilla JS**) and the server code (**Express** or **Node.js**) for this policy, with the checks you ticked already filled in. Verify the proofs on your server, as the [Quick Start](./quick-start#verify-the-proofs-on-your-server) explains.
- **On-chain verification** shows the frontend code and a Solidity contract that verifies this policy's proofs on chain. See [On-chain verification](./onchain).

The **Server verification** and **On-chain verification** tabs also have an **Each person can verify only once** switch. When it is on, repeat attempts with the same ID document are rejected. The copy icon copies the code shown.

### Import from chain

Paste the **Credential ID** of an on-chain policy, or use **Connect wallet**. Importing creates a policy with the same checks and links the credential to it. Nothing changes on chain.

## Verifications

One verification is one attempt by a user to pass your checks. One user can make several attempts.

| Option | What it does |
| --- | --- |
| **Search by reference** | Finds verifications by their reference (see [Verification Links](#verification-links)) |
| **Status** | Filters by status: **Success**, **Failed** or **In progress** |
| **Policy** | Filters by policy |
| **From** and **To** dates | Limits the list to a date range |
| **Refresh** | Reloads the list |
| **Date**, **Status**, **Reference** | Sort the list by that column |
| **Previous**, **Next** | Page through the list |

Click a row to open **Request Detail**, which shows the verification's status, **Request ID** (with a copy button), **Policy ID**, **Domain** and when it was **Created**.

## Verification Links

A verification link asks one person to verify themselves against a policy, with no integration needed. Send it to them. When they open it, they scan the QR code with the ZKPassport app.

The list shows each link's **Date**, **Policy**, **Attempts**, **Status** and **Reference**. Sort by date, status or reference, and use **Refresh** to reload it. Once you have links, you can also search them by reference and filter them by status.

**New Link** opens **New verification link**:

| Option | What it does |
| --- | --- |
| **Policy** | The policy the person verifies against |
| **Reference** (optional) | Free text such as a booking number, name or case id. It is shown to the person verifying and sealed into the proof, so the result is tied to this link |
| **Create link** | Creates the link to send |
