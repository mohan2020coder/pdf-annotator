// hooks/useAnnotationTools.ts
import { useCallback, useState } from 'react';
import type {
  Point,
  Tool,
  Annotation,
  PenAnnotation,
  RectAnnotation,
  CircleAnnotation,
  ArrowAnnotation
} from '../lib/types';
import { isPointInAnnotation, drawPreview } from '../utils/annotationUtils';
import { useAnnotationHistory } from './useAnnotationHistory';
import { redrawAll } from '../utils/annotationDrawers';

interface State {
  isDrawing: boolean;
  points: Point[];
  start: Point | null;
  selected: Annotation | null;
  offset: Point;
}

export function useAnnotationTools(
  annotCanvasRef: React.RefObject<HTMLCanvasElement>,
  tool: Tool,
  color: string,
  lineWidth: number,
) {
  const { annotations, push, undo, redo ,reset} = useAnnotationHistory();
  const [state, setState] = useState<State>({
    isDrawing: false,
    points: [],
    start: null,
    selected: null,
    offset: { x: 0, y: 0 }
  });

  const replaceAnnotations = (newAnnotations: Annotation[]) => {
  reset(newAnnotations);
  
  // Add null check and type assertion
  const ctx = annotCanvasRef.current?.getContext('2d');
  if (ctx) {
    redrawAll(ctx, newAnnotations);
  }
};

  const getPos = (e: React.MouseEvent): Point => {
    const r = annotCanvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const redrawAnnotations = () => {
    const ctx = annotCanvasRef.current!.getContext('2d')!;
    redrawAll(ctx, annotations, state.selected || undefined);
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const pt = getPos(e);

    if (tool === 'move') {
      const hit = [...annotations].reverse().find(a => isPointInAnnotation(pt, a));
      if (hit) {
        let ref: Point = pt;
        if (hit.type === 'rect') ref = (hit as RectAnnotation).start;
        else if (hit.type === 'circle') ref = (hit as CircleAnnotation).center;
        else if (hit.type === 'arrow') ref = (hit as ArrowAnnotation).start;

        setState(s => ({
          ...s,
          selected: hit,
          isDrawing: true,
          offset: { x: pt.x - ref.x, y: pt.y - ref.y }
        }));
        return;
      }
      setState(s => ({ ...s, selected: null }));
      return;
    }

    setState(s => ({
      ...s,
      isDrawing: true,
      start: pt,
      points: [pt]
    }));
  }, [tool, annotations]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const ctx = annotCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pt = getPos(e);
    const { isDrawing, selected, offset } = state;

    if (tool === 'move' && isDrawing && selected) {
      const dx = pt.x - offset.x;
      const dy = pt.y - offset.y;
      let moved: Annotation | null = null;

      if (selected.type === 'rect') {
        const r = selected as RectAnnotation;
        moved = {
          ...r,
          start: { x: dx, y: dy },
          end:   { x: dx + (r.end.x - r.start.x), y: dy + (r.end.y - r.start.y) }
        };
      } else if (selected.type === 'circle') {
        const c = selected as CircleAnnotation;
        moved = { ...c, center: { x: dx, y: dy } };
      } else if (selected.type === 'arrow') {
        const a = selected as ArrowAnnotation;
        moved = {
          ...a,
          start: { x: dx, y: dy },
          end:   { x: dx + (a.end.x - a.start.x), y: dy + (a.end.y - a.start.y) }
        };
      }

      if (moved) {
        push(moved);
        redrawAnnotations();
      }
      return;
    }

    if (!isDrawing || !state.start) return;

    setState(s => ({ ...s, points: [...s.points, pt] }));
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    redrawAll(ctx, annotations, state.selected || undefined);
    drawPreview(ctx, tool, color, lineWidth, state.start, state.points, pt);
  }, [state, tool, color, lineWidth, annotations, push]);

  const onMouseUp = useCallback(() => {
    const { isDrawing, start, points } = state;
    if (!isDrawing || !start) {
      setState(s => ({ ...s, isDrawing: false }));
      return;
    }

    const base = {
      id: Date.now().toString(),
      color,
      lineWidth,
      lineStyle: 'solid' as const,
      page: 1 as const
    };

    if (tool === 'pen' && points.length > 1) {
      const pen: PenAnnotation = { ...base, type: 'pen', points };
      push(pen);
    }

    if (tool === 'rect') {
      const end = points[points.length - 1];
      const rect: RectAnnotation = { ...base, type: 'rect', start, end };
      push(rect);
    }

    if (tool === 'circle') {
      const end = points[points.length - 1];
      const dx = end.x - start.x, dy = end.y - start.y;
      const circle: CircleAnnotation = {
        ...base,
        type: 'circle',
        center: start,
        radius: Math.hypot(dx, dy)
      };
      push(circle);
    }

    if (tool === 'arrow') {
      const end = points[points.length - 1];
      const arrow: ArrowAnnotation = { ...base, type: 'arrow', start, end };
      push(arrow);
    }

    setState(s => ({ ...s, isDrawing: false, start: null, points: [] }));
    const ctx = annotCanvasRef.current!.getContext('2d')!;
    redrawAll(ctx, annotations, state.selected || undefined);
  }, [state, tool, color, lineWidth, push, annotations]);

  return {
    annotations,
    selected: state.selected,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    undo,
    redo,
    replaceAnnotations,
    push
  };
}
