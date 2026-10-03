import React, { useState } from 'react';
import { useReliefGridStore } from '../store';
import { sortPatientsByPriority, calculatePriorityScore } from '../engine';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Ambulance as AmbulanceIcon,
  Building2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const PatientQueue: React.FC = () => {
  const {
    patients,
    hospitals,
    allocationPlans,
    approveRecommendation,
    rejectRecommendation,
    isPresentationMode,
  } = useReliefGridStore();

  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

  const sortedPatients = sortPatientsByPriority(patients);

  const toggleExpand = (id: string) => {
    setExpandedPatientId((prev) => (prev === id ? null : id));
  };

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
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-sm tracking-wide">
              Triage Priority Queue
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono">
              Score = Severity / Minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs bg-black px-2.5 py-1 rounded-lg border border-white/10">
          <span className="text-tactical-orange font-bold">{sortedPatients.length}</span>
          <span className="text-zinc-500">Cases</span>
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedPatients.map((patient, index) => {
          const plan = allocationPlans[patient.id];
          const isTopPending =
            patient.status === 'pending' &&
            sortedPatients.findIndex((p) => p.status === 'pending') === index;
          const isExpanded = expandedPatientId === patient.id || isTopPending;
          const assignedHosp = hospitals.find((h) => h.id === (plan?.hospitalId || patient.assignedHospitalId));

          const triageColors = {
            RED: {
              badge: 'bg-red-500/10 text-rose-300 border-rose-500/30',
              accent: 'border-l-2 border-l-rose-500',
            },
            YELLOW: {
              badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
              accent: 'border-l-2 border-l-amber-500',
            },
            GREEN: {
              badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
              accent: 'border-l-2 border-l-emerald-500',
            },
          }[patient.triage];

          const priorityScore = calculatePriorityScore(patient.triage, patient.minutesLeft).toFixed(3);

          return (
            <div
              key={patient.id}
              className={`rounded-xl border transition-all duration-150 command-panel-sub ${
                triageColors.accent
              } ${
                patient.status === 'dispatched'
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : plan?.escalatedToEoc
                  ? 'border-red-500/50 bg-red-950/15'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Summary Line */}
              <div
                className="p-3 cursor-pointer flex items-center justify-between gap-2"
                onClick={() => toggleExpand(patient.id)}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${triageColors.badge}`}
                  >
                    {patient.triage}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white tracking-wide text-xs">
                        {patient.code}
                      </span>
                      {plan?.escalatedToEoc && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-600 text-black flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          ESCALATE TO EOC
                        </span>
                      )}
                      {patient.status === 'dispatched' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Dispatched
                        </span>
                      )}
                      {patient.status === 'verified' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[190px]">
                      {patient.condition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="font-mono text-xs">
                    <span className="text-white font-bold tabular-nums">
                      {patient.minutesLeft}m
                    </span>
                    <span className="text-zinc-500 text-[10px] block">deadline</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2.5 text-xs">
                  {/* Location & Score */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono bg-black px-2 py-1 rounded border border-white/5">
                    <span>{patient.locationName}</span>
                    <span>Priority: {priorityScore}</span>
                  </div>

                  {/* Recommendation Route Banner */}
                  {plan && !plan.escalatedToEoc && (
                    <div className="p-2.5 rounded-lg bg-obsidian-900 border border-white/10 space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-200">
                          <AmbulanceIcon className="w-3.5 h-3.5 text-tactical-orange" />
                          <span className="font-bold text-white">{plan.ambulanceId}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-600" />
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-bold text-white">{assignedHosp?.name}</span>
                        </div>
                        <div className="font-bold text-tactical-orange tabular-nums">
                          ETA {plan.totalEtaMin}m
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>Pickup: {plan.ambToSceneMin}m</span>
                        <span>Transit: {plan.sceneToHospMin}m</span>
                        {plan.reroutePenaltyMin > 0 && (
                          <span className="text-amber-400 font-semibold">
                            +5m Reroute penalty
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* "Why this?" Explainability Panel (GENERATED FROM REAL DATA) */}
                  {plan && (
                    <div className="p-2.5 rounded-lg bg-black border border-white/10 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-tactical-orange">
                        <Info className="w-3 h-3" />
                        <span>Algorithmic Rationale:</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                        {plan.explanation}
                      </p>
                    </div>
                  )}

                  {/* Dispatcher Actions */}
                  {patient.status === 'pending' && !plan?.escalatedToEoc && (
                    <div className="flex items-center gap-2 pt-1 font-mono">
                      <button
                        onClick={() => approveRecommendation(patient.id)}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-white text-black transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve Dispatch</span>
                        {isTopPending && (
                          <kbd className="text-[9px] bg-black/20 px-1 rounded text-black">
                            A
                          </kbd>
                        )}
                      </button>

                      <button
                        onClick={() => rejectRecommendation(patient.id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-obsidian-900 hover:bg-obsidian-850 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1"
                        title="Reject this hospital option and calculate next best reachable route"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Escalated state actions */}
                  {plan?.escalatedToEoc && (
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-red-200 text-center font-mono">
                      <p className="font-bold text-xs flex items-center justify-center gap-1 text-red-400 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        EOC Action Required
                      </p>
                      <p className="text-[10px] text-zinc-400 font-sans">
                        All local hospitals full or inaccessible. Requesting Regional Disaster Air Wing.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
