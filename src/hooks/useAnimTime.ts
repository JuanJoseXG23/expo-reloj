import { useEffect, useRef, useState } from 'react';

/**
 * Tiempo animado (en "unidades por segundo real" = speed).
 * Se pausa con `running = false` y cuando la pestaña está oculta.
 */
export function useAnimTime(running: boolean, speed = 1, start = 0) {
  const [t, setT] = useState(start);
  const tRef = useRef(start);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // evita saltos al volver a la pestaña
      last = now;
      tRef.current += dt * speed;
      setT(tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);

  const set = (v: number) => {
    tRef.current = v;
    setT(v);
  };

  return [t, set, tRef] as const;
}

/** Sonido "tic" corto con Web Audio (sin archivos). */
let audioCtx: AudioContext | null = null;
export function playTick(freq = 1200) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx ??= new Ctx();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    /* sin audio */
  }
}
