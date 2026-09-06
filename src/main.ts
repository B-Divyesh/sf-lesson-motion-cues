import './style.css';
import { Actor, Cue, CueKind, Project, clamp, emptyProject, frameAt, sampleProject, serializeProject, uid, validateProject } from './model';

const STORAGE_KEY = 'lmc:project:v1';
const LICENSE_KEY = 'sb_license:lesson-motion-cues';
const VERIFY_KEY = `${LICENSE_KEY}:verified`;
const isDemo = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const app = document.querySelector<HTMLDivElement>('#app')!;
let recoveryMessage = '';
let project = loadProject();
let currentTime = 0;
let playing = false;
let raf = 0;
let lastFrame = 0;
let selectedCue = '';
let audioUrl = '';
let undoProject: Project | null = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadProject(): Project {
  if (isDemo) return sampleProject();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyProject();
  try { return validateProject(JSON.parse(saved)); }
  catch {
    localStorage.removeItem(STORAGE_KEY);
    recoveryMessage = 'The saved lesson could not be read. A blank lesson is open. Import a backup or try the sample.';
    return emptyProject();
  }
}

function save(message = 'Saved locally') {
  if (isDemo) {
    announce(message ? `${message}. Your saved lessons are unchanged.` : '');
    return;
  }
  try {
    const copy = structuredClone(project); if (copy.audio) delete copy.audio.dataUrl;
    localStorage.setItem(STORAGE_KEY, serializeProject(copy));
    announce(message);
  } catch { announce('Your browser storage is full. Export JSON to keep this lesson.'); }
}

function announce(message: string) {
  const live = document.querySelector<HTMLElement>('#live');
  if (live) live.textContent = message;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}

function route() {
  if (location.pathname === '/privacy') return renderLegal('Privacy', [
    'Your lesson, imported SVG, and license token stay in this browser.',
    'We do not use analytics, advertising cookies, or tracking pixels.',
    'License checks send only your token to the Sociobot billing API.',
    'Checkout is hosted by Sociobot and Dodo, whose policies apply there.',
    'Imported audio stays in the current tab and is never uploaded.',
    'Clear this site’s storage to remove saved lesson and license data.'
  ]);
  if (location.pathname === '/terms') return renderLegal('Terms', [
    'Lesson Motion Cues is provided “as is” under the MIT License.',
    'You retain ownership of lesson files and media you import.',
    'Only import media you own or may use.',
    'The $12 Field Kit is a one-time license for three lesson templates.',
    'Core editing, accessibility, and exports remain free.',
    'Sociobot and Dodo handle checkout and refunds.',
    'A refunded or revoked license stops opening paid templates.',
    'Export and back up important work.'
  ]);
  if (!['/', '/demo'].includes(location.pathname)) return renderNotFound();
  renderEditor();
}

function header() {
  return `<header class="topbar">
    <a class="brand" href="/" aria-label="Lesson Motion Cues home"><span class="brand-mark" aria-hidden="true">⌁</span><span>Lesson Motion Cues</span></a>
    <nav aria-label="Site"><a href="/demo">Demo</a><a href="/privacy">Privacy</a></nav>
  </header>`;
}

function footer() {
  return `<footer class="site-foot"><span>Cue timeline editor for teachers and technical educators.</span><span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · Built by Param Factory · v1.1.0 · Generated illustration disclosed</span></footer>`;
}

function setPageMeta(title: string, description: string, path: string) {
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://lesson-motion-cues.sociobot.in${path}`;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = description;
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content = `https://lesson-motion-cues.sociobot.in${path}`;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = description;
}

function renderLegal(title: string, paragraphs: string[]) {
  setPageMeta(`${title} — Lesson Motion Cues`, `${title} information for Lesson Motion Cues.`, `/${title.toLowerCase()}`);
  app.innerHTML = `${header()}<main id="main" class="legal"><p class="eyebrow">LEGAL</p><h1>${title}</h1>${paragraphs.map(p => `<p>${p}</p>`).join('')}<p><a href="/">← Return to the lesson editor</a></p></main>${footer()}<div id="live" class="sr-only" aria-live="polite"></div>`;
}

function renderNotFound() {
  setPageMeta('Page not found — Lesson Motion Cues', 'Return to the Lesson Motion Cues editor.', location.pathname);
  app.innerHTML = `${header()}<main id="main" class="legal"><p class="eyebrow">404 / PAGE NOT FOUND</p><h1>This page does not exist</h1><p>Return to the lesson editor or open the sample pollination lesson.</p><p><a href="/">Return to the lesson editor</a> · <a href="/demo">Try sample data</a></p></main>${footer()}<div id="live" class="sr-only" aria-live="polite"></div>`;
}

function renderEditor() {
  setPageMeta(
    isDemo ? 'Demo — Lesson Motion Cues' : 'Lesson Motion Cues — build timed lesson animations',
    isDemo ? 'Try a 20-second pollination lesson with three actors and seven cues.' : 'Build readable cue timelines for cartoon-like lesson animations, then export JSON, JavaScript, SVG, or video.',
    isDemo ? '/demo' : '/'
  );
  const intro = isDemo ? `
    <section class="intro demo-intro" aria-labelledby="page-title">
      <div><p class="eyebrow">SAMPLE LESSON</p><h1 id="page-title">Edit a timed pollination lesson</h1><p>Play seven readable cues for three actors, then change any cue or export the result.</p></div>
    </section>` : `
    <section class="intro" aria-labelledby="page-title">
      <div class="intro-copy">
        <p class="eyebrow">LESSON ANIMATION CUE EDITOR</p>
        <h1 id="page-title">Build a timed lesson animation</h1>
        <p>For teachers and technical educators who need readable cues instead of an animation engine.</p>
        <div class="hero-action"><a class="primary" href="/demo">Try it with sample data</a><span><strong>Recommended first step.</strong> Opens a 20-second pollination lesson with three actors and seven cues.</span></div>
        <button class="text-action" id="start-blank">Start a blank lesson</button>
      </div>
      <ul class="plain-facts" aria-label="Product facts"><li>Projects stay in this browser.</li><li>Works offline after your first visit.</li><li>Core editor: free. Field Kit: $12 once.</li></ul>
    </section>`;
  const demoBanner = isDemo ? `<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved.</strong><span>Your saved lessons are not read or changed.</span><div><button class="quiet" id="reset-demo">Reset demo</button><a class="secondary" href="/">Start for real</a></div></aside>` : '';
  app.innerHTML = `
    ${header()}
    ${demoBanner}
    <main id="main">
      ${intro}
      ${recoveryMessage ? `<aside class="recovery" role="status"><strong>Saved lesson reset</strong><span>${recoveryMessage}</span><button class="quiet" id="dismiss-recovery">Dismiss</button></aside>` : ''}
      <section class="editor-section" id="editor" aria-labelledby="editor-title">
        <div class="editor-head"><div><p class="eyebrow">${isDemo ? 'DEMO WORKSPACE' : 'YOUR WORKSPACE'} / <span id="save-state">${isDemo ? 'NOT SAVED' : 'LOCAL'}</span></p><h2 id="editor-title">${isDemo ? 'Sample lesson: pollination' : 'Build your lesson'}</h2></div><div class="editor-actions"><button class="quiet" id="new-project">New lesson</button><button class="quiet" id="import-project">Import JSON</button><button class="primary" id="export-project">Export files <span aria-hidden="true">↗</span></button></div></div>
        <div class="project-meta"><label>Lesson title<input id="project-title" value="${escapeHtml(project.title)}" maxlength="80"></label><label>Length <span class="unit-wrap"><input id="project-duration" type="number" min="1" max="900" step="1" value="${project.duration}"><span>s</span></span></label></div>
      <section class="workspace" aria-label="Lesson workspace">
        <div class="stage-column">
          <div class="stage-head"><div><span class="coord">PREVIEW</span><strong>Animation preview</strong></div><span class="offline" id="network-state">Ready offline</span></div>
          <div class="stage" id="stage" tabindex="0" aria-label="Animation preview. Use the playback controls below.">
            <div class="stage-grid" aria-hidden="true"></div><div id="actors-layer"></div>
            <div class="stage-empty" id="stage-empty" hidden><img src="/assets/hero-map.webp" width="768" height="512" alt="Illustrated lesson stage with three geometric actors and a timeline"><div><strong>No actors yet</strong><span>Add a named actor to show the first idea in your lesson.</span><button class="primary" data-add-actor>Add first actor</button></div></div>
            <span class="north" aria-hidden="true">N<br>↑</span>
          </div>
          <div class="transport">
            <button class="icon-btn" id="restart" aria-label="Restart preview">↶</button>
            <button class="play" id="play" aria-label="Play preview"><span aria-hidden="true">▶</span><span>Play</span></button>
            <label class="scrub"><span class="sr-only">Preview time</span><input id="scrubber" type="range" min="0" max="${project.duration}" step="0.05" value="0"></label>
            <output id="timecode">00:00.0 / ${formatTime(project.duration)}</output>
            <button class="quiet compact" id="audio-button">Add audio</button>
          </div>
          <p class="caption-note">Captions appear automatically from every “say” cue. <span id="audio-name">No audio attached.</span></p>
        </div>
        <aside class="roster" aria-labelledby="roster-title">
          <div class="section-head"><div><span class="coord">ACTORS</span><h3 id="roster-title">Actors</h3></div><button class="square-btn" data-add-actor aria-label="Add actor">＋</button></div>
          <div id="actor-list"></div>
          <div class="roster-actions"><button class="secondary" data-add-actor>+ Add actor</button><button class="quiet" id="templates">Field Kit</button></div>
        </aside>
      </section>
      <section class="cue-section" aria-labelledby="cue-title">
        <div class="cue-header"><div><p class="eyebrow">CUES / TIME</p><h3 id="cue-title">Cue timeline</h3><p>Each band is an instruction with a start and an end. Select one to edit it.</p></div><button class="primary" id="add-cue" ${project.actors.length ? '' : 'disabled'}>+ Add cue</button></div>
        <div class="timeline-shell" id="timeline-shell"><div id="timeline"></div></div>
      </section>
      </section>
      ${isDemo ? '' : `<section class="how" aria-labelledby="how-title"><p class="eyebrow">HOW IT WORKS</p><h2 id="how-title">Build a lesson in three steps</h2><ol><li><strong>Add actors.</strong><span>Name each idea, object, or speaker.</span></li><li><strong>Write cues.</strong><span>Set when each actor enters, moves, speaks, or gets highlighted.</span></li><li><strong>Export files.</strong><span>Save versioned JSON, JavaScript, SVG, or browser-recorded video.</span></li></ol></section>
      <section class="limits" aria-labelledby="limits-title"><p class="eyebrow">SCOPE AND PRIVACY</p><h2 id="limits-title">Your lesson stays under your control</h2><p>Lesson files and imported media stay in your browser. This tool does not create character rigs, generate video, or host classrooms.</p></section>`}
      <section class="field-kit" aria-labelledby="kit-title"><div><p class="eyebrow">OPTIONAL FIELD KIT</p><h2 id="kit-title">Start with three lesson templates</h2><p>Process, comparison, and cause-and-effect templates cost $12 once. Core editing and every export stay free.</p><p class="availability">Purchase setup is pending. Existing buyers can still restore a license.</p></div><button class="secondary" id="kit-button">View Field Kit</button></section>
    </main>
    ${footer()}
    <input id="project-file" type="file" accept="application/json,.json" hidden><input id="audio-file" type="file" accept="audio/*" hidden>
    <div id="live" class="sr-only" aria-live="polite"></div>
    ${dialogs()}`;
  bind();
  renderProject();
  updateNetwork();
  handleLicenseReturn();
}

function dialogs() {
  return `<dialog id="actor-dialog"><form method="dialog" id="actor-form"><div class="dialog-head"><div><p class="eyebrow">NEW ACTOR</p><h2>Add an actor</h2></div><button class="close" type="button" aria-label="Close">×</button></div><label>Name<input name="name" required maxlength="30" autocomplete="off"></label><fieldset><legend>Shape</legend><div class="shape-options"><label><input type="radio" name="shape" value="circle" checked><span>● Circle</span></label><label><input type="radio" name="shape" value="square"><span>■ Square</span></label><label><input type="radio" name="shape" value="triangle"><span>▲ Triangle</span></label></div></fieldset><label>Actor color<input name="color" type="color" value="#2e6f8e"></label><label class="upload-label">Or use your own SVG<input name="svg" type="file" accept="image/svg+xml,.svg"><small>Scripts and external references are removed.</small></label><p class="form-error" aria-live="assertive"></p><div class="dialog-actions"><button value="cancel" class="quiet">Cancel</button><button value="default" class="primary">Add actor</button></div></form></dialog>
  <dialog id="cue-dialog"><form method="dialog" id="cue-form"><div class="dialog-head"><div><p class="eyebrow">TIMED INSTRUCTION</p><h2 id="cue-dialog-title">Add a cue</h2></div><button class="close" type="button" aria-label="Close">×</button></div><input name="id" type="hidden"><label>Actor<select name="actorId" required></select></label><label>Cue type<select name="kind"><option value="enter">Enter the stage</option><option value="move">Move to a point</option><option value="say">Say with caption</option><option value="highlight">Highlight an idea</option></select></label><div class="field-row"><label>Starts at <span class="unit-wrap"><input name="start" type="number" min="0" step="0.1" required><span>s</span></span></label><label>Lasts <span class="unit-wrap"><input name="duration" type="number" min="0.1" step="0.1" required><span>s</span></span></label></div><label class="cue-text">Caption text<textarea name="text" rows="3" maxlength="180"></textarea></label><div class="field-row cue-position"><label>End X<input name="x" type="range" min="5" max="95" value="70"></label><label>End Y<input name="y" type="range" min="10" max="90" value="50"></label></div><p class="form-error" aria-live="assertive"></p><div class="dialog-actions"><button type="button" class="danger" id="delete-cue" hidden>Delete cue</button><span class="spacer"></span><button value="cancel" class="quiet">Cancel</button><button value="default" class="primary">Save cue</button></div></form></dialog>
  <dialog id="export-dialog"><div class="dialog-head"><div><p class="eyebrow">EXPORT FILES</p><h2>Export lesson</h2></div><button class="close" aria-label="Close">×</button></div><p>JSON saves the editable lesson. JavaScript works in code. SVG captures the current frame.</p><div class="export-grid"><button data-export="json"><strong>Versioned JSON</strong><span>Reopen the same editable lesson</span></button><button data-export="js"><strong>JavaScript data</strong><span>Use the lesson data in your code</span></button><button data-export="svg"><strong>Self-contained SVG</strong><span>Save the current frame with captions</span></button><button data-export="video"><strong>Record video</strong><span>Save MP4 where supported or WebM elsewhere</span></button></div><p class="export-status" aria-live="polite"></p></dialog>
  <dialog id="kit-dialog"><div class="dialog-head"><div><p class="eyebrow">FIELD KIT / $12 ONCE</p><h2>Choose a lesson template</h2></div><button class="close" aria-label="Close">×</button></div><div id="kit-content"></div></dialog>`;
}

function bind() {
  document.querySelectorAll<HTMLElement>('[data-add-actor]').forEach(b => b.onclick = openActorDialog);
  byId('new-project').onclick = startBlankLesson;
  const startBlank = document.querySelector<HTMLButtonElement>('#start-blank');
  if (startBlank) startBlank.onclick = startBlankLesson;
  const resetDemo = document.querySelector<HTMLButtonElement>('#reset-demo');
  if (resetDemo) resetDemo.onclick = () => { project = sampleProject(); currentTime = 0; selectedCue = ''; renderEditor(); announce('Demo reset to the pollination sample.'); };
  const dismissRecovery = document.querySelector<HTMLButtonElement>('#dismiss-recovery');
  if (dismissRecovery) dismissRecovery.onclick = () => { recoveryMessage = ''; dismissRecovery.closest('.recovery')?.remove(); };
  byId('import-project').onclick = () => byId<HTMLInputElement>('project-file').click();
  byId<HTMLInputElement>('project-file').onchange = importProject;
  byId('audio-button').onclick = () => byId<HTMLInputElement>('audio-file').click();
  byId<HTMLInputElement>('audio-file').onchange = importAudio;
  byId('export-project').onclick = () => openDialog('export-dialog');
  byId('add-cue').onclick = () => openCueDialog();
  byId('templates').onclick = byId('kit-button').onclick = openKit;
  byId<HTMLInputElement>('project-title').onchange = e => { project.title = (e.target as HTMLInputElement).value.trim() || 'Untitled lesson'; save(); renderProject(); };
  byId<HTMLInputElement>('project-duration').onchange = e => { const requested=Number((e.target as HTMLInputElement).value);project.duration=Number.isFinite(requested)?clamp(requested,1,900):45;project.cues=project.cues.filter(c=>c.start<project.duration).map(c=>({...c,duration:Math.min(c.duration,project.duration-c.start)}));currentTime=Math.min(currentTime,project.duration);save();renderEditor(); };
  byId('play').onclick = togglePlay;
  byId('restart').onclick = () => { pause(); currentTime = 0; syncPreview(); };
  byId<HTMLInputElement>('scrubber').oninput = e => { pause(); currentTime = Number((e.target as HTMLInputElement).value); syncPreview(); };
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach(d => d.querySelector<HTMLElement>('.close')!.onclick = () => d.close());
  document.querySelectorAll<HTMLButtonElement>('button[value="cancel"]').forEach(b => b.onclick = e => { e.preventDefault(); b.closest('dialog')?.close(); });
  byId<HTMLFormElement>('actor-form').onsubmit = submitActor;
  byId<HTMLFormElement>('cue-form').onsubmit = submitCue;
  byId<HTMLSelectElement>('cue-form').querySelector<HTMLSelectElement>('[name=kind]')!.onchange = toggleCueFields;
  byId('delete-cue').onclick = deleteCue;
  document.querySelectorAll<HTMLElement>('[data-export]').forEach(b => b.onclick = () => exportFile(b.dataset.export!));
}

function startBlankLesson() {
  const hasContent = project.actors.length > 0 || project.cues.length > 0 || project.title !== 'Untitled lesson';
  if (hasContent && !confirm('Start a blank lesson? You can undo this change during this session.')) return;
  undoProject = hasContent ? structuredClone(project) : null;
  project = emptyProject(); currentTime = 0; selectedCue = '';
  save('Blank lesson started'); renderEditor();
  if (undoProject) showUndo();
  byId('editor').scrollIntoView({ block: 'start' });
  const heading = byId('editor-title'); heading.tabIndex = -1; heading.focus();
}

function byId<T extends HTMLElement = HTMLElement>(id: string) { return document.getElementById(id) as T; }
function openDialog(id: string) { const d = byId<HTMLDialogElement>(id); d.showModal(); }

function renderProject() {
  renderActors(); renderRoster(); renderTimeline(); syncPreview();
  const addCue = byId<HTMLButtonElement>('add-cue'); addCue.disabled = project.actors.length === 0;
}

function renderActors() {
  const layer = byId('actors-layer');
  const frames = frameAt(project, currentTime, reducedMotion);
  layer.innerHTML = frames.map(a => actorHtml(a)).join('');
  byId('stage-empty').hidden = project.actors.length > 0;
  layer.querySelectorAll<HTMLElement>('.actor').forEach(el => enableDrag(el));
}

function actorHtml(a: ReturnType<typeof frameAt>[number]) {
  const content = a.shape === 'svg' && a.svg ? `<img src="${a.svg}" alt="">` : `<span class="shape shape-${a.shape}" style="--actor:${a.color}"></span>`;
  return `<div class="actor ${a.highlighted ? 'is-highlighted':''}" data-actor="${a.id}" tabindex="0" style="--x:${a.x};--y:${a.y};--size:${a.size};--visible:${a.visible ? 1 : 0}" aria-label="${escapeHtml(a.name)} at ${Math.round(a.x)}, ${Math.round(a.y)}"><div class="actor-visual">${content}<span class="actor-initial">${escapeHtml(a.name.slice(0,1).toUpperCase())}</span></div><span class="actor-name">${escapeHtml(a.name)}</span>${a.speaking ? `<span class="speech">${escapeHtml(a.speaking)}</span>`:''}</div>`;
}

function enableDrag(el: HTMLElement) {
  el.onpointerdown = e => {
    if (playing) return; el.setPointerCapture(e.pointerId);
    const stage = byId('stage').getBoundingClientRect();
    const move = (event: PointerEvent) => { const a = project.actors.find(x => x.id === el.dataset.actor)!; a.x = clamp((event.clientX-stage.left)/stage.width*100,5,95); a.y = clamp((event.clientY-stage.top)/stage.height*100,10,90); currentTime = 0; renderActors(); };
    el.onpointermove = move; el.onpointerup = () => { el.onpointermove = null; save('Actor position saved'); renderTimeline(); };
  };
}

function renderRoster() {
  byId('actor-list').innerHTML = project.actors.length ? project.actors.map((a,i) => `<div class="actor-row"><span class="legend-shape shape-${a.shape}" style="--actor:${a.color}">${a.shape === 'svg' ? '◇' : ''}</span><button class="actor-label" data-focus-actor="${a.id}"><strong>${escapeHtml(a.name)}</strong><span>${a.shape} · ${Math.round(a.x)}, ${Math.round(a.y)}</span></button><button class="row-menu" data-remove-actor="${a.id}" aria-label="Remove ${escapeHtml(a.name)}">×</button><span class="index">${String(i+1).padStart(2,'0')}</span></div>`).join('') : `<div class="roster-empty"><span>＋</span><p>Your actors will be listed here.</p></div>`;
  document.querySelectorAll<HTMLElement>('[data-focus-actor]').forEach(b => b.onclick = () => { const el = document.querySelector<HTMLElement>(`[data-actor="${b.dataset.focusActor}"]`); el?.focus(); el?.classList.add('is-highlighted'); setTimeout(()=>el?.classList.remove('is-highlighted'),700); });
  document.querySelectorAll<HTMLElement>('[data-remove-actor]').forEach(b => b.onclick = () => removeActor(b.dataset.removeActor!));
}

function renderTimeline() {
  const timeline = byId('timeline');
  if (!project.actors.length) { timeline.innerHTML = `<div class="timeline-empty"><strong>No cues yet.</strong><span>Add an actor, then give it an enter, move, say, or highlight cue.</span></div>`; return; }
  const ticks = Array.from({length: 6},(_,i) => project.duration*i/5);
  timeline.innerHTML = `<div class="ruler"><span>ACTOR / CUES</span><div>${ticks.map(t=>`<i style="left:${t/project.duration*100}%">${formatTime(t)}</i>`).join('')}</div></div>${project.actors.map(actor => `<div class="lane"><div class="lane-label"><span class="legend-dot" style="--actor:${actor.color}"></span><strong>${escapeHtml(actor.name)}</strong></div><div class="lane-track">${project.cues.filter(c=>c.actorId===actor.id).map(c=>`<button class="cue cue-${c.kind} ${selectedCue===c.id?'selected':''}" style="left:${c.start/project.duration*100}%;width:${Math.max(c.duration/project.duration*100,2.4)}%" data-cue="${c.id}" title="${c.kind} at ${formatTime(c.start)}"><span>${cueIcon(c.kind)} ${c.kind}</span></button>`).join('')}<span class="playhead" style="left:${currentTime/project.duration*100}%"></span></div></div>`).join('')}`;
  timeline.querySelectorAll<HTMLElement>('[data-cue]').forEach(b => b.onclick = () => openCueDialog(b.dataset.cue));
}

function cueIcon(kind: CueKind) { return ({enter:'↳',move:'→',say:'“',highlight:'✦'})[kind]; }
function formatTime(t: number) { const m = Math.floor(t/60); const s = t-m*60; return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`; }

function syncPreview() {
  renderActors();
  const scrub = byId<HTMLInputElement>('scrubber'); scrub.max = String(project.duration); scrub.value = String(currentTime);
  byId<HTMLOutputElement>('timecode').value = `${formatTime(currentTime)} / ${formatTime(project.duration)}`;
  document.querySelectorAll<HTMLElement>('.playhead').forEach(p => p.style.left = `${currentTime/project.duration*100}%`);
  const audio = document.querySelector<HTMLAudioElement>('#lesson-audio'); if (audio && Math.abs(audio.currentTime-currentTime) > .3) audio.currentTime = currentTime;
}

function togglePlay() { playing ? pause() : play(); }
function play() {
  if (currentTime >= project.duration) currentTime = 0;
  playing = true; lastFrame = performance.now();
  const button = byId('play'); button.innerHTML = '<span aria-hidden="true">Ⅱ</span><span>Pause</span>'; button.setAttribute('aria-label','Pause preview');
  document.querySelector<HTMLAudioElement>('#lesson-audio')?.play().catch(()=>{});
  const step = (now:number) => { if (!playing) return; currentTime += (now-lastFrame)/1000; lastFrame = now; if (currentTime >= project.duration) { currentTime=project.duration; pause(); } syncPreview(); if (playing) raf=requestAnimationFrame(step); };
  raf=requestAnimationFrame(step);
}
function pause() { playing=false; cancelAnimationFrame(raf); document.querySelector<HTMLAudioElement>('#lesson-audio')?.pause(); const b=byId('play'); if(b){b.innerHTML='<span aria-hidden="true">▶</span><span>Play</span>';b.setAttribute('aria-label','Play preview');} }

function openActorDialog() { const f=byId<HTMLFormElement>('actor-form'); f.reset(); f.querySelector('.form-error')!.textContent=''; openDialog('actor-dialog'); setTimeout(()=>f.querySelector<HTMLInputElement>('[name=name]')!.focus(),0); }
async function submitActor(e: SubmitEvent) {
  e.preventDefault(); const f=e.currentTarget as HTMLFormElement; const fd=new FormData(f); const name=String(fd.get('name')).trim(); const file=(fd.get('svg') as File);
  try {
    let shape=String(fd.get('shape')) as Actor['shape'], svg:string|undefined;
    if(file?.size){ if(file.size>300_000) throw new Error('Use an SVG smaller than 300 KB.'); svg=sanitizeSvg(await file.text()); shape='svg'; }
    project.actors.push({id:uid('actor'),name,shape,color:String(fd.get('color')),x:25+project.actors.length*18%55,y:50,size:15,svg});
    f.closest('dialog')!.close(); save(`${name} added`); renderProject();
  } catch(err){f.querySelector('.form-error')!.textContent=(err as Error).message;}
}

function sanitizeSvg(text:string) {
  const doc=new DOMParser().parseFromString(text,'image/svg+xml'); if(doc.querySelector('parsererror') || doc.documentElement.tagName.toLowerCase()!=='svg') throw new Error('That file is not a valid SVG.');
  doc.querySelectorAll('script,foreignObject,iframe,object,embed').forEach(n=>n.remove());
  doc.querySelectorAll('*').forEach(el=>Array.from(el.attributes).forEach(a=>{if(a.name.startsWith('on') || ((a.name==='href'||a.name.endsWith(':href')) && !a.value.startsWith('#'))) el.removeAttribute(a.name);}));
  const clean=new XMLSerializer().serializeToString(doc.documentElement); return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clean)))}`;
}

function removeActor(id:string){const actor=project.actors.find(a=>a.id===id);if(actor&&confirm(`Remove ${actor.name} and all of its cues?`)){project.actors=project.actors.filter(a=>a.id!==id);project.cues=project.cues.filter(c=>c.actorId!==id);save(`${actor.name} removed`);renderProject();}}

function openCueDialog(id?:string) {
  const f=byId<HTMLFormElement>('cue-form'); f.reset(); f.querySelector<HTMLSelectElement>('[name=actorId]')!.innerHTML=project.actors.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  const cue=id?project.cues.find(c=>c.id===id):undefined; selectedCue=cue?.id||'';
  (f.elements.namedItem('id') as HTMLInputElement).value=cue?.id||'';(f.elements.namedItem('actorId') as HTMLSelectElement).value=cue?.actorId||project.actors[0]?.id;(f.elements.namedItem('kind') as HTMLSelectElement).value=cue?.kind||'enter';(f.elements.namedItem('start') as HTMLInputElement).value=String(cue?.start??Math.min(Math.floor(currentTime),project.duration-1));(f.elements.namedItem('duration') as HTMLInputElement).value=String(cue?.duration??2);(f.elements.namedItem('text') as HTMLTextAreaElement).value=cue?.text||'';(f.elements.namedItem('x') as HTMLInputElement).value=String(cue?.x??70);(f.elements.namedItem('y') as HTMLInputElement).value=String(cue?.y??50);
  byId('cue-dialog-title').textContent=cue?'Edit cue':'Add a cue'; byId<HTMLButtonElement>('delete-cue').hidden=!cue; f.querySelector('.form-error')!.textContent=''; toggleCueFields(); openDialog('cue-dialog');
}
function toggleCueFields(){const f=byId<HTMLFormElement>('cue-form');const k=(f.elements.namedItem('kind') as HTMLSelectElement).value;f.querySelector<HTMLElement>('.cue-text')!.hidden=k!=='say';f.querySelector<HTMLElement>('.cue-position')!.hidden=k!=='move';}
function submitCue(e:SubmitEvent){e.preventDefault();const f=e.currentTarget as HTMLFormElement,fd=new FormData(f),start=Number(fd.get('start')),duration=Number(fd.get('duration')),kind=fd.get('kind') as CueKind;if(!Number.isFinite(start)||!Number.isFinite(duration)||start<0||duration<=0||start+duration>project.duration){f.querySelector('.form-error')!.textContent=`Keep this cue between 0 and ${project.duration} seconds.`;return;}const data:Cue={id:String(fd.get('id'))||uid('cue'),actorId:String(fd.get('actorId')),kind,start,duration};if(kind==='say'){data.text=String(fd.get('text')).trim();if(!data.text){f.querySelector('.form-error')!.textContent='Add caption text for a say cue.';return;}}if(kind==='move'){data.x=Number(fd.get('x'));data.y=Number(fd.get('y'));}const i=project.cues.findIndex(c=>c.id===data.id);if(i>=0)project.cues[i]=data;else project.cues.push(data);project.cues.sort((a,b)=>a.start-b.start);selectedCue=data.id;f.closest('dialog')!.close();save(`${kind} cue saved`);renderProject();}
function deleteCue(){const id=(byId<HTMLFormElement>('cue-form').elements.namedItem('id') as HTMLInputElement).value;if(id){project.cues=project.cues.filter(c=>c.id!==id);byId<HTMLDialogElement>('cue-dialog').close();selectedCue='';save('Cue deleted');renderProject();}}

async function importProject(e:Event){const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{const next=validateProject(JSON.parse(await file.text()));undoProject=structuredClone(project);project=next;currentTime=0;save(`${file.name} imported`);renderEditor();showUndo();}catch(err){announce((err as Error).message);alert(`${(err as Error).message}\nChoose a Lesson Motion Cues v1 JSON file.`);}finally{input.value='';}}
function importAudio(e:Event){const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;if(file.size>25_000_000){alert('Choose audio smaller than 25 MB so preview remains responsive.');return;}if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(file);const safeName=file.name.slice(0,200);project.audio={name:safeName};byId('audio-name').textContent=`${safeName} is attached for this tab.`;const a=document.createElement('audio');a.id='lesson-audio';a.src=audioUrl;a.preload='metadata';a.addEventListener('error',()=>announce('This browser could not play that audio file.'));document.body.append(a);save('Audio reference saved');}

function download(name:string,content:Blob|string,type='text/plain'){const blob=content instanceof Blob?content:new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function slug(){return (project.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'lesson');}
function exportFile(type:string){const status=document.querySelector<HTMLElement>('.export-status')!;status.textContent='Preparing export…';try{if(type==='json')download(`${slug()}.lmc.json`,serializeProject(project),'application/json');if(type==='js')download(`${slug()}.js`,`// Generated by Lesson Motion Cues v1\nexport const lesson = ${serializeProject(project)};\n`,'text/javascript');if(type==='svg')download(`${slug()}-${currentTime.toFixed(1)}s.svg`,renderSvg(project,currentTime),'image/svg+xml');if(type==='video'){recordVideo(status);return;}status.textContent='Export ready. Your browser saved the file.';}catch(err){status.textContent=`Export failed: ${(err as Error).message}`;}}

export function renderSvg(p:Project,time:number){const frames=frameAt(p,time);const actors=frames.filter(a=>a.visible).map(a=>{let shape=`<circle r="38" fill="${a.color}"/>`;if(a.shape==='square')shape=`<rect x="-38" y="-38" width="76" height="76" rx="8" fill="${a.color}"/>`;if(a.shape==='triangle')shape=`<path d="M0 -44 L42 35 L-42 35 Z" fill="${a.color}"/>`;if(a.shape==='svg'&&a.svg)shape=`<image href="${a.svg}" x="-48" y="-48" width="96" height="96"/>`;const speech=a.speaking?`<g><rect x="48" y="-80" width="340" height="56" rx="8" fill="#fffced" stroke="#173b35"/><text x="64" y="-46" font-size="18" fill="#173b35">${escapeXml(a.speaking.slice(0,44))}</text></g>`:'';return `<g transform="translate(${a.x*9.6} ${a.y*5.4})">${a.highlighted?'<circle r="54" fill="none" stroke="#c98427" stroke-width="8"/>':''}${shape}<text text-anchor="middle" y="7" font-size="22" font-weight="700" fill="#fffced">${escapeXml(a.name[0]||'')}</text><text text-anchor="middle" y="66" font-size="17" font-weight="700" fill="#173b35">${escapeXml(a.name)}</text>${speech}</g>`}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeXml(p.title)} at ${time.toFixed(1)} seconds"><rect width="960" height="540" fill="${p.background}"/><g opacity=".18" fill="none" stroke="#176b57">${[80,140,210,300,390].map((y,i)=>`<path d="M-20 ${y} Q 180 ${y-70+i*9} 360 ${y+20} T 750 ${y-10} T 1000 ${y+30}"/>`).join('')}</g>${actors}<text x="24" y="516" font-family="monospace" font-size="14" fill="#52665e">${escapeXml(p.title)} · ${formatTime(time)} · Lesson Motion Cues v1</text></svg>`;}
function escapeXml(s:string){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&apos;','"':'&quot;'}[c]!));}

async function recordVideo(status:HTMLElement){if(!('MediaRecorder'in window)){status.textContent='Video recording is unavailable here. Export SVG or JSON instead.';return;}const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const ctx=canvas.getContext('2d')!;const supported=['video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm'].find(MediaRecorder.isTypeSupported);if(!supported){status.textContent='This browser has no supported video recorder.';return;}const stream=canvas.captureStream(30);let recordingAudio:HTMLAudioElement|undefined,audioContext:AudioContext|undefined;if(audioUrl){recordingAudio=new Audio(audioUrl);audioContext=new AudioContext();const source=audioContext.createMediaElementSource(recordingAudio),destination=audioContext.createMediaStreamDestination();source.connect(destination);destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));}const recorder=new MediaRecorder(stream,{mimeType:supported,videoBitsPerSecond:3_000_000});const chunks:BlobPart[]=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{recordingAudio?.pause();audioContext?.close();const ext=supported.startsWith('video/mp4')?'mp4':'webm';download(`${slug()}.${ext}`,new Blob(chunks,{type:supported}));status.textContent=`${ext.toUpperCase()} recording saved${recordingAudio?' with audio':''}.`;};recorder.start();recordingAudio?.play().catch(()=>{});status.textContent=`Recording ${project.duration}s in real time. Keep this tab visible…`;const started=performance.now();const draw=()=>{const t=Math.min((performance.now()-started)/1000,project.duration);const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);if(t>=project.duration)recorder.stop();else requestAnimationFrame(draw);};img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSvg(project,t))}`;};draw();}

function updateNetwork(){const n=byId('network-state');if(n)n.textContent=navigator.onLine?'Ready offline':'Offline · edits still save';}
function showUndo(){const toast=document.createElement('div');toast.className='toast';toast.innerHTML='Previous lesson kept for this session. <button>Undo</button>';toast.querySelector('button')!.onclick=()=>{if(undoProject){project=undoProject;undoProject=null;save('Previous lesson restored');renderEditor();}toast.remove();};document.body.append(toast);setTimeout(()=>toast.remove(),8000);}

async function handleLicenseReturn(){const params=new URLSearchParams(location.search),token=params.get('license');if(token){localStorage.setItem(LICENSE_KEY,token);history.replaceState({},'',location.pathname);await verifyLicense(token,true);}}
function cachedLicense(token:string,freshOnly=false){try{const c=JSON.parse(localStorage.getItem(VERIFY_KEY)||'null');return c?.token===token&&!!c?.valid&&(!freshOnly||Date.now()-c.time<86400000);}catch{return false;}}
async function verifyLicense(token:string,force=false){if(!force&&cachedLicense(token,true))return true;try{const r=await fetch(`https://api.sociobot.in/api/v1/products/lesson-motion-cues/verify?license=${encodeURIComponent(token)}`);if(!r.ok)throw new Error('License service unavailable');const data=await r.json();localStorage.setItem(VERIFY_KEY,JSON.stringify({token,valid:!!data.valid,time:Date.now()}));if(!data.valid)announce('Field Kit license is no longer active. Free editing and exports are unchanged.');return !!data.valid;}catch{return cachedLicense(token);}}
async function openKit(){const dialog=byId<HTMLDialogElement>('kit-dialog');if(!dialog.open)openDialog('kit-dialog');const box=byId('kit-content'),token=localStorage.getItem(LICENSE_KEY)||'';let unlocked=!!token&&cachedLicense(token);if(token&&!unlocked)unlocked=await verifyLicense(token);else if(token)verifyLicense(token).catch(()=>{});if(unlocked){box.innerHTML=`<p class="success-note">✓ Field Kit license active on this device.</p><div class="template-list">${[['Process lesson','process'],['Side-by-side comparison','comparison'],['Cause and effect','cause']].map(([n,id])=>`<button data-template="${id}"><strong>${n}</strong><span>Load a structured 45-second lesson</span></button>`).join('')}</div><p class="fine">Loading a template replaces the current lesson after confirmation.</p>`;box.querySelectorAll<HTMLElement>('[data-template]').forEach(b=>b.onclick=()=>loadTemplate(b.dataset.template!));}else{box.innerHTML=`<p>Three reusable 45-second lesson templates cost <strong>$12 once</strong>. Core editing, captions, and every export remain free.</p><button class="primary buy-link" disabled>Checkout temporarily unavailable</button><p class="availability" role="status">Sociobot product registration is pending. No payment can be taken yet.</p><hr><form id="restore-form"><label>Have a license?<input name="license" autocomplete="off" spellcheck="false" required></label><button class="secondary">Verify and restore</button><p class="form-error" aria-live="polite"></p></form><p class="fine">Sociobot and Dodo handle checkout and refunds. A refund revokes the license. <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>`;byId<HTMLFormElement>('restore-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget as HTMLFormElement,t=String(new FormData(f).get('license')).trim(),error=f.querySelector<HTMLElement>('.form-error')!;error.textContent='Verifying…';if(await verifyLicense(t,true)){localStorage.setItem(LICENSE_KEY,t);await openKit();}else error.textContent=navigator.onLine?'That license is not active for Lesson Motion Cues. Check the token and try again.':'You are offline. Reconnect once to restore this license.';};}}
function loadTemplate(type:string){if(!confirm('Replace the current lesson with this template? You can undo this change during this session.'))return;undoProject=structuredClone(project);const p=sampleProject();p.title=type==='comparison'?'Compare two energy sources':type==='cause'?'From cause to effect':'Explain a process';p.duration=45;if(type==='comparison'){p.actors[0].name='Option A';p.actors[1].name='Option B';}if(type==='cause'){p.actors[0].name='Cause';p.actors[1].name='Effect';}project=p;byId<HTMLDialogElement>('kit-dialog').close();save('Field Kit template loaded');renderEditor();showUndo();}

addEventListener('online', updateNetwork);
addEventListener('offline', updateNetwork);
if (!isDemo) addEventListener('beforeunload', () => save(''));
if ('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
route();
