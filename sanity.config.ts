import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { projectId, dataset, apiVersion } from "./src/sanity/env";

// Embedded at /studio. Won't actually connect to anything until projectId
// and dataset are set to a real Sanity project (see src/sanity/env.ts) —
// but the Studio UI itself builds and runs fine with placeholders.
export default defineConfig({
  name: "default",
  title: "The Order of Things",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
