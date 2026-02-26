import { Router, Request, Response } from "express";
import { getPrivyClient } from "../lib/privyClient";

const router = Router();

router.post("/starknet", async (req: Request, res: Response) => {
  try {
    const privy = getPrivyClient();
    const wallet = await privy.wallets().create({ chain_type: "starknet" });
    const result = {
      id: wallet.id,
      address: wallet.address,
      publicKey: (wallet as { public_key?: string; publicKey?: string }).public_key ??
        (wallet as { public_key?: string; publicKey?: string }).publicKey,
    };
    return res.status(200).json({ wallet: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create wallet";
    console.error("Error creating wallet:", msg);
    return res.status(500).json({ error: msg });
  }
});

router.post("/sign", async (req: Request, res: Response) => {
  try {
    const { walletId, hash } = (req.body || {}) as { walletId?: string; hash?: string };
    if (!walletId || !hash) {
      return res.status(400).json({ error: "walletId and hash are required" });
    }
    const privy = getPrivyClient();
    const result = await privy.wallets().rawSign(walletId, { params: { hash } });
    return res.status(200).json({ signature: (result as { signature: string }).signature });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to sign";
    console.error("Error signing:", msg);
    return res.status(500).json({ error: msg });
  }
});

export default router;
