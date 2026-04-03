import React from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface NotificationToastProps {
  notifications: Notification[];
}

/**
 * Fixed overlay displaying queued notifications in the top-right corner.
 */
export function NotificationToast({ notifications }: NotificationToastProps) {
  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`
            pointer-events-auto min-w-[280px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 duration-300
            ${n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}
          `}
        >
          <div className="flex items-center gap-3">
            {n.type === 'error' ? <ShieldAlert className="w-5 h-5" /> :
             n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
             <Info className="w-5 h-5" />}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">{n.type}</span>
              <span className="text-sm font-medium">{n.message}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
