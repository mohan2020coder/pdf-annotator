import React, { useRef, useEffect, useState } from 'react';
import '../lib/pdfWorker';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';
import type { Annotation, Point, HighlightAnnotation, RectAnnotation, TextAnnotation, ArrowAnnotation, CircleAnnotation, PenAnnotation } from '../lib/types';
import './PDFAnnotator.css';
import TextAnnotationModal from './TextAnnotationModal';
import type { TextAnnotationForm } from '../lib/types';


interface Props {
  url: string;
  scale?: number;
}

type Tool = 'pen' | 'highlight' | 'rect' | 'circle' | 'arrow' | 'text' | 'move';

type PartialAnnot = Omit<Partial<Annotation>, 'type'> & { type: Tool };

const PDFAnnotator: React.FC<Props> = ({ url, scale = 1.5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [histIndex, setHistIndex] = useState(0);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(2);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);

  //state for text annotation
  const [isTextModalOpen, setTextModalOpen] = useState(false);
  const [pendingTextPos, setPendingTextPos] = useState<Point | null>(null);

  // State for move
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });



  // Load PDF
  useEffect(() => {
    getDocument(url).promise.then(pdf => {
      setPdfDoc(pdf);
      renderPage(pdf, 1);

      setHistory([[]]);
      setHistIndex(0);
      setAnnotations([]);
    });
  }, [url]);

  // Render a page
  const renderPage = async (pdf: PDFDocumentProxy, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const pdfCanvas = pdfCanvasRef.current!;
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    const pdfCtx = pdfCanvas.getContext('2d')!;
    await page.render({ canvasContext: pdfCtx, viewport }).promise;

    const annotCanvas = annotCanvasRef.current!;
    annotCanvas.width = viewport.width;
    annotCanvas.height = viewport.height;
    redraw();
  };

  // Redraw all annotations
  const redraw = () => {
    const ctx = annotCanvasRef.current!.getContext('2d')!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw all annotations
    annotations.forEach(a => {
      ctx.save();
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = a.lineWidth;
      switch (a.type) {
        case 'pen':
        case 'highlight':
          drawFreehand(ctx, a);
          break;
        case 'rect':
          drawRect(ctx, a);
          break;
        case 'circle':
          drawCircle(ctx, a);
          break;
        case 'arrow':
          drawArrow(ctx, a);
          break;
        case 'text':
          drawText(ctx, a);
          break;
      }
      ctx.restore();
    });

    // Draw visual highlight around selected annotation
    if (selectedAnnotation) {
      ctx.save();
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      switch (selectedAnnotation.type) {
        case 'rect': {
          const { start, end } = selectedAnnotation;
          const w = end.x - start.x;
          const h = end.y - start.y;
          ctx.strokeRect(start.x, start.y, w, h);
          break;
        }
        case 'circle': {
          const { center, radius } = selectedAnnotation;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        }
        case 'arrow': {
          const { start, end } = selectedAnnotation;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;
        }
        case 'text': {
          const { position, fontSize, text } = selectedAnnotation;
          const width = text.length * fontSize * 0.5;
          ctx.strokeRect(position.x, position.y - fontSize, width, fontSize);
          break;
        }
        case 'pen':
        case 'highlight': {
          const xs = selectedAnnotation.points.map(p => p.x);
          const ys = selectedAnnotation.points.map(p => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          ctx.strokeRect(minX - 3, minY - 3, maxX - minX + 6, maxY - minY + 6);
          break;
        }
      }

      ctx.restore();
    }
  };


  // Drawing helpers
  const drawFreehand = (ctx: CanvasRenderingContext2D, ann: PenAnnotation | HighlightAnnotation) => {
    ctx.save(); // Save the current canvas state

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
    if (ann.points.length) {
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    }

    ctx.restore(); // Restore the original canvas state
  };

  const drawRect = (ctx: CanvasRenderingContext2D, ann: RectAnnotation) => {
    const w = ann.end.x - ann.start.x;
    const h = ann.end.y - ann.start.y;
    ctx.strokeRect(ann.start.x, ann.start.y, w, h);
  };
  const drawCircle = (ctx: CanvasRenderingContext2D, ann: CircleAnnotation) => {
    if (!ann.radius || ann.radius <= 0) {
      console.warn('Invalid circle radius', ann); // full log of the object
      return;
    }

    ctx.beginPath();
    ctx.arc(ann.center.x, ann.center.y, ann.radius, 0, 2 * Math.PI);
    ctx.stroke();
  };


  const drawArrow = (ctx: CanvasRenderingContext2D, ann: ArrowAnnotation) => {
    ctx.beginPath();
    ctx.moveTo(ann.start.x, ann.start.y);
    ctx.lineTo(ann.end.x, ann.end.y);
    ctx.stroke();
    const angle = Math.atan2(ann.end.y - ann.start.y, ann.end.x - ann.start.x);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(ann.end.x, ann.end.y);
    ctx.lineTo(ann.end.x - headLen * Math.cos(angle - Math.PI / 6), ann.end.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(ann.end.x - headLen * Math.cos(angle + Math.PI / 6), ann.end.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };
  const drawText = (ctx: CanvasRenderingContext2D, ann: TextAnnotation) => {
    ctx.save();
    ctx.font = `${ann.fontSize}px ${ann.fontFamily}`;
    ctx.fillStyle = ann.color;             // ← explicitly set the color
    ctx.globalAlpha = 1.0;                 // ← reset alpha in case it was changed
    ctx.fillText(ann.text, ann.position.x, ann.position.y);
    ctx.restore();
  };

  const isPointInAnnotation = (pt: Point, ann: Annotation): boolean => {
    switch (ann.type) {
      case 'rect':
        return pt.x >= ann.start.x && pt.x <= ann.end.x && pt.y >= ann.start.y && pt.y <= ann.end.y;
      case 'circle':
        const dx = pt.x - ann.center.x;
        const dy = pt.y - ann.center.y;
        return Math.sqrt(dx * dx + dy * dy) <= ann.radius;
      case 'arrow':
        // approximate hitbox around line
        const distToLine = distancePointToLine(pt, ann.start, ann.end);
        return distToLine < 5;
      case 'text':
        // approximate box around text position
        return pt.x >= ann.position.x && pt.x <= ann.position.x + ann.text.length * ann.fontSize * 0.5 && pt.y >= ann.position.y - ann.fontSize && pt.y <= ann.position.y;
      case 'pen':
      case 'highlight':
        // Check if point is close to any segment in points[]
        return ann.points.some((p, i) => {
          if (i === 0) return false;
          const prev = ann.points[i - 1];
          const dist = distancePointToLine(pt, prev, p);
          return dist < ann.lineWidth + 3;
        });
    }
    return false;
  };

  // Helper function to calculate distance from point to line segment
  function distancePointToLine(pt: Point, start: Point, end: Point) {
    const A = pt.x - start.x;
    const B = pt.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) //in case of 0 length line
      param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = start.x;
      yy = start.y;
    }
    else if (param > 1) {
      xx = end.x;
      yy = end.y;
    }
    else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = pt.x - xx;
    const dy = pt.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = annotCanvasRef.current!.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (tool === 'move') {
      // Find annotation under pointer, start dragging
      const found = annotations.findLast(ann => isPointInAnnotation(pt, ann));
      if (found) {
        setSelectedAnnotation(found);
        // Calculate offset between click point and annotation position
        // For different annotation types you need different reference points:
        let offsetX = 0, offsetY = 0;
        switch (found.type) {
          case 'rect':
            offsetX = pt.x - found.start.x;
            offsetY = pt.y - found.start.y;
            break;
          case 'circle':
            offsetX = pt.x - found.center.x;
            offsetY = pt.y - found.center.y;
            break;
          case 'arrow':
            offsetX = pt.x - found.start.x;
            offsetY = pt.y - found.start.y;
            break;
          case 'text':
            offsetX = pt.x - found.position.x;
            offsetY = pt.y - found.position.y;
            break;
          case 'pen':
          case 'highlight':
            // Use first point of freehand as reference
            offsetX = pt.x - found.points[0].x;
            offsetY = pt.y - found.points[0].y;
            break;
        }
        setOffset({ x: offsetX, y: offsetY });
        setIsDrawing(true); // Use isDrawing as dragging flag
        return;
      }
      // If nothing selected, clear selection
      setSelectedAnnotation(null);
    }

    if (tool === 'text') {

      setPendingTextPos(pt);
      setTextModalOpen(true);
      return;
    }
    setIsDrawing(true);
    setDrawingPoints([pt]);
    setShapeStart(pt);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'move' && isDrawing && selectedAnnotation) {
      const rect = annotCanvasRef.current!.getBoundingClientRect();
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Calculate new position based on offset
      const newPos = { x: pt.x - offset.x, y: pt.y - offset.y };

      // Update annotation in state (immutably)
      setAnnotations(prevAnns => prevAnns.map(ann => {
        if (ann.id !== selectedAnnotation.id) return ann;

        switch (ann.type) {
          case 'rect':
            const w = ann.end.x - ann.start.x;
            const h = ann.end.y - ann.start.y;
            return {
              ...ann,
              start: { x: newPos.x, y: newPos.y },
              end: { x: newPos.x + w, y: newPos.y + h },
            };
          case 'circle':
            return { ...ann, center: newPos };
          case 'arrow':
            const dx = ann.end.x - ann.start.x;
            const dy = ann.end.y - ann.start.y;
            return {
              ...ann,
              start: newPos,
              end: { x: newPos.x + dx, y: newPos.y + dy }
            };
          case 'text':
            return { ...ann, position: newPos };
          case 'pen':
          case 'highlight':
            const deltaX = newPos.x - ann.points[0].x;
            const deltaY = newPos.y - ann.points[0].y;
            return {
              ...ann,
              points: ann.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY })),
            };
          default:
            return ann;
        }
      }));

      redraw();
      return;
    }
    if (!isDrawing) return;
    const rect = annotCanvasRef.current!.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDrawingPoints(prev => [...prev, pt]);
    redraw();
    drawPreview(pt);
  };

  const handleMouseUp = () => {

    if (!isDrawing) return;
    setIsDrawing(false);
    const base: PartialAnnot = { id: Date.now().toString(), color, lineWidth, lineStyle: 'solid', page: 1, type: tool };
    let finalized: Annotation | null = null;

    if (tool === 'move' && isDrawing && selectedAnnotation) {
      // You could push the moved annotation to history for undo/redo here if you want

      setSelectedAnnotation(null);
      setIsDrawing(false);
      return;
    }
    switch (tool) {
      case 'pen': case 'highlight':
        finalized = { ...(base as Partial<PenAnnotation>), points: drawingPoints } as PenAnnotation | HighlightAnnotation;
        break;
      case 'rect':
        if (shapeStart) finalized = { ...(base as Partial<RectAnnotation>), start: shapeStart, end: drawingPoints[drawingPoints.length - 1] } as RectAnnotation;
        break;
      case 'circle':
        if (shapeStart && drawingPoints.length) {
          // take the last point (the mouseup position) instead of the first
          const last = drawingPoints[drawingPoints.length - 1];
          const dx = last.x - shapeStart.x;
          const dy = last.y - shapeStart.y;
          const r = Math.hypot(dx, dy);

          finalized = {
            ...(base as Partial<CircleAnnotation>),
            center: shapeStart,
            radius: r,
          } as CircleAnnotation;
        } else {
          console.warn("Missing shapeStart or drawing points.");
        }
        break;
      case 'arrow':
        if (shapeStart) finalized = { ...(base as Partial<ArrowAnnotation>), start: shapeStart, end: drawingPoints[drawingPoints.length - 1] } as ArrowAnnotation;
        break;
    }
    if (finalized) pushAnnotation(finalized);
    setDrawingPoints([]);
    setShapeStart(null);
  };

  const drawPreview = (current: Point) => {
    const ctx = annotCanvasRef.current!.getContext('2d')!;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
    switch (tool) {
      case 'pen': case 'highlight':
        ctx.beginPath(); ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
        drawingPoints.forEach(p => ctx.lineTo(p.x, p.y)); ctx.lineTo(current.x, current.y); ctx.stroke();
        break;
      case 'rect':
        if (!shapeStart) break;
        const w = current.x - shapeStart.x, h = current.y - shapeStart.y;
        ctx.strokeRect(shapeStart.x, shapeStart.y, w, h);
        break;
      case 'circle':
        if (!shapeStart) break;
        const dx = current.x - shapeStart.x;
        const dy = current.y - shapeStart.y;
        const rad = Math.hypot(dx, dy);
        ctx.beginPath();
        ctx.arc(shapeStart.x, shapeStart.y, rad, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'arrow':
        if (!shapeStart) break;
        ctx.beginPath(); ctx.moveTo(shapeStart.x, shapeStart.y); ctx.lineTo(current.x, current.y); ctx.stroke();
        const ang = Math.atan2(current.y - shapeStart.y, current.x - shapeStart.x);
        const hl = 10;
        ctx.beginPath(); ctx.moveTo(current.x, current.y);
        ctx.lineTo(current.x - hl * Math.cos(ang - Math.PI / 6), current.y - hl * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(current.x - hl * Math.cos(ang + Math.PI / 6), current.y - hl * Math.sin(ang + Math.PI / 6));
        ctx.closePath(); ctx.fill();
        break;
    }
    ctx.restore();
  };

  // State management: push, undo, redo
  const pushAnnotation = (ann: Annotation) => {
    setHistIndex(prevIndex => {
      setHistory(prevHistory => {
        const before = prevHistory.slice(0, prevIndex + 1);
        const next = [...before[prevIndex], ann];
        return [...before, next];
      });
      return prevIndex + 1;
    });
  };


  // Undo just moves the index back:
  const undo = () => setHistIndex(i => Math.max(0, i - 1));

  // Redo moves it forward:
  const redo = () => setHistIndex(i => Math.min(history.length - 1, i + 1));


  const exportAnnotations = () => {
    const blob = new Blob([JSON.stringify(annotations)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importAnnotations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);

        setAnnotations(data);
        setHistory([data]); 
        setHistIndex(0);

      } catch (e) {
        alert('Invalid annotation file');
      }
    };
    reader.readAsText(file);
  };



  useEffect(() => {
    setAnnotations(history[histIndex]);
  }, [history, histIndex]);

  useEffect(() => {
    redraw();
  }, [annotations]);

  // Attach events
  useEffect(() => {
    const canvas = annotCanvasRef.current!;
    canvas.addEventListener('mousedown', handleMouseDown as any);
    canvas.addEventListener('mousemove', handleMouseMove as any);
    window.addEventListener('mouseup', handleMouseUp as any);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown as any);
      canvas.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp as any);
    };
  }, [isDrawing, drawingPoints, shapeStart, tool, color, lineWidth]);

  return (
    <>
      <TextAnnotationModal
        isOpen={isTextModalOpen}
        initialColor={color}
        onCancel={() => setTextModalOpen(false)}
        onSubmit={(form: TextAnnotationForm) => {
          if (pendingTextPos) {
            pushAnnotation({
              id: Date.now().toString(),
              type: 'text',
              position: pendingTextPos,
              text: form.text,
              color: form.color,
              lineWidth,
              lineStyle: 'solid',
              page: 1,
              fontSize: form.fontSize,
              fontFamily: form.fontFamily,
              bold: form.bold,
              italic: form.italic,
            });
          }
          setTextModalOpen(false);
        }}
      />

      <div ref={containerRef} className="pdf-annotator-container">
        <canvas ref={pdfCanvasRef} className="pdf-canvas" />
        <canvas ref={annotCanvasRef} className="annot-canvas" />
        <div className="toolbar">
          <div className="toolbar-group">
            <span className="active-tool">
              Tool: <strong>{tool.charAt(0).toUpperCase() + tool.slice(1)}</strong>
            </span>
          </div>
          <div className="toolbar-divider"></div>
          <div className="toolbar-group">

            <button title="Pen" onClick={() => setTool('pen')}>✏️</button>
            <button title="Highlight" onClick={() => setTool('highlight')}>🖍</button>
            <button title="Rectangle" onClick={() => setTool('rect')}>⬜</button>
            <button title="Circle" onClick={() => setTool('circle')}>⭕</button>
            <button title="Arrow" onClick={() => setTool('arrow')}>➡️</button>
            <button title="Text" onClick={() => setTool('text')}>T</button>
            <button title="Move" onClick={() => setTool('move')}>🖐️</button>
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <label htmlFor="colorPicker" title="Pick color">🎨</label>
            <input
              id="colorPicker"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              title="Color"
            />

            <label htmlFor="lineWidth" title="Line width">〰️</label>
            <input
              id="lineWidth"
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={e => setLineWidth(+e.target.value)}
              title={`Line width: ${lineWidth}`}
            />
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <button title="Undo" onClick={undo}>↩️Undo</button>
            <button title="Redo" onClick={redo}>↪️Redo</button>
          </div>

          <div className="toolbar-divider"></div>
          <div className="toolbar-group">
            <label htmlFor="import" title="Import">Import📥</label>
            <input
              id="import"
              type="file"
              accept="application/json"
              onChange={importAnnotations}
              style={{ display: 'none', border: '1px solid "black", borderRadius: 4' }}
            />
          </div>
          <div className="toolbar-divider"></div>

          <div className="toolbar-group">
            <button onClick={exportAnnotations} title="Export">📤 Export</button>

          </div>
        </div>

      </div>
    </>
  );
};

export default PDFAnnotator;
