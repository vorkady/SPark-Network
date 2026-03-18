/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Plus, 
  RefreshCw, 
  Server, 
  Shield, 
  Terminal, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DGXNode, HederaTransaction } from './types';
import { hederaService } from './services/hederaService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_NODES = 5;

export default function App() {
  const [nodes, setNodes] = useState<DGXNode[]>([]);
  const [logs, setLogs] = useState<HederaTransaction[]>([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [networkTopicId, setNetworkTopicId] = useState<string | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);

  // Initialize network topic
  useEffect(() => {
    const initNetwork = async () => {
      const topicId = await hederaService.createNetworkTopic();
      setNetworkTopicId(topicId);
    };
    initNetwork();
  }, []);

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        if (node.status !== 'online') return node;
        
        const cpuDelta = (Math.random() - 0.5) * 5;
        const gpuDelta = (Math.random() - 0.5) * 10;
        
        return {
          ...node,
          cpuUsage: Math.min(100, Math.max(0, node.cpuUsage + cpuDelta)),
          gpuUsage: Math.min(100, Math.max(0, node.gpuUsage + gpuDelta)),
          temp: 45 + Math.random() * 20,
          lastUpdate: new Date().toISOString()
        };
      }));

      // Update history for charts
      setMetricsHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          avgCpu: nodes.length ? nodes.reduce((acc, n) => acc + n.cpuUsage, 0) / nodes.length : 0,
          avgGpu: nodes.length ? nodes.reduce((acc, n) => acc + n.gpuUsage, 0) / nodes.length : 0,
        };
        return [...prev.slice(-19), newEntry];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [nodes]);

  const addNode = async () => {
    if (nodes.length >= MAX_NODES) return;
    
    setIsProvisioning(true);
    const newNodeId = `dgx-${Math.random().toString(36).substr(2, 5)}`;
    
    const newNode: DGXNode = {
      id: newNodeId,
      name: `DGX-SPARK-${nodes.length + 1}`,
      status: 'provisioning',
      gpuCount: 8,
      memory: '2TB',
      cpuUsage: 0,
      gpuUsage: 0,
      temp: 30,
      lastUpdate: new Date().toISOString()
    };

    setNodes(prev => [...prev, newNode]);

    // Simulate provisioning delay
    setTimeout(async () => {
      setNodes(prev => prev.map(n => n.id === newNodeId ? { ...n, status: 'online' } : n));
      setIsProvisioning(false);
      
      if (networkTopicId) {
        const txId = await hederaService.logEvent(networkTopicId, {
          nodeId: newNodeId,
          type: 'REGISTRATION',
          message: `Node ${newNode.name} provisioned and registered on Hedera Network.`
        });

        const newLog: HederaTransaction = {
          id: txId || Math.random().toString(),
          nodeId: newNodeId,
          type: 'REGISTRATION',
          message: `Node ${newNode.name} registered.`,
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev]);
      }
    }, 3000);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(118,185,0,0.3)]">
            <Zap className="text-bg w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">DGX Spark Network</h1>
            <div className="flex items-center gap-2 text-[10px] text-accent/70 font-mono">
              <span className="animate-pulse">●</span> SYSTEM_READY
              {networkTopicId && (
                <>
                  <span className="text-ink/30">|</span>
                  <span className="flex items-center gap-1">
                    <Hash size={10} /> HEDERA_TOPIC: {networkTopicId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg/50 border border-border rounded-md text-xs font-mono">
            <Activity size={14} className="text-accent" />
            <span>NODES: {nodes.length}/{MAX_NODES}</span>
          </div>
          <button 
            onClick={addNode}
            disabled={nodes.length >= MAX_NODES || isProvisioning}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-bg px-4 py-2 rounded-md font-bold text-sm transition-all active:scale-95"
          >
            <Plus size={18} />
            PROVISION NODE
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="scanline" />
        
        {/* Sidebar - Node List */}
        <aside className="w-80 border-r border-border bg-surface/30 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold text-ink/50 uppercase tracking-widest flex items-center gap-2">
              <Server size={14} /> Active Nodes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {nodes.length === 0 && !isProvisioning && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                <Terminal size={48} className="mb-4" />
                <p className="text-sm font-mono">NO ACTIVE NODES DETECTED</p>
                <p className="text-[10px] mt-2">Initialize DGX systems to begin monitoring</p>
              </div>
            )}
            
            <AnimatePresence>
              {nodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all group relative overflow-hidden",
                    selectedNodeId === node.id 
                      ? "bg-accent/10 border-accent shadow-[inset_0_0_10px_rgba(118,185,0,0.1)]" 
                      : "bg-surface border-border hover:border-accent/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        node.status === 'online' ? "bg-accent animate-pulse" : "bg-yellow-500"
                      )} />
                      <span className="font-mono text-sm font-bold">{node.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-50">{node.id}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase">
                        <span>CPU</span>
                        <span>{Math.round(node.cpuUsage)}%</span>
                      </div>
                      <div className="h-1 bg-bg rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent" 
                          animate={{ width: `${node.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase">
                        <span>GPU</span>
                        <span>{Math.round(node.gpuUsage)}%</span>
                      </div>
                      <div className="h-1 bg-bg rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent" 
                          animate={{ width: `${node.gpuUsage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg">
          {selectedNode ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Node Detail Header */}
              <div className="flex items-end justify-between border-b border-border pb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-surface border border-border rounded-xl flex items-center justify-center relative">
                    <Server size={40} className="text-accent/50" />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-bg px-2 py-0.5 rounded text-[10px] font-bold">
                      {selectedNode.status.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedNode.name}</h2>
                    <p className="text-ink/50 font-mono text-xs flex items-center gap-2 mt-1">
                      <Settings size={12} /> CONFIG: 8x A100 GPU | 2TB RAM | HEDERA_SYNC_ENABLED
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeNode(selectedNode.id)}
                  className="text-red-500/50 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 px-3 py-1.5 rounded transition-colors"
                >
                  Decommission Node
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'CPU LOAD', value: `${Math.round(selectedNode.cpuUsage)}%`, icon: Cpu, color: 'text-accent' },
                  { label: 'GPU UTIL', value: `${Math.round(selectedNode.gpuUsage)}%`, icon: Zap, color: 'text-accent' },
                  { label: 'MEMORY', value: '1.2 / 2.0 TB', icon: Database, color: 'text-blue-400' },
                  { label: 'TEMP', value: `${Math.round(selectedNode.temp)}°C`, icon: Activity, color: selectedNode.temp > 60 ? 'text-red-400' : 'text-accent' },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface border border-border p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-mono font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface border border-border p-6 rounded-xl">
                  <h3 className="text-xs font-bold mb-6 flex items-center gap-2 uppercase tracking-widest opacity-50">
                    <Activity size={14} /> Network Performance History
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#76b900" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#76b900" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2d" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="#2a2a2d" fontSize={10} fontStyle="mono" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#161618', border: '1px solid #2a2a2d', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <Area type="monotone" dataKey="avgCpu" stroke="#76b900" fillOpacity={1} fill="url(#colorCpu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface border border-border p-6 rounded-xl">
                  <h3 className="text-xs font-bold mb-6 flex items-center gap-2 uppercase tracking-widest opacity-50">
                    <Shield size={14} /> Hedera Consensus Logs
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {logs.filter(l => l.nodeId === selectedNode.id).length === 0 && (
                      <div className="text-center py-12 opacity-20 text-xs font-mono">
                        NO LOGS RECORDED FOR THIS NODE
                      </div>
                    )}
                    {logs.filter(l => l.nodeId === selectedNode.id).map((log) => (
                      <div key={log.id} className="text-[10px] font-mono p-2 bg-bg/50 border-l-2 border-accent flex flex-col gap-1">
                        <div className="flex justify-between opacity-50">
                          <span>TX_ID: {log.id.substring(0, 16)}...</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-accent uppercase font-bold">{log.type}</div>
                        <div className="text-ink/80">{log.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-32 h-32 bg-surface border border-border rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-dashed animate-[spin_10s_linear_infinite]" />
                <Server size={64} className="text-accent/20" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Select a Node to Monitor</h2>
              <p className="text-ink/40 max-w-md text-sm font-mono">
                Real-time telemetry and Hedera consensus data will be displayed here once a DGX Spark node is selected from the sidebar.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-border bg-surface flex items-center justify-between px-4 text-[10px] font-mono text-ink/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>HEDERA_NETWORK: TESTNET</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>API_STATUS: OPERATIONAL</span>
          </div>
        </div>
        <div>
          SYSTEM_TIME: {new Date().toISOString()}
        </div>
      </footer>

      {/* Provisioning Overlay */}
      <AnimatePresence>
        {isProvisioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-surface border border-accent/30 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={32} className="text-accent animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-2">Provisioning Node</h3>
              <p className="text-xs text-ink/50 font-mono mb-6">
                Allocating resources and registering on Hedera Hashgraph...
              </p>
              <div className="h-1 bg-bg rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2d;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #76b900;
        }
      `}</style>
    </div>
  );
}
