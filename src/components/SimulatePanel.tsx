import React, { useState } from 'react';
import { useReliefGridStore } from '../store';
import {
  Sliders,
  AlertTriangle,
  UserPlus,
  BedDouble,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react';
import type { TriageLevel } from '../types';

export const SimulatePanel: React.FC = () => {
  const {
    isSimulateDrawerOpen,
    toggleSimulateDrawer,
    setHospitalBBedsToZero,
    addNewPatient,
    resetDemo,
    hospitals,
    lastReplanDurationMs,
  } = useReliefGridStore();

  const [triage, setTriage] = useState<TriageLevel>('RED');
  const [condition, setCondition] = useState('Severe multi-system blast trauma & internal hemorrhage');
  const [deadlineMin, setDeadlineMin] = useState(25);

  if (!isSimulateDrawerOpen) return null;

  const hospB = hospitals.find((h) => h.code === 'B');

  const presets = [
    {
      triage: 'RED' as const,
      condition: 'Acute subdural hematoma & Glasgow Coma 7',
      deadline: 20,
    },
    {
      triage: 'RED' as const,
      condition: 'Penetrating thoracic trauma with tension pneumothorax',
      deadline: 15,
    },
    {
      triage: 'YELLOW' as const,
      condition: 'Pelvic fracture with stable hemodynamics',
      deadline: 50,
    },
    {
      triage: 'GREEN' as const,
      condition: 'Peripheral lacerations & mild hypothermia',
      deadline: 90,
    },
  ];

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    addNewPatient(triage, condition, deadlineMin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="command-panel w-full max-w-xl rounded-3xl border border-white/15 p-6 space-y-6 shadow-elevated bg-obsidian-950">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-tactical-orange">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-white text-base">
                Stress Simulation & Scenario Injection
              </h3>
              <p className="text-xs text-zinc-400">
                Test emergency dynamic re-allocation, bed saturation, and EOC escalations.
              </p>
            </div>
          </div>

          <button
            onClick={toggleSimulateDrawer}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SCRIPTED SCENARIO: Set Hospital B Beds to 0 */}
        <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
                Scenario: Saturate Hospital B ICU
              </h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Current Free: <strong className="text-white">{hospB?.freeIcuBeds}</strong> beds
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-normal">
            Instantly set Hospital B ICU free beds to 0. Watch the deterministic engine re-plan all active RED cases to Hospital C, or trigger the <strong className="text-red-400 font-mono">Escalate to EOC</strong> badge if no reachable beds remain.
          </p>

          <button
            onClick={setHospitalBBedsToZero}
            disabled={hospB?.freeIcuBeds === 0}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600/90 hover:bg-amber-500 disabled:opacity-40 text-black transition-all flex items-center justify-center gap-2 font-mono"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Set Hospital B Beds to 0 (Test Overload Re-plan)</span>
          </button>
        </div>

        {/* 2. INJECT NEW PATIENT FORM */}
        <form onSubmit={handleAddPatient} className="p-4 rounded-2xl bg-obsidian-900 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-tactical-orange" />
              <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
                Inject Live Incident Patient
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              Latency: {lastReplanDurationMs}ms
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTriage(p.triage);
                  setCondition(p.condition);
                  setDeadlineMin(p.deadline);
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-black hover:bg-white/5 border border-white/10 text-zinc-300 transition-colors"
              >
                {p.triage}: {p.condition.slice(0, 22)}...
              </button>
            ))}
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Triage Priority
              </label>
              <select
                value={triage}
                onChange={(e) => setTriage(e.target.value as TriageLevel)}
                className="w-full bg-black border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
              >
                <option value="RED">RED (Immediate - 3x)</option>
                <option value="YELLOW">YELLOW (Delayed - 2x)</option>
                <option value="GREEN">GREEN (Minor - 1x)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Treatment Deadline (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={deadlineMin}
                onChange={(e) => setDeadlineMin(Number(e.target.value))}
                className="w-full bg-black border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
              Clinical Condition
            </label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-black border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              placeholder="Describe emergency trauma..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-tactical-orange hover:bg-tactical-orangeHover text-black transition-all flex items-center justify-center gap-2 font-mono"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Inject Incident into Dispatch Grid</span>
          </button>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <button
            onClick={resetDemo}
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo to Pure Seed</span>
          </button>

          <button
            onClick={toggleSimulateDrawer}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
