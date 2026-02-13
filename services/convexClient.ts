
import { ConvexReactClient } from "convex/react";

// Assuming CONVEX_URL is provided in process.env or fallback to a placeholder
// In this specific environment, we rely on the injected env variables.
const convexUrl = (process.env as any).CONVEX_URL || "https://placeholder-url.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);
