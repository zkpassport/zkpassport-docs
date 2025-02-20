---
sidebar_position: 1
---

# Installation

Getting started with ZKPassport SDK is straightforward. You can install it using npm or work with it locally for development purposes.

## NPM Installation

Install the SDK using npm:

```bash
npm install @zkpassport/sdk
```

## Local Development Setup

If you want to work with the SDK locally or contribute to its development, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/zkpassport/zkpassport-sdk.git
cd zkpassport-sdk
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Run Tests

To ensure everything is working correctly:

```bash
bun test
```

### 4. Development Tools

For development and testing, you can simulate websocket messages:

```bash
# Simulate mobile websocket messages
bun run scripts/simulate.ts mobile

# Simulate frontend websocket messages
bun run scripts/simulate.ts frontend
```
