import React, { useState, useRef } from 'react';
import { useReliefGridStore } from '../store';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ambulance as AmbulanceIcon,
  Building2,
  QrCode,
  KeyRound,
  FileCheck2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type { DeliveryStep } from '../types';

export const DeliveryTrail: React.FC = () => {
  const {
    patients,
    hospitals,
    selectedTrailPatientId,
    setSelectedTrailPatientId,
    advanceDeliveryStep,
    submitDriverOtp,
    setActiveTab,
    selectReceipt,
    receipts,
    lastHandoverSuccessPatientId,
    addToast,
  } = useReliefGridStore();

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const patient =
    patients.find((p) => p.id === selectedTrailPatientId) ||
    patients.find((p) => p.status === 'dispatched' || p.status === 'verified') ||
    patients[0];

  const assignedHosp = hospitals.find((h) => h.id === patient?.assignedHospitalId);

  const steps: { id: DeliveryStep; label: string; description: string }[] = [
    { id: 'allocated', label: 'Allocated', description: 'Deterministic engine matching' },
    { id: 'dispatched', label: 'Dispatched', description: 'Ambulance en route' },
    { id: 'received', label: 'Received', description: 'Hospital bay arrival & OTP' },
    { id: 'verified', label: 'Verified', description: 'Cryptographic receipt anchored' },
  ];

  const currentStep = patient?.currentStep || (patient?.status === 'verified' ? 'verified' : patient?.status === 'dispatched' ? 'dispatched' : 'allocated');

  const stepOrder: Record<DeliveryStep, number> = {
    allocated: 0,
    dispatched: 1,
    received: 2,
    verified: 3,
  };

  const currentStepIndex = stepOrder[currentStep];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    if (!patient?.driverOtp) return;
    const digits = patient.driverOtp.split('');
    setOtpDigits(digits);
    addToast('OTP Autofilled', `Driver code ${patient.driverOtp} entered. Click Verify Transfer.`, 'info');
  };

  const handleConfirmOtp = async () => {
    if (!patient) return;
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      addToast('Incomplete Code', 'Please enter all 6 digits of the driver OTP.', 'warning');
      return;
    }

    setIsVerifying(true);
    const success = await submitDriverOtp(patient.id, fullOtp);
    setIsVerifying(false);

    if (success) {
      setOtpDigits(['', '', '', '', '', '']);
    }
  };

  const matchingReceipt = receipts.find((r) => r.patientRef === patient?.code);

  const qrPayload = JSON.stringify({
    ref: patient?.code,
    amb: patient?.assignedAmbulanceId,
    hosp: assignedHosp?.code,
    otp: patient?.driverOtp,
    ts: patient?.timestamps?.dispatched || new Date().toISOString(),
  });

  return (
    <div className="w-full h-full p-6 overflow-y-auto max-w-6xl mx-auto space-y-6 bg-vantablack">
      {/* Top Header & Patient Selector */}
      <div className="command-panel p-5 rounded-2xl border border-white/10 shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/10 text-tactical-orange">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              Delivery Trail & Chain of Custody
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Real-time physical hand-off verification with driver OTP manifest and immutable audit trail.
          </p>
        </div>

        {/* Patient Case Selector Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-zinc-400">Select Mission:</span>
          {patients.map((p) => {
            const isSelected = p.id === patient?.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedTrailPatientId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-tactical-orange text-black border-orange-400'
                    : 'bg-obsidian-900 text-zinc-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{p.code}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    p.status === 'verified'
                      ? 'bg-emerald-400'
                      : p.status === 'dispatched'
                      ? 'bg-tactical-orange animate-pulse'
                      : 'bg-zinc-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {patient && (
        <div
          className={`command-panel p-6 rounded-2xl border transition-all duration-300 space-y-8 shadow-panel ${
            lastHandoverSuccessPatientId === patient.id
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-white/10'
          }`}
        >
          {/* Mission Meta Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-obsidian-900 border border-white/5">
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${
                  patient.triage === 'RED'
                    ? 'bg-red-500/10 text-rose-300 border-rose-500/30'
                    : patient.triage === 'YELLOW'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {patient.triage} PRIORITY
              </span>
              <div>
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <span>{patient.code}</span>
                  <span className="text-zinc-400 text-xs font-normal">
                    ({patient.condition})
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Origin: {patient.locationName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <AmbulanceIcon className="w-4 h-4 text-tactical-orange" />
                <span className="text-zinc-400">
                  Unit: <strong className="text-white">{patient.assignedAmbulanceId || 'Unassigned'}</strong>
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">
                  Destination: <strong className="text-white">{assignedHosp?.name || 'TBD'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 1. HORIZONTAL STEPPER */}
          <div className="relative py-4 px-2 sm:px-6">
            <div className="absolute top-1/2 left-10 right-10 -translate-y-4 h-0.5 bg-zinc-800 z-0" />

            <div
              className="absolute top-1/2 left-10 -translate-y-4 h-0.5 bg-tactical-orange z-0 transition-all duration-300"
              style={{
                width: `${(currentStepIndex / 3) * 85}%`,
              }}
            />

            <div className="relative z-10 flex items-center justify-between">
              {steps.map((s, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                const stepTimestamp = patient.timestamps?.[s.id];

                return (
                  <div key={s.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all duration-200 border ${
                        isCurrent
                          ? 'bg-tactical-orange text-black border-white shadow-sm'
                          : isPassed
                          ? 'bg-white text-black border-white'
                          : 'bg-black text-zinc-600 border-zinc-800'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>0{idx + 1}</span>
                      )}
                    </div>

                    <div className="text-center mt-3 space-y-0.5">
                      <span
                        className={`text-xs font-mono font-bold block tracking-wide uppercase ${
                          isCurrent
                            ? 'text-tactical-orange'
                            : isPassed
                            ? 'text-white'
                            : 'text-zinc-600'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-sans">
                        {s.description}
                      </span>
                      {stepTimestamp && (
                        <div className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{stepTimestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Interactive Handover Section */}
          {patient.status === 'dispatched' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/10 font-mono">
              {/* Driver Card & QR Code */}
              <div className="command-panel-sub p-5 rounded-2xl border border-white/10 space-y-4 bg-obsidian-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-tactical-orange" />
                    <h4 className="font-bold text-white text-xs uppercase">
                      Driver Manifest Card (Demo)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black text-zinc-400 border border-white/10">
                    Unit: {patient.assignedAmbulanceId}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-black border border-white/5">
                  <div className="p-2 bg-white rounded-lg shrink-0">
                    <QRCodeSVG
                      value={qrPayload}
                      size={110}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-[10px] text-zinc-500 uppercase block">
                      Transfer Auth Code:
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-2xl font-mono font-extrabold tracking-widest text-tactical-orange bg-obsidian-900 px-3 py-1 rounded-lg border border-white/10">
                        {patient.driverOtp}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(patient.driverOtp || '');
                          addToast('Copied', `OTP ${patient.driverOtp} copied`, 'info');
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                        title="Copy OTP"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Presented by paramedic upon arrival at {assignedHosp?.name} emergency intake.
                    </p>
                  </div>
                </div>

                {currentStep === 'dispatched' && (
                  <button
                    onClick={() => advanceDeliveryStep(patient.id, 'received')}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-obsidian-850 hover:bg-obsidian-800 text-white transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    <Building2 className="w-4 h-4 text-zinc-400" />
                    <span>Simulate Ambulance Arrival at Hospital Bay</span>
                  </button>
                )}
              </div>

              {/* Receiving Nurse 6-Box OTP Verification Input */}
              <div className="command-panel-sub p-5 rounded-2xl border border-white/10 space-y-4 bg-obsidian-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-tactical-orange" />
                    <h4 className="font-bold text-white text-xs uppercase">
                      Hospital Triage OTP Verification
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Step: Received → Verified
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans">
                  Enter the 6-digit confirmation code provided by the ambulance paramedic to certify physical bed handover.
                </p>

                {/* 6-box input */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-mono font-bold bg-black border border-white/20 focus:border-tactical-orange rounded-xl text-white outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleAutoFillOtp}
                    className="py-2 px-3 rounded-xl text-xs font-medium bg-black hover:bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    Auto-fill Manifest Code
                  </button>

                  <button
                    onClick={handleConfirmOtp}
                    disabled={isVerifying}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-black transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isVerifying ? 'Verifying...' : 'Verify Transfer & Anchor'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Verified State Card */}
          {patient.status === 'verified' && (
            <div className="p-6 rounded-2xl bg-obsidian-900 border border-emerald-500/30 space-y-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-white">
                  Physical Chain of Custody Confirmed
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto font-sans">
                  Patient handover successfully executed at {assignedHosp?.name}. One-time token verified and anchored to canonical ledger.
                </p>
              </div>

              {matchingReceipt && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono">
                  <div className="text-xs text-zinc-400 bg-black px-3 py-1.5 rounded-lg border border-white/10">
                    Receipt: <strong className="text-white">{matchingReceipt.id}</strong> • Hash: <span className="text-zinc-300">{matchingReceipt.hash.slice(0, 16)}...</span>
                  </div>

                  <button
                    onClick={() => {
                      selectReceipt(matchingReceipt.id);
                      setActiveTab('audit');
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                  >
                    <span>View in Audit Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending state guidance */}
          {patient.status === 'pending' && (
            <div className="p-4 rounded-xl bg-obsidian-900 border border-white/10 flex items-center justify-between text-xs text-zinc-300 font-mono">
              <div className="flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 text-tactical-orange shrink-0" />
                <span>
                  This mission is currently waiting for human dispatcher authorization in the queue.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('dispatch')}
                className="px-3 py-1 rounded-lg bg-zinc-100 text-black font-bold hover:bg-white transition-colors"
              >
                Go to Dispatch Queue →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
