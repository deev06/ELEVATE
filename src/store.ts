import { create } from 'zustand';
import type {
  Patient,
  Hospital,
  Ambulance,
  RoadLink,
  AllocationPlan,
  EventLogItem,
  ToastMessage,
  DeliveryReceipt,
  DeliveryStep,
  TriageLevel,
} from './types';
import {
  INITIAL_PATIENTS,
  INITIAL_HOSPITALS,
  INITIAL_AMBULANCES,
  INITIAL_ROAD_LINKS,
  INITIAL_RECEIPTS,
} from './seed';
import { runAllocationEngine } from './engine';
import {
  hashReceipt,
  buildMerkleTree,
  canonicalJsonString,
  simpleSha256Hex,
} from './crypto';

export type ActiveTab = 'dispatch' | 'delivery-trail' | 'audit' | 'driver-app' | 'compare';

export interface BedMigrationAnimation {
  fromHospId: string;
  toHospId: string;
  timestamp: number;
}

export interface GuidedDemoState {
  isActive: boolean;
  step: number; // 1 to 5
  totalSteps: number;
  isPaused: boolean;
  caption: string;
  subcaption: string;
  autoPlayTimerId?: number;
}

interface ReliefGridState {
  // Navigation & Display Modes
  activeTab: ActiveTab;
  isPresentationMode: boolean;
  isBaselineMode: boolean; // Baseline vs ReliefGrid toggle
  showOnboarding: boolean;
  isSimulateDrawerOpen: boolean;

  // Domain Entities
  patients: Patient[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  roadLinks: RoadLink[];

  // Allocation Engine State
  isFloodActive: boolean;
  allocationPlans: Record<string, AllocationPlan>;
  lastReplanDurationMs: number;
  bedMigration: BedMigrationAnimation | null;

  // Phase 2: Delivery Trail & Cryptographic Audit
  receipts: DeliveryReceipt[];
  merkleRoot: string;
  merkleTreeLevels: string[][];
  selectedReceiptId: string | null;
  selectedTrailPatientId: string;
  lastHandoverSuccessPatientId: string | null;
  tamperedReceiptId: string | null;

  // Phase 3: Driver App & Simulation
  selectedDriverAmbulanceId: string;
  isSmsFallbackActive: boolean;

  // Logs & Toasts
  eventLogs: EventLogItem[];
  toasts: ToastMessage[];

  // Guided Demo (45-second interactive story)
  guidedDemo: GuidedDemoState;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  togglePresentationMode: () => void;
  toggleBaselineMode: () => void;
  dismissOnboarding: () => void;
  toggleSimulateDrawer: () => void;
  toggleFlood: () => void;
  approveRecommendation: (patientId: string) => Promise<void>;
  rejectRecommendation: (patientId: string) => void;
  updateHospitalBedCount: (hospitalId: string, delta: number) => void;
  resetDemo: () => void;
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Phase 2 Actions: Delivery Trail & Audit
  setSelectedTrailPatientId: (patientId: string) => void;
  advanceDeliveryStep: (patientId: string, step: DeliveryStep) => void;
  submitDriverOtp: (patientId: string, otp: string) => Promise<boolean>;
  selectReceipt: (receiptId: string) => void;
  verifyReceipt: (receiptId: string) => Promise<boolean>;
  tamperReceipt: (receiptId: string) => void;
  restoreReceipt: (receiptId: string) => void;

  // Phase 3 Actions: Simulation & Driver App
  setSelectedDriverAmbulanceId: (id: string) => void;
  toggleSmsFallback: () => void;
  setHospitalBBedsToZero: () => void;
  addNewPatient: (triage: TriageLevel, condition: string, deadlineMin: number) => void;

  // Guided Demo Actions
  startGuidedDemo: () => void;
  stopGuidedDemo: () => void;
  nextGuidedDemoStep: () => void;
  prevGuidedDemoStep: () => void;
  togglePauseGuidedDemo: () => void;

  // Re-run Engine Helper
  runEngine: () => void;
  recomputeMerkleRoot: () => Promise<void>;
}

function getFormattedTime(): string {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Flood Hits City Causeway',
    caption: 'Rising storm surge breaches the Mithi Causeway, completely flooding and blocking the primary arterial road to Hospital A.',
    subcaption: 'Observation: Hospital A becomes inaccessible to all emergency vehicles.',
  },
  {
    step: 2,
    title: 'ReliefGrid Deterministic Re-plan',
    caption: 'Allocation engine re-evaluates all 5 patients in <1s. RED critical trauma is re-routed from Hospital A to Hospital B with an ICU bed reserved.',
    subcaption: 'Key Rule: Only RED patients reserve ICU beds; a 5-minute stability penalty prevents ping-pong re-routing.',
  },
  {
    step: 3,
    title: 'Human-in-the-Loop Dispatcher Approval',
    caption: 'Dispatcher reviews transparent algorithmic reasoning ("Why this?") and approves the optimal dispatch recommendation.',
    subcaption: 'Human Oversight: Nothing dispatches without human authorization; rejected options compute the next best route.',
  },
  {
    step: 4,
    title: 'Hand-over Confirmed with Driver OTP',
    caption: 'Ambulance reaches destination. Secure physical chain-of-custody hand-off confirmed via one-time cryptographically hashed OTP.',
    subcaption: 'Zero Patient PII: Medical record integrity is maintained strictly through verifiable credentials.',
  },
  {
    step: 5,
    title: 'Audit Portal Verification',
    caption: 'Immutable delivery receipt hashed with SHA-256 and committed to the Merkle tree for transparent, tamper-evident verification.',
    subcaption: 'Trust Architecture: Any retroactive record modification immediately triggers a cryptographic mismatch alert.',
  },
];

// Initial synchronous Merkle calculation for seed receipts
const initialHashes = INITIAL_RECEIPTS.map((r) => r.hash);
const initialCombined = simpleSha256Hex(initialHashes[0] + (initialHashes[1] || initialHashes[0]));

export const useReliefGridStore = create<ReliefGridState>((set, get) => {
  // Initial run of allocation engine
  const initialEngineRun = runAllocationEngine(
    INITIAL_PATIENTS,
    INITIAL_HOSPITALS,
    INITIAL_AMBULANCES,
    false
  );

  const initialPlansRecord: Record<string, AllocationPlan> = {};
  initialEngineRun.plans.forEach((plan, patientId) => {
    initialPlansRecord[patientId] = plan;
  });

  // Calculate free beds with reservations
  const hospitalsWithReservations = INITIAL_HOSPITALS.map((h) => {
    const reserved = initialEngineRun.hospitalReservedCounts[h.id] || 0;
    return {
      ...h,
      reservedIcuBeds: reserved,
      freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
    };
  });

  return {
    activeTab: 'dispatch',
    isPresentationMode: false,
    isBaselineMode: false,
    showOnboarding: true,
    isSimulateDrawerOpen: false,

    patients: INITIAL_PATIENTS,
    hospitals: hospitalsWithReservations,
    ambulances: INITIAL_AMBULANCES,
    roadLinks: INITIAL_ROAD_LINKS,

    isFloodActive: false,
    allocationPlans: initialPlansRecord,
    lastReplanDurationMs: initialEngineRun.replanDurationMs,
    bedMigration: null,

    // Phase 2: Delivery Trail & Cryptographic Audit
    receipts: INITIAL_RECEIPTS,
    merkleRoot: initialCombined,
    merkleTreeLevels: [initialHashes, [initialCombined]],
    selectedReceiptId: INITIAL_RECEIPTS[0].id,
    selectedTrailPatientId: 'P-101',
    lastHandoverSuccessPatientId: null,
    tamperedReceiptId: null,

    // Phase 3: Driver App & Simulation
    selectedDriverAmbulanceId: 'Amb-01',
    isSmsFallbackActive: false,

    eventLogs: [
      {
        id: 'log-001',
        timestamp: getFormattedTime(),
        type: 'system',
        title: 'System Initialized',
        details: 'ReliefGrid command center online. 5 triage patients, 4 ambulances, 3 hospital nodes loaded.',
        badge: 'READY',
        badgeColor: 'blue',
      },
      {
        id: 'log-002',
        timestamp: getFormattedTime(),
        type: 'replan',
        title: 'Initial Dispatch Plan Computed',
        details: `Engine calculated 5 candidate assignments in ${initialEngineRun.replanDurationMs}ms. Hospital A prioritized as nearest node.`,
        badge: 'OPTIMAL',
        badgeColor: 'green',
      },
      {
        id: 'log-003',
        timestamp: getFormattedTime(),
        type: 'crypto',
        title: 'Merkle Tree Anchored',
        details: `Root ${initialCombined.slice(0, 16)}... committed with 2 genesis deliveries.`,
        badge: 'VERIFIED',
        badgeColor: 'green',
      },
    ],

    toasts: [
      {
        id: 'toast-init',
        title: 'ReliefGrid System Online',
        message: 'Mumbai Flood scenario ready. Click "Trigger flood" to test real-time re-allocation.',
        type: 'info',
        timestamp: Date.now(),
      },
    ],

    guidedDemo: {
      isActive: false,
      step: 1,
      totalSteps: 5,
      isPaused: false,
      caption: DEMO_STEPS[0].caption,
      subcaption: DEMO_STEPS[0].subcaption,
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    togglePresentationMode: () => {
      set((state) => {
        const next = !state.isPresentationMode;
        get().addToast(
          next ? 'Presentation Mode Active' : 'Standard View Restored',
          next ? 'Enlarged controls and high contrast enabled for projector view.' : 'Command panels expanded.',
          'info'
        );
        return { isPresentationMode: next };
      });
    },

    toggleBaselineMode: () => {
      set((state) => {
        const next = !state.isBaselineMode;
        get().addToast(
          next ? 'Nearest-Hospital Baseline Active' : 'ReliefGrid Active',
          next
            ? 'Warning: Baseline routes blindly to nearest Hospital A regardless of flood or bed saturation.'
            : 'ReliefGrid intelligent dynamic re-routing restored.',
          next ? 'warning' : 'success'
        );
        return { isBaselineMode: next };
      });
    },

    dismissOnboarding: () => set({ showOnboarding: false }),

    toggleSimulateDrawer: () => set((s) => ({ isSimulateDrawerOpen: !s.isSimulateDrawerOpen })),

    setSelectedDriverAmbulanceId: (id) => set({ selectedDriverAmbulanceId: id }),

    toggleSmsFallback: () => {
      set((s) => {
        const next = !s.isSmsFallbackActive;
        get().addToast(
          next ? 'SMS Fallback Protocol Engaged' : 'Broadband Data Link Restored',
          next ? 'Low-bandwidth ASCII mode active. Turn-by-turn dispatched via GSM cell broadcast.' : 'Full vector UI active.',
          next ? 'warning' : 'info'
        );
        return { isSmsFallbackActive: next };
      });
    },

    // Phase 3: Set Hospital B beds to 0 (watch re-plan to C or EOC)
    setHospitalBBedsToZero: () => {
      const state = get();
      const updatedHospitals = state.hospitals.map((h) => {
        if (h.code === 'B') {
          return {
            ...h,
            occupiedIcuBeds: h.totalIcuBeds, // 10/10 saturated
            freeIcuBeds: 0,
          };
        }
        return h;
      });

      const newLog: EventLogItem = {
        id: `log-sim-${Date.now()}`,
        timestamp: getFormattedTime(),
        type: 'bed_update',
        title: 'SIMULATION: Hospital B ICU Saturated (0 Free Beds)',
        details: 'Dispatcher forced Hospital B beds to 0. Engine recalculating: RED cases diverted to Hospital C or escalated to EOC.',
        badge: 'SATURATION',
        badgeColor: 'amber',
      };

      set((s) => ({
        hospitals: updatedHospitals,
        eventLogs: [newLog, ...s.eventLogs],
      }));

      // Re-run allocation engine immediately
      const engineResult = runAllocationEngine(
        state.patients,
        updatedHospitals,
        state.ambulances,
        state.isFloodActive
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, patientId) => {
        plansRecord[patientId] = plan;
      });

      const finalHospitals = updatedHospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      set({
        hospitals: finalHospitals,
        allocationPlans: plansRecord,
        lastReplanDurationMs: engineResult.replanDurationMs,
      });

      get().addToast(
        'Hospital B Beds Set to 0',
        'ICU capacity exhausted. Engine diverted patients to Hospital C or EOC.',
        'warning'
      );
    },

    // Phase 3: Inject New Patient
    addNewPatient: (triage: TriageLevel, condition: string, deadlineMin: number) => {
      const state = get();
      const newNum = state.patients.length + 1;
      const code = `${triage.slice(0, 3)}-${100 + newNum}`;
      const newPatient: Patient = {
        id: `P-${100 + newNum}`,
        code,
        triage,
        condition,
        deadlineMinutes: deadlineMin,
        minutesLeft: deadlineMin,
        location: { x: 500, y: 350 },
        locationName: `Sector ${newNum} (Emergency Influx)`,
        status: 'pending',
        rejectedHospitals: [],
        currentStep: 'allocated',
        timestamps: { allocated: getFormattedTime() },
        driverOtp: `${Math.floor(100000 + Math.random() * 900000)}`,
      };

      const updatedPatients = [...state.patients, newPatient];

      const newLog: EventLogItem = {
        id: `log-new-pat-${Date.now()}`,
        timestamp: getFormattedTime(),
        type: 'system',
        title: `New Incident Influx: ${code} (${triage})`,
        details: `${condition}. Deadline: ${deadlineMin}m. Added to triage priority queue.`,
        badge: 'NEW PATIENT',
        badgeColor: triage === 'RED' ? 'red' : 'amber',
      };

      set((s) => ({
        patients: updatedPatients,
        eventLogs: [newLog, ...s.eventLogs],
      }));

      // Re-run allocation engine immediately
      const engineResult = runAllocationEngine(
        updatedPatients,
        state.hospitals,
        state.ambulances,
        state.isFloodActive
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, patientId) => {
        plansRecord[patientId] = plan;
      });

      const finalHospitals = state.hospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      set({
        hospitals: finalHospitals,
        allocationPlans: plansRecord,
        lastReplanDurationMs: engineResult.replanDurationMs,
      });

      get().addToast(
        `New Patient Added: ${code}`,
        `${condition} (${triage}, ${deadlineMin}m deadline). Engine re-allocated in ${engineResult.replanDurationMs}ms.`,
        triage === 'RED' ? 'danger' : 'info'
      );
    },

    addToast: (title, message, type = 'info') => {
      const id = `toast-${Date.now()}-${Math.floor(performance.now() * 100)}`;
      set((state) => ({
        toasts: [...state.toasts.slice(-4), { id, title, message, type, timestamp: Date.now() }],
      }));
      setTimeout(() => {
        get().removeToast(id);
      }, 4500);
    },

    removeToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    // Re-run Engine and update all plans, beds, ambulances
    runEngine: () => {
      const state = get();
      const engineResult = runAllocationEngine(
        state.patients,
        state.hospitals,
        state.ambulances,
        state.isFloodActive
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, patientId) => {
        plansRecord[patientId] = plan;
      });

      // Update hospitals with new reserved counts
      const updatedHospitals = state.hospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      set({
        allocationPlans: plansRecord,
        hospitals: updatedHospitals,
        lastReplanDurationMs: engineResult.replanDurationMs,
      });
    },

    // Recompute Merkle root asynchronously with WebCrypto
    recomputeMerkleRoot: async () => {
      const state = get();
      const hashes = state.receipts.map((r) => r.hash);
      const tree = await buildMerkleTree(hashes);
      set({
        merkleRoot: tree.root,
        merkleTreeLevels: tree.treeLevels,
      });
    },

    // Trigger flood: block road to Hospital A
    toggleFlood: () => {
      const state = get();
      const nextFloodState = !state.isFloodActive;

      // Track bed migration from Hosp A to Hosp B if flood triggered
      const bedMigration: BedMigrationAnimation | null = nextFloodState
        ? {
            fromHospId: 'HOSP-A',
            toHospId: 'HOSP-B',
            timestamp: Date.now(),
          }
        : null;

      // Update road link status
      const updatedRoads = state.roadLinks.map((r) =>
        r.id === 'road-causeway-A' ? { ...r, isFlooded: nextFloodState } : r
      );

      // Update hospital A blocked status
      const updatedHospitals = state.hospitals.map((h) =>
        h.code === 'A' ? { ...h, roadAccessBlocked: nextFloodState } : h
      );

      // Re-run allocation engine with new flood state
      const engineResult = runAllocationEngine(
        state.patients,
        updatedHospitals,
        state.ambulances,
        nextFloodState
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, patientId) => {
        plansRecord[patientId] = plan;
      });

      // Update hospital reserved counts
      const finalHospitals = updatedHospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      // Log event
      const newLog: EventLogItem = nextFloodState
        ? {
            id: `log-${Date.now()}`,
            timestamp: getFormattedTime(),
            type: 'flood',
            title: 'CRITICAL: Causeway Flooded (Hospital A Cut Off)',
            details: `Water level +1.8m at Mithi Causeway. Hospital A road marked IMPASSABLE. ReliefGrid re-planned in ${engineResult.replanDurationMs}ms. Ambulances re-routed to Hospital B (+5m stability penalty applied).`,
            badge: 'FLOOD ALERT',
            badgeColor: 'red',
          }
        : {
            id: `log-${Date.now()}`,
            timestamp: getFormattedTime(),
            type: 'flood',
            title: 'Causeway Flood Receded',
            details: `Flood barrier drained. Hospital A access road reopened. Engine re-planned in ${engineResult.replanDurationMs}ms.`,
            badge: 'ROAD OPEN',
            badgeColor: 'green',
          };

      set((s) => ({
        isFloodActive: nextFloodState,
        roadLinks: updatedRoads,
        hospitals: finalHospitals,
        allocationPlans: plansRecord,
        lastReplanDurationMs: engineResult.replanDurationMs,
        bedMigration,
        eventLogs: [newLog, ...s.eventLogs],
      }));

      get().addToast(
        nextFloodState ? 'FLOOD EMERGENCY: Road to Hospital A Blocked!' : 'Flood Receded: Hospital A Road Reopened',
        nextFloodState
          ? `Engine re-planned in ${engineResult.replanDurationMs}ms. Critical patients automatically redirected to Hospital B.`
          : 'Shortest paths to Hospital A restored.',
        nextFloodState ? 'danger' : 'success'
      );
    },

    // Dispatcher Human-in-the-Loop: Approve
    approveRecommendation: async (patientId: string) => {
      const state = get();
      const patient = state.patients.find((p) => p.id === patientId);
      const plan = state.allocationPlans[patientId];

      if (!patient || !plan || plan.escalatedToEoc || !plan.ambulanceId || !plan.hospitalId) {
        return;
      }

      const assignedHosp = state.hospitals.find((h) => h.id === plan.hospitalId);
      const timeStr = getFormattedTime();

      // Update patient status and trail stepper
      const updatedPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'dispatched' as const,
            currentStep: 'dispatched' as DeliveryStep,
            assignedAmbulanceId: plan.ambulanceId!,
            assignedHospitalId: plan.hospitalId!,
            timestamps: {
              ...p.timestamps,
              dispatched: timeStr,
            },
          };
        }
        return p;
      });

      // Update ambulance status
      const updatedAmbulances = state.ambulances.map((a) => {
        if (a.id === plan.ambulanceId) {
          return {
            ...a,
            status: 'en_route_scene' as const,
            assignedPatientId: patientId,
            destinationHospitalId: plan.hospitalId!,
          };
        }
        return a;
      });

      // Generate verifiable receipt for this approved assignment
      const receiptId = `RCP-80${state.receipts.length + 1}`;
      const receiptData = {
        id: receiptId,
        patientRef: patient.code,
        resource: plan.ambulanceId,
        from: patient.locationName,
        to: assignedHosp?.name || 'Hospital',
        reason: plan.explanation,
        timestamp: new Date().toISOString(),
      };

      const computedHash = await hashReceipt(receiptData);

      const newReceipt: DeliveryReceipt = {
        ...receiptData,
        hash: computedHash,
        originalHash: computedHash,
        status: 'pending',
        driverOtp: patient.driverOtp,
      };

      const updatedReceipts = [newReceipt, ...state.receipts];

      // Rebuild Merkle Tree
      const tree = await buildMerkleTree(updatedReceipts.map((r) => r.hash));

      const newLog: EventLogItem = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        type: 'approval',
        title: `Dispatch Approved: ${patient.code} (${patient.triage})`,
        details: `Unit ${plan.ambulanceId} authorized to ${patient.locationName} -> ${assignedHosp?.name}. Total ETA: ${plan.totalEtaMin}m. Reserved bed confirmed. Receipt ${receiptId} generated with SHA-256 hash.`,
        badge: 'APPROVED',
        badgeColor: 'green',
      };

      const cryptoLog: EventLogItem = {
        id: `log-crypto-${Date.now()}`,
        timestamp: timeStr,
        type: 'crypto',
        title: `Receipt ${receiptId} Anchored to Merkle Root`,
        details: `Canonical Hash: ${computedHash.slice(0, 16)}... | Merkle Root updated: ${tree.root.slice(0, 16)}...`,
        badge: 'HASHED',
        badgeColor: 'blue',
      };

      set((s) => ({
        patients: updatedPatients,
        ambulances: updatedAmbulances,
        receipts: updatedReceipts,
        merkleRoot: tree.root,
        merkleTreeLevels: tree.treeLevels,
        selectedReceiptId: receiptId,
        selectedTrailPatientId: patientId,
        eventLogs: [cryptoLog, newLog, ...s.eventLogs],
      }));

      get().addToast(
        `Dispatch Approved: ${patient.code}`,
        `${plan.ambulanceId} en route to ${assignedHosp?.code}. Receipt ${receiptId} anchored.`,
        'success'
      );

      // Re-run allocation engine to compute next assignments
      get().runEngine();
    },

    // Dispatcher Human-in-the-Loop: Reject option and find next best
    rejectRecommendation: (patientId: string) => {
      const state = get();
      const patient = state.patients.find((p) => p.id === patientId);
      const currentPlan = state.allocationPlans[patientId];

      if (!patient || !currentPlan?.hospitalId) return;

      const rejectedHospitalId = currentPlan.hospitalId;
      const rejectedHosp = state.hospitals.find((h) => h.id === rejectedHospitalId);

      // Add to rejected hospitals list for this patient
      const updatedPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            rejectedHospitals: [...p.rejectedHospitals, rejectedHospitalId],
          };
        }
        return p;
      });

      // Re-run allocation engine
      const engineResult = runAllocationEngine(
        updatedPatients,
        state.hospitals,
        state.ambulances,
        state.isFloodActive
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, pid) => {
        plansRecord[pid] = plan;
      });

      const updatedHospitals = state.hospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      const newPlan = plansRecord[patientId];

      const newLog: EventLogItem = {
        id: `log-${Date.now()}`,
        timestamp: getFormattedTime(),
        type: 'rejection',
        title: `Option Rejected: ${patient.code} at ${rejectedHosp?.name}`,
        details: newPlan?.escalatedToEoc
          ? `No alternative hospitals reachable with open ICU beds. Escalated to EOC.`
          : `Dispatcher rejected ${rejectedHosp?.code}. Next best proposed: ${newPlan?.hospitalId} via ${newPlan?.ambulanceId} (ETA ${newPlan?.totalEtaMin}m).`,
        badge: 'RE-EVALUATED',
        badgeColor: 'amber',
      };

      set((s) => ({
        patients: updatedPatients,
        hospitals: updatedHospitals,
        allocationPlans: plansRecord,
        lastReplanDurationMs: engineResult.replanDurationMs,
        eventLogs: [newLog, ...s.eventLogs],
      }));

      get().addToast(
        `Rejected ${rejectedHosp?.code} for ${patient.code}`,
        newPlan?.escalatedToEoc
          ? 'No alternatives available. Escalated to EOC.'
          : `Next best option calculated: Hospital ${newPlan?.hospitalId}.`,
        'warning'
      );
    },

    // Phase 2: Delivery Trail & Stepper Progress
    setSelectedTrailPatientId: (patientId: string) => {
      set({ selectedTrailPatientId: patientId });
    },

    advanceDeliveryStep: (patientId: string, nextStep: DeliveryStep) => {
      const timeStr = getFormattedTime();
      set((state) => ({
        patients: state.patients.map((p) => {
          if (p.id === patientId) {
            return {
              ...p,
              currentStep: nextStep,
              timestamps: {
                ...p.timestamps,
                [nextStep]: timeStr,
              },
            };
          }
          return p;
        }),
      }));
    },

    // Phase 2: Confirm Hand-Over with 6-box Driver OTP
    submitDriverOtp: async (patientId: string, enteredOtp: string) => {
      const state = get();
      const patient = state.patients.find((p) => p.id === patientId);

      if (!patient) return false;

      // Validate OTP
      if (enteredOtp !== patient.driverOtp) {
        get().addToast('Invalid OTP', 'The 6-digit code does not match the driver manifest.', 'danger');
        return false;
      }

      const timeStr = getFormattedTime();

      // Update patient to verified arrival
      const updatedPatients = state.patients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'verified' as const,
            currentStep: 'verified' as DeliveryStep,
            enteredOtp,
            timestamps: {
              ...p.timestamps,
              received: p.timestamps?.received || timeStr,
              verified: timeStr,
            },
          };
        }
        return p;
      });

      // Update corresponding receipt to verified
      const updatedReceipts = state.receipts.map((r) => {
        if (r.patientRef === patient.code) {
          return {
            ...r,
            status: 'verified' as const,
            handoverTime: timeStr,
          };
        }
        return r;
      });

      // Trigger subtle green pulse (no confetti)
      set({
        patients: updatedPatients,
        receipts: updatedReceipts,
        lastHandoverSuccessPatientId: patientId,
      });

      // Reset pulse after 2 seconds
      setTimeout(() => {
        set({ lastHandoverSuccessPatientId: null });
      }, 2000);

      // Rebuild Merkle Tree
      await get().recomputeMerkleRoot();

      const newLog: EventLogItem = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        type: 'crypto',
        title: `Hand-over Verified: ${patient.code} via Driver OTP`,
        details: `OTP [${enteredOtp}] verified. Receipt committed to Merkle tree with immutable timestamp.`,
        badge: 'OTP VERIFIED',
        badgeColor: 'green',
      };

      set((s) => ({
        eventLogs: [newLog, ...s.eventLogs],
      }));

      get().addToast(
        'Hand-over Verified',
        `Physical transfer of ${patient.code} confirmed with Driver OTP. Delivery receipt anchored.`,
        'success'
      );

      return true;
    },

    // Phase 2: Audit Portal Actions
    selectReceipt: (receiptId: string) => {
      set({ selectedReceiptId: receiptId });
    },

    // Verify receipt against canonical hash
    verifyReceipt: async (receiptId: string) => {
      const state = get();
      const receipt = state.receipts.find((r) => r.id === receiptId);
      if (!receipt) return false;

      const currentCanonical = canonicalJsonString({
        from: receipt.from,
        id: receipt.id,
        patientRef: receipt.patientRef,
        reason: receipt.reason,
        resource: receipt.resource,
        timestamp: receipt.timestamp,
        to: receipt.to,
      });

      const recomputedHash = simpleSha256Hex(currentCanonical);
      const isMatch = recomputedHash === receipt.originalHash;

      if (isMatch) {
        set((s) => ({
          tamperedReceiptId: null,
          receipts: s.receipts.map((r) =>
            r.id === receiptId ? { ...r, hash: recomputedHash, status: 'verified' as const } : r
          ),
        }));
        get().addToast(
          'Tamper-evident: hash matches',
          `Canonical SHA-256 for ${receipt.id} exactly matches anchored ledger root.`,
          'success'
        );
        return true;
      } else {
        set({ tamperedReceiptId: receiptId });
        get().addToast(
          'TAMPER DETECTED!',
          `Hash mismatch on receipt ${receipt.id}! Record integrity violated.`,
          'danger'
        );
        return false;
      }
    },

    // Tamper with record: maliciously modify destination or reason
    tamperReceipt: (receiptId: string) => {
      set((state) => {
        const target = state.receipts.find((r) => r.id === receiptId);
        if (!target) return state;

        // Alter destination to Hospital A or modify timestamp
        const tamperedTo = target.to.includes('Hospital A')
          ? 'Hospital B (North Heights)'
          : 'Hospital A (City Central)';

        const tamperedCanonical = canonicalJsonString({
          from: target.from,
          id: target.id,
          patientRef: target.patientRef,
          reason: target.reason,
          resource: target.resource,
          timestamp: target.timestamp,
          to: tamperedTo,
        });

        // Current modified hash
        const modifiedHash = simpleSha256Hex(tamperedCanonical);

        const updated = state.receipts.map((r) => {
          if (r.id === receiptId) {
            return {
              ...r,
              to: tamperedTo,
              hash: modifiedHash,
              status: 'tampered' as const,
              tamperedField: 'to (Destination Hospital)',
            };
          }
          return r;
        });

        const newLog: EventLogItem = {
          id: `log-tamper-${Date.now()}`,
          timestamp: getFormattedTime(),
          type: 'crypto',
          title: `SIMULATION: Record Tampered (${receiptId})`,
          details: `Field 'to' fraudulently changed to '${tamperedTo}'. Hash altered from ${target.originalHash.slice(0, 10)}... to ${modifiedHash.slice(0, 10)}...`,
          badge: 'TAMPER ALERT',
          badgeColor: 'red',
        };

        return {
          receipts: updated,
          tamperedReceiptId: receiptId,
          eventLogs: [newLog, ...state.eventLogs],
        };
      });

      get().addToast(
        'Record Tampered',
        'Modified destination field in receipt. Click "Verify receipt" to observe cryptographic rejection.',
        'warning'
      );
    },

    // Restore original receipt
    restoreReceipt: (receiptId: string) => {
      set((state) => {
        const updated = state.receipts.map((r) => {
          if (r.id === receiptId) {
            return {
              ...r,
              hash: r.originalHash,
              status: 'verified' as const,
              tamperedField: undefined,
              to: r.to.includes('Hospital A') ? 'Hospital B (North Heights)' : r.to,
            };
          }
          return r;
        });

        return {
          receipts: updated,
          tamperedReceiptId: null,
        };
      });

      get().addToast(
        'Receipt Restored',
        'Reverted record to authentic state. Hash restored.',
        'info'
      );
    },

    // Live bed adjustment for simulation testing
    updateHospitalBedCount: (hospitalId: string, delta: number) => {
      const state = get();
      const updatedHospitals = state.hospitals.map((h) => {
        if (h.id === hospitalId) {
          const newOccupied = Math.max(0, Math.min(h.totalIcuBeds, h.occupiedIcuBeds + delta));
          return {
            ...h,
            occupiedIcuBeds: newOccupied,
          };
        }
        return h;
      });

      const targetHosp = updatedHospitals.find((h) => h.id === hospitalId);

      const newLog: EventLogItem = {
        id: `log-${Date.now()}`,
        timestamp: getFormattedTime(),
        type: 'bed_update',
        title: `ICU Capacity Changed: ${targetHosp?.name}`,
        details: `Occupied beds updated to ${targetHosp?.occupiedIcuBeds}/${targetHosp?.totalIcuBeds}. Free beds: ${targetHosp?.totalIcuBeds! - targetHosp?.occupiedIcuBeds!}. Triggering auto-replan.`,
        badge: 'ICU UPDATE',
        badgeColor: 'blue',
      };

      set((s) => ({
        hospitals: updatedHospitals,
        eventLogs: [newLog, ...s.eventLogs],
      }));

      // Re-run allocation engine immediately
      const engineResult = runAllocationEngine(
        state.patients,
        updatedHospitals,
        state.ambulances,
        state.isFloodActive
      );

      const plansRecord: Record<string, AllocationPlan> = {};
      engineResult.plans.forEach((plan, patientId) => {
        plansRecord[patientId] = plan;
      });

      const finalHospitals = updatedHospitals.map((h) => {
        const reserved = engineResult.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      set({
        hospitals: finalHospitals,
        allocationPlans: plansRecord,
        lastReplanDurationMs: engineResult.replanDurationMs,
      });

      get().addToast(
        `ICU Capacity Updated: ${targetHosp?.code}`,
        `Now ${targetHosp?.occupiedIcuBeds}/${targetHosp?.totalIcuBeds} occupied.`,
        'info'
      );
    },

    // Reset demo back to pure seed data
    resetDemo: () => {
      const resetEngineRun = runAllocationEngine(
        INITIAL_PATIENTS,
        INITIAL_HOSPITALS,
        INITIAL_AMBULANCES,
        false
      );

      const resetPlansRecord: Record<string, AllocationPlan> = {};
      resetEngineRun.plans.forEach((plan, patientId) => {
        resetPlansRecord[patientId] = plan;
      });

      const resetHospitals = INITIAL_HOSPITALS.map((h) => {
        const reserved = resetEngineRun.hospitalReservedCounts[h.id] || 0;
        return {
          ...h,
          roadAccessBlocked: false,
          reservedIcuBeds: reserved,
          freeIcuBeds: Math.max(0, h.totalIcuBeds - h.occupiedIcuBeds - reserved),
        };
      });

      // Clear any running demo interval
      if (get().guidedDemo.autoPlayTimerId) {
        clearInterval(get().guidedDemo.autoPlayTimerId);
      }

      set({
        patients: INITIAL_PATIENTS,
        hospitals: resetHospitals,
        ambulances: INITIAL_AMBULANCES,
        roadLinks: INITIAL_ROAD_LINKS,
        receipts: INITIAL_RECEIPTS,
        merkleRoot: initialCombined,
        selectedReceiptId: INITIAL_RECEIPTS[0].id,
        selectedTrailPatientId: 'P-101',
        selectedDriverAmbulanceId: 'Amb-01',
        isSmsFallbackActive: false,
        tamperedReceiptId: null,
        lastHandoverSuccessPatientId: null,
        isFloodActive: false,
        isBaselineMode: false,
        allocationPlans: resetPlansRecord,
        lastReplanDurationMs: resetEngineRun.replanDurationMs,
        bedMigration: null,
        guidedDemo: {
          isActive: false,
          step: 1,
          totalSteps: 5,
          isPaused: false,
          caption: DEMO_STEPS[0].caption,
          subcaption: DEMO_STEPS[0].subcaption,
        },
        eventLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: getFormattedTime(),
            type: 'system',
            title: 'Demo State Restored',
            details: 'Scenario reset to exact seed configuration. Road open, 5 patients pending, receipts reset.',
            badge: 'RESET',
            badgeColor: 'blue',
          },
        ],
      });

      get().addToast('Demo State Reset', 'Restored exact deterministic seed state.', 'info');
    },

    // Guided Demo Implementation (~45s story)
    startGuidedDemo: () => {
      // First reset to fresh state
      get().resetDemo();

      // Trigger Step 1: Flood hits
      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          isActive: true,
          step: 1,
          isPaused: false,
          caption: DEMO_STEPS[0].caption,
          subcaption: DEMO_STEPS[0].subcaption,
        },
      }));

      // Trigger flood
      if (!get().isFloodActive) {
        get().toggleFlood();
      }

      // Interval timer ~9 seconds per step
      const timerId = window.setInterval(() => {
        const current = get().guidedDemo;
        if (!current.isActive || current.isPaused) return;

        if (current.step < 5) {
          get().nextGuidedDemoStep();
        } else {
          get().stopGuidedDemo();
        }
      }, 9000);

      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          autoPlayTimerId: timerId,
        },
      }));
    },

    stopGuidedDemo: () => {
      const timerId = get().guidedDemo.autoPlayTimerId;
      if (timerId) clearInterval(timerId);

      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          isActive: false,
          autoPlayTimerId: undefined,
        },
      }));

      get().addToast('Guided Demo Finished', 'You can now manually test approvals, flood toggles, and bed capacity.', 'success');
    },

    nextGuidedDemoStep: () => {
      const currentStep = get().guidedDemo.step;
      const nextStep = Math.min(5, currentStep + 1);

      // Perform action associated with step
      if (nextStep === 2) {
        // Step 2: Engine re-plans (already triggered when flood toggled)
      } else if (nextStep === 3) {
        // Step 3: Approve top RED patient recommendation
        const topPatient = get().patients.find((p) => p.status === 'pending');
        if (topPatient) {
          get().approveRecommendation(topPatient.id);
        }
      } else if (nextStep === 4) {
        // Step 4: Switch to Delivery Trail tab and verify handover
        set({ activeTab: 'delivery-trail' });
        const dispatchedPatient = get().patients.find((p) => p.status === 'dispatched');
        if (dispatchedPatient) {
          get().submitDriverOtp(dispatchedPatient.id, dispatchedPatient.driverOtp || '829417');
        }
      } else if (nextStep === 5) {
        // Step 5: Switch to Audit Portal tab and verify receipt
        set({ activeTab: 'audit' });
        const topReceipt = get().receipts[0];
        if (topReceipt) {
          get().verifyReceipt(topReceipt.id);
        }
      }

      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          step: nextStep,
          caption: DEMO_STEPS[nextStep - 1].caption,
          subcaption: DEMO_STEPS[nextStep - 1].subcaption,
        },
      }));
    },

    prevGuidedDemoStep: () => {
      const currentStep = get().guidedDemo.step;
      const prevStep = Math.max(1, currentStep - 1);

      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          step: prevStep,
          caption: DEMO_STEPS[prevStep - 1].caption,
          subcaption: DEMO_STEPS[prevStep - 1].subcaption,
        },
      }));
    },

    togglePauseGuidedDemo: () => {
      set((s) => ({
        guidedDemo: {
          ...s.guidedDemo,
          isPaused: !s.guidedDemo.isPaused,
        },
      }));
    },
  };
});
