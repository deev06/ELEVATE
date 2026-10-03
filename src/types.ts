export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export interface Point {
  x: number;
  y: number;
}

export type DeliveryStep = 'allocated' | 'dispatched' | 'received' | 'verified';

export interface TrailTimestamps {
  allocated?: string;
  dispatched?: string;
  received?: string;
  verified?: string;
}

export interface Patient {
  id: string;
  code: string; // Anonymous ID e.g. "PAT-01"
  triage: TriageLevel;
  condition: string;
  deadlineMinutes: number;
  minutesLeft: number;
  location: Point;
  locationName: string;
  status: 'pending' | 'recommended' | 'dispatched' | 'arrived' | 'verified';
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  rejectedHospitals: string[];
  currentStep?: DeliveryStep;
  timestamps?: TrailTimestamps;
  driverOtp?: string; // 6-digit OTP e.g. "829417"
  enteredOtp?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: 'A' | 'B' | 'C';
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  reservedIcuBeds: number;
  freeIcuBeds: number; // total - occupied - reserved
  location: Point;
  roadAccessBlocked: boolean;
  baseTravelTimeMin: number; // to scene
}

export interface Ambulance {
  id: string;
  code: string; // "Amb-01"
  location: Point;
  baseLocation: Point;
  status: 'idle' | 'assigned' | 'en_route_scene' | 'en_route_hospital' | 'rerouted';
  assignedPatientId?: string;
  destinationHospitalId?: string;
  headingAngle?: number;
}

export interface RoadLink {
  id: string;
  from: string;
  to: string;
  pathD: string;
  travelMinutes: number;
  isFlooded: boolean;
  name: string;
}

export interface CandidateEvaluation {
  hospitalId: string;
  hospitalName: string;
  ambulanceId: string;
  ambToSceneMin: number;
  sceneToHospMin: number;
  reroutePenaltyMin: number;
  totalTimeMin: number;
  eligible: boolean;
  ineligibilityReason?: string;
}

export interface AllocationPlan {
  patientId: string;
  ambulanceId: string | null;
  hospitalId: string | null;
  ambToSceneMin: number;
  sceneToHospMin: number;
  reroutePenaltyMin: number;
  totalEtaMin: number;
  explanation: string;
  escalatedToEoc: boolean;
  evaluations: CandidateEvaluation[];
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  type: 'flood' | 'replan' | 'approval' | 'rejection' | 'bed_update' | 'reroute' | 'system' | 'crypto';
  title: string;
  details: string;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'green' | 'blue';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: number;
}

export interface DeliveryReceiptData {
  id: string;
  patientRef: string; // Anonymous code
  resource: string; // e.g. "Amb-01"
  from: string;
  to: string;
  reason: string;
  timestamp: string;
}

export interface DeliveryReceipt extends DeliveryReceiptData {
  hash: string;
  originalHash: string;
  status: 'verified' | 'pending' | 'tampered';
  tamperedField?: string;
  driverOtp?: string;
  handoverTime?: string;
}
