import React, { useEffect } from 'react';
import { useReliefGridStore } from './store';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { PatientQueue } from './components/PatientQueue';
import { HospitalCards } from './components/HospitalCards';
import { EventTimeline } from './components/EventTimeline';
import { DeliveryTrail } from './components/DeliveryTrail';
import { AuditPortal } from './components/AuditPortal';
import { DriverApp } from './components/DriverApp';
import { CompareView } from './components/CompareView';
import { SimulatePanel } from './components/SimulatePanel';
import { Toasts } from './components/Toasts';
import { sortPatientsByPriority } from './engine';

export const App: React.FC = () => {
  const {
    activeTab,
    toggleFlood,
    approveRecommendation,
    resetDemo,
    togglePresentationMode,
    isPresentationMode,
    patients,
  } = useReliefGridStore();

  // Keyboard shortcut listeners (F: Flood, A: Approve, R: Reset, P: Presentation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlood();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const sorted = sortPatientsByPriority(patients);
        const topPending = sorted.find((p) => p.status === 'pending');
        if (topPending) {
          approveRecommendation(topPending.id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetDemo();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePresentationMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFlood, approveRecommendation, resetDemo, togglePresentationMode, patients]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden bg-vantablack select-none text-zinc-100 ${
        isPresentationMode ? 'text-base font-medium' : 'text-sm'
      }`}
    >
      {/* Top Bar Header */}
      <Header />

      {/* Main Content Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-black">
        {/* 1. Dispatch Command Center */}
        {activeTab === 'dispatch' && (
          <>
            {/* SVG Background Map */}
            <div className="absolute inset-0 z-0">
              <Map />
            </div>

            {/* Floating Left Panel: Patient Queue */}
            <div className="absolute top-4 left-4 bottom-18 z-20 flex flex-col pointer-events-auto">
              <PatientQueue />
            </div>

            {/* Floating Right Panel: Hospital Cards */}
            <div className="absolute top-4 right-4 bottom-18 z-20 flex flex-col pointer-events-auto">
              <HospitalCards />
            </div>

            {/* Floating Bottom Panel: Event Timeline */}
            <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none">
              <EventTimeline />
            </div>
          </>
        )}

        {/* 2. Delivery Trail Tab */}
        {activeTab === 'delivery-trail' && (
          <div className="relative z-10 w-full h-full">
            <DeliveryTrail />
          </div>
        )}

        {/* 3. Audit Portal Tab */}
        {activeTab === 'audit' && (
          <div className="relative z-10 w-full h-full">
            <AuditPortal />
          </div>
        )}

        {/* 4. Driver App Tab (Phone Viewport) */}
        {activeTab === 'driver-app' && (
          <div className="relative z-10 w-full h-full">
            <DriverApp />
          </div>
        )}

        {/* 5. Compare View Tab */}
        {activeTab === 'compare' && (
          <div className="relative z-10 w-full h-full">
            <CompareView />
          </div>
        )}
      </main>

      {/* Phase 3: Simulate Drawer Overlay */}
      <SimulatePanel />

      {/* Floating System Toasts */}
      <Toasts />
    </div>
  );
};
export default App;
