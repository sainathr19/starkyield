import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { authMiddleware } from "./middleware/auth";
import walletRoutes from "./routes/wallet";
import paymasterRoutes from "./routes/paymaster";

// Load .env from api root (works for both tsx src/ and node dist/)
const envPaths = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NETWORK = process.env.STARKNET_NETWORK || "mainnet";

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.json({
    status: "OneSat V2 API",
    version: "1.0.0",
    network: NETWORK,
    endpoints: {
      health: "GET /health",
      walletCreate: "POST /api/wallet/starknet",
      walletSign: "POST /api/wallet/sign",
      paymaster: "ALL /api/paymaster/*",
    },
  });
});

app.get("/health", (_req, res) => {
  res.send("Online");
});

app.use("/api/wallet", authMiddleware, walletRoutes);
app.use("/api/paymaster", paymasterRoutes);

app.listen(PORT, () => {
  console.log(`OneSat V2 API v1.0.0`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
