import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  sidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/quick-start",
        "getting-started/basic-usage",
        "getting-started/dev-mode",
        "getting-started/onchain",
      ],
    },
    {
      type: "category",
      label: "Examples",
      link: {
        type: "doc",
        id: "examples/index",
      },
      items: [
        "examples/age-verification",
        "examples/nationality",
        "examples/residency",
        "examples/personhood",
        "examples/kyc",
        {
          type: "doc",
          label: "Client-Server",
          id: "examples/client-server",
        },
      ],
    },
    "api",
    {
      type: "doc",
      label: "FAQ",
      id: "faq",
    },
    {
      type: "doc",
      label: "Changelog",
      id: "changelog",
    },
  ],
};

export default sidebars;
