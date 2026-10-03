import React, { useState } from 'react';
import { useReliefGridStore } from '../store';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Terminal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const EventTimeline: React.FC = () => {
  const {
    eventLogs,
    guidedDemo,
    nextGuidedDemoStep,
    prevGuidedDemoStep,
    togglePauseGuidedDemo,
    stopGuidedDemo,
  } = useReliefGridStore();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full pointer-events-auto">
      {/* If Guided Demo is Active: Render Narration Bar */}
      {guidedDemo.isActive ? (
        <div className="command-panel rounded-2xl border border-white/20 p-4 shadow-elevated bg-obsidian-950/95 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Story Step Badge & Caption */}
            <div className="flex items-start gap-3 flex-1">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-xl bg-tactical-orange text-black font-extrabold flex items-center justify-center text-sm font-mono">
                  {guidedDemo.step}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 mt-1">/ 5</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white uppercase tracking-wider font-mono">
                    SCENARIO STEP
                  </span>
                  <h3 className="text-sm font-display font-bold text-white tracking-wide">
                    {guidedDemo.caption}
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 leading-normal font-sans">
                  {guidedDemo.subcaption}
                </p>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-2 shrink-0 font-mono">
              <button
                onClick={prevGuidedDemoStep}
                disabled={guidedDemo.step <= 1}
                className="p-2 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 disabled:opacity-30 text-white border border-white/10 transition-colors"
                title="Previous step"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={togglePauseGuidedDemo}
                className="px-3 py-1.5 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-white/10"
              >
                {guidedDemo.isPaused ? (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={nextGuidedDemoStep}
                disabled={guidedDemo.step >= 5}
                className="p-2 rounded-xl bg-tactical-orange hover:bg-tactical-orangeHover text-black font-bold transition-colors"
                title="Next step"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={stopGuidedDemo}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold border border-red-500/30 transition-colors ml-2"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-black h-1 rounded-full mt-3 overflow-hidden border border-white/10">
            <div
              className="bg-tactical-orange h-full rounded-full transition-all duration-300"
              style={{ width: `${(guidedDemo.step / 5) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        /* Standard Timeline / Audit Log Strip */
        <div
          className={`command-panel rounded-2xl border border-white/10 shadow-elevated transition-all duration-200 bg-obsidian-950/95 ${
            isExpanded ? 'h-52' : 'h-13'
          } flex flex-col overflow-hidden`}
        >
          {/* Collapsible Log Header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5 bg-black/60">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-3.5 h-3.5 text-tactical-orange" />
              <span className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                Command Dispatch Log
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black text-zinc-400 border border-white/10">
                {eventLogs.length} events
              </span>
              {!isExpanded && eventLogs[0] && (
                <span className="text-xs text-zinc-400 truncate max-w-[500px] ml-2 hidden sm:inline font-mono text-[11px]">
                  <strong className="text-zinc-200">[{eventLogs[0].timestamp}]</strong> {eventLogs[0].title}
                </span>
              )}
            </div>

            {/* Keyboard Shortcuts Hint & Expand Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span>Shortcuts:</span>
                <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-white">
                  F: Flood
                </kbd>
                <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-white">
                  A: Approve
                </kbd>
                <kbd className="bg-black border border-white/10 px-1 py-0.5 rounded text-white">
                  R: Reset
                </kbd>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg bg-black hover:bg-white/5 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Log Entries */}
          {isExpanded && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
              {eventLogs.map((log) => {
                const badgeColorClass = {
                  red: 'bg-red-500/10 text-rose-300 border-rose-500/30',
                  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                  blue: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
                }[log.badgeColor || 'blue'];

                return (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-black border border-white/5 flex items-start justify-between gap-3 hover:bg-zinc-950 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold">{log.timestamp}</span>
                        {log.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeColorClass}`}
                          >
                            {log.badge}
                          </span>
                        )}
                        <span className="text-white font-semibold font-sans">{log.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
