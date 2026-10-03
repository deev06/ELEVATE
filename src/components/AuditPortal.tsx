import React from 'react';
import { useReliefGridStore } from '../store';
import {
  ShieldCheck,
  Copy,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  FileCode2,
  Info,
  Layers,
  Database,
} from 'lucide-react';
import { getMerkleProof } from '../crypto';
import { formatISTTime } from '../time';

export const AuditPortal: React.FC = () => {
  const {
    receipts,
    merkleRoot,
    merkleTreeLevels,
    selectedReceiptId,
    selectReceipt,
    verifyReceipt,
    tamperReceipt,
    restoreReceipt,
    tamperedReceiptId,
    addToast,
  } = useReliefGridStore();

  const selectedReceipt =
    receipts.find((r) => r.id === selectedReceiptId) || receipts[0];

  const selectedIndex = receipts.findIndex((r) => r.id === selectedReceipt?.id);

  const merkleProof =
    selectedIndex >= 0 && merkleTreeLevels.length > 0
      ? getMerkleProof(selectedIndex, merkleTreeLevels)
      : [];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    addToast('Copied to Clipboard', `${label}: ${text.slice(0, 16)}...`, 'info');
  };

  const isRecordTampered =
    selectedReceipt?.status === 'tampered' ||
    tamperedReceiptId === selectedReceipt?.id ||
    (selectedReceipt ? selectedReceipt.hash !== selectedReceipt.originalHash : false);

  return (
    <div className="w-full h-full p-6 overflow-y-auto max-w-7xl mx-auto space-y-6 bg-vantablack">
      {/* Top Header & Public Ledger Summary */}
      <div className="command-panel p-5 rounded-2xl border border-white/10 shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/10 text-tactical-orange">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              Public Cryptographic Audit Portal
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-obsidian-900 text-zinc-300 border border-white/10">
              Zero-PII Verifiable Ledger
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              &quot;No patient data is stored here, only hashes.&quot;
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              &quot;Ledger anchoring is simulated in this prototype.&quot;
            </span>
          </div>
        </div>

        {/* Global Merkle Root Banner */}
        <div className="p-3 rounded-xl bg-obsidian-900 border border-white/10 flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-tactical-orange shrink-0" />
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">
              Anchored Merkle Root (Pairwise SHA-256)
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-white">
                {merkleRoot ? `${merkleRoot.slice(0, 16)}...${merkleRoot.slice(-8)}` : 'Generating...'}
              </code>
              <button
                onClick={() => copyToClipboard(merkleRoot, 'Merkle Root')}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5"
                title="Copy Full Merkle Root"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Merkle Proof Visualizer & Interactive Record Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* 1. Merkle Tree Diagram Card */}
        <div className="lg:col-span-1 command-panel p-5 rounded-2xl border border-white/10 space-y-4 shadow-panel bg-obsidian-950">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-tactical-orange" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Merkle Proof Path
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500">
              Leaf: {selectedReceipt?.id}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans leading-normal">
            Highlights pairwise cryptographic proof connecting leaf hash <code>{selectedReceipt?.id}</code> to the immutable root.
          </p>

          {/* Visual Node Diagram */}
          <div className="p-4 rounded-xl bg-black border border-white/10 space-y-3 text-xs">
            {/* Root Node */}
            <div className="p-2.5 rounded-lg bg-obsidian-900 border border-white/20 text-center">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-bold">
                Merkle Root (Anchor)
              </span>
              <span className="text-white font-bold text-[11px]">
                {merkleRoot.slice(0, 12)}...{merkleRoot.slice(-6)}
              </span>
            </div>

            <div className="flex justify-center text-zinc-600">
              <span className="text-xs">▲</span>
            </div>

            {/* Intermediate Proof Steps */}
            {merkleProof.map((step, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-obsidian-950 border border-white/10 flex items-center justify-between text-[10px]"
              >
                <span className="text-tactical-orange font-bold">
                  Sibling #{idx + 1} ({step.position})
                </span>
                <span className="text-zinc-400">
                  {step.hash.slice(0, 10)}...
                </span>
              </div>
            ))}

            {/* Leaf Node (Selected Receipt) */}
            <div className="p-2.5 rounded-lg bg-black border border-tactical-orange text-center">
              <span className="text-[9px] uppercase tracking-wider text-tactical-orange block font-bold">
                Target Leaf ({selectedReceipt?.id})
              </span>
              <span className="text-white font-bold text-[11px]">
                {selectedReceipt?.hash.slice(0, 12)}...
              </span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Tamper & Verification Control Box */}
        {selectedReceipt && (
          <div className="lg:col-span-2 command-panel p-5 rounded-2xl border border-white/10 space-y-4 shadow-panel bg-obsidian-950">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-tactical-orange" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Inspect Record: {selectedReceipt.id}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isRecordTampered ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-600/30 text-rose-300 border border-red-500/50 flex items-center gap-1.5 animate-shake">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    HASH MISMATCH
                  </span>
                ) : selectedReceipt.status === 'verified' ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Genuine
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Pending Handover
                  </span>
                )}
              </div>
            </div>

            {/* Record Fields Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-black p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Anonymous Ref</span>
                <span className="font-bold text-white">{selectedReceipt.patientRef}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Transport Unit</span>
                <span className="font-bold text-tactical-orange">{selectedReceipt.resource}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Origin Ward</span>
                <span className="font-bold text-zinc-300 truncate block">{selectedReceipt.from}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Destination Facility</span>
                <span className={`font-bold truncate block ${isRecordTampered ? 'text-red-400 underline' : 'text-zinc-200'}`}>
                  {selectedReceipt.to}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Timestamp (IST)</span>
                <span className="font-bold text-zinc-300 truncate block font-mono">
                  {formatISTTime(selectedReceipt.timestamp)}
                </span>
              </div>
            </div>

            {/* Canonical Reason */}
            <div className="p-3 rounded-xl bg-black border border-white/5 text-xs">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                Algorithmic Justification (Hashed):
              </span>
              <p className="text-zinc-300 leading-relaxed font-sans">
                {selectedReceipt.reason}
              </p>
            </div>

            {/* Tamper Alert Display: Side-by-side stored vs recomputed hash */}
            {isRecordTampered && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 space-y-3 animate-shake">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>HASH MISMATCH DETECTED (Integrity Violated)</span>
                </div>

                {/* Stored vs Recomputed Hashes Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/70 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">
                        Stored Anchored Hash
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Original
                      </span>
                    </div>
                    <code className="text-emerald-400 font-mono text-[11px] break-all block pt-1 select-all">
                      {selectedReceipt.originalHash}
                    </code>
                  </div>

                  <div className="p-3 rounded-lg bg-black/70 border border-rose-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-rose-300 uppercase font-mono font-bold">
                        Recomputed Hash
                      </span>
                      <span className="text-[9px] font-mono text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30 animate-pulse">
                        Mismatch
                      </span>
                    </div>
                    <code className="text-rose-400 font-mono text-[11px] break-all block pt-1 select-all">
                      {selectedReceipt.hash}
                    </code>
                  </div>
                </div>

                <p className="text-[11px] text-rose-200/90 font-sans">
                  The payload for receipt <strong>{selectedReceipt.id}</strong> has been modified (fraudulent destination: <em>{selectedReceipt.to}</em>). Recomputing SHA-256 over canonical JSON does not match the immutable anchored root.
                </p>
              </div>
            )}

            {/* Action Buttons: Verify & Tamper */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => verifyReceipt(selectedReceipt.id)}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-black transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Receipt (Compute SHA-256)</span>
              </button>

              {isRecordTampered ? (
                <button
                  onClick={() => restoreReceipt(selectedReceipt.id)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold bg-obsidian-900 hover:bg-obsidian-850 text-white border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restore Original</span>
                </button>
              ) : (
                <button
                  onClick={() => tamperReceipt(selectedReceipt.id)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-rose-200 border border-rose-500/30 transition-all flex items-center gap-1.5"
                  title="Simulate fraudulent modification to test tamper rejection"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Tamper with Record</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Immutable Receipts Table (Public View) */}
      <div className="command-panel rounded-2xl border border-white/10 overflow-hidden shadow-panel bg-obsidian-950">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-tactical-orange" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              Anchored Receipt Ledger ({receipts.length} Records)
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            Click row to inspect Merkle proof path
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Receipt ID</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-4">Canonical Hash (SHA-256)</th>
                <th className="py-3 px-4">Merkle Root</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {receipts.map((rcp) => {
                const isSelected = rcp.id === selectedReceipt?.id;
                const isRowTampered = rcp.status === 'tampered' || tamperedReceiptId === rcp.id || rcp.hash !== rcp.originalHash;

                return (
                  <tr
                    key={rcp.id}
                    onClick={() => selectReceipt(rcp.id)}
                    className={`cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-obsidian-900 border-l-2 border-l-tactical-orange'
                        : 'hover:bg-white/5'
                    } ${isRowTampered ? 'bg-red-950/40 border-l-2 border-l-rose-500 animate-shake text-rose-200' : ''}`}
                  >
                    <td className="py-3 px-4 font-bold text-white">
                      {rcp.id}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                      {formatISTTime(rcp.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-tactical-orange font-bold">
                      {rcp.resource}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-[120px] truncate">
                      {rcp.from}
                    </td>
                    <td className={`py-3 px-4 max-w-[150px] truncate ${isRowTampered ? 'text-rose-400 font-bold' : 'text-zinc-200'}`}>
                      {rcp.to}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-300 hover:text-white" title={rcp.hash}>
                          {rcp.hash.slice(0, 10)}...{rcp.hash.slice(-4)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(rcp.hash, 'Receipt Hash');
                          }}
                          className="text-zinc-500 hover:text-white p-0.5 rounded"
                          title="Copy Full Hash"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 text-[10px]">
                      {merkleRoot.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isRowTampered ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-shake inline-block">
                          HASH MISMATCH
                        </span>
                      ) : rcp.status === 'verified' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
