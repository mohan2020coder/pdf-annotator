// PDFAnnotator.tsx
import React, { useRef, useState, useEffect } from 'react';
import type { Annotation, Tool, Point, TextAnnotationForm } from '../lib/types';
import { usePdfLoader } from '../hooks/usePdfLoader';
import { useAnnotationTools } from '../hooks/useAnnotationTools';
// import { useAnnotationHistory } from '../hooks/useAnnotationHistory';
import { Toolbar } from './Toolbar';
import { CanvasLayer } from './CanvasLayer';
import TextAnnotationModal from './TextAnnotationModal';
// import { redrawAll } from '../utils/annotationDrawers';
import { exportAnnotations, importAnnotations } from '../utils/fileUtils';

import './PDFAnnotator.css';

interface Props {
  url: string;
  scale?: number;
}

export const PDFAnnotator: React.FC<Props> = ({ url, scale = 1.5 }) => {
   const pdfCanvasRef = useRef<HTMLCanvasElement>(null!);       // PDF layer
  const annotationRef = useRef<HTMLCanvasElement>(null!);       // Drawing layer

  const doc = usePdfLoader(url, scale, pdfCanvasRef);           // only renders to pdfCanvasRef

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(2);

  const [textPos, setTextPos] = useState<Point | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (pdfCanvasRef.current) {
      setWidth(pdfCanvasRef.current.width);
      setHeight(pdfCanvasRef.current.height);
    }
  }, [doc]);

  

  const {
    annotations,
    selected,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    undo,
    redo,
    replaceAnnotations,
    push: pushText,
  } = useAnnotationTools(annotationRef, tool, color, lineWidth);  // pass annotationRef only

  //  const { push: pushText } = useAnnotationHistory();

  const handleExport = () => exportAnnotations(annotations);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  importAnnotations(
    event,
    (data) => {
      replaceAnnotations(data); // Use the tools' reset method
      event.target.value = ''; // Clear input to allow re-import
    },
    () => console.error("Failed to import annotations")
  );
};



  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = annotationRef.current!.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (tool === 'text') {
      setTextPos(pt);
      setShowTextModal(true);
    } else {
      onMouseDown(e);
    }
  };

  const handleTextSubmit = (form: TextAnnotationForm) => {
    if (!textPos) return;

    const ann: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      page: 1,
      lineStyle: 'solid',
      color: form.color,
      lineWidth,
      position: textPos,
      text: form.text,
      fontSize: form.fontSize,
      fontFamily: form.fontFamily,
      bold: form.bold,
      italic: form.italic,
    };
    pushText(ann);
    setShowTextModal(false);
    setTextPos(null);
  };

  return (
    <div className="pdf-annotator-container">
      <canvas ref={pdfCanvasRef} className="pdf-canvas" />
      <CanvasLayer
      width={width}
      height={height}
      annotations={annotations}
      selected={selected}
      canvasRef={annotationRef}
      onMouseDown={handleMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />

      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        onUndo={undo}
        onRedo={redo}
        onImport={handleImport}
        onExport={handleExport}
      />
      <TextAnnotationModal
        isOpen={showTextModal}
        initialColor={color}
        onSubmit={handleTextSubmit}
        onCancel={() => setShowTextModal(false)}
      />
    </div>
  );
};
export default PDFAnnotator;