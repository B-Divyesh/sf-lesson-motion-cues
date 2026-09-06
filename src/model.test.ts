import { describe, expect, it } from 'vitest';
import { frameAt, Project, sampleProject, serializeProject, validateProject } from './model';

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

  it('rejects malformed actor fields before they reach rendering or storage', () => {
    const malformed = sampleProject() as unknown as { actors: Array<Record<string, unknown>> };
    malformed.actors[0].name = 7;
    expect(() => validateProject(malformed)).toThrow(/Actor 1 name/);
  });

  it('rejects duplicate ids, unsafe values, and cues outside the lesson', () => {
    const duplicate = sampleProject();
    duplicate.actors[1].id = duplicate.actors[0].id;
    expect(() => validateProject(duplicate)).toThrow(/repeated id/);

    const invalidColor = sampleProject();
    invalidColor.actors[0].color = 'url(https://example.com)';
    expect(() => validateProject(invalidColor)).toThrow(/six-digit color/);

    const overflow = sampleProject();
    overflow.cues[0].start = 1;
    overflow.cues[0].duration = overflow.duration;
    expect(() => validateProject(overflow)).toThrow(/ends after the lesson/);
  });

  it('normalizes imported data without retaining unknown fields', () => {
    const input = { ...sampleProject(), ignored: 'not part of the format' };
    const parsed = validateProject(input) as Project & { ignored?: string };
    expect(parsed.ignored).toBeUndefined();
    expect(parsed.audio).toBeUndefined();
  });
});
