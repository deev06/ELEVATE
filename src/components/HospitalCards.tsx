import React from 'react';
import { useReliefGridStore } from '../store';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Bed,
  Clock,
} from 'lucide-react';

export const HospitalCards: React.FC = () => {
  const {
    hospitals,
    updateHospitalBedCount,
    isFloodActive,
    isPresentationMode,
  } = useReliefGridStore();

  const totalFree = hospitals.reduce((acc, h) => acc + h.freeIcuBeds, 0);
  const totalReserved = hospitals.reduce((acc, h) => acc + h.reservedIcuBeds, 0);

  return (
    <div
      className={`w-96 flex flex-col h-full command-panel rounded-2xl shadow-elevated overflow-hidden transition-all duration-200 bg-obsidian-950/95 border border-white/10 ${
        isPresentationMode ? 'w-[440px] text-base' : 'text-sm'
      }`}
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-tactical-orange">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-sm tracking-wide">
              Hospital Nodes & Beds
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono">
              Network ICU Allocation & Access
            </p>
          </div>
        </div>

        {/* Aggregate Bed Status Badge */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-black text-emerald-400 border border-white/10">
            {totalFree} Free
          </span>
          <span className="px-2 py-0.5 rounded bg-black text-tactical-orange border border-white/10">
            {totalReserved} Res
          </span>
        </div>
      </div>

      {/* Hospital Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {hospitals.map((hosp) => {
          const isRoadBlocked = (isFloodActive && hosp.code === 'A') || hosp.roadAccessBlocked;

          return (
            <div
              key={hosp.id}
              className={`p-3.5 rounded-xl border transition-all duration-150 command-panel-sub ${
                isRoadBlocked
                  ? 'border-red-500/40 bg-red-950/15'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header: Name, Code & Road Status */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white text-black font-bold text-xs flex items-center justify-center font-mono">
                      {hosp.code}
                    </span>
                    <h3 className="font-display font-bold text-white text-xs tracking-wide">
                      {hosp.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {hosp.baseTravelTimeMin}m from scene
                    </span>
                    {hosp.code === 'A' && (
                      <span className="text-emerald-400 font-semibold">(Nearest)</span>
                    )}
                  </div>
                </div>

                {isRoadBlocked ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    ROAD BLOCKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Open Route
                  </span>
                )}
              </div>

              {/* ICU Bed Capacity Metrics */}
              <div className="grid grid-cols-3 gap-2 my-2.5 bg-black p-2 rounded-lg border border-white/5 text-center font-mono">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Free Beds</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">
                    {hosp.freeIcuBeds}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Reserved</span>
                  <span className="text-base font-bold text-tactical-orange tabular-nums">
                    {hosp.reservedIcuBeds}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Occupied</span>
                  <span className="text-base font-bold text-zinc-300 tabular-nums">
                    {hosp.occupiedIcuBeds}/{hosp.totalIcuBeds}
                  </span>
                </div>
              </div>

              {/* Individual Bed Pips Representation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>ICU WARD ({hosp.totalIcuBeds} BEDS)</span>
                  <span>
                    {Math.round(((hosp.occupiedIcuBeds + hosp.reservedIcuBeds) / hosp.totalIcuBeds) * 100)}% load
                  </span>
                </div>

                {/* Bed Pips Row */}
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-black border border-white/10">
                  {Array.from({ length: hosp.totalIcuBeds }).map((_, i) => {
                    let pipClass = 'bg-emerald-500 border-emerald-400';
                    let pipTooltip = `Bed #${i + 1}: Available`;

                    if (i < hosp.occupiedIcuBeds) {
                      pipClass = 'bg-zinc-800 border-zinc-700 opacity-60';
                      pipTooltip = `Bed #${i + 1}: Occupied`;
                    } else if (i < hosp.occupiedIcuBeds + hosp.reservedIcuBeds) {
                      pipClass = 'bg-tactical-orange border-orange-400 shadow-sm';
                      pipTooltip = `Bed #${i + 1}: Reserved for Inbound RED Patient`;
                    }

                    return (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${pipClass}`}
                        title={pipTooltip}
                      >
                        <Bed className="w-2 h-2 text-black" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Bed Adjuster */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-zinc-400">
                  Simulate Capacity:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateHospitalBedCount(hosp.id, -1)}
                    disabled={hosp.occupiedIcuBeds <= 0}
                    className="p-1 rounded bg-black hover:bg-zinc-900 disabled:opacity-30 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                    title="Free 1 occupied ICU bed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs text-white px-1">
                    {hosp.occupiedIcuBeds}
                  </span>
                  <button
                    onClick={() => updateHospitalBedCount(hosp.id, 1)}
                    disabled={hosp.occupiedIcuBeds >= hosp.totalIcuBeds}
                    className="p-1 rounded bg-black hover:bg-zinc-900 disabled:opacity-30 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                    title="Fill 1 ICU bed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
