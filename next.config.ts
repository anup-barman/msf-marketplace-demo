import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dataset files are read from disk at runtime by the API route handlers.
  outputFileTracingIncludes: {
    "/api/**": ["./data/**"],
  },
  // Python ML tooling lives alongside the app; keep it out of the server bundle traces.
  outputFileTracingExcludes: {
    "/*": ["**/__pycache__/**", "new_model/**", "*.py", "risk_training_100000.csv"],
  },
};

export default nextConfig;
