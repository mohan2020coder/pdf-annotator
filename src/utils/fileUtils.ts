// utils/annotationUtils.ts

import type { Annotation } from '../lib/types';

export const exportAnnotations = (annotations: Annotation[]) => {
  const blob = new Blob([JSON.stringify(annotations)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'annotations.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importAnnotations = (
  event: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (data: Annotation[]) => void,
  onError?: () => void
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string);
      onSuccess(data);
    } catch (e) {
      alert('Invalid annotation file');
      onError?.();
    }
  };
  reader.readAsText(file);
};
