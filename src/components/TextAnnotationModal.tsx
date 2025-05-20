import React, { useState, useEffect } from 'react';
import type { TextAnnotationForm } from '../lib/types';


interface TextAnnotationModalProps {
  isOpen: boolean;
  initialColor: string;
  onCancel: () => void;
  onSubmit: (form: TextAnnotationForm) => void;
}

const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'];

const TextAnnotationModal: React.FC<TextAnnotationModalProps> = ({
  isOpen,
  initialColor,
  onCancel,
  onSubmit,
}) => {
  const [form, setForm] = useState<TextAnnotationForm>({
    text: '',
    fontSize: 16,
    fontFamily: 'Arial',
    bold: false,
    italic: false,
    color: initialColor,
  });

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setForm({
        text: '',
        fontSize: 16,
        fontFamily: 'Arial',
        bold: false,
        italic: false,
        color: initialColor,
      });
    }
  }, [isOpen, initialColor]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Enter Text Annotation</h3>
        <textarea
          rows={3}
          value={form.text}
          onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
          placeholder="Type your text…"
        />

        <div className="modal-row">
          <label>
            Font size:
            <input
              type="number"
              min={8}
              max={72}
              value={form.fontSize}
              onChange={e => setForm(f => ({ ...f, fontSize: +e.target.value }))}
            />
          </label>
          <label>
            Font family:
            <select
              value={form.fontFamily}
              onChange={e => setForm(f => ({ ...f, fontFamily: e.target.value }))}
            >
              {fontFamilies.map(fam => (
                <option key={fam} value={fam}>{fam}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-row">
          <label>
            <input
              type="checkbox"
              checked={form.bold}
              onChange={e => setForm(f => ({ ...f, bold: e.target.checked }))}
            /> Bold
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.italic}
              onChange={e => setForm(f => ({ ...f, italic: e.target.checked }))}
            /> Italic
          </label>
          <label>
            Color:
            <input
              type="color"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={() => {
              if (form.text.trim()) {
                onSubmit(form);
              }
            }}
          >
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextAnnotationModal;
