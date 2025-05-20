// utils/annotationUtils.ts
import type { Annotation, Point, RectAnnotation, CircleAnnotation, ArrowAnnotation, TextAnnotation, PenAnnotation, HighlightAnnotation, Tool } from '../lib/types';

/** Returns true if pt is “inside” a given annotation. */
export function isPointInAnnotation(pt: Point, a: Annotation): boolean {
  switch (a.type) {
    case 'rect': {
      const { start, end } = a as RectAnnotation;
      const x0 = Math.min(start.x, end.x), x1 = Math.max(start.x, end.x);
      const y0 = Math.min(start.y, end.y), y1 = Math.max(start.y, end.y);
      return pt.x >= x0 && pt.x <= x1 && pt.y >= y0 && pt.y <= y1;
    }
    case 'circle': {
      const { center, radius } = a as CircleAnnotation;
      const dx = pt.x - center.x, dy = pt.y - center.y;
      return dx*dx + dy*dy <= radius*radius;
    }
    case 'arrow': {
      const { start, end } = a as ArrowAnnotation;
      return distancePointToLine(pt, start, end) < 5;
    }
    case 'text': {
      const t = a as TextAnnotation;
      const w = t.text.length * t.fontSize * 0.5;
      const h = t.fontSize;
      return pt.x >= t.position.x && pt.x <= t.position.x + w &&
             pt.y >= t.position.y - h  && pt.y <= t.position.y;
    }
    case 'pen':
    case 'highlight': {
      const pts = (a as PenAnnotation|HighlightAnnotation).points;
      return pts.slice(1).some((p, i) => {
        const prev = pts[i];
        return distancePointToLine(pt, prev, p) < ((a.lineWidth||2) + 3);
      });
    }
    default:
      return false;
  }
}

export function distancePointToLine(pt: Point, start: Point, end: Point): number {
  const A = pt.x - start.x, B = pt.y - start.y;
  const C = end.x - start.x, D = end.y - start.y;
  const dot = A*C + B*D, len2 = C*C + D*D;
  const t = len2 ? Math.max(0, Math.min(1, dot/len2)) : 0;
  const x = start.x + t*C, y = start.y + t*D;
  const dx = pt.x - x, dy = pt.y - y;
  return Math.hypot(dx, dy);
}

export function drawPreview(
  ctx: CanvasRenderingContext2D,
  tool: Tool,
  color: string,
  lineWidth: number,
  start: Point,
  points: Point[],
  current: Point
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  switch (tool) {
    case 'pen':
    case 'highlight': {
      ctx.beginPath();
      const all = [...points, current];
      all.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
      ctx.stroke();
      break;
    }
    case 'rect': {
      const w = current.x - start.x, h = current.y - start.y;
      ctx.strokeRect(start.x, start.y, w, h);
      break;
    }
    case 'circle': {
      const r = Math.hypot(current.x - start.x, current.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, r, 0, 2*Math.PI);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      const angle = Math.atan2(current.y - start.y, current.x - start.x);
      const hl = 10;
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(current.x - hl*Math.cos(angle - Math.PI/6), current.y - hl*Math.sin(angle - Math.PI/6));
      ctx.lineTo(current.x - hl*Math.cos(angle + Math.PI/6), current.y - hl*Math.sin(angle + Math.PI/6));
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
