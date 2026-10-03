import React, { useState } from 'react';
import { useReliefGridStore } from '../store';
import {
  Radio,
  WifiOff,
  Building2,
  AlertTriangle,
  KeyRound,
  Compass,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const DriverApp: React.FC = () => {
  const {
    ambulances,
    patients,
    hospitals,
    selectedDriverAmbulanceId,
    setSelectedDriverAmbulanceId,
    isSmsFallbackActive,
    toggleSmsFallback,
    isFloodActive,
    addToast,
    setActiveTab,
  } = useReliefGridStore();

  const [simulatedReply, setSimulatedReply] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  // Active unit & its assigned patient/hospital
  const currentAmbulance =
    ambulances.find((a) => a.id === selectedDriverAmbulanceId) || ambulances[0];

  const assignedPatient = patients.find(
    (p) => p.assignedAmbulanceId === currentAmbulance.id || p.status === 'dispatched'
  ) || patients[0];

  const assignedHospital = hospitals.find(
    (h) => h.id === assignedPatient?.assignedHospitalId || h.code === 'B'
  );

  const handleSendAck = (e: React.FormEvent) => {
    e.preventDefault();
    setAcknowledged(true);
    addToast('SMS Acknowledged', `Carrier message dispatched: "${simulatedReply || 'ACK ' + assignedPatient?.driverOtp}"`, 'success');
    setSimulatedReply('');
  };

  const triageColor =
    assignedPatient?.triage === 'RED'
      ? '#F43F5E'
      : assignedPatient?.triage === 'YELLOW'
      ? '#F59E0B'
      : '#10B981';

  return (
    <div className="w-full h-full flex flex-col min-[900px]:items-center min-[900px]:justify-center p-0 min-[900px]:p-4 bg-vantablack overflow-y-auto overflow-x-hidden max-w-full">
      {/* Unit Selector & Top Controls */}
      <div className="flex items-center gap-2 mb-0 min-[900px]:mb-4 p-2.5 min-[900px]:p-0 bg-obsidian-950 min-[900px]:bg-transparent border-b border-white/10 min-[900px]:border-none z-10 overflow-x-auto no-scrollbar shrink-0 justify-start min-[900px]:justify-center min-[900px]:flex-wrap max-w-full w-full">
        {/* Mobile-only return button to desktop notice */}
        <button
          onClick={() => setActiveTab('dispatch')}
          className="min-[900px]:hidden shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-zinc-400 bg-obsidian-850 border border-white/10 hover:text-white flex items-center gap-1"
          title="Return to desktop notice"
        >
          <span>← Notice</span>
        </button>

        <span className="text-xs font-mono text-zinc-400 shrink-0">Unit:</span>
        {ambulances.map((amb) => {
          const isSelected = amb.id === currentAmbulance.id;
          return (
            <button
              key={amb.id}
              onClick={() => setSelectedDriverAmbulanceId(amb.id)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                isSelected
                  ? 'bg-tactical-orange text-black border-orange-400'
                  : 'bg-obsidian-850 text-zinc-300 border-white/10 hover:border-white/20'
              }`}
            >
              {amb.code}
            </button>
          );
        })}

        {/* SMS Fallback Toggle */}
        <button
          onClick={toggleSmsFallback}
          className={`shrink-0 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
            isSmsFallbackActive
              ? 'bg-emerald-600 text-black border-emerald-400 font-bold'
              : 'bg-obsidian-850 text-zinc-300 border-white/10 hover:border-white/20'
          }`}
          title="Simulate low-connectivity GSM cellular fallback"
        >
          {isSmsFallbackActive ? <WifiOff className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
          <span>{isSmsFallbackActive ? 'SMS Active' : 'Broadband Data'}</span>
        </button>
      </div>

      {/* 390x800 Phone Frame (Becomes full-screen below 900px) */}
      <div className="phone-viewport flex flex-col select-none">
        {/* Status Bar */}
        <div className="h-10 min-[900px]:h-12 w-full pt-1 min-[900px]:pt-2 px-4 min-[900px]:px-6 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-obsidian-950 border-b border-white/5 shrink-0 z-20">
          <span>16:04</span>
          <div className="hidden min-[900px]:block w-20 h-4 bg-black rounded-full border border-white/10 mx-auto" />
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>94%</span>
          </div>
        </div>

        {/* SCREEN CONTENT */}
        {isSmsFallbackActive ? (
          /* Plain Monospace SMS-Style Screen */
          <div className="flex-1 flex flex-col justify-between p-4 bg-black text-emerald-400 font-mono text-xs overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div className="p-2 border border-emerald-500/30 bg-emerald-950/20 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>[RELIEFGRID SMS GATEWAY]</span>
                  <span>PRIORITY: URGENT</span>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  Carrier: SAT-CELL GSM MESH • Channel #04
                </p>
              </div>

              {/* Raw ASCII Dispatch Message */}
              <div className="p-3 border border-dashed border-emerald-500/40 bg-black rounded space-y-2 leading-relaxed text-[11px]">
                <p className="text-emerald-300 font-bold">
                  DISPATCH ORDER: {currentAmbulance.code}
                </p>
                <div className="space-y-0.5 text-zinc-300">
                  <p>PATIENT: <strong className="text-white">{assignedPatient.code}</strong> [{assignedPatient.triage} PRIORITY]</p>
                  <p>CONDITION: {assignedPatient.condition}</p>
                  <p>PICKUP: {assignedPatient.locationName}</p>
                  <p>DESTINATION: {assignedHospital?.name}</p>
                  <p>BED: RESERVED (ICU WARD)</p>
                  <p>ESTIMATED ETA: 14 MIN</p>
                  <p>TRANSFER OTP: <strong className="text-tactical-orange">{assignedPatient.driverOtp}</strong></p>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 text-amber-400 text-[10px]">
                  {isFloodActive ? (
                    <span>WARNING: CAUSEWAY TO HOSP A FLOODED (1.8M WATER). ROUTE VIA EAST ARTERIAL TO HOSP B.</span>
                  ) : (
                    <span>ROUTE: CAUSEWAY OPEN. PROCEED TO NEAREST NODE.</span>
                  )}
                </div>
              </div>

              {acknowledged && (
                <div className="p-2 bg-emerald-900/30 border border-emerald-400 text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ACK CONFIRMED. Base received your status.</span>
                </div>
              )}
            </div>

            {/* Simulated SMS Reply Input */}
            <form onSubmit={handleSendAck} className="pt-3 border-t border-emerald-500/30 space-y-2">
              <span className="text-[10px] text-zinc-500 block uppercase">
                Send Cellular ACK to Dispatch:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`ACK ${assignedPatient.driverOtp}`}
                  value={simulatedReply}
                  onChange={(e) => setSimulatedReply(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-emerald-500/40 rounded px-2.5 py-1.5 text-emerald-300 outline-none text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ACK</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Normal Graphic Driver Interface */
          <div className="flex-1 flex flex-col justify-between p-4 bg-obsidian-950 overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Patient Color Banner */}
              <div
                className="p-3.5 rounded-2xl border text-white space-y-1"
                style={{
                  backgroundColor: `${triageColor}18`,
                  borderColor: `${triageColor}50`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase font-mono"
                    style={{ backgroundColor: triageColor, color: '#000000' }}
                  >
                    {assignedPatient.triage} PRIORITY
                  </span>
                  <span className="font-mono text-xs text-zinc-300">
                    {assignedPatient.minutesLeft}m to deadline
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-white">
                  {assignedPatient.code}
                </h3>
                <p className="text-xs text-zinc-300 font-sans">
                  {assignedPatient.condition}
                </p>
              </div>

              {/* Large ETA & Speed HUD */}
              <div className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                    ETA to Hospital
                  </span>
                  <span className="text-3xl font-display font-extrabold text-white tracking-tight tabular-nums">
                    14 <span className="text-sm font-sans font-normal text-zinc-400">MIN</span>
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase block">Vehicle Speed</span>
                  <span className="text-lg font-bold text-tactical-orange tabular-nums">
                    48 <span className="text-xs text-zinc-400">km/h</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-sans">
                    Emergency Beacon ON
                  </span>
                </div>
              </div>

              {/* Bold Route Card */}
              <div className="p-4 rounded-2xl bg-obsidian-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Compass className="w-4 h-4 text-tactical-orange animate-spin" />
                    <span>Active Route Navigation</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Live GPS</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-tactical-orange mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-mono">Current Pickup:</span>
                      <span className="font-semibold text-white">{assignedPatient.locationName}</span>
                    </div>
                  </div>

                  <div className="w-0.5 h-4 bg-zinc-700 ml-1" />

                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-mono">Destination:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                        {assignedHospital?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flood Hazard Alert on Route */}
                {isFloodActive && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-[11px] text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-red-300 font-mono">HAZARD DIVERSION:</strong>
                      Causeway to Hospital A submerged (+1.8m). Re-routed via Eastern Expressway.
                    </div>
                  </div>
                )}
              </div>

              {/* Handover OTP Card */}
              <div className="p-3.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-tactical-orange">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                      Driver Intake OTP
                    </span>
                    <span className="text-lg font-mono font-extrabold text-white tracking-widest">
                      {assignedPatient.driverOtp}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-400 max-w-[90px] text-right">
                  Show to intake nurse
                </span>
              </div>
            </div>

            {/* Bottom Status Pill */}
            <div className="pt-2 text-center text-[10px] text-zinc-500 font-mono border-t border-white/5">
              Unit {currentAmbulance.code} • ReliefGrid Telematics v2.1
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
