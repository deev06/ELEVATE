import React from 'react';
import { useReliefGridStore } from '../store';
import type { ActiveTab } from '../store';
import {
  Waves,
  RotateCcw,
  Play,
  Pause,
  Monitor,
  Radio,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isFloodActive,
    toggleFlood,
    isPresentationMode,
    togglePresentationMode,
    isBaselineMode,
    toggleBaselineMode,
    resetDemo,
    guidedDemo,
    startGuidedDemo,
    stopGuidedDemo,
    togglePauseGuidedDemo,
    showOnboarding,
    dismissOnboarding,
    toggleSimulateDrawer,
    lastReplanDurationMs,
  } = useReliefGridStore();

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'dispatch', label: 'Dispatch' },
    { id: 'delivery-trail', label: 'Delivery Trail' },
    { id: 'audit', label: 'Audit Portal' },
    { id: 'driver-app', label: 'Driver App' },
    { id: 'compare', label: 'Compare View' },
  ];

  return (
    <header className="relative z-30 desktop-only-header flex flex-col w-full border-b border-white/10 bg-black/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
      {/* Top Main Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-obsidian-900 border border-white/15 text-tactical-orange">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-extrabold tracking-tight text-white flex items-center gap-2">
                ReliefGrid
                <span className="text-[9px] tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-obsidian-850 text-zinc-300 border border-white/10">
                  OPS CENTER
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Prototype: flood scenario. Other hazards plug in via adapters (planned).
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center p-0.5 rounded-xl bg-obsidian-950 border border-white/10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-100 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Simulation Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Baseline vs ReliefGrid Switch */}
          <div className="flex items-center rounded-xl bg-obsidian-950 border border-white/10 p-0.5 text-xs font-mono">
            <button
              onClick={() => isBaselineMode && toggleBaselineMode()}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                !isBaselineMode
                  ? 'bg-tactical-orange text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ReliefGrid</span>
            </button>
            <button
              onClick={() => !isBaselineMode && toggleBaselineMode()}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                isBaselineMode
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Baseline</span>
            </button>
          </div>

          {/* Trigger Flood Button */}
          <button
            onClick={toggleFlood}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
              isFloodActive
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-obsidian-900 hover:bg-obsidian-850 text-white border-white/15'
            }`}
            title="Press 'F' shortcut to toggle flood"
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{isFloodActive ? 'Clear Flood' : 'Trigger Flood: Block A'}</span>
            <kbd className="hidden sm:inline-block font-mono text-[9px] bg-black/50 px-1 rounded text-zinc-300">
              F
            </kbd>
          </button>

          {/* Simulate Drawer Button */}
          <button
            onClick={toggleSimulateDrawer}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-obsidian-900 hover:bg-obsidian-850 text-zinc-300 hover:text-white border border-white/15 transition-all flex items-center gap-1"
            title="Open Simulation & Stress Scenarios"
          >
            <Sliders className="w-3.5 h-3.5 text-tactical-orange" />
            <span>Simulate</span>
          </button>

          {/* Run Guided Demo Button */}
          {guidedDemo.isActive ? (
            <div className="flex items-center gap-1 rounded-xl bg-obsidian-900 border border-orange-500/40 p-0.5 text-xs text-orange-200 font-mono">
              <span className="px-2 font-bold">{guidedDemo.step}/5</span>
              <button
                onClick={togglePauseGuidedDemo}
                className="p-1 hover:bg-white/10 rounded"
                title={guidedDemo.isPaused ? 'Resume' : 'Pause'}
              >
                {guidedDemo.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
              <button
                onClick={stopGuidedDemo}
                className="px-2 py-0.5 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded font-medium"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={startGuidedDemo}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-zinc-100 hover:bg-white text-black transition-all flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Guided Demo</span>
            </button>
          )}

          {/* Reset Demo */}
          <button
            onClick={resetDemo}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-obsidian-900 hover:bg-obsidian-850 border border-white/10 transition-colors"
            title="Reset to pure seed state (Shortcut: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={togglePresentationMode}
            className={`p-2 rounded-xl border transition-colors ${
              isPresentationMode
                ? 'bg-tactical-orange text-black border-orange-400'
                : 'text-zinc-400 hover:text-white bg-obsidian-900 hover:bg-obsidian-850 border-white/10'
            }`}
            title="Toggle Presentation Mode (Larger fonts, Projector friendly)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Onboarding Banner */}
      {showOnboarding && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-bold text-white">Flow:</span>
            <span className="text-zinc-300">1. Trigger flood</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-300">2. Approve</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-300">3. Confirm with OTP</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-300">4. Verify on audit portal</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>Latency: <strong className="text-emerald-400">{lastReplanDurationMs}ms</strong></span>
            <button onClick={dismissOnboarding} className="text-zinc-500 hover:text-zinc-300 underline">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
