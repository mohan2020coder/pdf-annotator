// Toolbar.tsx
import React from 'react';
import type { Tool } from '../lib/types';

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  lineWidth: number;
  setLineWidth: (w: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  onUndo,
  onRedo,
  onImport,
  onExport,
}) => (
  <div className="toolbar">
    {/* current tool display */}
    <div className="toolbar-group">
      <span className="active-tool">
        Tool:{' '}
        <strong>
          {tool.charAt(0).toUpperCase() + tool.slice(1)}
        </strong>
      </span>
    </div>

    <div className="toolbar-divider" />

    {/* draw tools */}
    <div className="toolbar-group">
      <button title="Pen"       onClick={() => setTool('pen')}>✏️</button>
      <button title="Highlight" onClick={() => setTool('highlight')}>🖍</button>
      <button title="Rectangle" onClick={() => setTool('rect')}>⬜</button>
      <button title="Circle"    onClick={() => setTool('circle')}>⭕</button>
      <button title="Arrow"     onClick={() => setTool('arrow')}>➡️</button>
      <button title="Text"      onClick={() => setTool('text')}>T</button>
      <button title="Move"      onClick={() => setTool('move')}>🖐️</button>
    </div>

    <div className="toolbar-divider" />

    {/* color + line width */}
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

    <div className="toolbar-divider" />

    {/* undo / redo */}
    <div className="toolbar-group">
      <button title="Undo" onClick={onUndo}>↩️Undo</button>
      <button title="Redo" onClick={onRedo}>↪️Redo</button>
    </div>

    <div className="toolbar-divider" />

    {/* import */}
    <div className="toolbar-group">
      <label htmlFor="import-input" title="Import">Import📥</label>
      <input
        id="import-input"
        type="file"
        accept="application/json"
        onChange={onImport}
        style={{ display: 'none' }}
      />
    </div>

    <div className="toolbar-divider" />

    {/* export */}
    <div className="toolbar-group">
      <button onClick={onExport} title="Export">📤 Export</button>
    </div>
  </div>
);
