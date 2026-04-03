import React from 'react';
import { Link, Link2Off } from 'lucide-react';

interface ConnectionPanelProps {
  rosStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  rosUrl: string;
  setRosUrl: (url: string) => void;
  connectROS: (confirmed?: boolean) => void;
  rosConfirmAction: 'connect' | 'disconnect' | null;
  setRosConfirmAction: (action: 'connect' | 'disconnect' | null) => void;
  demoMode: boolean;
}

/**
 * ROS URL input, connect/disconnect button, and confirmation overlay.
 */
export function ConnectionPanel({
  rosStatus, rosUrl, setRosUrl, connectROS,
  rosConfirmAction, setRosConfirmAction, demoMode,
}: ConnectionPanelProps) {
  return (
    <div className={`flex items-center gap-2 bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/60 relative transition-opacity ${demoMode ? 'opacity-40 pointer-events-none' : ''}`}>
      {rosConfirmAction ? (
        <div className="flex items-center gap-2 px-2">
          <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest whitespace-nowrap">
            Confirm {rosConfirmAction}?
          </span>
          <button
            onClick={() => setRosConfirmAction(null)}
            className="px-2 py-1 bg-neutral-800 text-neutral-400 rounded text-[9px] font-bold hover:text-neutral-200 transition-colors"
          >
            NO
          </button>
          <button
            onClick={() => connectROS(true)}
            className="px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-[9px] font-bold hover:bg-yellow-500/30 transition-colors"
          >
            YES
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={rosUrl}
            onChange={(e) => setRosUrl(e.target.value)}
            className="bg-transparent border-none text-[10px] px-2 py-1 text-neutral-400 w-36 focus:outline-none focus:text-neutral-200"
            placeholder="ws://localhost:9090"
            disabled={rosStatus === 'connected' || rosStatus === 'connecting'}
          />
          <button
            onClick={() => connectROS()}
            className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
              rosStatus === 'connected'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : rosStatus === 'connecting'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {rosStatus === 'connected' ? <><Link2Off className="w-3 h-3" /> Disconnect</> : <><Link className="w-3 h-3" /> Connect</>}
          </button>
        </>
      )}
    </div>
  );
}
