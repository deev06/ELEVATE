import type {
  Patient,
  Hospital,
  Ambulance,
  AllocationPlan,
  CandidateEvaluation,
  TriageLevel,
} from './types';
import { SCENE_TO_HOSPITAL_TIME, AMB_TO_SCENE_TIME } from './seed';

/**
 * Severity weights defined by START triage protocol:
 * RED: Immediate (3)
 * YELLOW: Delayed (2)
 * GREEN: Minor (1)
 */
export const SEVERITY_WEIGHTS: Record<TriageLevel, number> = {
  RED: 3,
  YELLOW: 2,
  GREEN: 1,
};

/**
 * Calculates priority score:
 * Priority = severityWeight / max(minutesLeft, 1)
 */
export function calculatePriorityScore(triage: TriageLevel, minutesLeft: number): number {
  const weight = SEVERITY_WEIGHTS[triage];
  return weight / Math.max(minutesLeft, 1);
}

/**
 * Sorts patients in strict descending priority order.
 */
export function sortPatientsByPriority(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const scoreA = calculatePriorityScore(a.triage, a.minutesLeft);
    const scoreB = calculatePriorityScore(b.triage, b.minutesLeft);
    return scoreB - scoreA;
  });
}

export interface EngineRunResult {
  plans: Map<string, AllocationPlan>;
  hospitalReservedCounts: Record<string, number>;
  replanDurationMs: number;
}

/**
 * Core Allocation Engine
 * Deterministic, explainable matching between patients, ambulances, and hospitals.
 */
export function runAllocationEngine(
  patients: Patient[],
  hospitals: Hospital[],
  ambulances: Ambulance[],
  isFloodActive: boolean
): EngineRunResult {
  const startTime = performance.now();

  const sortedPatients = sortPatientsByPriority(patients);
  const plans = new Map<string, AllocationPlan>();

  // Track reserved beds per hospital during this planning run
  const hospitalReservedCounts: Record<string, number> = {};
  hospitals.forEach((h) => {
    hospitalReservedCounts[h.id] = 0;
  });

  // Track available ambulances
  const availableAmbulances = new Set(ambulances.map((a) => a.id));

  // Also preserve existing dispatches if already approved
  sortedPatients.forEach((patient) => {
    if (patient.status === 'dispatched' || patient.status === 'arrived') {
      if (patient.assignedAmbulanceId) {
        availableAmbulances.delete(patient.assignedAmbulanceId);
      }
      if (patient.assignedHospitalId && patient.triage === 'RED') {
        hospitalReservedCounts[patient.assignedHospitalId] =
          (hospitalReservedCounts[patient.assignedHospitalId] || 0) + 1;
      }
    }
  });

  // Process pending or recommended patients in priority order
  for (const patient of sortedPatients) {
    // If patient is already dispatched or arrived, check if road to hospital was blocked!
    if (patient.status === 'dispatched' || patient.status === 'arrived') {
      const assignedHosp = hospitals.find((h) => h.id === patient.assignedHospitalId);
      const isBlocked = isFloodActive && assignedHosp?.code === 'A';

      if (!isBlocked) {
        // Keep current plan
        continue;
      }
      // If road is blocked, patient MUST be re-routed!
    }

    const evaluations: CandidateEvaluation[] = [];

    // Evaluate all combinations of available ambulances and hospitals
    const candidateAmbulances = ambulances.filter(
      (a) => availableAmbulances.has(a.id) || a.id === patient.assignedAmbulanceId
    );

    for (const amb of candidateAmbulances) {
      for (const hosp of hospitals) {
        const isRoadBlocked = (isFloodActive && hosp.code === 'A') || hosp.roadAccessBlocked;
        const isRejectedByUser = patient.rejectedHospitals?.includes(hosp.id);

        // Bed availability check: Only RED consumes ICU beds
        const currentReserved = hospitalReservedCounts[hosp.id] || 0;
        const unreservedBeds = hosp.totalIcuBeds - hosp.occupiedIcuBeds - currentReserved;
        const hasBed = patient.triage !== 'RED' || unreservedBeds > 0;

        const ambToScene =
          AMB_TO_SCENE_TIME[amb.id]?.[patient.id] ?? 5;
        const sceneToHosp =
          SCENE_TO_HOSPITAL_TIME[patient.id]?.[hosp.id] ?? hosp.baseTravelTimeMin;

        // Stability rule: Add 5 min penalty if re-routing an already assigned/dispatched ambulance
        const isReroute =
          patient.assignedAmbulanceId === amb.id &&
          patient.assignedHospitalId &&
          patient.assignedHospitalId !== hosp.id;
        const reroutePenalty = isReroute ? 5 : 0;

        const totalTime = ambToScene + sceneToHosp + reroutePenalty;

        let eligible = true;
        let ineligibilityReason = '';

        if (isRoadBlocked) {
          eligible = false;
          ineligibilityReason = `Road to ${hosp.name} is submerged & impassable`;
        } else if (isRejectedByUser) {
          eligible = false;
          ineligibilityReason = `Hospital ${hosp.code} rejected by dispatcher`;
        } else if (!hasBed) {
          eligible = false;
          ineligibilityReason = `No unreserved ICU beds (0 of ${hosp.totalIcuBeds} available)`;
        }

        evaluations.push({
          hospitalId: hosp.id,
          hospitalName: hosp.name,
          ambulanceId: amb.id,
          ambToSceneMin: ambToScene,
          sceneToHospMin: sceneToHosp,
          reroutePenaltyMin: reroutePenalty,
          totalTimeMin: totalTime,
          eligible,
          ineligibilityReason,
        });
      }
    }

    // Filter eligible candidates and sort by total travel time
    const eligibleCandidates = evaluations
      .filter((e) => e.eligible)
      .sort((a, b) => a.totalTimeMin - b.totalTimeMin);

    if (eligibleCandidates.length > 0) {
      const best = eligibleCandidates[0];
      const chosenHosp = hospitals.find((h) => h.id === best.hospitalId)!;

      // Reserve bed for RED patients
      if (patient.triage === 'RED') {
        hospitalReservedCounts[best.hospitalId] =
          (hospitalReservedCounts[best.hospitalId] || 0) + 1;
      }

      // Claim ambulance
      availableAmbulances.delete(best.ambulanceId);

      // Generate explainability text from real inputs & rejected options
      const explanation = generateExplanationText(
        patient,
        best,
        evaluations,
        chosenHosp,
        isFloodActive
      );

      plans.set(patient.id, {
        patientId: patient.id,
        ambulanceId: best.ambulanceId,
        hospitalId: best.hospitalId,
        ambToSceneMin: best.ambToSceneMin,
        sceneToHospMin: best.sceneToHospMin,
        reroutePenaltyMin: best.reroutePenaltyMin,
        totalEtaMin: best.totalTimeMin,
        explanation,
        escalatedToEoc: false,
        evaluations,
      });
    } else {
      // Escalated to Emergency Operations Center (EOC)
      const escalationReason = generateEscalationExplanation(patient, evaluations);

      plans.set(patient.id, {
        patientId: patient.id,
        ambulanceId: null,
        hospitalId: null,
        ambToSceneMin: 0,
        sceneToHospMin: 0,
        reroutePenaltyMin: 0,
        totalEtaMin: 0,
        explanation: escalationReason,
        escalatedToEoc: true,
        evaluations,
      });
    }
  }

  const replanDurationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    plans,
    hospitalReservedCounts,
    replanDurationMs,
  };
}

/**
 * Generates transparent "Why this?" explanation strictly based on real algorithmic evaluation.
 */
function generateExplanationText(
  patient: Patient,
  best: CandidateEvaluation,
  allEvaluations: CandidateEvaluation[],
  chosenHospital: Hospital,
  isFloodActive: boolean
): string {
  const parts: string[] = [];

  // Triage urgency
  parts.push(`${patient.triage} priority (${patient.minutesLeft}m left to treatment deadline).`);

  // Mention why closer alternatives were bypassed
  const closerAlternatives = allEvaluations.filter(
    (e) => e.sceneToHospMin < best.sceneToHospMin && !e.eligible
  );

  const blockedHospA = closerAlternatives.find((e) => e.hospitalId === 'HOSP-A');
  if (blockedHospA && isFloodActive) {
    parts.push('Hospital A road blocked by flood surge.');
  } else if (blockedHospA && blockedHospA.ineligibilityReason) {
    parts.push(`Hospital A skipped: ${blockedHospA.ineligibilityReason.toLowerCase()}.`);
  }

  // Hospital & ICU justification
  if (patient.triage === 'RED') {
    parts.push(
      `${chosenHospital.name} selected: unreserved ICU capacity confirmed at ETA ${best.totalTimeMin}m (${best.ambToSceneMin}m pickup + ${best.sceneToHospMin}m transit).`
    );
  } else {
    parts.push(
      `${chosenHospital.name} selected: shortest open route at ETA ${best.totalTimeMin}m (non-ICU ward).`
    );
  }

  // Reroute penalty note if applied
  if (best.reroutePenaltyMin > 0) {
    parts.push(`Includes +${best.reroutePenaltyMin}m anti-ping-pong re-route stability penalty.`);
  }

  return parts.join(' ');
}

/**
 * Generates clear explanation when a case must escalate to EOC.
 */
function generateEscalationExplanation(
  patient: Patient,
  evaluations: CandidateEvaluation[]
): string {
  const rejectedReasons = Array.from(
    new Set(evaluations.map((e) => e.ineligibilityReason).filter(Boolean))
  );

  return `ESCALATED TO EOC: Unable to assign safe transit for ${patient.code} (${patient.triage}, ${patient.minutesLeft}m left). Road blocks or ICU saturation across all reachable facilities: [${rejectedReasons.join('; ')}]. Immediate air-rescue or field hospital dispatch required.`;
}
