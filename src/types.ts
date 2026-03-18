export interface DGXNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'provisioning' | 'error';
  gpuCount: number;
  memory: string;
  cpuUsage: number;
  gpuUsage: number;
  temp: number;
  hederaTopicId?: string;
  lastUpdate: string;
}

export interface HederaTransaction {
  id: string;
  timestamp: string;
  type: 'REGISTRATION' | 'HEARTBEAT' | 'ALERT' | 'STATUS_CHANGE';
  nodeId: string;
  message: string;
  consensusTimestamp?: string;
}
