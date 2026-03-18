import { 
  Client, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountId
} from "@hashgraph/sdk";
import { HederaTransaction } from "../types";

class HederaService {
  private client: Client | null = null;
  private accountId: string | null = null;

  constructor() {
    const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

    if (accountIdStr && privateKeyStr) {
      try {
        this.accountId = accountIdStr;
        const privateKey = PrivateKey.fromString(privateKeyStr);
        this.client = Client.forTestnet();
        this.client.setOperator(AccountId.fromString(accountIdStr), privateKey);
      } catch (error) {
        console.error("Failed to initialize Hedera client:", error);
      }
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public async createNetworkTopic(): Promise<string | null> {
    if (!this.client) return "simulated-topic-id-" + Math.random().toString(36).substr(2, 9);

    try {
      const transaction = new TopicCreateTransaction();
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      return receipt.topicId?.toString() || null;
    } catch (error) {
      console.error("Error creating topic:", error);
      return null;
    }
  }

  public async logEvent(topicId: string, event: Omit<HederaTransaction, 'id' | 'timestamp'>): Promise<string | null> {
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    });

    if (!this.client) {
      console.log("[Simulated Hedera Log]:", message);
      return "simulated-tx-" + Math.random().toString(36).substr(2, 9);
    }

    try {
      const transaction = new TopicMessageSubmitTransaction({
        topicId,
        message
      });
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      return response.transactionId.toString();
    } catch (error) {
      console.error("Error logging to Hedera:", error);
      return null;
    }
  }
}

export const hederaService = new HederaService();
