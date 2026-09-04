import { useEffect, useState, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { AnimatePresence } from 'framer-motion';
import MainScene from './components/3d/MainScene';
import HeroUI from './sections/HeroUI';
import Navbar from './components/Navbar';
import CommandLayout from './sections/CommandLayout';
import GhostGenerationUI from './sections/GhostGenerationUI';
import EnergyFlowUI from './sections/EnergyFlowUI';
import DigitalTwinUI from './sections/DigitalTwinUI';
import AIConsoleUI from './sections/AIConsoleUI';
import GhostReplayUI from './sections/GhostReplayUI';
import PredictiveMaintenanceUI from './sections/PredictiveMaintenanceUI';
import ESGIntelligenceUI from './sections/ESGIntelligenceUI';
import ArchitectureUI from './sections/ArchitectureUI';
import ROICalculatorUI from './sections/ROICalculatorUI';
import CTAUI from './sections/CTAUI';
import Footer from './components/Footer';
import { SpectraSplash, shouldPlaySplash } from './components/branding';
import DecisionPanel from './components/ui/DecisionPanel';
import CommandCenter from './sections/CommandCenter';
import CommandCenterTransition from './components/CommandCenterTransition';
import TelemetryHUD from './components/ui/TelemetryHUD';
import { store, scrollRef } from './store';

gsap.registerPlugin(ScrollTrigger);

type CCState = 'idle' | 'transitioning' | 'open';

const STAGE_SECTIONS = [
  { stageIndex: 0, targetId: 'ghost-generation', fallbackId: 'hero' },
  { stageIndex: 1, targetId: 'digital-twin-dashboard' },
  { stageIndex: 2, targetId: 'scenario-simulator' },
  { stageIndex: 3, targetId: 'esg-intelligence' },
  { stageIndex: 4, targetId: 'observability' },
  { stageIndex: 5, targetId: 'cta' },
];

function updateStageFromScroll() {
  const triggerPoint = window.innerHeight * 0.45;
  let activeStageIndex = 0;

  for (let i = STAGE_SECTIONS.length - 1; i >= 0; i--) {
    const sec = STAGE_SECTIONS[i];
    const el = document.getElementById(sec.targetId) || (sec.fallbackId ? document.getElementById(sec.fallbackId) : null);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= triggerPoint) {
        activeStageIndex = sec.stageIndex;
        break;
      }
    }
  }

  if (store.stage !== activeStageIndex) {
    store.stage = activeStageIndex;
  }
}

function App() {
  const [splashComplete, setSplashComplete] = useState(() => !shouldPlaySplash());
  const [ccState, setCcState] = useState<CCState>('idle');

  const openCommandCenter = useCallback(() => {
    setCcState('transitioning');
  }, []);

  const closeCommandCenter = useCallback(() => {
    setCcState('idle');
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
      scrollRef.value = lenis.progress ?? 0;
      updateStageFromScroll();
    };

    gsap.ticker.add(onTick);
    window.addEventListener('scroll', updateStageFromScroll, { passive: true });

    gsap.ticker.lagSmoothing(0);

    // Pause scroll when CC is open
    if (ccState !== 'idle') {
      lenis.stop();
    } else {
      lenis.start();
    }

    return () => {
      lenis.destroy();
      gsap.ticker.remove(onTick);
      window.removeEventListener('scroll', updateStageFromScroll);
    };
  }, [ccState]);

  return (
    <>
      {!splashComplete && (
        <SpectraSplash onComplete={() => setSplashComplete(true)} />
      )}

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: -1 }}>
        <Canvas gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }} camera={{ position: [0, 5, 15], fov: 45 }}>
          <color attach="background" args={['#0F1115']} />
          <ambientLight intensity={0.5} />
          <MainScene />
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Main site — hidden behind CC when open */}
      <div style={{ opacity: ccState !== 'idle' ? 0 : 1, pointerEvents: ccState !== 'idle' ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
        <Navbar onCommandCenter={openCommandCenter} />
        <TelemetryHUD />
        <CommandLayout>
          <HeroUI brandReady={splashComplete} />
          <GhostGenerationUI />
          <EnergyFlowUI />
          <DigitalTwinUI />
          <AIConsoleUI />
          <GhostReplayUI />
          <PredictiveMaintenanceUI />
          <ESGIntelligenceUI />
          <ArchitectureUI />
          <ROICalculatorUI />
          <CTAUI />
        </CommandLayout>
        <Footer />
        <DecisionPanel />
      </div>

      {/* Command Center overlay with cinematic transition */}
      <AnimatePresence>
        {ccState === 'transitioning' && (
          <CommandCenterTransition
            key="cc-transition"
            onComplete={() => setCcState('open')}
          />
        )}
        {ccState === 'open' && (
          <CommandCenter
            key="cc-open"
            onClose={closeCommandCenter}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
