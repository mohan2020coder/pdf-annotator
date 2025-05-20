// utils/annotationDrawers.ts
import type { Annotation, PenAnnotation, HighlightAnnotation, RectAnnotation, CircleAnnotation, ArrowAnnotation, TextAnnotation } from '../lib/types';

export function drawFreehand(ctx: CanvasRenderingContext2D, ann: PenAnnotation | HighlightAnnotation) {
  ctx.save();
  if (ann.type === 'highlight') {
      ctx.globalAlpha = 0.3; // Semi-transparent for highlights
      ctx.strokeStyle = ann.color || 'yellow'; // You can customize default color
      ctx.lineWidth = ann.lineWidth || 10; // Make highlight thicker if needed
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = ann.color || 'black';
      ctx.lineWidth = ann.lineWidth || 2;
    }
  ctx.beginPath();
//   ann.points.forEach((p, i) => {
//     if (i === 0) ctx.moveTo(p.x, p.y);
//     else ctx.lineTo(p.x, p.y);
//   });
//   ctx.stroke();
   if (ann.points.length) {
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    }
  ctx.restore();
}


export function drawRect(ctx: CanvasRenderingContext2D, ann: RectAnnotation) {
  const w = ann.end.x - ann.start.x;
  const h = ann.end.y - ann.start.y;
  ctx.strokeRect(ann.start.x, ann.start.y, w, h);
}

export function drawCircle(ctx: CanvasRenderingContext2D, ann: CircleAnnotation) {
  if (!ann.radius) return;
  ctx.beginPath();
  ctx.arc(ann.center.x, ann.center.y, ann.radius, 0, 2 * Math.PI);
  ctx.stroke();
}

export function drawArrow(ctx: CanvasRenderingContext2D, ann: ArrowAnnotation) {
  ctx.beginPath();
  ctx.moveTo(ann.start.x, ann.start.y);
  ctx.lineTo(ann.end.x, ann.end.y);
  ctx.stroke();
  const angle = Math.atan2(ann.end.y - ann.start.y, ann.end.x - ann.start.x);
  const len = 10;
  ctx.beginPath();
  ctx.moveTo(ann.end.x, ann.end.y);
  ctx.lineTo(
    ann.end.x - len * Math.cos(angle - Math.PI / 6),
    ann.end.y - len * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    ann.end.x - len * Math.cos(angle + Math.PI / 6),
    ann.end.y - len * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

export function drawText(ctx: CanvasRenderingContext2D, ann: TextAnnotation) {
   ctx.save();
    ctx.font = `${ann.fontSize}px ${ann.fontFamily}`;
    ctx.fillStyle = ann.color;             // ← explicitly set the color
    ctx.globalAlpha = 1.0;                 // ← reset alpha in case it was changed
    ctx.fillText(ann.text, ann.position.x, ann.position.y);
    ctx.restore();
}

// NEW: compute a simple bounding box for ANY annotation
function getBoundingBox(a: Annotation): { x: number; y: number; width: number; height: number } {
  switch (a.type) {
    case 'pen':
    case 'highlight': {
        const pts = (a as PenAnnotation | HighlightAnnotation).points;
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const padding = (a.lineWidth || (a.type === 'highlight' ? 10 : 2)) / 2 + 2;

        return {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2,
        };
    }
    case 'rect': {
      const { start, end } = a as RectAnnotation;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      return { x, y, width, height };
    }
    case 'circle': {
      const { center, radius } = a as CircleAnnotation;
      return {
        x: center.x - radius,
        y: center.y - radius,
        width: radius * 2,
        height: radius * 2
      };
    }
    case 'arrow': {
      const { start, end } = a as ArrowAnnotation;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      return { x, y, width, height };
    }
    case 'text': {
      const t = a as TextAnnotation;
      // approximate text width by char count x half-fontSize
      const width = t.text.length * t.fontSize * 0.5;
      const height = t.fontSize;
      // position.y is the baseline, so box y = baseline - fontSize
      return {
        x: t.position.x,
        y: t.position.y - t.fontSize,
        width,
        height
      };
    }
    default:
      // fallback: zero‐size at origin
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}


export function redrawAll(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  selected?: Annotation
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  annotations.forEach(a => {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.lineWidth;

    switch (a.type) {
      case 'pen':
      case 'highlight':
        drawFreehand(ctx, a as any);
        break;
      case 'rect':
        drawRect(ctx, a as any);
        break;
      case 'circle':
        drawCircle(ctx, a as any);
        break;
      case 'arrow':
        drawArrow(ctx, a as any);
        break;
      case 'text':
        drawText(ctx, a as any);
        break;
    }
    ctx.restore();
  });

  if (selected) {
    const box = getBoundingBox(selected);
    ctx.save();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }
}