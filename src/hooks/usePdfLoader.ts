// hooks/usePdfLoader.ts
import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';

// src/lib/pdfWorker.ts
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Vite will serve public/pdf.worker.mjs at '/pdf.worker.mjs'
GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

/**
 * Loads a PDF document and renders the first page into the provided canvas ref.
 */
export function usePdfLoader(
  url: string,
  scale: number,
  canvasRef: RefObject<HTMLCanvasElement>,
): PDFDocumentProxy | null {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    getDocument(url).promise.then(pdf => {
      setPdfDoc(pdf);
      pdf.getPage(1).then(page => {
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        page.render({ canvasContext: ctx, viewport });
      });
    });
  }, [url, scale, canvasRef]);

  return pdfDoc;
}