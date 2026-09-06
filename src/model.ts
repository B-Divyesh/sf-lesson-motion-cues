export const PROJECT_VERSION = 1 as const;
export type CueKind = 'enter' | 'move' | 'say' | 'highlight';
export type ActorShape = 'circle' | 'square' | 'triangle' | 'svg';

export interface Actor {
  id: string;
  name: string;
  shape: ActorShape;
  color: string;
  x: number;
  y: number;
  size: number;
  svg?: string;
}

export interface Cue {
  id: string;
  actorId: string;
  kind: CueKind;
  start: number;
  duration: number;
  text?: string;
  x?: number;
  y?: number;
}

export interface Project {
  format: 'lesson-motion-cues';
  version: typeof PROJECT_VERSION;
  title: string;
  duration: number;
  background: string;
  actors: Actor[];
  cues: Cue[];
  audio?: { name: string; dataUrl?: string };
}

export interface ActorFrame extends Actor {
  visible: boolean;
  speaking?: string;
  highlighted: boolean;
}

export const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function emptyProject(): Project {
  return { format: 'lesson-motion-cues', version: 1, title: 'Untitled lesson', duration: 45, background: '#fffced', actors: [], cues: [] };
}

export function sampleProject(): Project {
  return {
    ...emptyProject(), title: 'How pollination travels', duration: 20,
    actors: [
      { id: 'bee', name: 'Bee', shape: 'circle', color: '#c98427', x: 16, y: 48, size: 15 },
      { id: 'flower', name: 'Flower', shape: 'triangle', color: '#2e6f8e', x: 78, y: 62, size: 18 },
      { id: 'pollen', name: 'Pollen', shape: 'square', color: '#8f4a56', x: 48, y: 30, size: 10 }
    ],
    cues: [
      { id: 'c1', actorId: 'flower', kind: 'enter', start: 0, duration: 1 },
      { id: 'c2', actorId: 'bee', kind: 'enter', start: 1, duration: 1 },
      { id: 'c3', actorId: 'bee', kind: 'say', start: 2.5, duration: 4, text: 'I carry pollen from one flower to another.' },
      { id: 'c4', actorId: 'bee', kind: 'move', start: 7, duration: 5, x: 67, y: 52 },
      { id: 'c5', actorId: 'pollen', kind: 'enter', start: 11, duration: 1 },
      { id: 'c6', actorId: 'pollen', kind: 'highlight', start: 12, duration: 3 },
      { id: 'c7', actorId: 'flower', kind: 'say', start: 15, duration: 4, text: 'That helps the next seed begin.' }
    ]
  };
}

const ACTOR_SHAPES = new Set<ActorShape>(['circle', 'square', 'triangle', 'svg']);
const CUE_KINDS = new Set<CueKind>(['enter', 'move', 'say', 'highlight']);
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const SVG_DATA_PATTERN = /^data:image\/svg\+xml;base64,[a-zA-Z0-9+/=]+$/;

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max) {
    throw new Error(`${label} must be ${allowEmpty ? 'text' : 'non-empty text'} under ${max + 1} characters.`);
  }
  return value;
}

function numberIn(value: unknown, label: string, min: number, max: number, inclusiveMin = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || (inclusiveMin ? value < min : value <= min) || value > max) {
    throw new Error(`${label} must be a number between ${min} and ${max}.`);
  }
  return value;
}

export function validateProject(input: unknown): Project {
  const p = record(input, 'That file does not contain a cue project.');
  if (p.format !== 'lesson-motion-cues' || p.version !== PROJECT_VERSION) throw new Error('This project format or version is not supported.');
  if (!Array.isArray(p.actors) || !Array.isArray(p.cues)) throw new Error('The project is missing actors or cues.');
  if (p.actors.length > 100 || p.cues.length > 1000) throw new Error('This project has too many actors or cues.');

  const duration = numberIn(p.duration, 'Lesson duration', 1, 900);
  const title = text(p.title, 'Lesson title', 80);
  if (typeof p.background !== 'string' || !COLOR_PATTERN.test(p.background)) throw new Error('Lesson background must be a six-digit color.');

  const actorIds = new Set<string>();
  const actors = p.actors.map((value, index): Actor => {
    const actor = record(value, `Actor ${index + 1} is not valid.`);
    const id = text(actor.id, `Actor ${index + 1} id`, 80);
    if (!ID_PATTERN.test(id) || actorIds.has(id)) throw new Error(`Actor ${index + 1} has an invalid or repeated id.`);
    actorIds.add(id);
    const shape = actor.shape as ActorShape;
    if (typeof shape !== 'string' || !ACTOR_SHAPES.has(shape)) throw new Error(`Actor ${index + 1} has an invalid shape.`);
    if (typeof actor.color !== 'string' || !COLOR_PATTERN.test(actor.color)) throw new Error(`Actor ${index + 1} must use a six-digit color.`);
    const color = actor.color;
    const normalized: Actor = {
      id,
      name: text(actor.name, `Actor ${index + 1} name`, 30),
      shape,
      color,
      x: numberIn(actor.x, `Actor ${index + 1} x position`, 0, 100),
      y: numberIn(actor.y, `Actor ${index + 1} y position`, 0, 100),
      size: numberIn(actor.size, `Actor ${index + 1} size`, 5, 50)
    };
    if (shape === 'svg') {
      const svg = text(actor.svg, `Actor ${index + 1} SVG`, 500_000);
      if (!SVG_DATA_PATTERN.test(svg)) throw new Error(`Actor ${index + 1} SVG must be an embedded SVG image.`);
      normalized.svg = svg;
    }
    return normalized;
  });

  const cueIds = new Set<string>();
  const cues = p.cues.map((value, index): Cue => {
    const cue = record(value, `Cue ${index + 1} is not valid.`);
    const id = text(cue.id, `Cue ${index + 1} id`, 80);
    if (!ID_PATTERN.test(id) || cueIds.has(id)) throw new Error(`Cue ${index + 1} has an invalid or repeated id.`);
    cueIds.add(id);
    const actorId = text(cue.actorId, `Cue ${index + 1} actor`, 80);
    const kind = cue.kind as CueKind;
    if (!actorIds.has(actorId) || typeof kind !== 'string' || !CUE_KINDS.has(kind)) {
      throw new Error(`Cue ${index + 1} references an invalid actor or cue type.`);
    }
    const start = numberIn(cue.start, `Cue ${index + 1} start`, 0, duration);
    const cueDuration = numberIn(cue.duration, `Cue ${index + 1} duration`, 0, duration, false);
    if (start + cueDuration > duration) throw new Error(`Cue ${index + 1} ends after the lesson.`);
    const normalized: Cue = { id, actorId, kind, start, duration: cueDuration };
    if (kind === 'say') normalized.text = text(cue.text, `Cue ${index + 1} caption`, 180);
    if (kind === 'move') {
      normalized.x = numberIn(cue.x, `Cue ${index + 1} end x position`, 0, 100);
      normalized.y = numberIn(cue.y, `Cue ${index + 1} end y position`, 0, 100);
    }
    return normalized;
  });

  const project: Project = { format: 'lesson-motion-cues', version: PROJECT_VERSION, title, duration, background: p.background, actors, cues };
  if (p.audio !== undefined) {
    const audio = record(p.audio, 'The audio reference is not valid.');
    project.audio = { name: text(audio.name, 'Audio name', 200) };
  }
  return project;
}

export function frameAt(project: Project, time: number, reducedMotion = false): ActorFrame[] {
  return project.actors.map(actor => {
    let x = actor.x, y = actor.y;
    const actorCues = project.cues.filter(c => c.actorId === actor.id).sort((a,b) => a.start - b.start);
    const enters = actorCues.filter(c => c.kind === 'enter');
    let visible = enters.length === 0 || time >= enters[0].start;
    let speaking: string | undefined;
    let highlighted = false;
    for (const cue of actorCues) {
      const active = time >= cue.start && time <= cue.start + cue.duration;
      if (cue.kind === 'move' && time >= cue.start) {
        const previousMoves = actorCues.filter(c => c.kind === 'move' && c.start < cue.start);
        const fromX = previousMoves.at(-1)?.x ?? actor.x;
        const fromY = previousMoves.at(-1)?.y ?? actor.y;
        const progress = time >= cue.start + cue.duration ? 1 : clamp((time - cue.start) / cue.duration, 0, 1);
        const eased = reducedMotion ? (progress >= 1 ? 1 : 0) : progress;
        x = fromX + ((cue.x ?? x) - fromX) * eased;
        y = fromY + ((cue.y ?? y) - fromY) * eased;
      }
      if (cue.kind === 'say' && active) speaking = cue.text || '…';
      if (cue.kind === 'highlight' && active) highlighted = true;
    }
    return { ...actor, x, y, visible, speaking, highlighted };
  });
}

export function serializeProject(project: Project): string {
  const copy = structuredClone(project);
  copy.cues.sort((a,b) => a.start - b.start || a.id.localeCompare(b.id));
  return JSON.stringify(copy, null, 2);
}
