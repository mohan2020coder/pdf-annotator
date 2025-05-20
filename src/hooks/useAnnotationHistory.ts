// hooks/useAnnotationHistory.ts
import { useState, useEffect } from 'react';
import type { Annotation } from '../lib/types';

export function useAnnotationHistory(initial: Annotation[] = []) {
  const [history, setHistory] = useState<Annotation[][]>([initial]);
  const [idx, setIdx]     = useState(0);
  const annotations       = history[idx];

  const push = (ann: Annotation) => {
    setHistory(h => {
      const newHist = [...h.slice(0, idx + 1), [...h[idx], ann]];
      return newHist;
    });
    setIdx(i => i + 1);
  };

  const undo  = () => setIdx(i => Math.max(0, i - 1));
  const redo  = () => setIdx(i => Math.min(history.length - 1, i + 1));
  const reset = (anns: Annotation[]) => { setHistory([anns]); setIdx(0); };

   const update = (ann: Annotation) => {
    setHistory(h => {
      const current = h[idx];
      const updated = current.map(a => (a.id === ann.id ? ann : a));
      return [...h.slice(0, idx + 1), updated];
    });
    setIdx(i => i + 1);
  };

  return { annotations, push, undo, redo, reset,update };
}
