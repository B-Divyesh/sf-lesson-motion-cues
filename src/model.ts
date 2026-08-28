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

export function validateProject(input: unknown): Project {
  if (!input || typeof input !== 'object') throw new Error('That file does not contain a cue project.');
  const p = input as Partial<Project>;
  if (p.format !== 'lesson-motion-cues' || p.version !== 1) throw new Error('This project format or version is not supported.');
  if (!Array.isArray(p.actors) || !Array.isArray(p.cues)) throw new Error('The project is missing actors or cues.');
  const duration = Number(p.duration);
  if (!Number.isFinite(duration) || duration < 1 || duration > 900) throw new Error('Lesson duration must be between 1 and 900 seconds.');
  const actorIds = new Set(p.actors.map(a => a?.id));
  if (p.cues.some(c => !c || !actorIds.has(c.actorId) || !['enter','move','say','highlight'].includes(c.kind))) throw new Error('One or more cues reference an invalid actor or cue type.');
  return structuredClone(p as Project);
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
