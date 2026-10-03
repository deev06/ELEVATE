import React from 'react';
import { useReliefGridStore } from '../store';
import { Smartphone } from 'lucide-react';

export const MobileNotice: React.FC = () => {
  const { activeTab, setActiveTab } = useReliefGridStore();

  if (activeTab === 'driver-app') {
    return null;
  }

  return (
    <aside
      aria-label="Desktop recommendation notice"
      className="mobile-notice-fallback fixed inset-0 z-[100] flex-col items-center justify-center p-6 text-center select-none"
      style={{
        backgroundColor: '#06152B',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(255, 145, 77, 0.09) 0%, transparent 65%)',
        }}
      />

      {/* ReliefGrid Brand Logo */}
      <div
        className="relative flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl"
        style={{
          backgroundColor: 'rgba(255, 145, 77, 0.12)',
          border: '1px solid rgba(255, 145, 77, 0.35)',
          boxShadow: '0 0 35px rgba(255, 145, 77, 0.25)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#FF914D"
          className="w-9 h-9"
          aria-hidden="true"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <div className="relative flex items-center gap-2.5 mb-4">
        <span className="text-2xl font-bold tracking-tight text-white font-['Inter',sans-serif]">
          ReliefGrid
        </span>
        <span
          className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded font-bold"
          style={{
            backgroundColor: 'rgba(255, 145, 77, 0.15)',
            color: '#FF914D',
            border: '1px solid rgba(255, 145, 77, 0.3)',
          }}
        >
          OPS CENTER
        </span>
      </div>

      {/* Message */}
      <p
        className="relative text-sm sm:text-base text-slate-300 max-w-xs sm:max-w-sm mb-8 leading-relaxed font-normal"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Built for a laptop or projector. Open this link on a desktop for the full demo.
      </p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => setActiveTab('driver-app')}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:brightness-110"
        style={{
          backgroundColor: '#FF914D',
          color: '#06152B',
          boxShadow: '0 10px 25px -5px rgba(255, 145, 77, 0.4)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Smartphone className="w-4 h-4" />
        <span>Open Driver App preview</span>
      </button>
    </aside>
  );
};
