// src/lib/pdfWorker.ts
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Vite will serve public/pdf.worker.mjs at '/pdf.worker.mjs'
GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

