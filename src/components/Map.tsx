import React, { useMemo, useState, useEffect } from 'react';
import { useReliefGridStore } from '../store';
import { AlertTriangle, Waves, X, Info } from 'lucide-react';

export const Map: React.FC = () => {
  const {
    hospitals,
    patients,
    ambulances,
    isFloodActive,
    bedMigration,
    isBaselineMode,
    allocationPlans,
  } = useReliefGridStore();

  const [activeTooltip, setActiveTooltip] = useState<{
    type: 'patient' | 'hospital' | 'ambulance';
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Animation ticker for moving ambulances along roads
  const [animProgress, setAnimProgress] = useState(0.4);

  useEffect(() => {
    let frameId: number;
    const updateAnim = () => {
      setAnimProgress((prev) => (prev >= 1 ? 0.05 : prev + 0.003));
      frameId = requestAnimationFrame(updateAnim);
    };
    frameId = requestAnimationFrame(updateAnim);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Compute active route paths for ambulances
  const activeRoutes = useMemo(() => {
    return patients
      .filter((p) => p.status === 'dispatched' || p.status === 'verified')
      .map((p) => {
        const amb = ambulances.find((a) => a.id === p.assignedAmbulanceId);
        const hosp = hospitals.find((h) => h.id === p.assignedHospitalId);
        if (!amb || !hosp) return null;

        const midX = (p.location.x + hosp.location.x) / 2 + (hosp.code === 'B' ? 40 : -30);
        const midY = (p.location.y + hosp.location.y) / 2 - 40;
        const pathD = `M ${p.location.x},${p.location.y} Q ${midX},${midY} ${hosp.location.x},${hosp.location.y}`;

        return {
          patientId: p.id,
          ambulanceId: amb.id,
          pathD,
          triage: p.triage,
          isRerouted: isFloodActive && hosp.code === 'B',
        };
      })
      .filter(Boolean);
  }, [patients, ambulances, hospitals, isFloodActive]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* SVG Canvas */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="gridDots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="rgba(255, 255, 255, 0.08)" />
          </pattern>
        </defs>

        {/* 1. Base Vantablack Canvas */}
        <rect width="1000" height="650" fill="#000000" />
        <rect width="1000" height="650" fill="url(#gridDots)" />

        {/* Topographic elevation contours: North Heights around Hosp B */}
        <path
          d="M 620,80 Q 750,50 880,90 Q 940,160 880,240 Q 720,260 620,200 Z"
          fill="#080808"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />

        {/* 2. Water Bodies (Mithi River & Arabian Sea Bay) - Minimalist Dark Slate */}
        <path
          d="M 0,0 L 260,0 C 230,120 180,200 240,320 C 280,400 190,520 170,650 L 0,650 Z"
          fill="#050505"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        <path
          d="M 230,270 C 310,290 350,340 370,390 C 390,440 360,540 330,650 L 270,650 C 300,550 320,440 300,400 C 270,360 210,320 180,310 Z"
          fill="#050505"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        {/* 3. Urban Districts Footprints */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" fill="#0D0D0D">
          <rect x="180" y="80" width="35" height="45" rx="2" />
          <rect x="230" y="90" width="40" height="30" rx="2" />
          <rect x="440" y="220" width="50" height="40" rx="2" />
          <rect x="500" y="240" width="60" height="35" rx="2" />
          <rect x="370" y="380" width="30" height="45" rx="2" />
          <rect x="420" y="410" width="50" height="30" rx="2" />
          <rect x="550" y="340" width="70" height="50" rx="2" />
          <rect x="630" y="360" width="60" height="40" rx="2" />
          <rect x="780" y="420" width="40" height="35" rx="2" />
          <rect x="840" y="430" width="45" height="30" rx="2" />
        </g>

        {/* 4. Secondary Street Network */}
        <g stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="3 3">
          <line x1="410" y1="360" x2="480" y2="280" />
          <line x1="480" y1="280" x2="640" y2="270" />
          <line x1="410" y1="360" x2="580" y2="410" />
          <line x1="410" y1="360" x2="360" y2="470" />
          <line x1="580" y1="410" x2="640" y2="270" />
          <line x1="580" y1="410" x2="830" y2="480" />
        </g>

        {/* 5. Major Arterial Expressways */}
        {/* Road 2: To Hospital B */}
        <path
          d="M 410,360 Q 560,240 740,150"
          fill="none"
          stroke="#1F1F1F"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 410,360 Q 560,240 740,150"
          fill="none"
          stroke="#404040"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Road 3: To Hospital C */}
        <path
          d="M 410,360 Q 620,440 830,480"
          fill="none"
          stroke="#1F1F1F"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 410,360 Q 620,440 830,480"
          fill="none"
          stroke="#404040"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Road 1: Causeway to Hospital A (Flood Risk) */}
        <path
          d="M 410,360 Q 300,280 220,190"
          fill="none"
          stroke="#1F1F1F"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {!isFloodActive && (
          <path
            d="M 410,360 Q 300,280 220,190"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}

        {/* FLOOD CONDITION ON ROAD A */}
        {isFloodActive && (
          <g>
            <path
              d="M 410,360 Q 300,280 220,190"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="3.5"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
            {/* Minimalist tactical warning plaque */}
            <g transform="translate(260, 260)">
              <rect
                x="-5"
                y="-14"
                width="175"
                height="28"
                rx="6"
                fill="#1A050A"
                stroke="#F43F5E"
                strokeWidth="1"
              />
              <text
                x="8"
                y="4"
                fill="#FDA4AF"
                fontSize="10"
                fontWeight="700"
                fontFamily="Space Mono"
              >
                ROAD IMPASSABLE (1.8M)
              </text>
            </g>
          </g>
        )}

        {/* Active Dispatched Routes */}
        {activeRoutes.map((route) => {
          if (!route) return null;
          return (
            <path
              key={`route-${route.patientId}`}
              d={route.pathD}
              fill="none"
              stroke={route.triage === 'RED' ? '#F43F5E' : '#FF5500'}
              strokeWidth={route.isRerouted ? '3' : '2'}
              strokeDasharray="6 4"
            />
          );
        })}

        {/* Baseline Mode: Ambulance Stuck Marker */}
        {isBaselineMode && isFloodActive && (
          <g transform="translate(310, 280)">
            <circle r="12" fill="#2E050D" stroke="#F43F5E" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="Space Mono" fontWeight="bold">
              STUCK
            </text>
            <rect x="-70" y="16" width="140" height="20" rx="4" fill="#0A0A0A" stroke="#F43F5E" strokeWidth="0.8" />
            <text x="0" y="30" textAnchor="middle" fill="#F43F5E" fontSize="9" fontFamily="Space Mono">
              Baseline: Trapped in flood
            </text>
          </g>
        )}

        {/* Reserved Bed Migration Arc (A -> B) */}
        {bedMigration && isFloodActive && (
          <g>
            <path
              d="M 220,190 Q 480,70 740,150"
              fill="none"
              stroke="#FF5500"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <g transform="translate(480, 110)">
              <rect
                x="-75"
                y="-12"
                width="150"
                height="24"
                rx="6"
                fill="#120600"
                stroke="#FF5500"
                strokeWidth="1"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#FF7733"
                fontSize="9"
                fontWeight="700"
                fontFamily="Space Mono"
              >
                ICU BED RE-ALLOCATED A→B
              </text>
            </g>
          </g>
        )}

        {/* 6. Hospitals (Minimalist Monochromatic Glyph Cards) */}
        {hospitals.map((hosp) => (
          <g
            key={hosp.id}
            transform={`translate(${hosp.location.x}, ${hosp.location.y})`}
            className="cursor-pointer transition-opacity duration-150 hover:opacity-95"
            onClick={() =>
              setActiveTooltip({
                type: 'hospital',
                id: hosp.id,
                x: hosp.location.x,
                y: hosp.location.y,
              })
            }
          >
            <rect
              x="-60"
              y="-40"
              width="120"
              height="74"
              rx="8"
              fill="#0A0A0A"
              stroke={hosp.roadAccessBlocked ? '#F43F5E' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth="1.2"
            />

            <circle
              cx="0"
              cy="-20"
              r="11"
              fill="#121212"
              stroke={hosp.roadAccessBlocked ? '#F43F5E' : '#FFFFFF'}
              strokeWidth="1"
            />
            {/* Cross */}
            <path
              d="M -1,-25 L 1,-25 L 1,-21 L 5,-21 L 5,-19 L 1,-19 L 1,-15 L -1,-15 L -1,-19 L -5,-19 L -5,-21 L -1,-21 Z"
              fill="#FFFFFF"
            />

            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="700"
              fontFamily="Space Grotesk"
            >
              Hosp {hosp.code}
            </text>

            <text
              x="0"
              y="11"
              textAnchor="middle"
              fill={hosp.roadAccessBlocked ? '#F43F5E' : '#71717A'}
              fontSize="9"
              fontFamily="Space Mono"
            >
              {hosp.roadAccessBlocked ? 'ROAD BLOCKED' : `${hosp.baseTravelTimeMin}m ETA`}
            </text>

            {/* Bed pips */}
            <g transform="translate(0, 22)">
              {Array.from({ length: Math.min(8, hosp.totalIcuBeds) }).map((_, i) => {
                const pipX = (i - Math.min(8, hosp.totalIcuBeds) / 2) * 8 + 4;
                let pipColor = '#10B981';

                if (i < hosp.occupiedIcuBeds) {
                  pipColor = '#27272A';
                } else if (i < hosp.occupiedIcuBeds + hosp.reservedIcuBeds) {
                  pipColor = '#FF5500';
                }

                return (
                  <circle
                    key={i}
                    cx={pipX}
                    cy="0"
                    r="2.5"
                    fill={pipColor}
                  />
                );
              })}
            </g>
          </g>
        ))}

        {/* 7. Patients */}
        {patients.map((patient) => {
          const triageColor =
            patient.triage === 'RED'
              ? '#F43F5E'
              : patient.triage === 'YELLOW'
              ? '#F59E0B'
              : '#10B981';

          return (
            <g
              key={patient.id}
              transform={`translate(${patient.location.x}, ${patient.location.y})`}
              className="cursor-pointer"
              onClick={() =>
                setActiveTooltip({
                  type: 'patient',
                  id: patient.id,
                  x: patient.location.x,
                  y: patient.location.y,
                })
              }
            >
              <circle
                r="10"
                fill="#000000"
                stroke={triageColor}
                strokeWidth="2"
              />
              <circle r="4" fill={triageColor} />

              {/* Patient Badge */}
              <g transform="translate(0, -18)">
                <rect
                  x="-28"
                  y="-10"
                  width="56"
                  height="16"
                  rx="4"
                  fill="#0A0A0A"
                  stroke={triageColor}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="Space Mono"
                >
                  {patient.code}
                </text>
              </g>

              {/* Deadline pip */}
              <g transform="translate(0, 16)">
                <rect
                  x="-20"
                  y="-7"
                  width="40"
                  height="13"
                  rx="3"
                  fill="#000000"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#A1A1AA"
                  fontSize="8"
                  fontFamily="Space Mono"
                >
                  {patient.minutesLeft}m
                </text>
              </g>
            </g>
          );
        })}

        {/* 8. Ambulances */}
        {ambulances.map((amb) => {
          const isAssigned = amb.status !== 'idle';
          const patient = patients.find((p) => p.assignedAmbulanceId === amb.id);
          const hosp = hospitals.find((h) => h.id === amb.destinationHospitalId);

          let displayX = amb.location.x;
          let displayY = amb.location.y;

          if (isAssigned && patient && hosp) {
            displayX =
              patient.location.x +
              (hosp.location.x - patient.location.x) * animProgress;
            displayY =
              patient.location.y +
              (hosp.location.y - patient.location.y) * animProgress;
          }

          return (
            <g
              key={amb.id}
              transform={`translate(${displayX}, ${displayY})`}
              className="cursor-pointer"
              onClick={() =>
                setActiveTooltip({
                  type: 'ambulance',
                  id: amb.id,
                  x: displayX,
                  y: displayY,
                })
              }
            >
              <circle
                r="9"
                fill="#FF5500"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <path
                d="M -1,-3 L 1,-3 L 1,-1 L 3,-1 L 3,1 L 1,1 L 1,3 L -1,3 L -1,1 L -3,1 L -3,-1 L -1,-1 Z"
                fill="#000000"
              />
              <g transform="translate(0, 14)">
                <rect
                  x="-20"
                  y="-6"
                  width="40"
                  height="12"
                  rx="3"
                  fill="#0D0D0D"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.6"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="Space Mono"
                >
                  {amb.code}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating Detail Tooltip Card */}
      {activeTooltip && (
        <div
          className="absolute z-30 command-panel p-3 rounded-xl border border-white/20 shadow-2xl max-w-xs text-xs pointer-events-auto bg-obsidian-950 font-mono"
          style={{
            left: `${Math.min(75, Math.max(15, (activeTooltip.x / 1000) * 100))}%`,
            top: `${Math.min(75, Math.max(15, (activeTooltip.y / 650) * 100))}%`,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10">
            <span className="font-bold text-white uppercase text-[10px] flex items-center gap-1">
              <Info className="w-3 h-3 text-tactical-orange" />
              {activeTooltip.type}
            </span>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {activeTooltip.type === 'patient' && (() => {
            const p = patients.find((pat) => pat.id === activeTooltip.id);
            const plan = p ? allocationPlans[p.id] : null;
            if (!p) return null;
            return (
              <div className="space-y-1 font-sans text-xs">
                <div className="font-bold text-white font-mono">{p.code} • {p.condition}</div>
                <div className="text-zinc-400 font-mono">Triage: <strong className="text-tactical-orange">{p.triage}</strong> ({p.minutesLeft}m deadline)</div>
                <div className="text-zinc-500 text-[11px]">{p.locationName}</div>
                {plan && (
                  <div className="pt-1 mt-1 border-t border-white/5 text-[11px] text-zinc-300 font-mono">
                    Target: {plan.hospitalId || 'Unassigned'} • ETA: {plan.totalEtaMin}m
                  </div>
                )}
              </div>
            );
          })()}

          {activeTooltip.type === 'hospital' && (() => {
            const h = hospitals.find((hosp) => hosp.id === activeTooltip.id);
            if (!h) return null;
            return (
              <div className="space-y-1 font-mono text-xs">
                <div className="font-bold text-white">{h.name}</div>
                <div className="text-zinc-400">ICU: {h.freeIcuBeds} Free / {h.reservedIcuBeds} Res / {h.occupiedIcuBeds} Occ</div>
                <div className="text-zinc-500">Access: {h.roadAccessBlocked ? 'BLOCKED' : 'CLEAR'}</div>
              </div>
            );
          })()}

          {activeTooltip.type === 'ambulance' && (() => {
            const a = ambulances.find((amb) => amb.id === activeTooltip.id);
            if (!a) return null;
            return (
              <div className="space-y-1 font-mono text-xs">
                <div className="font-bold text-white">Unit {a.code}</div>
                <div className="text-zinc-400">Status: {a.status}</div>
                {a.assignedPatientId && (
                  <div className="text-zinc-500">Patient: {a.assignedPatientId}</div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating Tactical Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="command-panel px-3 py-2 rounded-xl text-xs flex items-center gap-3 text-zinc-400 font-mono bg-obsidian-950/90 border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-triage-red" />
            <span className="text-zinc-200">RED (Immediate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-triage-yellow" />
            <span className="text-zinc-200">YELLOW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-triage-green" />
            <span className="text-zinc-200">GREEN</span>
          </div>
        </div>

        <div
          className={`command-panel px-3 py-2 rounded-xl text-xs flex items-center justify-between border font-mono ${
            isFloodActive
              ? 'border-red-500/40 bg-red-950/20 text-red-300'
              : 'border-white/10 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isFloodActive ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Waves className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-semibold text-[11px]">
              {isFloodActive ? 'CAUSEWAY SUBMERGED' : 'ROADS CLEAR'}
            </span>
          </div>
          <span className="text-[10px] bg-black px-1.5 py-0.5 rounded text-zinc-400 ml-2">
            {isFloodActive ? 'HOSP A OFFLINE' : 'ALL NODES OPEN'}
          </span>
        </div>
      </div>
    </div>
  );
};
