import React, {  useEffect } from 'react';
import type { Annotation } from '../lib/types';
import { redrawAll } from '../utils/annotationDrawers';

interface CanvasLayerProps {
  width: number;
  height: number;
  annotations: Annotation[];
  selected?: Annotation | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: React.MouseEventHandler;
  onMouseMove: React.MouseEventHandler;
  onMouseUp: React.MouseEventHandler;
}

export const CanvasLayer: React.FC<CanvasLayerProps> = ({
  width,
  height,
  annotations,
  selected,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    redrawAll(ctx, annotations, selected || undefined);
  }, [annotations, selected]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="annot-canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
};

