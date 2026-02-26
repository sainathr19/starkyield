import { BitcoinWalletBase } from "./BitcoinWalletBase";
import { BitcoinNetwork, CoinselectAddressTypes } from "@atomiqlabs/sdk";
import {  Address as AddressParser } from "@scure/btc-signer";
import { Transaction } from "@scure/btc-signer";
import { BTC_NETWORK } from "@scure/btc-signer/utils";

interface UnisatProvider {
    requestAccounts(): Promise<string[]>;
    getAccounts(): Promise<string[]>;
    getPublicKey(): Promise<string>;
    getBalance(): Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signPsbt(psbtHex: string, options?: any): Promise<string>;
    pushPsbt(psbtHex: string): Promise<string>;
    getNetwork(): Promise<string>;
}

declare global {
    interface Window {
        unisat?: UnisatProvider;
    }
}

function identifyAddressType(address: string, network: BTC_NETWORK): CoinselectAddressTypes {
    const decoded = AddressParser(network).decode(address);
    switch (decoded.type) {
        case "pkh": return "p2pkh";
        case "wpkh": return "p2wpkh";
        case "tr": return "p2tr";
        case "sh": return "p2sh-p2wpkh";
        default: return "p2wpkh"; // fallback
    }
}

export class UnisatBitcoinWallet extends BitcoinWalletBase {
    readonly address: string;
    readonly pubkey: string;
    readonly addressType: CoinselectAddressTypes;
    readonly bitcoinNetwork: BitcoinNetwork;
    private provider: UnisatProvider;

    private     constructor(
        address: string,
        pubkey: string,
        provider: UnisatProvider,
        bitcoinNetwork: BitcoinNetwork,
        rpcUrl: string
    ) {
        super("UniSat", "/icons/unisat.svg", bitcoinNetwork, rpcUrl);
        this.address = address;
        this.pubkey = pubkey;
        this.provider = provider;
        this.bitcoinNetwork = bitcoinNetwork;
        this.addressType = identifyAddressType(address, this.network);
        
        // Add SDK compatibility methods directly to the instance
        // (this as any).publicKey = pubkey;
        (this as any).getAccounts = () => this.toBitcoinWalletAccounts();
        console.log('UniSat wallet constructor - added publicKey:', pubkey);
        console.log('UniSat wallet constructor - added getAccounts method');
    }
    

    static async connect(bitcoinNetwork: BitcoinNetwork, rpcUrl: string): Promise<UnisatBitcoinWallet> {
        if (typeof window === 'undefined' || !window.unisat) {
            throw new Error("UniSat wallet not found");
        }

        const provider = window.unisat;

        try {
            const accounts = await provider.requestAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
            }

            const address = accounts[0];
            const pubkey = await provider.getPublicKey();
            
            // Check network
            const network = await provider.getNetwork();
            console.log("UniSat network:", network);

            console.log("UniSat wallet connected:", address);
            return new UnisatBitcoinWallet(address, pubkey, provider, bitcoinNetwork, rpcUrl);
        } catch (error) {
            console.error("Failed to connect UniSat wallet:", error);
            throw error;
        }
    }

    getReceiveAddress(): string {
        return this.address;
    }

    async getBalance(): Promise<{ confirmedBalance: bigint; unconfirmedBalance: bigint }> {
        try {
            const balance = await this.provider.getBalance();
            return {
                confirmedBalance: BigInt(balance.confirmed),
                unconfirmedBalance: BigInt(balance.unconfirmed)
            };
        } catch (error) {
            console.error("Failed to get balance from UniSat:", error);
            return super._getBalance(this.address);
        }
    }

    protected toBitcoinWalletAccounts(): {
        pubkey: string;
        address: string;
        addressType: CoinselectAddressTypes;
    }[] {
        return [{
            pubkey: this.pubkey,
            address: this.address,
            addressType: this.addressType
        }];
    }

    async sendTransaction(address: string, amount: bigint, feeRate?: number): Promise<string> {
        console.log(`UnisatBitcoinWallet: Sending ${amount} sats to ${address}`);
        
        const { psbt } = await super._getPsbt(
            this.toBitcoinWalletAccounts(),
            address,
            Number(amount),
            feeRate
        );

        if (!psbt) {
            throw new Error("Not enough balance!");
        }

        try {
            const psbtHex = Buffer.from(psbt.toPSBT(0)).toString("hex");
            
            // Sign the PSBT
            const signedPsbtHex = await this.provider.signPsbt(psbtHex, {
                autoFinalized: true
            });

            // Broadcast the transaction
            const txId = await this.provider.pushPsbt(signedPsbtHex);
            
            console.log("Transaction sent:", txId);
            return txId;
        } catch (error) {
            console.error("Failed to send transaction:", error);
            throw error;
        }
    }

    async signPsbt(psbt: Transaction, _signInputs: number[]): Promise<Transaction> {
        try {
            const psbtHex = Buffer.from(psbt.toPSBT(0)).toString("hex");
            
            const signedPsbtHex = await this.provider.signPsbt(psbtHex, {
                autoFinalized: false
            });

            return Transaction.fromPSBT(Buffer.from(signedPsbtHex, "hex"));
        } catch (error) {
            console.error("Failed to sign PSBT:", error);
            throw error;
        }
    }

    getFundedPsbtFee(inputPsbt: Transaction, feeRate?: number): Promise<number> {
        return Promise.resolve(0);
    }

    getSpendableBalance(psbt?: Transaction, feeRate?: number): Promise<{ balance: bigint; feeRate: number; totalFee: number; }> {
        return super._getSpendableBalance(this.toBitcoinWalletAccounts(), psbt, feeRate);
    }
}

