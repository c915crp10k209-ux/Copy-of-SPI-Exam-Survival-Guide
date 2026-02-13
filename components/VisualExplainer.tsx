
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Topic, LabState } from '../types';
import { getLabState, saveLabState } from '../services/storageService';
import { analyzeSimState } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface VisualExplainerProps {
  topic: Topic;
  visualId: string;
  hideControls?: boolean;
  termName?: string; 
}

const DEFAULT_LAB_STATE: LabState = {
  frequency: 50,
  amplitude: 50,
  targetDepth: 5,
  flowType: 'Laminar',
  dopplerAngle: 60,
  velocity: 40,
  mismatch: 30,
  incidenceType: 'Normal',
  damping: 'High',
  axialSpacing: 30,
  medium: 'Soft Tissue',
  speed1: 1540,
  speed2: 1540
};

export const VisualExplainer: React.FC<VisualExplainerProps> = ({ topic, visualId, hideControls = false, termName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [labState, setLabState] = useState<LabState>(() => getLabState(visualId) || DEFAULT_LAB_STATE);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [showPressureMap, setShowPressureMap] = useState(true);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Interaction modulation refs
  const interactionFreqMult = useRef(1.0);
  const interactionAmpMult = useRef(1.0);

  // Refs for lerping
  const lerpFactor = 0.12;
  const lerpedState = useRef<Record<string, number>>({
    frequency: labState.frequency,
    amplitude: labState.amplitude,
    targetDepth: labState.targetDepth,
    velocity: labState.velocity,
    mismatch: labState.mismatch,
    dopplerAngle: labState.dopplerAngle,
    axialSpacing: labState.axialSpacing || 30,
    speed1: labState.speed1 || 1540,
    speed2: labState.speed2 || 1540
  });

  const isSyncing = useRef<Record<string, boolean>>({});

  const physicsData = useMemo(() => {
    const fMHz = (lerpedState.current.frequency / 10) * (visualId === 'LongitudinalWaveVisual' && isHovered ? interactionFreqMult.current : 1.0);
    const fHz = fMHz * 1000000;
    const speed = lerpedState.current.speed1 || 1540;
    const wavelength = (speed / fHz) * 1000; 
    const period = (1 / fMHz); 
    const spl = wavelength * (labState.damping === 'High' ? 2 : 4); 
    
    return {
      fMHz: fMHz.toFixed(1),
      wavelength: wavelength.toFixed(3),
      period: period.toFixed(3),
      axialRes: (spl / 2).toFixed(3),
      impedance: (1.54 * (lerpedState.current.mismatch / 10 + 1)).toFixed(2)
    };
  }, [labState, isHovered, visualId]);

  useEffect(() => {
    const handleSync = () => {
      const fresh = getLabState(visualId);
      if (fresh) setLabState(fresh);
    };
    window.addEventListener('storage-update', handleSync);
    return () => window.removeEventListener('storage-update', handleSync);
  }, [visualId]);

  useEffect(() => {
    if (!hideControls) {
      saveLabState(visualId, labState);
    }
    window.dispatchEvent(new CustomEvent('rav_lab_state_changed', { detail: { state: labState, visualId } }));
  }, [labState, visualId, hideControls]);

  const handleStartAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeSimState(visualId, labState);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.04;
      
      const keysToLerp = ['frequency', 'amplitude', 'targetDepth', 'velocity', 'mismatch', 'dopplerAngle', 'axialSpacing', 'speed1', 'speed2'];
      keysToLerp.forEach(key => {
        const target = (labState as any)[key] ?? (DEFAULT_LAB_STATE as any)[key];
        const current = lerpedState.current[key];
        if (Math.abs(target - current) > 0.01) {
          lerpedState.current[key] = current + (target - current) * lerpFactor;
          isSyncing.current[key] = true;
        } else {
          lerpedState.current[key] = target;
          isSyncing.current[key] = false;
        }
      });

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const { frequency, amplitude, targetDepth, velocity, mismatch, dopplerAngle, axialSpacing, speed1, speed2 } = lerpedState.current;
      const { flowType, damping } = labState;

      ctx.save();
      ctx.shadowBlur = isHovered ? 20 : 10;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';

      switch (visualId) {
        case 'LongitudinalWaveVisual': 
          if (isHovered) {
             const targetF = 0.4 + (mousePosRef.current.x / rect.width) * 2.0;
             const targetA = 0.3 + (1 - mousePosRef.current.y / rect.height) * 2.5;
             interactionFreqMult.current += (targetF - interactionFreqMult.current) * 0.1;
             interactionAmpMult.current += (targetA - interactionAmpMult.current) * 0.1;
          } else {
             interactionFreqMult.current += (1.0 - interactionFreqMult.current) * 0.05;
             interactionAmpMult.current += (1.0 - interactionAmpMult.current) * 0.05;
          }
          drawLongitudinalWave(ctx, rect.width, rect.height, time, amplitude * interactionAmpMult.current, frequency * interactionFreqMult.current, speed1, isHovered, mousePosRef.current); 
          break;
        case 'WaveParametersVisual': drawTransverseWave(ctx, rect.width, rect.height, time, amplitude, frequency, speed1); break;
        case 'TissueInteractionVisual': drawReflectionRefraction(ctx, rect.width, rect.height, time, mismatch, dopplerAngle, speed1, speed2); break;
        case 'PulseEchoPrincipleVisual': drawPulseEcho(ctx, rect.width, rect.height, time, targetDepth); break;
        case 'PulseParametersVisual': drawPulseParameters(ctx, rect.width, rect.height, time, frequency, amplitude); break;
        case 'FlowPatternsVisual': drawFlow(ctx, rect.width, rect.height, time, flowType, velocity); break;
        case 'BeamFocusingVisual': drawBeamFocusing(ctx, rect.width, rect.height, time, frequency); break;
        case 'LateralResolutionVisual': drawLateralRes(ctx, rect.width, rect.height, time, frequency, axialSpacing); break;
        case 'AxialResolutionVisual': drawAxialRes(ctx, rect.width, rect.height, time, frequency, axialSpacing); break;
        case 'TransducerAnatomyVisual': drawTransducerAnatomy(ctx, rect.width, rect.height, time, frequency, damping); break;
        case 'DopplerModesVisual': 
            // Enhanced Interactivity: Steering
            const steerAngle = isHovered ? (mousePosRef.current.x / rect.width) * 90 : dopplerAngle;
            drawAliasing(ctx, rect.width, rect.height, time, velocity, frequency, steerAngle); 
            break; 
        case 'PropagationArtifactsVisual': 
            // Fix: Replaced 'width' with 'rect.width' to resolve "Cannot find name 'width'" error
            const reflectorX = isHovered ? mousePosRef.current.x : rect.width / 2;
            drawArtifactsMatrix(ctx, rect.width, rect.height, time, mismatch, reflectorX); 
            break;
        case 'BioeffectMechanismsVisual': drawBioeffects(ctx, rect.width, rect.height, time, amplitude); break;
        case 'QaPhantomVisual': drawQaPhantom(ctx, rect.width, rect.height, time, targetDepth, amplitude); break;
        case 'HarmonicImagingVisual': drawHarmonics(ctx, rect.width, rect.height, time, frequency); break;
        case 'ReceiverFunctionsVisual': drawReceiverFunctions(ctx, rect.width, rect.height, time, amplitude, mismatch); break;
        case 'DisplayModesVisual': drawDisplayModes(ctx, rect.width, rect.height, time, velocity); break;
        case 'ElastographyVisual': drawElastography(ctx, rect.width, rect.height, time, amplitude); break;
        case 'DopplerTypesVisual': drawDopplerTypes(ctx, rect.width, rect.height, time, velocity); break;
        case 'ResolutionArtifactsVisual': drawResolutionArtifacts(ctx, rect.width, rect.height, time, axialSpacing); break;
        case 'OutputControlVisual': drawOutputControl(ctx, rect.width, rect.height, time, amplitude, dopplerAngle); break;
        case 'BernoulliVisual': drawBernoulli(ctx, rect.width, rect.height, time, velocity); break;
        case 'PhantomDetailVisual': drawPhantomDetail(ctx, rect.width, rect.height, time, mismatch); break;
        case 'ElevationResVisual': drawElevationRes(ctx, rect.width, rect.height, time, frequency, dopplerAngle); break;
        case 'ContrastAgentsVisual': drawContrastAgents(ctx, rect.width, rect.height, time, amplitude); break;
        case 'PostProcessingVisual': drawPostProcessing(ctx, rect.width, rect.height, time, mismatch); break;
        case 'VolumeImagingVisual': drawVolumeImaging(ctx, rect.width, rect.height, time, frequency); break;
        case 'DepthPrfVisual': drawDepthPrf(ctx, rect.width, rect.height, time, targetDepth); break;
        default: drawGenericActivity(ctx, rect.width, rect.height, time); break;
      }
      ctx.restore();

      drawHUDTelemetry(ctx, rect.width, rect.height, lerpedState.current, physicsData);
      if (isAnalyzing) drawScanningEffect(ctx, rect.width, rect.height, time);

      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [visualId, labState, termName, isHovered, physicsData, isAnalyzing, showPressureMap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current || e.touches.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePosRef.current = { 
      x: e.touches[0].clientX - rect.left, 
      y: e.touches[0].clientY - rect.top 
    };
    if (!isHovered) setIsHovered(true);
  };

  const drawHUDTelemetry = (ctx: CanvasRenderingContext2D, width: number, height: number, state: any, physics: any) => {
    ctx.save();
    const x = 20; const y = 30; const rowH = 15;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'; ctx.lineWidth = 1;
    
    ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(25, 10); ctx.moveTo(10, 10); ctx.lineTo(10, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - 10, 10); ctx.lineTo(width - 25, 10); ctx.moveTo(width - 10, 10); ctx.lineTo(width - 10, 25); ctx.stroke();

    ctx.font = '900 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(`// SYSTEM_TELEMETRY`, x, y);

    const drawRow = (label: string, value: string, idx: number, animating: boolean) => {
      ctx.fillStyle = animating ? '#d4af37' : 'rgba(244, 228, 188, 0.5)';
      ctx.font = animating ? '900 9px "JetBrains Mono", monospace' : '800 8px "JetBrains Mono", monospace';
      ctx.fillText(`${label.padEnd(10)} ${value}`, x, y + rowH * (idx + 1));
    };

    drawRow('FREQ:', `${physics.fMHz} MHz`, 0, isSyncing.current.frequency || (isHovered && visualId === 'LongitudinalWaveVisual'));
    drawRow('WAVELEN:', `${physics.wavelength} mm`, 1, isSyncing.current.speed1 || isSyncing.current.frequency || (isHovered && visualId === 'LongitudinalWaveVisual'));
    drawRow('IMPED:', `${physics.impedance} Rayls`, 2, isSyncing.current.mismatch);

    if (visualId === 'DopplerModesVisual') {
        const angle = isHovered ? (mousePosRef.current.x / width) * 90 : state.dopplerAngle;
        drawRow('COS(θ):', Math.cos(angle * Math.PI / 180).toFixed(3), 3, isHovered);
    }

    if (termName) {
      ctx.fillStyle = '#d4af37';
      ctx.font = '900 10px "JetBrains Mono"';
      ctx.fillText(`TARGET: ${termName.toUpperCase()}`, width / 2 - 40, height - 20);
    }
    
    ctx.restore();
  };

  const drawLongitudinalWave = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, amplitude: number, frequency: number, speed: number, hovered: boolean, mouse: {x: number, y: number}) => {
    const cols = width < 640 ? 30 : 60; const rows = width < 640 ? 8 : 12; 
    const freqScale = frequency / 50; 
    const startX = (width / 2) - (cols * 10) / 2;
    const startY = (height / 2) - (rows * 16) / 2;

    const oscillationSpeed = time * (10 + frequency / 5);

    if (showPressureMap) {
        for(let c = 0; c < cols; c += 4) {
            const phase = (c * (Math.PI * 2 / (15 / freqScale))) - oscillationSpeed;
            const val = Math.sin(phase);
            ctx.fillStyle = val > 0 ? `rgba(212, 175, 55, ${val * 0.08})` : `rgba(56, 189, 248, ${Math.abs(val) * 0.08})`;
            ctx.fillRect(startX + c * 10, startY - 20, 30, rows * 16 + 40);
        }
    }

    for (let c = 0; c < cols; c++) {
      const xBase = startX + c * 10; 
      const wavelengthFactor = 15 / freqScale;
      const phase = (c * (Math.PI * 2 / wavelengthFactor)) - oscillationSpeed;
      const waveVal = Math.sin(phase); 
      
      const isComp = waveVal > 0.8; 
      const isRare = waveVal < -0.8;

      for (let r = 0; r < rows; r++) {
        const yBase = startY + r * 16; 
        let influence = 0;
        
        if (hovered) {
          const dist = Math.sqrt((xBase-mouse.x)**2 + (yBase-mouse.y)**2);
          influence = Math.sin(time * 15 + dist / 8) * Math.exp(-dist / 50) * (amplitude / 2);
        }
        
        const xOffset = (waveVal * (amplitude / 8)) + influence;
        let alpha = hovered ? 0.3 : 0.15;
        if (isComp) alpha = 0.7 + (amplitude / 200); else if (isRare) alpha = 0.5;
        
        ctx.fillStyle = isComp ? `rgba(212, 175, 55, ${alpha})` : isRare ? `rgba(56, 189, 248, ${alpha})` : `rgba(244, 228, 188, ${alpha})`;
        const size = (width < 640 ? 1.5 : 2.0) * (isComp ? 1.4 : 1.0);
        
        ctx.beginPath(); 
        ctx.arc(xBase + xOffset, yBase, size, 0, Math.PI * 2); 
        ctx.fill();
      }
    }
  };

  const drawTransverseWave = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, amp: number, freq: number, speed: number) => {
    const centerY = height / 2; const startX = 40; const endX = width - 40;
    const wavelength = (speed / 1540) * (150 / (freq / 10));
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = startX; x < endX; x++) {
      const y = centerY + amp * 0.8 * Math.sin((x - startX) * (Math.PI * 2 / wavelength) - time * 10);
      if (x === startX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawReflectionRefraction = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, mismatch: number, angle: number, speed1: number, speed2: number) => {
    const centerY = height / 2; const centerX = width / 2;
    ctx.strokeStyle = 'rgba(244, 228, 188, 0.1)'; ctx.beginPath(); ctx.moveTo(centerX, 40); ctx.lineTo(centerX, height - 40); ctx.stroke();
    const rad = angle * (Math.PI / 180); const beamLen = width / 3;
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(centerX - Math.sin(rad) * beamLen, centerY + Math.cos(rad) * beamLen);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
    const sin2 = (speed2 / speed1) * Math.sin(rad);
    const refractAngle = sin2 <= 1 && sin2 >= -1 ? Math.asin(sin2) : Math.PI / 2;
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath(); moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.sin(refractAngle) * beamLen, centerY - Math.cos(refractAngle) * beamLen); ctx.stroke();
  };

  const drawArtifactsMatrix = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, mismatch: number, refX: number) => {
    const cx = refX; const cy = height / 2;
    const isShadow = mismatch > 50;
    const isEnhance = mismatch < 20;

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(50, cy); ctx.lineTo(width - 50, cy); ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(cx, cy - 40, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4af37'; ctx.stroke();

    if (isShadow) {
        const grad = ctx.createLinearGradient(cx, cy, cx, height);
        grad.addColorStop(0, 'rgba(0,0,0,0.6)'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fillRect(cx - 30, cy - 10, 60, height - cy);
    } else if (isEnhance) {
        const grad = ctx.createLinearGradient(cx, cy, cx, height);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.2)'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fillRect(cx - 30, cy - 10, 60, height - cy);
    }
  };

  const drawPulseEcho = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, depth: number) => {
    const startX = 80; const targetX = startX + (depth * (width - 160) / 15); const centerY = height / 2;
    ctx.strokeStyle = '#d4af37'; ctx.strokeRect(startX - 40, centerY - 40, 40, 80);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'; ctx.fillRect(targetX, centerY - 50, 15, 100); 
    const cycle = 3.0; const progress = (time % cycle) / cycle;
    const currentX = progress < 0.5 ? startX + progress * 2 * (targetX - startX) : targetX - (progress - 0.5) * 2 * (targetX - startX);
    ctx.strokeStyle = progress < 0.5 ? '#d4af37' : '#10b981'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(currentX, centerY - 15); ctx.lineTo(currentX, centerY + 15); ctx.stroke();
  };

  const drawPulseParameters = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, freq: number, amp: number) => {
    const centerY = height / 2; const pulseLen = 50 * (freq / 50);
    const xOffset = (time * 80) % (width - 100);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x < pulseLen; x++) {
        const env = Math.sin((x / pulseLen) * Math.PI);
        const y = centerY + Math.sin(x * 0.8) * amp * 0.3 * env;
        if (x === 0) ctx.moveTo(50 + xOffset + x, y); else ctx.lineTo(50 + xOffset + x, y);
    }
    ctx.stroke();
  };

  const drawFlow = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, type: 'Laminar' | 'Turbulent', vel: number) => {
    const centerY = height / 2; const pipeH = 70;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)'; ctx.strokeRect(50, centerY - pipeH/2, width - 100, pipeH);
    for(let i=0; i < 50; i++) {
        const yRel = ((i * 37) % 100) / 100; const yB = centerY - pipeH/2 + yRel * pipeH; 
        const d = Math.abs(yB - centerY) / (pipeH/2);
        const s = type === 'Laminar' ? (1.5 - d * d) * (vel/10) : (vel/12) * (Math.random() + 0.5);
        const x = (i * 15 + time * 80 * s) % (width - 100) + 50;
        ctx.fillStyle = type === 'Laminar' ? '#10b981' : '#ef4444'; 
        ctx.beginPath(); ctx.arc(x, yB, 1.5, 0, Math.PI*2); ctx.fill();
    }
  };

  const drawBeamFocusing = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, freq: number) => {
    const cx = 50; const cy = height / 2; const focusX = width * 0.55;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; ctx.lineWidth = 1;
    for(let i = -8; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(cx, cy + i * 3); ctx.bezierCurveTo(focusX, cy + i, focusX, cy + i, width - 30, cy + i * 10); ctx.stroke();
    }
    ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(focusX, cy, 3, 0, Math.PI * 2); ctx.fill();
  };

  const drawLateralRes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number, spacing: number) => {
    const cx = width / 2; const cy = height / 2; const beamW = 90 - frequency;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)'; ctx.fillRect(cx - beamW/2, 0, beamW, height);
    ctx.fillStyle = '#f4e4bc'; ctx.beginPath(); ctx.arc(cx - spacing/2, cy, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + spacing/2, cy, 3, 0, Math.PI*2); ctx.fill();
  };

  const drawAxialRes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number, spacing: number) => {
    const cx = width / 2; const cy = height / 2; const pulseL = 100 - frequency;
    const pulseX = (time * 150) % (width + 100) - 50;
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pulseX, cy); ctx.lineTo(pulseX + pulseL, cy); ctx.stroke();
    ctx.fillStyle = '#f4e4bc'; ctx.beginPath(); ctx.arc(cx, cy - spacing/2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + spacing/2, 3, 0, Math.PI*2); ctx.fill();
  };

  const drawTransducerAnatomy = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number, damping: 'High' | 'Low') => {
    const cx = width / 2; const cy = height / 2; const h = 80;
    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(cx - 50, cy - h/2, 30, h); 
    ctx.fillStyle = '#d4af37'; ctx.fillRect(cx - 20, cy - h/2, 8, h); 
    ctx.fillStyle = '#38bdf8'; ctx.globalAlpha = 0.4; ctx.fillRect(cx - 12, cy - h/2, 8, h); ctx.globalAlpha = 1;
    const step = damping === 'Low' ? 8 : 25; const waveProgress = (time * 6) % 15;
    for(let i=0; i<3; i++) {
        const x = cx + waveProgress * 8 + i * step; ctx.strokeStyle = `rgba(212, 175, 55, ${1 - (x-cx)/100})`;
        ctx.beginPath(); ctx.arc(cx - 10, cy, x - (cx - 10), -0.3, 0.3); ctx.stroke();
    }
  };

  const drawAliasing = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, velocity: number, frequency: number, angle: number) => {
    const cx = width / 2; const cy = height / 2; 
    const limit = 80 - frequency/2; 
    const cosVal = Math.cos(angle * Math.PI / 180);
    
    // Draw limit lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(80, cy - limit); ctx.lineTo(width - 80, cy - limit); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, cy + limit); ctx.lineTo(width - 80, cy + limit); ctx.stroke();
    ctx.setLineDash([]);

    // Draw steering line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(cx, 20);
    ctx.lineTo(cx + Math.tan((angle-45) * Math.PI / 180) * 100, 120);
    ctx.stroke();

    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 80; x < width - 80; x++) {
      // Shift magnitude depends on velocity AND cosine of angle
      let yShift = Math.sin(x * 0.05 - time * 5) * velocity * 1.5 * cosVal;
      
      // Handle aliasing wrap-around
      if (yShift > limit) yShift -= limit * 2; 
      if (yShift < -limit) yShift += limit * 2;
      
      if (x === 80) ctx.moveTo(x, cy - yShift); else ctx.lineTo(x, cy - yShift);
    }
    ctx.stroke();
  };

  const drawBioeffects = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, amp: number) => {
    const cx = width / 2; const cy = height / 2; const isTransient = amp > 80;
    const count = isTransient ? 15 : 5;
    for (let i = 0; i < count; i++) {
        const r = isTransient ? (20 + Math.random() * 30) * (Math.sin(time * 20 + i) > 0 ? 1 : 0) : (20 + Math.sin(time * 8 + i) * 8) * (amp / 50); 
        ctx.strokeStyle = isTransient ? '#ef4444' : '#10b981';
        ctx.beginPath(); ctx.arc(cx + Math.cos(i) * 60, cy + Math.sin(i) * 60, r, 0, Math.PI * 2); ctx.stroke();
    }
  };

  const drawQaPhantom = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, depth: number, gain: number) => {
    const scanY = (time * 60) % height; ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(width, scanY); ctx.stroke();
    for (let i = 1; i <= 6; i++) {
        const y = i * (35 + (depth * 1.5)); const op = Math.max(0, 1 - (y / height) * (1 - gain/100));
        ctx.fillStyle = `rgba(244, 228, 188, ${op})`; ctx.beginPath(); ctx.arc(width/2, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawHarmonics = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number) => {
    const cy = height / 2; ctx.strokeStyle = 'rgba(244, 228, 188, 0.1)'; ctx.beginPath();
    for (let x = 60; x < width - 60; x++) {
      const y = cy - 30 + Math.sin(x * 0.06 - time * 4) * 20;
      if (x === 60) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 60; x < width - 60; x++) {
      const y = cy + 30 + Math.sin(x * 0.12 - time * 8) * 10;
      if (x === 60) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawReceiverFunctions = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, gain: number, mismatch: number) => {
    const amp = gain / 50; ctx.strokeStyle = '#d4af37'; ctx.beginPath();
    for (let x = 80; x < width - 80; x++) {
        const noise = (Math.random() - 0.5) * 6 * amp;
        const pulse = Math.abs(x - width/2) < 10 ? -60 * amp : 0;
        const y = height/2 + 40 + noise + pulse;
        if (x === 80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawDisplayModes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, vel: number) => {
    const cx = width / 2; const cy = height / 2;
    ctx.strokeStyle = '#d4af37'; ctx.strokeRect(cx - 80, cy - 50, 160, 100);
    ctx.beginPath(); ctx.moveTo(cx - 80, cy); ctx.lineTo(cx - 40, cy); ctx.lineTo(cx - 30, cy - 40); ctx.lineTo(cx - 20, cy); ctx.lineTo(cx + 80, cy); ctx.stroke();
  };

  const drawElastography = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, force: number) => {
    const compress = Math.sin(time * 2.0) * (force / 100) * 10;
    ctx.fillStyle = force > 70 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath(); ctx.ellipse(width/2, height/2 + compress, 40, 40 - compress, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = force > 70 ? '#38bdf8' : '#ef4444'; ctx.stroke();
  };

  const drawDopplerTypes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, vel: number) => {
    const cy = height / 2; ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'; ctx.fillRect(80, cy - 30, width - 160, 60);
    for (let i = 0; i < 4; i++) {
      const x = (100 + i * (width - 200) / 3 + time * 40) % (width - 160) + 80;
      ctx.fillStyle = vel > 50 ? '#ef4444' : '#38bdf8';
      ctx.beginPath(); ctx.arc(x, cy, 8, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawResolutionArtifacts = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, spacing: number) => {
    const cx = width / 2; const cy = height / 2; const blur = Math.max(1, 30 - spacing / 2);
    ctx.fillStyle = 'rgba(244, 228, 188, 0.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, blur + 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  };

  const drawOutputControl = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, amp: number, angle: number) => {
    const cx = width / 2; const cy = height / 2; const rad = angle * (Math.PI / 180);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad);
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = `rgba(212, 175, 55, ${0.4 / i})`; ctx.beginPath(); ctx.arc(-80, 0, i * 15 * (amp / 50), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  const drawBernoulli = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, vel: number) => {
    const cy = height / 2; const midX = width / 2; ctx.strokeStyle = 'rgba(244, 228, 188, 0.15)';
    ctx.beginPath(); ctx.moveTo(80, cy - 40); ctx.lineTo(midX - 30, cy - 40); ctx.lineTo(midX, cy - 15); ctx.lineTo(midX + 30, cy - 40); ctx.lineTo(width - 80, cy - 40); ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const x = (i * 25 + time * vel * 1.5) % (width - 160) + 80;
      const isNar = Math.abs(x - midX) < 30;
      ctx.fillStyle = isNar ? '#ef4444' : '#10b981'; ctx.beginPath(); ctx.arc(x, isNar ? cy + (Math.random()-0.5)*15 : cy + (Math.random()-0.5)*50, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawPhantomDetail = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, mismatch: number) => {
    const cx = width / 2; const speedErr = (mismatch - 30) / 12;
    for (let i = 1; i <= 5; i++) {
      const y = 50 + i * 35; ctx.fillStyle = 'rgba(244, 228, 188, 0.7)';
      ctx.beginPath(); ctx.arc(cx, y + i * speedErr, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawElevationRes = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number, angle: number) => {
    const cx = width / 2; const cy = height / 2; const rad = angle * (Math.PI / 180);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'; ctx.beginPath(); ctx.moveTo(-30, -60); ctx.lineTo(30, -45); ctx.lineTo(30, 45); ctx.lineTo(-30, 60); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  };

  const drawContrastAgents = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, amp: number) => {
    const cx = width / 2; const cy = height / 2;
    for (let i = 0; i < 15; i++) {
      const x = (i * 35 + time * 25) % width; const size = 2 + Math.sin(time * 4 + i) * (amp / 25);
      ctx.fillStyle = '#f4e4bc'; ctx.beginPath(); ctx.arc(x, cy + Math.sin(x * 0.06) * 20, size, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawPostProcessing = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, mismatch: number) => {
    const cx = width / 2; const cy = height / 2; const px = mismatch > 50 ? 15 : 4;
    ctx.fillStyle = 'rgba(244, 228, 188, 0.1)';
    for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) ctx.fillRect(cx + x * px - px / 2, cy + y * px - px / 2, px - 1, px - 1);
  };

  const drawVolumeImaging = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, frequency: number) => {
    const cx = width / 2; const cy = height / 2; ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath(); ctx.moveTo(cx - 40, cy - 40); ctx.lineTo(cx + 40, cy - 40); ctx.lineTo(cx + 60, cy - 15); ctx.lineTo(cx + 60, cy + 60); ctx.lineTo(cx - 15, cy + 60); ctx.lineTo(cx - 40, cy + 40); ctx.closePath(); ctx.stroke();
  };

  const drawDepthPrf = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, depth: number) => {
    const prp = depth * 8; const t = (time * 80) % (prp * 4); ctx.fillStyle = '#d4af37';
    if (t < 15) ctx.fillRect(width / 2 - 40, height / 2, 80, 3);
  };

  const drawGenericActivity = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.fillStyle = 'rgba(244, 228, 188, 0.1)'; ctx.textAlign = 'center'; ctx.font = '900 12px "JetBrains Mono", monospace'; ctx.fillText("INIT_LAB_UPLINK...", width/2, height/2);
  };

  const drawScanningEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const scanY = (time * 120) % height;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(width, scanY); ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.03)'; ctx.fillRect(0, scanY - 40, width, 40);
  };

  const renderControlPanel = (controls: React.ReactNode) => (
      <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6 glass-panel rounded-xl md:rounded-[2.5rem] p-3 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-center z-40 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10 items-center flex-1">{controls}</div>
          <div className="flex gap-2 w-full md:w-auto">
              <button onClick={handleStartAnalysis} disabled={isAnalyzing} className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-black border border-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 italic font-mono flex items-center justify-center gap-2">
                <i className={`fas ${isAnalyzing ? 'fa-circle-notch fa-spin' : 'fa-microchip'}`}></i> ANALYZE
              </button>
              <button onClick={() => {setLabState(DEFAULT_LAB_STATE); setAnalysis(null);}} className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-gold-500 text-slate-300 hover:text-black border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 italic font-mono flex items-center justify-center gap-2">
                <i className="fas fa-undo-alt"></i> RESET
              </button>
          </div>
      </div>
  );

  return (
      <div 
        className="relative w-full h-full bg-midnight flex flex-col items-center justify-center overflow-hidden rounded-[1.2rem] md:rounded-[4rem] border border-white/5 shadow-inner touch-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
          <canvas ref={canvasRef} className="w-full h-full z-10 block" />
          
          <div className="absolute top-3 right-3 z-30">
              <button 
                onClick={() => setShowPressureMap(!showPressureMap)} 
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${showPressureMap ? 'bg-gold-500/20 border-gold-500 text-gold-500' : 'bg-black/40 border-white/10 text-slate-500'}`}
                title="Toggle Field Map"
              >
                  <i className="fas fa-layer-group"></i>
              </button>
          </div>

          {analysis && (
            <div className="absolute top-16 right-4 left-4 md:top-24 md:right-10 md:left-auto md:w-80 z-50 animate-fade-in">
               <div className="glass-card p-5 md:p-10 rounded-[1.5rem] border-emerald-500/30 bg-black/90 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 animate-pulse"></div>
                  <div className="flex justify-between items-center mb-3">
                     <span className="hud-label text-emerald-400">ANALYSIS_SYNC</span>
                     <button onClick={() => setAnalysis(null)} className="text-slate-600 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="prose prose-invert prose-xs">
                     <div className="text-slate-300 italic font-light leading-relaxed text-[10px] md:text-xs">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {!hideControls && (
            <div className="animate-fade-in w-full">
              {renderControlPanel(
                <>
                    <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase text-gold-500 tracking-widest font-mono">
                          <span className="flex items-center gap-2"><i className="fas fa-wave-square"></i> FREQUENCY</span>
                          <span className={`${isSyncing.current.frequency ? 'animate-pulse text-white' : ''}`}>
                            {physicsData.fMHz} MHz
                          </span>
                        </div>
                        <input type="range" min="20" max="150" value={labState.frequency} onChange={e => setLabState(p => ({ ...p, frequency: Number(e.target.value) }))} className="w-full h-1 appearance-none bg-white/10 rounded-full accent-gold-500 cursor-pointer" />
                    </div>

                    <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase text-acoustic-blue tracking-widest font-mono">
                          <span className="flex items-center gap-2"><i className="fas fa-cog"></i> {visualId === 'ElastographyVisual' ? 'STRESS' : 'AMPLITUDE'}</span>
                          <span className={`${isSyncing.current.amplitude ? 'animate-pulse text-white' : ''}`}>
                            {Math.round(lerpedState.current.amplitude)}%
                          </span>
                        </div>
                        <input type="range" min="10" max="100" value={labState.amplitude} onChange={e => setLabState(p => ({ ...p, amplitude: Number(e.target.value) }))} className="w-full h-1 appearance-none bg-white/10 rounded-full accent-acoustic-blue cursor-pointer" />
                    </div>

                    <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase text-emerald-500 tracking-widest font-mono">
                          <span className="flex items-center gap-2"><i className="fas fa-layer-group"></i> DEPTH</span>
                          <span className={`${isSyncing.current.targetDepth ? 'animate-pulse text-white' : ''}`}>
                            {lerpedState.current.targetDepth.toFixed(1)}cm
                          </span>
                        </div>
                        <input type="range" min="1" max="15" value={labState.targetDepth} onChange={e => setLabState(p => ({ ...p, targetDepth: Number(e.target.value) }))} className="w-full h-1 appearance-none bg-white/10 rounded-full accent-emerald-500 cursor-pointer" />
                    </div>

                    {['LateralResolutionVisual', 'AxialResolutionVisual', 'TissueInteractionVisual', 'PostProcessingVisual', 'ResolutionArtifactsVisual', 'ElevationResVisual', 'OutputControlVisual', 'BioeffectMechanismsVisual', 'PropagationArtifactsVisual', 'DopplerModesVisual'].includes(visualId) && (
                      <div className="w-full space-y-1.5">
                          <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase text-acoustic-indigo tracking-widest font-mono">
                            <span className="flex items-center gap-2">
                                <i className="fas fa-arrows-alt-h"></i> {['ElevationResVisual', 'OutputControlVisual'].includes(visualId) ? 'STEERING' : (visualId === 'TissueInteractionVisual' || visualId === 'PropagationArtifactsVisual' ? 'MISMATCH' : (visualId === 'DopplerModesVisual' ? 'ANGLE' : 'SPACING'))}
                            </span>
                            <span className={`${(isSyncing.current.dopplerAngle || isSyncing.current.mismatch || isSyncing.current.axialSpacing) ? 'animate-pulse text-white' : ''}`}>
                                {['ElevationResVisual', 'OutputControlVisual', 'DopplerModesVisual'].includes(visualId) ? `${Math.round(lerpedState.current.dopplerAngle)}°` : (['TissueInteractionVisual', 'PropagationArtifactsVisual'].includes(visualId) ? `${Math.round(lerpedState.current.mismatch)}%` : `${Math.round(lerpedState.current.axialSpacing)} mm`)}
                            </span>
                          </div>
                          <input type="range" min={['ElevationResVisual', 'OutputControlVisual', 'DopplerModesVisual'].includes(visualId) ? "0" : "5"} max={['ElevationResVisual', 'OutputControlVisual', 'DopplerModesVisual'].includes(visualId) ? "90" : "80"} value={['ElevationResVisual', 'OutputControlVisual', 'DopplerModesVisual'].includes(visualId) ? labState.dopplerAngle : (['TissueInteractionVisual', 'PropagationArtifactsVisual'].includes(visualId) ? labState.mismatch : labState.axialSpacing)} onChange={e => setLabState(p => ({ ...p, [['ElevationResVisual', 'OutputControlVisual', 'DopplerModesVisual'].includes(visualId) ? 'dopplerAngle' : (['TissueInteractionVisual', 'PropagationArtifactsVisual'].includes(visualId) ? 'mismatch' : 'axialSpacing')]: Number(e.target.value) }))} className="w-full h-1 appearance-none bg-white/10 rounded-full accent-acoustic-indigo cursor-pointer" />
                      </div>
                    )}
                </>
              )}
            </div>
          )}
      </div>
  );
};
