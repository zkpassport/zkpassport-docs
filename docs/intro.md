---
sidebar_position: 1
---

# Introduction

Privacy-preserving identity verification using passports and ID cards.

## Overview

ZKPassport enables privacy-preserving identity verification using passports and ID cards. It allows you to request and verify specific identity attributes — such as age, nationality, or personhood — without exposing any unnecessary personal information. Proofs are generated on the user's phone and reveal only what you asked for, and nothing else.

### Key Features

- Privacy-first identity verification with zero-knowledge proofs
- Selective disclosure of identity attributes
- Support for passports, national IDs, and residence permits
- A drop-in QR verification card ([`@zkpassport/ui`](./getting-started/quick-start)) for React and vanilla JS
- Optional no-code configuration through the [ZKPassport Dashboard](https://dashboard.zkpassport.id)

### Sample Use Cases

- Age verification
- Nationality verification
- Identity attribute disclosure
- Proof of personhood and KYC

## Two ways to integrate

There are two ways to define what you ask users to prove. Both produce the same verification flow and the same results — they differ only in **where the request is defined**.

Both give you full control over what you verify — they differ in where the request lives.

| | **Self-served** | **Dashboard** |
| --- | --- | --- |
| **Setup** | None — install the SDK and go | Register your domain at [dashboard.zkpassport.id](https://dashboard.zkpassport.id) |
| **Query definition** | Built in code: `.gte("age", 18).disclose("nationality")…` | Defined in the dashboard, referenced by id: `.policy("pol_xyz")` |
| **Branding** (name & logo) | Passed to `request()` in code | Managed in the dashboard |
| **Changing the request** | Edit and redeploy your code | Edit the policy in the dashboard — no redeploy |
| **Proof storage** | You handle it yourself | Auditable proof storage in the dashboard |
| **Best for** | Keeping everything in code; queries that vary at runtime | Centralized config, auditable records, reuse across apps |

**Pick self-served** if you want to get started immediately, keep everything in code, or build queries dynamically. Start with [Basic Usage](./getting-started/basic-usage).

**Pick the dashboard** if you'd rather manage branding and the request in one place, get auditable proof storage, and reuse it across apps without redeploying. See [Dashboard & Policies](./getting-started/policies).

You don't have to choose up front — the same component and SDK support both, so you can start self-served and adopt policies later.

Check out the [Quick Start Guide](./getting-started/quick-start) to begin integrating ZKPassport into your application.
