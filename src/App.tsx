import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './index.css';

// TypeScript interfaces
type VpnStatus = 
  | { type: 'Disconnected' }
  | { type: 'Connecting' }
  | { type: 'Connected'; interface: string; endpoint: string }
  | { type: 'Disconnecting' }
  | { type: 'Error'; message: string };

interface HealthMetrics {
  latency_ms: number | null;
  download_bps: number | null;
  upload_bps: number | null;
  packet_loss_pct: number | null;
  bytes_rx: number | null;
  bytes_tx: number | null;
  uptime_secs: number | null;
  timestamp: number;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

// Sample WireGuard config for testing
const SAMPLE_CONFIG = `[Interface]
PrivateKey = YOUR_PRIVATE_KEY_HERE
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25`;

function App() {
  const [status, setStatus] = useState<VpnStatus>({ type: 'Disconnected' });
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(SAMPLE_CONFIG);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showRawConfig, setShowRawConfig] = useState(false);
  const [health, setHealth] = useState<HealthMetrics | null>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ timestamp, type, message }, ...prev].slice(0, 100));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await invoke<VpnStatus>('get_vpn_status');
      setStatus(result);
    } catch (error) {
      addLog('error', `Failed to fetch status: ${error}`);
    }
  }, [addLog]);

  const fetchHealth = useCallback(async () => {
    try {
      const result = await invoke<HealthMetrics>('get_health_metrics');
      setHealth(result);
    } catch (error) {
      // Health metrics unavailable
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (status.type === 'Connected') {
      fetchHealth();
      const interval = setInterval(fetchHealth, 5000);
      return () => clearInterval(interval);
    } else {
      setHealth(null);
    }
  }, [status.type, fetchHealth]);

  const handleConnect = async () => {
    setIsLoading(true);
    addLog('info', 'Initiating VPN connection...');
    
    try {
      const result = await invoke<string>('connect_vpn', { 
        config,
        configName: 'default'
      });
      addLog('success', result);
      await fetchStatus();
    } catch (error) {
      const errorMsg = String(error);
      addLog('error', `Connection failed: ${errorMsg}`);
      setStatus({ type: 'Error', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    addLog('info', 'Disconnecting VPN...');
    
    try {
      const result = await invoke<string>('disconnect_vpn');
      addLog('success', result);
      await fetchStatus();
    } catch (error) {
      const errorMsg = String(error);
      addLog('error', `Disconnection failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'Connected': return 'bg-green-500';
      case 'Connecting': return 'bg-yellow-500';
      case 'Disconnecting': return 'bg-orange-500';
      case 'Error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status.type) {
      case 'Connected': 
        return status.type === 'Connected' 
          ? `Connected to ${(status as any).endpoint}` 
          : 'Connected';
      case 'Connecting': return 'Connecting...';
      case 'Disconnecting': return 'Disconnecting...';
      case 'Error': return 'Error';
      default: return 'Disconnected';
    }
  };

  const isConnected = status.type === 'Connected';
  const isConnecting = status.type === 'Connecting' || status.type === 'Disconnecting';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
            V
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            VPNht
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${isConnecting ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Main Connection Area */}
      <div className="flex flex-col items-center justify-center py-8 mb-8">
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isLoading || isConnecting}
          className={`
            relative w-32 h-32 rounded-full font-bold text-lg transition-all duration-300
            flex items-center justify-center shadow-2xl
            ${isConnected 
              ? 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
          `}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="text-white">
              {isConnected ? 'Disconnect' : 'Connect'}
            </span>
          )}
          
          {/* Ripple effect for connected state */}
          {isConnected && (
            <>
              <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
              <div className="absolute -inset-4 rounded-full border-2 border-green-500/30" />
            </>
          )}
        </button>

        <p className="mt-6 text-slate-400 text-sm">
          {isConnected 
            ? 'Your connection is secure and encrypted' 
            : 'Click to establish secure VPN connection'
          }
        </p>
      </div>

      {/* Config Section */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <button
          onClick={() => setShowRawConfig(!showRawConfig)}
          className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white"
        >
          <span>WireGuard Configuration</span>
          <svg 
            className={`w-5 h-5 transition-transform ${showRawConfig ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showRawConfig && (
          <div className="mt-4">
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full h-48 bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded-lg 
                         border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Paste your WireGuard configuration here..."
            />
            <p className="mt-2 text-xs text-slate-500">
              Edit the configuration above with your VPN provider's details
            </p>
          </div>
        )}
      </div>

      {/* Connection Info */}
      {isConnected && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Connection Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Interface:</span>
              <span className="ml-2 text-slate-200 font-mono">{(status as any).interface}</span>
            </div>
            <div>
              <span className="text-slate-500">Protocol:</span>
              <span className="ml-2 text-slate-200">WireGuard</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Endpoint:</span>
              <span className="ml-2 text-slate-200 font-mono">{(status as any).endpoint}</span>
            </div>
          </div>
        </div>
      )}

      {/* Connection Health Dashboard */}
      {isConnected && health && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Connection Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Latency */}
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Latency</div>
              <div className={`text-lg font-bold ${
                health.latency_ms !== null && health.latency_ms < 50 ? 'text-green-400' :
                health.latency_ms !== null && health.latency_ms < 150 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {health.latency_ms !== null ? `${health.latency_ms.toFixed(1)}ms` : '—'}
              </div>
            </div>
            {/* Download */}
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">↓ Download</div>
              <div className="text-lg font-bold text-blue-400">
                {health.download_bps !== null 
                  ? health.download_bps > 1048576 
                    ? `${(health.download_bps / 1048576).toFixed(1)} MB/s`
                    : `${(health.download_bps / 1024).toFixed(1)} KB/s`
                  : '—'}
              </div>
            </div>
            {/* Upload */}
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">↑ Upload</div>
              <div className="text-lg font-bold text-cyan-400">
                {health.upload_bps !== null 
                  ? health.upload_bps > 1048576 
                    ? `${(health.upload_bps / 1048576).toFixed(1)} MB/s`
                    : `${(health.upload_bps / 1024).toFixed(1)} KB/s`
                  : '—'}
              </div>
            </div>
            {/* Packet Loss */}
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Packet Loss</div>
              <div className={`text-lg font-bold ${
                health.packet_loss_pct !== null && health.packet_loss_pct === 0 ? 'text-green-400' :
                health.packet_loss_pct !== null && health.packet_loss_pct < 5 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {health.packet_loss_pct !== null ? `${health.packet_loss_pct}%` : '—'}
              </div>
            </div>
          </div>
          {/* Totals row */}
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span>
              Total: ↓ {health.bytes_rx !== null ? `${(health.bytes_rx / 1048576).toFixed(1)} MB` : '—'} / 
              ↑ {health.bytes_tx !== null ? `${(health.bytes_tx / 1048576).toFixed(1)} MB` : '—'}
            </span>
            <span>
              Uptime: {health.uptime_secs !== null 
                ? `${Math.floor(health.uptime_secs / 3600)}h ${Math.floor((health.uptime_secs % 3600) / 60)}m`
                : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Activity Log</h3>
        <div className="h-48 overflow-y-auto bg-slate-900 rounded-lg p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">No activity yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 flex gap-2">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className={`
                  ${log.type === 'error' ? 'text-red-400' : ''}
                  ${log.type === 'success' ? 'text-green-400' : ''}
                  ${log.type === 'warning' ? 'text-yellow-400' : ''}
                  ${log.type === 'info' ? 'text-blue-400' : ''}
                `}>
                  {log.type.toUpperCase()}:
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear logs
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-600">
        VPNht Desktop v2.0.0 • Secure WireGuard Connections
      </div>
    </div>
  );
}

export default App;
