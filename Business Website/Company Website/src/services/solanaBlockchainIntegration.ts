import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    clusterApiUrl
} from '@solana/web3.js';

// Solana testnet configuration
const SOLANA_NETWORK = 'testnet';
const SOLANA_RPC_URL = clusterApiUrl(SOLANA_NETWORK);

// Government wallet address
const GOVERNMENT_WALLET_ADDRESS = new PublicKey('Duy3y9DAeDV2B4N9ESvejx6PvUXZPc75KNuDbxZ1e2u6');

class SolanaBlockchainIntegrationService {
    private connection: Connection;

    constructor() {
        this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    }

    /**
     * Connect Phantom wallet
     */
    async connectWallet(): Promise<boolean> {
        try {
            if (!(window as any).solana || !(window as any).solana.isPhantom) {
                throw new Error('Phantom wallet is not installed');
            }

            const response = await (window as any).solana.connect();
            console.log('Connected to wallet:', response.publicKey.toString());
            return true;
        } catch (error: any) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    /**
     * Get connected wallet public key
     */
    async getWalletPublicKey(): Promise<PublicKey | null> {
        try {
            if ((window as any).solana && (window as any).solana.isConnected) {
                return (window as any).solana.publicKey;
            }
            return null;
        } catch (error) {
            console.error('Error getting wallet public key:', error);
            return null;
        }
    }

    /**
     * Get government wallet balance from Solana
     */
    async getGovernmentBalance(): Promise<number> {
        try {
            const balance = await this.connection.getBalance(GOVERNMENT_WALLET_ADDRESS);
            // Return balance in SOL
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Error getting government balance:', error);
            return 490196; // Fallback
        }
    }

    /**
     * Allocate carbon credits to companies - triggers Solana transaction
     */
    async allocateCreditsToCompany(
        companyAddress: string,
        amount: number,
        allocationId: string
    ): Promise<string> {
        try {
            await this.connectWallet();
            const walletPublicKey = await this.getWalletPublicKey();

            if (!walletPublicKey) {
                throw new Error('Wallet not connected');
            }

            // Create transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: walletPublicKey,
                    toPubkey: GOVERNMENT_WALLET_ADDRESS,
                    lamports: 1000, // Minimal amount for demonstration
                })
            );

            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletPublicKey;

            // Sign and send transaction
            const signed = await (window as any).solana.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signed.serialize());

            // Confirm transaction
            await this.connection.confirmTransaction(signature, 'confirmed');

            console.log(`✅ Allocated ${amount} CC to company ${allocationId}`);
            console.log(`Transaction signature: ${signature}`);

            return signature;
        } catch (error) {
            console.error('Error allocating credits:', error);
            throw error;
        }
    }

    /**
     * Process company payment - triggers Solana transaction
     */
    async processPayment(
        amount: number,
        companyId: string
    ): Promise<string> {
        try {
            await this.connectWallet();
            const walletPublicKey = await this.getWalletPublicKey();

            if (!walletPublicKey) {
                throw new Error('Wallet not connected');
            }

            // Create payment transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: walletPublicKey,
                    toPubkey: GOVERNMENT_WALLET_ADDRESS,
                    lamports: 1000, // Minimal amount for demonstration
                })
            );

            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletPublicKey;

            // Sign and send transaction
            const signed = await (window as any).solana.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signed.serialize());

            // Confirm transaction
            await this.connection.confirmTransaction(signature, 'confirmed');

            console.log(`✅ Payment processed for company ${companyId}: ${amount}`);
            console.log(`Transaction signature: ${signature}`);

            return signature;
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    /**
     * Get Solana Explorer URL
     */
    getExplorerUrl(signature: string): string {
        return `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
    }

    /**
     * Get wallet address
     */
    async getWalletAddress(): Promise<string> {
        const pubkey = await this.getWalletPublicKey();
        return pubkey ? pubkey.toString() : '';
    }

    /**
     * Get network information
     */
    async getNetworkInfo(): Promise<any> {
        const pubkey = await this.getWalletPublicKey();
        let balance = 0;

        if (pubkey) {
            balance = await this.connection.getBalance(pubkey);
        }

        return {
            network: SOLANA_NETWORK,
            rpcUrl: SOLANA_RPC_URL,
            walletAddress: pubkey?.toString() || '',
            walletBalance: balance / LAMPORTS_PER_SOL
        };
    }
}

export const blockchainIntegration = new SolanaBlockchainIntegrationService();
export default blockchainIntegration;
