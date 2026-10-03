import type { Patient, Hospital, Ambulance, RoadLink, DeliveryReceipt } from './types';
import { simpleSha256Hex, canonicalJsonString } from './crypto';

/**
 * ReliefGrid Seed Data
 * Deterministic scenario for Mumbai-style urban flood in fictional coastal city.
 * STRICTLY NO Math.random so simulation is 100% reproducible every run.
 */

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP-A',
    name: 'Hospital A (City Central)',
    code: 'A',
    totalIcuBeds: 12,
    occupiedIcuBeds: 10,
    reservedIcuBeds: 0,
    freeIcuBeds: 2, // 10/12 occupied -> 2 free
    location: { x: 220, y: 190 },
    roadAccessBlocked: false,
    baseTravelTimeMin: 6, // 6 min nearest
  },
  {
    id: 'HOSP-B',
    name: 'Hospital B (North Heights)',
    code: 'B',
    totalIcuBeds: 10,
    occupiedIcuBeds: 7,
    reservedIcuBeds: 0,
    freeIcuBeds: 3, // 3 free ICU beds
    location: { x: 740, y: 150 },
    roadAccessBlocked: false,
    baseTravelTimeMin: 12, // 12 min second nearest
  },
  {
    id: 'HOSP-C',
    name: 'Hospital C (East Bay Medical)',
    code: 'C',
    totalIcuBeds: 8,
    occupiedIcuBeds: 7,
    reservedIcuBeds: 0,
    freeIcuBeds: 1, // 1 free ICU bed
    location: { x: 830, y: 480 },
    roadAccessBlocked: false,
    baseTravelTimeMin: 20, // 20 min farthest
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P-101',
    code: 'RED-101',
    triage: 'RED',
    condition: 'Acute respiratory trauma & crush injury',
    deadlineMinutes: 30,
    minutesLeft: 30,
    location: { x: 410, y: 360 },
    locationName: 'Sector 4 (Central Market)',
    status: 'pending',
    rejectedHospitals: [],
    currentStep: 'allocated',
    timestamps: { allocated: '16:02:14 IST' },
    driverOtp: '829417',
  },
  {
    id: 'P-102',
    code: 'RED-102',
    triage: 'RED',
    condition: 'Severe hemorrhagic shock',
    deadlineMinutes: 45,
    minutesLeft: 45,
    location: { x: 480, y: 280 },
    locationName: 'Sector 2 (Transit Junction)',
    status: 'pending',
    rejectedHospitals: [],
    currentStep: 'allocated',
    timestamps: { allocated: '16:02:18 IST' },
    driverOtp: '491723',
  },
  {
    id: 'P-103',
    code: 'YEL-103',
    triage: 'YELLOW',
    condition: 'Open femur fracture, hemodynamic stable',
    deadlineMinutes: 60,
    minutesLeft: 60,
    location: { x: 360, y: 470 },
    locationName: 'Sector 7 (South Wharves)',
    status: 'pending',
    rejectedHospitals: [],
    currentStep: 'allocated',
    timestamps: { allocated: '16:02:22 IST' },
    driverOtp: '618204',
  },
  {
    id: 'P-104',
    code: 'YEL-104',
    triage: 'YELLOW',
    condition: 'Head laceration & suspected concussion',
    deadlineMinutes: 90,
    minutesLeft: 90,
    location: { x: 580, y: 410 },
    locationName: 'Sector 9 (Financial Core)',
    status: 'pending',
    rejectedHospitals: [],
    currentStep: 'allocated',
    timestamps: { allocated: '16:02:30 IST' },
    driverOtp: '359182',
  },
  {
    id: 'P-105',
    code: 'GRN-105',
    triage: 'GREEN',
    condition: 'Minor contusions & mild hypothermia',
    deadlineMinutes: 120,
    minutesLeft: 120,
    location: { x: 640, y: 270 },
    locationName: 'Sector 5 (Suburban Cross)',
    status: 'pending',
    rejectedHospitals: [],
    currentStep: 'allocated',
    timestamps: { allocated: '16:02:45 IST' },
    driverOtp: '742915',
  },
];

export const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: 'Amb-01',
    code: 'Amb-01',
    location: { x: 350, y: 320 },
    baseLocation: { x: 350, y: 320 },
    status: 'idle',
    headingAngle: 45,
  },
  {
    id: 'Amb-02',
    code: 'Amb-02',
    location: { x: 530, y: 210 },
    baseLocation: { x: 530, y: 210 },
    status: 'idle',
    headingAngle: 120,
  },
  {
    id: 'Amb-03',
    code: 'Amb-03',
    location: { x: 420, y: 510 },
    baseLocation: { x: 420, y: 510 },
    status: 'idle',
    headingAngle: 0,
  },
  {
    id: 'Amb-04',
    code: 'Amb-04',
    location: { x: 670, y: 370 },
    baseLocation: { x: 670, y: 370 },
    status: 'idle',
    headingAngle: 270,
  },
];

/**
 * Initial Verified Historical Receipts for Shift (Standard RCP-800x ID Format, Earlier IST Time)
 */
const rawReceipt1 = {
  id: 'RCP-8001',
  patientRef: 'PAT-089',
  resource: 'Amb-02',
  from: 'Sector 1 (West Coast Wharf)',
  to: 'Hospital A (City Central)',
  reason: 'Pre-flood acute cardiac transfer to nearest node',
  timestamp: '2026-10-03T08:30:00Z',
};
const hash1 = simpleSha256Hex(canonicalJsonString(rawReceipt1));

const rawReceipt2 = {
  id: 'RCP-8002',
  patientRef: 'PAT-094',
  resource: 'Amb-03',
  from: 'Sector 3 (South Point Industrial)',
  to: 'Hospital B (North Heights)',
  reason: 'Severe burn injury transferred directly to regional burn ICU',
  timestamp: '2026-10-03T09:15:00Z',
};
const hash2 = simpleSha256Hex(canonicalJsonString(rawReceipt2));

export const INITIAL_RECEIPTS: DeliveryReceipt[] = [
  {
    ...rawReceipt1,
    hash: hash1,
    originalHash: hash1,
    status: 'verified',
    driverOtp: '519284',
    handoverTime: '14:00:00 IST',
  },
  {
    ...rawReceipt2,
    hash: hash2,
    originalHash: hash2,
    status: 'verified',
    driverOtp: '634812',
    handoverTime: '14:45:00 IST',
  },
];

/**
 * Fixed Travel Time Matrices (in minutes)
 * Guaranteed: A is nearest (6 min), B second (12 min), C farthest (20 min).
 */
export const SCENE_TO_HOSPITAL_TIME: Record<string, Record<string, number>> = {
  'P-101': { 'HOSP-A': 6, 'HOSP-B': 12, 'HOSP-C': 20 },
  'P-102': { 'HOSP-A': 6, 'HOSP-B': 12, 'HOSP-C': 20 },
  'P-103': { 'HOSP-A': 6, 'HOSP-B': 12, 'HOSP-C': 20 },
  'P-104': { 'HOSP-A': 6, 'HOSP-B': 12, 'HOSP-C': 20 },
  'P-105': { 'HOSP-A': 6, 'HOSP-B': 12, 'HOSP-C': 20 },
};

/**
 * Fixed travel time from ambulance base/position to patient scene (in minutes).
 */
export const AMB_TO_SCENE_TIME: Record<string, Record<string, number>> = {
  'Amb-01': { 'P-101': 3, 'P-102': 4, 'P-103': 5, 'P-104': 7, 'P-105': 8 },
  'Amb-02': { 'P-101': 4, 'P-102': 3, 'P-103': 7, 'P-104': 6, 'P-105': 4 },
  'Amb-03': { 'P-101': 5, 'P-102': 7, 'P-103': 3, 'P-104': 5, 'P-105': 7 },
  'Amb-04': { 'P-101': 7, 'P-102': 6, 'P-103': 6, 'P-104': 3, 'P-105': 3 },
};

/**
 * Road Links for Map Graph
 */
export const INITIAL_ROAD_LINKS: RoadLink[] = [
  {
    id: 'road-causeway-A',
    from: 'CentralHub',
    to: 'HOSP-A',
    pathD: 'M 410,340 Q 300,290 220,190',
    travelMinutes: 6,
    isFlooded: false,
    name: 'Causeway Bridge to Hospital A',
  },
  {
    id: 'road-express-B',
    from: 'CentralHub',
    to: 'HOSP-B',
    pathD: 'M 410,340 Q 560,230 740,150',
    travelMinutes: 12,
    isFlooded: false,
    name: 'Eastern Arterial Expressway to Hospital B',
  },
  {
    id: 'road-ring-C',
    from: 'CentralHub',
    to: 'HOSP-C',
    pathD: 'M 410,340 Q 620,440 830,480',
    travelMinutes: 20,
    isFlooded: false,
    name: 'Coastal Ring Road to Hospital C',
  },
];
