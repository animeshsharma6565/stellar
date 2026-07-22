import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

export default {
  ...config,
  // package.json's "build" script runs this CLI itself. defineCloudflareConfig()
  // drops unknown keys, so buildCommand must be spliced onto its return value —
  // passing it inside defineCloudflareConfig({ buildCommand }) is silently ignored.
  // Without this override the default `npm run build` recurses into this same script.
  buildCommand: "npx next build",
};
