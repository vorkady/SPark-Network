# DGX Spark Cluster

A high-performance monitoring and management dashboard for NVIDIA DGX Spark nodes, leveraging **Hedera Hashgraph** for decentralized consensus, auditing, and real-time event logging.

![DGX Spark Cluster Dashboard](https://picsum.photos/seed/dgx-spark/1200/600)

## Features

- **Real-Time Telemetry**: Monitor CPU load, GPU utilization, memory usage, and thermal metrics across your cluster.
- **Hedera HCS Integration**: Every node registration and critical status change is logged to the Hedera Consensus Service (HCS) for an immutable audit trail.
- **Dynamic Provisioning**: Simulate the deployment and decommissioning of up to 5 DGX Spark nodes (8x A100 GPU configuration).
- **Technical UI/UX**: A dark-mode, high-density interface inspired by NVIDIA's professional tooling, featuring live charts and "scanline" visual effects.
- **Consensus Logs**: View live transaction IDs and consensus timestamps directly from the Hedera network.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4
- **Blockchain**: Hedera Hashgraph SDK
- **Visualization**: Recharts, Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Hedera Testnet Account](https://portal.hedera.com/) (Optional, but required for live transactions)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/dgx-spark-cluster.git
   cd dgx-spark-cluster
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or use AI Studio Secrets) with the following:
   ```env
   HEDERA_ACCOUNT_ID=0.0.xxxxxx
   HEDERA_PRIVATE_KEY=302e0201...
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Hedera Configuration

To use the live Hedera network instead of simulation mode:
1. Go to the [Hedera Portal](https://portal.hedera.com/) and create a Testnet account.
2. Copy your **Account ID** and **Private Key**.
3. Add them to your environment variables.
4. The application will automatically initialize a new Topic ID on the Testnet upon startup.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---
*Built with Google AI Studio Build.*
