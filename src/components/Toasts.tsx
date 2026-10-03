import React from 'react';
import { useReliefGridStore } from '../store';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useReliefGridStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-18 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none font-mono">
      {toasts.map((toast) => {
        const iconConfig = {
          success: {
            icon: CheckCircle2,
            border: 'border-emerald-500/40',
            bg: 'bg-obsidian-950',
            text: 'text-emerald-400',
          },
          danger: {
            icon: AlertCircle,
            border: 'border-rose-500/40',
            bg: 'bg-obsidian-950',
            text: 'text-rose-400',
          },
          warning: {
            icon: AlertTriangle,
            border: 'border-amber-500/40',
            bg: 'bg-obsidian-950',
            text: 'text-amber-400',
          },
          info: {
            icon: Info,
            border: 'border-white/20',
            bg: 'bg-obsidian-950',
            text: 'text-tactical-orange',
          },
        }[toast.type];

        const Icon = iconConfig.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${iconConfig.border} ${iconConfig.bg} shadow-2xl backdrop-blur-md transition-all duration-200`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconConfig.text}`} />
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-bold text-white tracking-wide">
                {toast.title}
              </h4>
              <p className="text-[11px] text-zinc-400 font-sans leading-normal">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
