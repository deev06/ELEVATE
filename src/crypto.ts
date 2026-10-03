/**
 * ReliefGrid Cryptographic Verification Module
 * Canonical JSON serialization, WebCrypto SHA-256 hashing, and pairwise Merkle Tree construction.
 */

export interface DeliveryReceiptData {
  id: string;
  patientRef: string; // Anonymous code e.g. "RED-101"
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

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  receiptId?: string;
  isLeaf: boolean;
}

export interface MerkleProofStep {
  hash: string;
  position: 'left' | 'right';
}

/**
 * Returns a canonical JSON string with strictly sorted keys.
 */
export function canonicalJsonString(data: Record<string, unknown>): string {
  const sortedKeys = Object.keys(data).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = data[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Computes SHA-256 hex digest using browser SubtleCrypto.
 */
export async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback hash for deterministic initial render or SSR
 */
export function simpleSha256Hex(str: string): string {
  // Simple deterministic hash function as immediate fallback before async SubtleCrypto resolves
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const h1 = (hash >>> 0).toString(16).padStart(8, '0');
  const h2 = ((hash ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, '0');
  const h3 = ((hash ^ 0x3c3c3c3c) >>> 0).toString(16).padStart(8, '0');
  const h4 = ((hash ^ 0xa5a5a5a5) >>> 0).toString(16).padStart(8, '0');
  return `${h1}${h2}${h3}${h4}${h1}${h2}${h3}${h4}`;
}

/**
 * Computes receipt canonical hash.
 */
export async function hashReceipt(receipt: DeliveryReceiptData): Promise<string> {
  const canonical = canonicalJsonString({
    from: receipt.from,
    id: receipt.id,
    patientRef: receipt.patientRef,
    reason: receipt.reason,
    resource: receipt.resource,
    timestamp: receipt.timestamp,
    to: receipt.to,
  });
  return await sha256Hex(canonical);
}

/**
 * Merkle Tree builder: pairwise SHA-256 tree over leaf hashes.
 */
export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  treeLevels: string[][];
}

export async function buildMerkleTree(hashes: string[]): Promise<MerkleTreeResult> {
  if (hashes.length === 0) {
    const emptyHash = await sha256Hex('EMPTY_RELIEFGRID_ROOT');
    return { root: emptyHash, leaves: [], treeLevels: [[emptyHash]] };
  }

  const leaves = [...hashes];
  const treeLevels: string[][] = [leaves];
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = await sha256Hex(left + right);
      nextLevel.push(combined);
    }
    treeLevels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    leaves,
    treeLevels,
  };
}

/**
 * Generates Merkle proof path for a leaf at given index.
 */
export function getMerkleProof(
  leafIndex: number,
  treeLevels: string[][]
): MerkleProofStep[] {
  const proof: MerkleProofStep[] = [];
  let index = leafIndex;

  for (let i = 0; i < treeLevels.length - 1; i++) {
    const level = treeLevels[i];
    const isEven = index % 2 === 0;
    const siblingIndex = isEven ? index + 1 : index - 1;

    if (siblingIndex < level.length) {
      proof.push({
        hash: level[siblingIndex],
        position: isEven ? 'right' : 'left',
      });
    } else {
      // Duplicated sibling for odd count
      proof.push({
        hash: level[index],
        position: 'right',
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}
