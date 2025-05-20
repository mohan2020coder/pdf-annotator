export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface Point { x: number; y: number; }

export interface BaseAnnotation {
  id: string;
  type: 'highlight' | 'rect' | 'text' | 'arrow' | 'circle' | 'ellipse' | 'pen';
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  page: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  points: Point[];
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect';
  start: Point;
  end: Point;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  position: Point;
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  start: Point;
  end: Point;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  center: Point;
  radius: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse';
  center: Point;
  radiusX: number;
  radiusY: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen';
  points: Point[];
}

export type Tool = 'pen' | 'highlight' | 'rect' | 'circle' | 'arrow' | 'text' | 'move';


export interface TextAnnotationForm {
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  color: string;
}

export type Annotation =
  | HighlightAnnotation
  | RectAnnotation
  | TextAnnotation
  | ArrowAnnotation
  | CircleAnnotation
  | EllipseAnnotation
  | PenAnnotation;
