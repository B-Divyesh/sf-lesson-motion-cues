import { describe, expect, it } from 'vitest';
import { frameAt, sampleProject, serializeProject, validateProject } from './model';

describe('cue model', () => {
  it('interpolates movement deterministically', () => {
    const p = sampleProject();
    expect(frameAt(p, 9.5).find(a => a.id === 'bee')?.x).toBeCloseTo(41.5);
    expect(frameAt(p, 12).find(a => a.id === 'bee')?.x).toBe(67);
  });
  it('reports speech and highlight at their cue ranges', () => {
    const p = sampleProject();
    expect(frameAt(p, 3).find(a => a.id === 'bee')?.speaking).toContain('pollen');
    expect(frameAt(p, 13).find(a => a.id === 'pollen')?.highlighted).toBe(true);
  });
  it('exports stable sorted JSON and validates it', () => {
    const p = sampleProject();
    p.cues.reverse();
    const json = serializeProject(p);
    expect(validateProject(JSON.parse(json)).format).toBe('lesson-motion-cues');
    expect(JSON.parse(json).cues[0].start).toBe(0);
  });
});
