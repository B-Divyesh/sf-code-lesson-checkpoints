import '@fontsource-variable/fraunces/wght.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './style.css';
import type { Checkpoint, Lesson, Submission } from './types';
import { normalizeShareCode, redactOutput } from './privacy';

declare const __BUILD_SHA__: string;

const PRODUCT_SLUG = 'code-lesson-checkpoints';
const BILLING_BASE = 'https://api.sociobot.in/api/v1';
const DEMO_STORAGE_KEY = 'demo:clc:workspace';
const app = document.querySelector<HTMLDivElement>('#app')!;
let routeFocusRequested = false;

type ApiError = Error & { status?: number };
type ArchivedLesson = { id: string; title: string; learnerName: string; shareCode: string; tutorToken: string; createdAt: string };
type DemoWorkspace = { workspaceId: string; expiresAt: number; lesson: Lesson };

const icon = (name: 'mark' | 'lock' | 'copy' | 'run' | 'reply' | 'check' | 'block') => {
  const paths = {
    mark: '<path d="M5 11.5 9 15l10-11"/><path d="M5 4v15h15"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    run: '<path d="m7 5 11 7-11 7Z"/>',
    reply: '<path d="m9 8-5 4 5 4v-3h4a7 7 0 0 1 6 3c-.5-5-2.5-8-7-8Z"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    block: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/>',
  }[name];
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${paths}</svg>`;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function shell(content: string, options: { compact?: boolean; current?: string; demo?: boolean } = {}): string {
  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="Code Lesson Checkpoints home">
        <span class="brand-mark">${icon('mark')}</span><span>Code Lesson<br><strong>Checkpoints</strong></span>
      </a>
      <nav aria-label="Main navigation">
        <a ${options.current === 'demo' ? 'aria-current="page"' : ''} href="/demo">Demo</a>
        <a ${options.current === 'join' ? 'aria-current="page"' : ''} href="/join">Join lesson</a>
        <a ${options.current === 'pricing' ? 'aria-current="page"' : ''} href="/pricing">Team plan</a>
        <a class="header-action" href="/new">Plan a lesson</a>
      </nav>
    </header>
    ${options.demo ? `<aside class="demo-banner" aria-label="Sample-data demo"><div><strong>Demo — sample data, nothing is saved</strong><span>Use the tutor view without changing a real lesson.</span></div><div><button type="button" id="reset-demo">Reset demo</button><button type="button" id="start-real">Start for real</button></div></aside>` : ''}
    <div id="route-announcer" class="visually-hidden" role="status" aria-live="polite"></div>
    <main id="main" class="${options.compact ? 'main compact' : 'main'}" tabindex="-1">${content}</main>
    <footer>
      <p><strong>Code Lesson Checkpoints</strong><br><span>Learners choose which run results to share.</span></p>
      <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-code-lesson-checkpoints">Source on GitHub (external)</a></nav>
      <p class="made-note">Paper-path artwork generated for this product. No source code is uploaded by default.<br>Built by Param Factory · Version 0.1.0 (${escapeHtml(__BUILD_SHA__.slice(0, 12))})</p>
    </footer>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="offline" class="offline" role="status" hidden>You’re offline. Existing details stay visible; reconnect to share updates.</div>`;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  } catch {
    const error = new Error('Could not reach the lesson service. Check your connection and try again.') as ApiError;
    error.status = 0;
    throw error;
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({ error: 'The request could not be completed.' })) as { error?: string };
    const error = new Error(result.error ?? 'The request could not be completed.') as ApiError;
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function announce(message: string): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('shown');
  window.setTimeout(() => toast.classList.remove('shown'), 3600);
}

function finishRoute(description: string, canonicalPath = location.pathname): void {
  const canonicalUrl = `https://code-lesson-checkpoints.sociobot.in${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '')}`;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', description);
  }
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', document.title);
  const heading = document.querySelector<HTMLHeadingElement>('main h1');
  heading?.setAttribute('tabindex', '-1');
  if (routeFocusRequested && heading) {
    heading.focus({ preventScroll: true });
    const announcer = document.querySelector<HTMLElement>('#route-announcer');
    if (announcer) announcer.textContent = `Page changed: ${heading.innerText.replace(/\s+/g, ' ').trim() || document.title}`;
    routeFocusRequested = false;
  }
  bindConnectivity();
}

function home(): void {
  document.title = 'Code Lesson Checkpoints — See where learners get stuck';
  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span></span>Learners choose what to share</p>
        <h1>See where the lesson got <em>stuck.</em></h1>
        <p class="lede">Remote programming tutors add commands or tests for each lesson step. Learners run them locally and choose what to share.</p>
        <div class="hero-actions"><div class="primary-action"><a class="button primary" href="/?demo=1">Try it with sample data ${icon('run')}</a><small>Opens Sam’s three-checkpoint lesson in a temporary demo.</small></div><a class="button secondary" href="/new">Plan a lesson</a><a class="text-link" href="/join">Join with a lesson code <span aria-hidden="true">→</span></a></div>
        <ul class="trust-row" aria-label="Product facts"><li>${icon('lock')} No source uploads</li><li>${icon('check')} Learners review output before sharing</li><li>${icon('mark')} Free lesson planning</li></ul>
      </div>
      <figure class="hero-art paper-layer">
        <picture>
          <source type="image/avif" srcset="/assets/hero-paper-path-720.avif 720w, /assets/hero-paper-path.avif 1200w" sizes="(max-width: 780px) 92vw, 48vw">
          <source type="image/webp" srcset="/assets/hero-paper-path-720.webp 720w, /assets/hero-paper-path.webp 1200w" sizes="(max-width: 780px) 92vw, 48vw">
          <img src="/assets/hero-paper-path.webp" width="1200" height="800" alt="A paper-cut path where a small terminal slip crosses three checkpoint steps toward a reply flag" fetchpriority="high" decoding="async">
        </picture>
        <figcaption><span>01</span> Run locally <span>02</span> Share selected output <span>03</span> Reply in context</figcaption>
      </figure>
    </section>
    <section class="process" aria-labelledby="process-title">
      <div><p class="eyebrow"><span></span>How it works</p><h2 id="process-title">A record of the work,<br>not a recording of the learner.</h2></div>
      <ol>
        <li><span class="step-number">1</span><div><h3>Add checkpoints</h3><p>Add the commands or tests that define progress. Learners can copy them into their own terminal.</p></div></li>
        <li><span class="step-number">2</span><div><h3>Run and review</h3><p>Learners choose Passed or Blocked. They check hidden passwords and keys, then approve what leaves their computer.</p><a href="/downloads/code-lesson-checkpoints-0.1.0.vsix" download>Install the VS Code companion</a></div></li>
        <li><span class="step-number">3</span><div><h3>Reply to the blocked attempt</h3><p>Read the selected output and note in order. Reply to the exact attempt that needs help.</p></div></li>
      </ol>
    </section>
    <section class="boundary" aria-labelledby="boundary-title">
      <div class="boundary-tag">What this tool does not do</div><h2 id="boundary-title">Share lesson results, not source code.</h2>
      <p>No remote control, keystroke recording, source collection, automated grading, or generated answers. The learner keeps the keyboard—and the context.</p>
      <a class="button paper-button" href="/new">Create your first lesson</a>
    </section>
    <section class="home-team" aria-labelledby="home-team-title">
      <div><p class="eyebrow"><span></span>Optional Team archive</p><h2 id="home-team-title">Keep private tutor links together.</h2><p>Lesson planning and sharing stay free. Team archive searches lesson links saved on this device.</p></div>
      <div class="home-team-price"><p><strong>$39</strong> once</p><ul><li>For one tutor</li><li>Search by learner or lesson</li><li>Reopen saved tutor links</li><li>No recurring fee</li></ul><a class="button secondary" href="/pricing">See Team archive details</a></div>
    </section>`);
  finishRoute('Remote programming tutors add lesson steps. Learners run them locally and choose which results to share.', '/');
}

const checkpointTemplate = (index: number, values?: { title?: string; command?: string; hint?: string }) => `
  <fieldset class="checkpoint-editor" data-checkpoint>
    <legend><span class="step-number">${index + 1}</span> Checkpoint ${index + 1}</legend>
    <button class="remove-checkpoint icon-button" type="button" aria-label="Remove checkpoint ${index + 1}" title="Remove checkpoint">×</button>
    <label>Checkpoint name <input name="checkpoint-title" maxlength="100" required value="${escapeHtml(values?.title ?? '')}" placeholder="Tests pass"></label>
    <label>Command the learner runs <input class="command-input" name="checkpoint-command" maxlength="500" required value="${escapeHtml(values?.command ?? '')}" placeholder="npm test" spellcheck="false"></label>
    <label>What success looks like <input name="checkpoint-hint" maxlength="300" value="${escapeHtml(values?.hint ?? '')}" placeholder="All 12 tests pass"></label>
  </fieldset>`;

function newLesson(): void {
  document.title = 'Plan a lesson — Code Lesson Checkpoints';
  app.innerHTML = shell(`
    <section class="form-intro"><p class="eyebrow"><span></span>Tutor setup</p><h1>Plan your next<br>code lesson.</h1><p>Add the commands or tests for each lesson step. The server shows them but never runs them.</p></section>
    <form id="lesson-form" class="lesson-form">
      <div class="form-section"><h2>Lesson details</h2><div class="two-fields"><label>Lesson title <input name="title" maxlength="100" required autofocus placeholder="Debugging the weather API"></label><label>Learner name <span class="optional">Optional</span><input name="learnerName" maxlength="80" placeholder="Sam"></label></div></div>
      <div class="form-section"><div class="section-heading"><div><h2>Lesson checkpoints</h2><p>Use commands that are safe to run from the project folder.</p></div><button type="button" class="button secondary" id="add-checkpoint">+ Add checkpoint</button></div><div id="checkpoint-list">${checkpointTemplate(0, { title: 'Run the starter tests', command: 'npm test', hint: 'The test runner starts and shows the current failures' })}${checkpointTemplate(1, { title: 'Verify the fix', command: 'npm test', hint: 'All tests pass' })}</div></div>
      <aside class="privacy-note">${icon('lock')}<div><strong>Share the command, not the project.</strong><p>Learners run commands locally. Only their selected status, output, and optional note enter the lesson record.</p></div></aside>
      <div id="form-error" class="form-error" role="alert"></div>
      <button class="button primary submit-button" type="submit">Create lesson ${icon('run')}</button>
    </form>`, { compact: true });

  const list = document.querySelector<HTMLDivElement>('#checkpoint-list');
  const add = document.querySelector<HTMLButtonElement>('#add-checkpoint');
  const form = document.querySelector<HTMLFormElement>('#lesson-form');
  if (!list || !add || !form) return;
  finishRoute('Add commands or tests for a learner to run and share during a remote programming lesson.', '/new');
  const renumber = () => {
    [...list.querySelectorAll<HTMLElement>('[data-checkpoint]')].forEach((item, index) => {
      const legend = item.querySelector('legend');
      const remove = item.querySelector<HTMLButtonElement>('.remove-checkpoint');
      if (legend) legend.innerHTML = `<span class="step-number">${index + 1}</span> Checkpoint ${index + 1}`;
      if (remove) remove.setAttribute('aria-label', `Remove checkpoint ${index + 1}`);
    });
  };
  add.addEventListener('click', () => {
    const count = list.querySelectorAll('[data-checkpoint]').length;
    if (count >= 12) return announce('A lesson can have up to 12 checkpoints.');
    list.insertAdjacentHTML('beforeend', checkpointTemplate(count));
    list.querySelectorAll<HTMLInputElement>('input')[list.querySelectorAll('input').length - 3]?.focus();
  });
  list.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.remove-checkpoint');
    if (!target) return;
    if (list.querySelectorAll('[data-checkpoint]').length === 1) return announce('Keep at least one checkpoint.');
    target.closest('[data-checkpoint]')?.remove();
    renumber();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const error = document.querySelector<HTMLDivElement>('#form-error');
    const data = new FormData(form);
    const titles = data.getAll('checkpoint-title');
    const commands = data.getAll('checkpoint-command');
    const hints = data.getAll('checkpoint-hint');
    button?.setAttribute('aria-busy', 'true');
    if (button) button.disabled = true;
    if (error) error.textContent = '';
    try {
      const created = await api<{ id: string; shareCode: string; tutorToken: string }>('/api/lessons', {
        method: 'POST', body: JSON.stringify({
          title: data.get('title'), learnerName: data.get('learnerName'),
          checkpoints: titles.map((title, index) => ({ title, command: commands[index], successHint: hints[index] })),
        }),
      });
      localStorage.setItem(`clc:tutor:${created.id}`, created.tutorToken);
      const archive = JSON.parse(localStorage.getItem('clc:archive') ?? '[]') as ArchivedLesson[];
      archive.unshift({ id: created.id, title: String(data.get('title')), learnerName: String(data.get('learnerName') ?? ''), shareCode: created.shareCode, tutorToken: created.tutorToken, createdAt: new Date().toISOString() });
      localStorage.setItem('clc:archive', JSON.stringify(archive.slice(0, 100)));
      location.assign(`/lesson/${created.id}?t=${encodeURIComponent(created.tutorToken)}&created=1`);
    } catch (cause) {
      if (error) error.textContent = cause instanceof Error ? cause.message : 'The lesson could not be created.';
      button?.removeAttribute('aria-busy');
      if (button) button.disabled = false;
    }
  });
}

function join(): void {
  document.title = 'Join a lesson — Code Lesson Checkpoints';
  app.innerHTML = shell(`
    <section class="join-sheet paper-layer">
      <p class="eyebrow"><span></span>Learner access</p><h1>Open your<br>code lesson.</h1><p>Your tutor’s six-character code opens the checkpoints. You decide what output to share.</p>
      <form id="join-form"><label for="share-code">Lesson code</label><div class="code-entry"><input id="share-code" name="code" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="7" required aria-describedby="code-help" placeholder="ABC123"><button class="button primary" type="submit">Open lesson ${icon('run')}</button></div><p id="code-help" class="field-help">Letters and numbers only. Dashes and spaces are ignored.</p><p id="join-error" class="form-error" role="alert"></p></form>
      <p><a class="button secondary" href="/downloads/code-lesson-checkpoints-0.1.0.vsix" download>Install the VS Code companion</a></p>
      <div class="join-privacy">${icon('lock')} <span><strong>You stay in control.</strong> Checkpoints cannot see your files, terminal, or screen. Only the results you submit are shared.</span></div>
    </section>`, { compact: true, current: 'join' });
  const form = document.querySelector<HTMLFormElement>('#join-form');
  const input = document.querySelector<HTMLInputElement>('#share-code');
  input?.addEventListener('input', () => { input.value = normalizeShareCode(input.value); });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = normalizeShareCode(input?.value ?? '');
    if (code.length !== 6) {
      const error = document.querySelector<HTMLParagraphElement>('#join-error');
      if (error) error.textContent = 'Enter all six characters from your tutor.';
      return;
    }
    location.assign(`/join/${code}`);
  });
  finishRoute('Enter a six-character lesson code to open checkpoints from your tutor.', '/join');
}

function statusFor(checkpoint: Checkpoint): 'passed' | 'blocked' | 'waiting' {
  return checkpoint.submissions[0]?.status ?? 'waiting';
}

function statusLabel(status: 'passed' | 'blocked' | 'waiting'): string {
  if (status === 'passed') return `${icon('check')} Passed`;
  if (status === 'blocked') return `${icon('block')} Blocked`;
  return '<span class="waiting-dot" aria-hidden="true"></span> Not run';
}

function submissionMarkup(submission: Submission, role: 'tutor' | 'learner'): string {
  return `<article class="attempt">
    <div class="attempt-meta"><span class="status ${submission.status}">${statusLabel(submission.status)}</span><time datetime="${escapeHtml(submission.createdAt)}">${formatDate(submission.createdAt)}</time></div>
    ${submission.output ? `<div><h3>Selected output</h3><pre><code>${escapeHtml(submission.output)}</code></pre></div>` : '<p class="muted">No terminal output was included.</p>'}
    ${submission.note ? `<div><h3>Learner note</h3><p class="learner-note">${escapeHtml(submission.note)}</p></div>` : ''}
    ${submission.teacherReply ? `<div class="teacher-reply">${icon('reply')}<div><h3>Tutor reply</h3><p>${escapeHtml(submission.teacherReply)}</p></div></div>` : role === 'tutor' ? `<form class="reply-form" data-submission="${escapeHtml(submission.id)}"><label>Reply to this attempt <textarea name="reply" maxlength="2000" required placeholder="Point to the next thing to inspect—without giving away the keyboard."></textarea></label><button class="button small secondary" type="submit">Send reply ${icon('reply')}</button><span class="inline-error" role="alert"></span></form>` : '<p class="muted reply-waiting">Tutor reply pending.</p>'}
  </article>`;
}

function checkpointMarkup(checkpoint: Checkpoint, role: 'tutor' | 'learner'): string {
  const latestStatus = statusFor(checkpoint);
  return `<li class="checkpoint ${latestStatus}" id="checkpoint-${escapeHtml(checkpoint.id)}">
    <span class="path-node" aria-hidden="true">${checkpoint.position}</span>
    <div class="checkpoint-paper">
      <div class="checkpoint-head"><div><p class="checkpoint-count">Checkpoint ${checkpoint.position}</p><h2>${escapeHtml(checkpoint.title)}</h2></div><span class="status ${latestStatus}">${statusLabel(latestStatus)}</span></div>
      <div class="command-row"><code>${escapeHtml(checkpoint.command)}</code><button class="icon-button copy-command" type="button" data-copy="${escapeHtml(checkpoint.command)}" aria-label="Copy command for ${escapeHtml(checkpoint.title)}">${icon('copy')}</button></div>
      ${checkpoint.successHint ? `<p class="success-hint"><strong>Success looks like:</strong> ${escapeHtml(checkpoint.successHint)}</p>` : ''}
      ${role === 'learner' ? `<button class="button ${latestStatus === 'waiting' ? 'primary' : 'secondary'} share-evidence" data-checkpoint="${escapeHtml(checkpoint.id)}" data-title="${escapeHtml(checkpoint.title)}" type="button">${latestStatus === 'waiting' ? 'Share a run' : 'Share another run'} ${icon('run')}</button>` : ''}
      ${checkpoint.submissions.length ? `<details class="attempts" ${latestStatus === 'blocked' ? 'open' : ''}><summary>${checkpoint.submissions.length} ${checkpoint.submissions.length === 1 ? 'attempt' : 'attempts'} <span>View evidence</span></summary>${checkpoint.submissions.map((submission) => submissionMarkup(submission, role)).join('')}</details>` : `<div class="empty-attempt"><p>${role === 'tutor' ? 'Waiting for the learner to run this checkpoint.' : 'No run shared yet. Copy the command, run it locally, then share only what helps.'}</p></div>`}
    </div>
  </li>`;
}

function evidenceDialogs(checkpoints: Checkpoint[]): string {
  return checkpoints.map((checkpoint) => `<dialog class="evidence-dialog" id="evidence-${escapeHtml(checkpoint.id)}" aria-labelledby="evidence-title-${escapeHtml(checkpoint.id)}">
    <form method="dialog"><button class="dialog-close icon-button" value="cancel" aria-label="Close evidence form">×</button></form>
    <form class="evidence-form" data-checkpoint="${escapeHtml(checkpoint.id)}">
      <p class="eyebrow"><span></span>Checkpoint ${checkpoint.position}</p><h2 id="evidence-title-${escapeHtml(checkpoint.id)}">Share your run</h2><p class="dialog-intro">Paste only the terminal lines your tutor needs. Common secrets are hidden locally before sharing.</p>
      <fieldset><legend>What happened?</legend><div class="choice-row"><label><input type="radio" name="status" value="passed" required><span>${icon('check')} Passed</span></label><label><input type="radio" name="status" value="blocked" required><span>${icon('block')} Blocked</span></label></div></fieldset>
      <label>Selected terminal output <span class="optional">Optional · max 8,000 characters</span><textarea class="output-input" name="output" maxlength="12000" rows="7" spellcheck="false" placeholder="Paste the useful lines—not the whole session."></textarea></label>
      <div class="redaction-preview" aria-live="polite">Nothing pasted. No output will be shared.</div>
      <label>What do you think is happening? <span class="optional">Optional</span><textarea name="note" maxlength="1000" rows="3" placeholder="I expected… but I noticed…"></textarea></label>
      <label class="consent"><input type="checkbox" name="consented" required><span>I reviewed these results and agree to share them with my tutor. No source files are attached.</span></label>
      <p class="inline-error" role="alert"></p><button class="button primary" type="submit">Share this run ${icon('run')}</button>
    </form>
  </dialog>`).join('');
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

async function lessonPage(role: 'tutor' | 'learner', key: string): Promise<void> {
  const tokenParam = new URLSearchParams(location.search).get('t');
  if (role === 'tutor' && tokenParam) {
    localStorage.setItem(`clc:tutor:${key}`, tokenParam);
    history.replaceState({}, '', location.pathname + (new URLSearchParams(location.search).has('created') ? '?created=1' : ''));
  }
  const token = role === 'tutor' ? localStorage.getItem(`clc:tutor:${key}`) : null;
  document.title = 'Loading lesson — Code Lesson Checkpoints';
  app.innerHTML = shell('<section class="loading-state" aria-live="polite"><div class="paper-spinner"></div><h1>Opening the lesson…</h1><p>Loading only the shared checkpoint record.</p></section>');
  try {
    const lesson = await api<Lesson>(role === 'tutor' ? `/api/tutor/lessons/${encodeURIComponent(key)}` : `/api/lessons/code/${encodeURIComponent(key)}`, role === 'tutor' ? { headers: { Authorization: `Bearer ${token ?? ''}` } } : {});
    renderLesson(lesson, role, token);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The lesson could not be opened.';
    document.title = 'Lesson unavailable — Code Lesson Checkpoints';
    app.innerHTML = shell(`<section class="error-state paper-layer"><span class="error-mark">!</span><h1>Lesson unavailable</h1><p>${escapeHtml(message)}</p><div><button class="button primary" type="button" id="retry">Try again</button><a class="text-link" href="${role === 'tutor' ? '/new' : '/join'}">${role === 'tutor' ? 'Plan a new lesson' : 'Check another code'}</a></div></section>`);
    document.querySelector('#retry')?.addEventListener('click', () => void lessonPage(role, key));
    finishRoute('The requested lesson could not be opened. Check the private link or lesson code.');
  }
}

function renderLesson(lesson: Lesson, role: 'tutor' | 'learner', token: string | null): void {
  document.title = `${lesson.title} — Code Lesson Checkpoints`;
  const completed = lesson.checkpoints.filter((checkpoint) => statusFor(checkpoint) === 'passed').length;
  const blocked = lesson.checkpoints.find((checkpoint) => statusFor(checkpoint) === 'blocked');
  const origin = location.origin;
  const learnerUrl = `${origin}/join/${lesson.shareCode}`;
  const created = new URLSearchParams(location.search).has('created');
  app.innerHTML = shell(`
    <section class="lesson-header">
      <div><p class="eyebrow"><span></span>${role === 'tutor' ? 'Tutor view · private link' : 'Learner view · shared record'}</p><h1>${escapeHtml(lesson.title)}</h1><p>${lesson.learnerName ? `${escapeHtml(lesson.learnerName)}’s lesson` : 'Pair lesson'} · ${lesson.checkpoints.length} checkpoints</p></div>
      <div class="lesson-actions">${role === 'tutor' ? `<button class="button secondary" id="export-lesson" type="button">Export record</button><button class="button secondary" type="button" data-copy="${escapeHtml(learnerUrl)}">${icon('copy')} Copy learner link</button>` : ''}<button class="icon-button refresh" id="refresh" type="button" aria-label="Refresh lesson" title="Refresh lesson">↻</button></div>
    </section>
    ${created && role === 'tutor' ? `<section class="share-strip" aria-label="Lesson created"><div>${icon('check')}<p><strong>Your lesson is ready.</strong><br>Give the learner this code or copy their link.</p></div><code>${escapeHtml(lesson.shareCode)}</code><button class="button paper-button" type="button" data-copy="${escapeHtml(learnerUrl)}">Copy link ${icon('copy')}</button></section>` : ''}
    <div class="lesson-layout">
      <aside class="lesson-rail">
        <div class="progress-ring" aria-label="${completed} of ${lesson.checkpoints.length} checkpoints passed"><strong>${completed}/${lesson.checkpoints.length}</strong><span>passed</span></div>
        <div><h2>Lesson status</h2>${blocked ? `<p class="pulse-blocked">${icon('block')} First block at checkpoint ${blocked.position}</p><a href="#checkpoint-${escapeHtml(blocked.id)}">Open the blocked checkpoint →</a>` : completed === lesson.checkpoints.length ? `<p class="pulse-passed">${icon('check')} All checkpoints passed</p>` : '<p>Waiting for the next learner update.</p>'}</div>
        <dl><div><dt>Lesson code</dt><dd>${escapeHtml(lesson.shareCode)}</dd></div><div><dt>Privacy</dt><dd>${icon('lock')} Selected evidence only</dd></div></dl>
        ${role === 'tutor' ? `<button class="danger-link" id="delete-lesson" type="button">Delete this lesson and its results</button>` : '<p class="rail-note">Need a new checkpoint? Ask your tutor. Learners cannot change the lesson.</p>'}
      </aside>
      <section class="timeline" aria-labelledby="timeline-title"><div class="timeline-intro"><h2 id="timeline-title">Checkpoint attempts</h2><p>${role === 'tutor' ? 'Newest results appear inside each checkpoint.' : 'Run each command in your own terminal. Share when you choose.'}</p></div><ol>${lesson.checkpoints.map((checkpoint) => checkpointMarkup(checkpoint, role)).join('')}</ol></section>
    </div>
    ${role === 'learner' ? evidenceDialogs(lesson.checkpoints) : ''}
    ${role === 'tutor' ? `<dialog id="delete-dialog" class="confirm-dialog" aria-labelledby="delete-title"><form method="dialog"><button class="dialog-close icon-button" value="cancel" aria-label="Close delete confirmation">×</button></form><h2 id="delete-title">Delete “${escapeHtml(lesson.title)}”?</h2><p>This permanently removes every checkpoint, run, note, and reply. Type <strong>DELETE</strong> to confirm.</p><form id="delete-form"><label>Confirmation <input name="confirmation" autocomplete="off" required pattern="DELETE"></label><p class="inline-error" role="alert"></p><button class="button danger" type="submit">Delete lesson permanently</button></form></dialog>` : ''}`);

  bindLessonEvents(lesson, role, token);
  if (created) announce('Lesson created. Your private tutor link is saved on this device.');
  finishRoute(`${role === 'tutor' ? 'Review' : 'Run'} the checkpoints for ${lesson.title}.`);
}

function storedDemo(): DemoWorkspace | null {
  try {
    const workspace = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? 'null') as DemoWorkspace | null;
    if (!workspace?.workspaceId || !workspace.lesson || workspace.expiresAt * 1000 <= Date.now()) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      return null;
    }
    return workspace;
  } catch {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    return null;
  }
}

async function discardDemo(workspaceId: string): Promise<void> {
  await fetch(`/api/demo/workspaces/${encodeURIComponent(workspaceId)}`, { method: 'DELETE' }).catch(() => undefined);
}

async function demoPage(forceFresh = false): Promise<void> {
  document.title = 'Demo — Code Lesson Checkpoints';
  if (forceFresh) localStorage.removeItem(DEMO_STORAGE_KEY);
  const cached = storedDemo();
  if (cached) {
    renderDemo(cached);
    return;
  }
  app.innerHTML = shell('<section class="loading-state" aria-live="polite"><div class="paper-spinner"></div><h1>Loading the sample lesson…</h1><p>Creating an isolated workspace that expires in 24 hours.</p></section>', { current: 'demo', demo: true });
  try {
    const workspace = await api<DemoWorkspace>('/api/demo/workspaces', { method: 'POST', body: '{}' });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(workspace));
    renderDemo(workspace);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The sample lesson could not be loaded.';
    app.innerHTML = shell(`<section class="error-state paper-layer"><span class="error-mark">!</span><h1>The sample did not load.</h1><p>${escapeHtml(message)}</p><button class="button primary" type="button" id="retry-demo">Try the sample again</button></section>`, { current: 'demo', demo: true });
    document.querySelector('#retry-demo')?.addEventListener('click', () => void demoPage(true));
    bindDemoBanner({ workspaceId: '', expiresAt: 0, lesson: {} as Lesson });
    finishRoute('The temporary sample lesson could not be loaded. Try again when the connection is available.', '/demo');
  }
}

function renderDemo(workspace: DemoWorkspace): void {
  const { lesson } = workspace;
  const completed = lesson.checkpoints.filter((checkpoint) => statusFor(checkpoint) === 'passed').length;
  const blocked = lesson.checkpoints.find((checkpoint) => statusFor(checkpoint) === 'blocked');
  app.innerHTML = shell(`
    <section class="lesson-header demo-intro">
      <div><p class="eyebrow"><span></span>Tutor view · realistic sample</p><h1>Find the first blocked checkpoint.</h1><p>${escapeHtml(lesson.learnerName)} is debugging a weather API. The sample already contains runs, notes, and a tutor reply.</p></div>
      <div class="lesson-actions"><button class="button secondary" id="demo-export" type="button">Export sample record</button></div>
    </section>
    <div class="lesson-layout demo-layout">
      <aside class="lesson-rail">
        <div class="progress-ring" aria-label="${completed} of ${lesson.checkpoints.length} checkpoints passed"><strong>${completed}/${lesson.checkpoints.length}</strong><span>passed</span></div>
        <div><h2>Lesson status</h2>${blocked ? `<p class="pulse-blocked">${icon('block')} First block at checkpoint ${blocked.position}</p><a href="#checkpoint-${escapeHtml(blocked.id)}">Open the blocked checkpoint →</a>` : '<p>Waiting for a learner update.</p>'}</div>
        <dl><div><dt>Lesson code</dt><dd>${escapeHtml(lesson.shareCode)}</dd></div><div><dt>Privacy</dt><dd>${icon('lock')} Selected evidence only</dd></div></dl>
        <p class="rail-note">This 24-hour workspace is separate from real lessons. Resetting removes its local sample copy.</p>
      </aside>
      <section class="timeline" aria-labelledby="demo-timeline-title"><div class="timeline-intro"><h2 id="demo-timeline-title">Checkpoint attempts</h2><p>Open each attempt to see the chosen output, note, and reply.</p></div><ol>${lesson.checkpoints.map((checkpoint) => checkpointMarkup(checkpoint, 'tutor')).join('')}</ol></section>
    </div>
    <section class="demo-redaction" aria-labelledby="demo-redaction-title">
      <div><p class="eyebrow"><span></span>Safe practice area</p><h2 id="demo-redaction-title">Preview output redaction.</h2><p>Paste test output here. The browser hides common credentials and trims shared output to 8,000 characters.</p></div>
      <div><label for="demo-output">Sample terminal output<textarea id="demo-output" rows="5" spellcheck="false" placeholder="API_KEY=sample-secret"></textarea></label><p id="demo-redaction-status" role="status">Nothing entered. This preview stays in the demo.</p><pre id="demo-redacted" hidden><code></code></pre></div>
    </section>`, { current: 'demo', demo: true });

  bindDemoBanner(workspace);
  document.querySelector<HTMLButtonElement>('#demo-export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample-code-lesson-checkpoints.json';
    link.click();
    URL.revokeObjectURL(link.href);
    announce('Sample record exported as JSON.');
  });
  const output = document.querySelector<HTMLTextAreaElement>('#demo-output');
  const status = document.querySelector<HTMLElement>('#demo-redaction-status');
  const preview = document.querySelector<HTMLElement>('#demo-redacted');
  const code = preview?.querySelector('code');
  output?.addEventListener('input', () => {
    const redacted = redactOutput(output.value);
    if (code) code.textContent = redacted.text;
    if (preview) preview.hidden = output.value.length === 0;
    if (status) status.textContent = output.value.length === 0
      ? 'Nothing entered. This preview stays in the demo.'
      : `${redacted.redactions} possible ${redacted.redactions === 1 ? 'secret' : 'secrets'} hidden.${redacted.trimmed ? ' Output trimmed to 8,000 characters.' : ''}`;
  });
  finishRoute('Explore Sam’s temporary three-checkpoint lesson with passed, blocked, and replied attempts.', '/demo');
}

function bindDemoBanner(workspace: DemoWorkspace): void {
  const reset = document.querySelector<HTMLButtonElement>('#reset-demo');
  reset?.addEventListener('click', async () => {
    reset.disabled = true;
    reset.setAttribute('aria-busy', 'true');
    if (workspace.workspaceId) await discardDemo(workspace.workspaceId);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    await demoPage(true);
    announce('Demo reset with a fresh sample workspace.');
  });
  document.querySelector<HTMLButtonElement>('#start-real')?.addEventListener('click', () => {
    if (workspace.workspaceId) void discardDemo(workspace.workspaceId);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    navigate('/new');
  });
}

function bindLessonEvents(lesson: Lesson, role: 'tutor' | 'learner', token: string | null): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy ?? ''); announce('Copied to clipboard.'); }
    catch { announce('Clipboard access was blocked. Select and copy the text instead.'); }
  }));
  document.querySelector('#refresh')?.addEventListener('click', () => void lessonPage(role, role === 'tutor' ? lesson.id : lesson.shareCode));
  document.querySelector('#export-lesson')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'lesson'}-checkpoints.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    announce('Lesson record exported as JSON.');
  });
  document.querySelectorAll<HTMLButtonElement>('.share-evidence').forEach((button) => button.addEventListener('click', () => {
    document.querySelector<HTMLDialogElement>(`#evidence-${CSS.escape(button.dataset.checkpoint ?? '')}`)?.showModal();
  }));
  document.querySelectorAll<HTMLTextAreaElement>('.output-input').forEach((input) => input.addEventListener('input', () => {
    const result = redactOutput(input.value);
    const preview = input.closest('form')?.querySelector<HTMLDivElement>('.redaction-preview');
    if (!preview) return;
    preview.innerHTML = input.value ? `${icon('lock')} <strong>Local privacy check:</strong> ${result.redactions ? `${result.redactions} possible ${result.redactions === 1 ? 'secret' : 'secrets'} hidden.` : 'No common secrets found.'}${result.trimmed ? ' Output will be trimmed.' : ''}` : 'Nothing pasted. No output will be shared.';
  }));
  document.querySelectorAll<HTMLFormElement>('.evidence-form').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const output = redactOutput(String(data.get('output') ?? '')).text;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const error = form.querySelector<HTMLElement>('.inline-error');
    if (button) button.disabled = true;
    try {
      await api(`/api/lessons/code/${encodeURIComponent(lesson.shareCode)}/checkpoints/${encodeURIComponent(form.dataset.checkpoint ?? '')}/submissions`, { method: 'POST', body: JSON.stringify({ status: data.get('status'), output, note: data.get('note'), consented: data.get('consented') === 'on' }) });
      form.closest<HTMLDialogElement>('dialog')?.close();
      announce('Run shared with your tutor.');
      await lessonPage('learner', lesson.shareCode);
    } catch (cause) {
      if (error) error.textContent = cause instanceof Error ? cause.message : 'The run could not be shared.';
      if (button) button.disabled = false;
    }
  }));
  document.querySelectorAll<HTMLFormElement>('.reply-form').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const error = form.querySelector<HTMLElement>('.inline-error');
    if (button) button.disabled = true;
    try {
      const data = new FormData(form);
      await api(`/api/tutor/submissions/${encodeURIComponent(form.dataset.submission ?? '')}/reply`, { method: 'PUT', headers: { Authorization: `Bearer ${token ?? ''}` }, body: JSON.stringify({ reply: data.get('reply') }) });
      announce('Reply added to the learner’s attempt.');
      await lessonPage('tutor', lesson.id);
    } catch (cause) {
      if (error) error.textContent = cause instanceof Error ? cause.message : 'The reply could not be saved.';
      if (button) button.disabled = false;
    }
  }));
  const deleteDialog = document.querySelector<HTMLDialogElement>('#delete-dialog');
  document.querySelector('#delete-lesson')?.addEventListener('click', () => deleteDialog?.showModal());
  document.querySelector<HTMLFormElement>('#delete-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const error = form.querySelector<HTMLElement>('.inline-error');
    if (data.get('confirmation') !== 'DELETE') { if (error) error.textContent = 'Type DELETE exactly to confirm.'; return; }
    try {
      await api(`/api/tutor/lessons/${encodeURIComponent(lesson.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token ?? ''}` } });
      localStorage.removeItem(`clc:tutor:${lesson.id}`);
      const archive = (JSON.parse(localStorage.getItem('clc:archive') ?? '[]') as ArchivedLesson[]).filter((item) => item.id !== lesson.id);
      localStorage.setItem('clc:archive', JSON.stringify(archive));
      location.assign('/?deleted=1');
    } catch (cause) { if (error) error.textContent = cause instanceof Error ? cause.message : 'The lesson could not be deleted.'; }
  });
}

type LicenseVerdict = { valid: boolean; reason: string; expires_at?: string };
type LicenseCache = { token: string; at: number; verdict: LicenseVerdict };

function readLicense(): string | null {
  return localStorage.getItem(`sb_license:${PRODUCT_SLUG}`);
}

async function verifyLicense(token: string, force = false): Promise<LicenseVerdict> {
  const cacheKey = `sb_license_verdict:${PRODUCT_SLUG}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null') as LicenseCache | null;
  if (!force && cached?.token === token && Date.now() - cached.at < 86_400_000) return cached.verdict;
  const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License verification is temporarily unavailable. Your free lesson tools still work.');
  const verdict = await response.json() as LicenseVerdict;
  localStorage.setItem(cacheKey, JSON.stringify({ token, at: Date.now(), verdict }));
  return verdict;
}

async function pricing(): Promise<void> {
  document.title = 'Team plan — Code Lesson Checkpoints';
  const token = readLicense();
  const cached = JSON.parse(localStorage.getItem(`sb_license_verdict:${PRODUCT_SLUG}`) ?? 'null') as LicenseCache | null;
  const optimistic = Boolean(token && cached?.token === token && cached.verdict.valid);
  app.innerHTML = shell(`
    <section class="pricing-intro"><p class="eyebrow"><span></span>Free lessons or a local archive</p><h1>Plan lessons for free.<br>Keep links together.</h1><p>Lesson planning and sharing are free. Team archive is a one-time purchase for searching tutor links saved on this device.</p></section>
    <section class="price-grid" aria-label="Plans">
      <article class="price-sheet"><p class="plan-name">Pair</p><h2>Free</h2><p class="price-note">No purchase required</p><ul><li>${icon('check')} Plan and share lessons</li><li>${icon('check')} Copy commands and reply to attempts</li><li>${icon('check')} Export and delete lesson records</li><li>${icon('check')} Hide common keys before sharing</li></ul><a class="button secondary" href="/new">Plan a free lesson</a></article>
      <article class="price-sheet featured"><div class="paper-tab">One-time purchase</div><p class="plan-name">Team archive</p><h2>$39 <small>once</small></h2><p class="price-note">For one tutor</p><ul><li>${icon('check')} Everything in Pair</li><li>${icon('check')} Search by learner or lesson</li><li>${icon('check')} Reopen tutor links saved on this device</li><li>${icon('check')} No recurring fee</li></ul>${optimistic ? '<a class="button primary" href="/team">Open Team archive</a>' : `<a class="button primary" href="${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout">Buy Team archive ${icon('run')}</a>`}<p class="merchant-note">Sociobot/Dodo is the merchant of record. Its hosted checkout handles payment and refunds.</p></article>
    </section>
    <section class="restore-sheet"><div><h2>${optimistic ? 'Team archive is unlocked' : 'Already purchased?'}</h2><p>${optimistic ? 'This browser has an active cached license. We’ll quietly recheck it in the background.' : 'Paste your license to restore Team archive on this device.'}</p></div><form id="license-form"><label for="license">License token</label><div><input id="license" name="license" autocomplete="off" required value="${escapeHtml(token ?? '')}" placeholder="Paste license token"><button class="button secondary" type="submit">Verify license</button></div><p id="license-status" role="status" aria-live="polite"></p></form></section>
    <p class="legal-callout">Buying means you agree to the <a href="/terms">terms</a>. See how license and lesson data are handled in our <a href="/privacy">privacy notice</a>.</p>`, { current: 'pricing' });
  const form = document.querySelector<HTMLFormElement>('#license-form');
  finishRoute('Compare free lesson tools with the $39 local Team archive.', '/pricing');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const license = String(data.get('license') ?? '').trim();
    const status = document.querySelector<HTMLElement>('#license-status');
    if (status) status.textContent = 'Checking license…';
    try {
      const verdict = await verifyLicense(license, true);
      if (verdict.valid) {
        localStorage.setItem(`sb_license:${PRODUCT_SLUG}`, license);
        // Redraw now rather than asking the tutor to reload before the
        // returned/entered license changes the available action.
        void pricing();
      } else {
        localStorage.removeItem(`sb_license:${PRODUCT_SLUG}`);
        localStorage.removeItem(`sb_license_verdict:${PRODUCT_SLUG}`);
        if (status) status.textContent = `License no longer active (${verdict.reason.replace('_', ' ')}). You can continue using the free Pair plan.`;
      }
    } catch (cause) { if (status) status.textContent = cause instanceof Error ? cause.message : 'The license could not be checked.'; }
  });
  if (token) void verifyLicense(token).then((verdict) => {
    const status = document.querySelector<HTMLElement>('#license-status');
    if (!verdict.valid) {
      localStorage.removeItem(`sb_license:${PRODUCT_SLUG}`);
      localStorage.removeItem(`sb_license_verdict:${PRODUCT_SLUG}`);
      if (status) status.textContent = `License no longer active (${verdict.reason.replace('_', ' ')}). Free lesson tools remain available.`;
    } else if (!optimistic) {
      // A checkout return stores its token before the first render, but has no
      // cached verdict yet. Render again as soon as that first verification
      // succeeds so the archive unlock is visible without a manual reload.
      void pricing();
    }
  }).catch(() => undefined);
}

function teamArchive(): void {
  document.title = 'Team archive — Code Lesson Checkpoints';
  const token = readLicense();
  const cached = JSON.parse(localStorage.getItem(`sb_license_verdict:${PRODUCT_SLUG}`) ?? 'null') as LicenseCache | null;
  if (!token || cached?.token !== token || !cached.verdict.valid) {
    app.innerHTML = shell(`<section class="error-state paper-layer"><span class="error-mark">${icon('lock')}</span><h1>Team archive is locked.</h1><p>The free Pair workflow is ready whenever you need it. A one-time Team archive license adds a searchable roster and keeps private lesson links together on this device.</p><a class="button primary" href="/pricing">See Team archive</a></section>`, { current: 'team' });
    finishRoute('Restore or buy a Team archive license to search tutor links saved on this device.', '/team');
    return;
  }
  const archive = JSON.parse(localStorage.getItem('clc:archive') ?? '[]') as ArchivedLesson[];
  const rows = archive.length ? archive.map((item) => `<li class="archive-row" data-search="${escapeHtml(`${item.learnerName} ${item.title}`.toLowerCase())}"><div><p>${escapeHtml(item.learnerName || 'Learner')}</p><h2>${escapeHtml(item.title)}</h2><span>Created ${formatDate(item.createdAt)} · code ${escapeHtml(item.shareCode)}</span></div><a class="button secondary" href="/lesson/${encodeURIComponent(item.id)}?t=${encodeURIComponent(item.tutorToken)}">Open record</a></li>`).join('') : '<li class="archive-empty"><h2>No saved lessons yet.</h2><p>Create a lesson and its private tutor link will appear here on this device.</p><a class="button primary" href="/new">Plan a lesson</a></li>';
  app.innerHTML = shell(`<section class="archive-head"><p class="eyebrow"><span></span>Team archive · unlocked</p><h1>Your teaching roster.</h1><p>Private lesson links saved in this browser, organized around the learner—not around screen recordings.</p><label for="roster-search">Filter by learner or lesson <input id="roster-search" type="search" placeholder="Search roster"></label></section><section aria-labelledby="archive-list-title"><h2 class="visually-hidden" id="archive-list-title">Saved lesson records</h2><ul class="archive-list">${rows}</ul></section><p class="archive-privacy">${icon('lock')} Archive links stay in this browser. Clearing site data removes this local index, but does not delete relay records; delete each lesson from its tutor view.</p>`, { current: 'team' });
  document.querySelector<HTMLInputElement>('#roster-search')?.addEventListener('input', (event) => {
    const value = (event.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>('.archive-row').forEach((row) => { row.hidden = !row.dataset.search?.includes(value); });
  });
  finishRoute('Search and reopen private tutor links saved on this device.', '/team');
  void verifyLicense(token).then((verdict) => { if (!verdict.valid) { localStorage.removeItem(`sb_license:${PRODUCT_SLUG}`); localStorage.removeItem(`sb_license_verdict:${PRODUCT_SLUG}`); teamArchive(); } }).catch(() => undefined);
}

function legal(kind: 'privacy' | 'terms'): void {
  const isPrivacy = kind === 'privacy';
  document.title = `${isPrivacy ? 'Privacy' : 'Terms'} — Code Lesson Checkpoints`;
  const content = isPrivacy ? `
    <p class="updated">Effective August 28, 2026</p><h1>Privacy, in plain language.</h1><p class="legal-lede">The product exists to share less than a screen recording—not to create a new surveillance stream.</p>
    <h2>What the relay stores</h2><p>For a lesson, the relay stores its title, optional learner name, checkpoint commands, selected command output, learner notes, tutor replies, status, and timestamps. It does not request or upload project source files. Common secret patterns are redacted in your browser and again on the server, but you should still review output before submitting.</p>
    <h2>Access and retention</h2><p>A random private link controls tutor access. A six-character code lets the learner open that lesson. Treat both as private. The tutor can permanently delete the lesson and all shared results at any time.</p>
    <h2>Local device data</h2><p>Your browser stores private tutor links and, if purchased, the Sociobot license token and a daily verification result. The sample demo uses a separate browser key that Reset demo or Start for real removes. Clear site data to remove all local records from that device.</p>
    <h2>Payments and measurement</h2><p>Sociobot/Dodo is the merchant of record and handles checkout. This app does not receive payment card details. No advertising trackers or third-party analytics run here.</p>
    <h2>Your choices</h2><p>Do not enter sensitive personal information into lesson titles, notes, or output. Tutors can delete a lesson from its private view. For access or deletion help when the private link is lost, contact the site operator through the project repository.</p>` : `
    <p class="updated">Effective August 28, 2026</p><h1>Terms for a clear lesson record.</h1><p class="legal-lede">Use Code Lesson Checkpoints as a consent-based teaching aid, not an automated judge or monitoring tool.</p>
    <h2>Acceptable use</h2><p>You may add lesson checkpoints and share selected run results with people who agreed to participate. Do not collect secrets, harass learners, conceal monitoring, run malicious commands, or violate school, workplace, or local policies.</p>
    <h2>Your responsibilities</h2><p>Tutors are responsible for choosing safe commands and protecting private tutor links. Learners are responsible for reviewing selected output before sharing. Both parties are responsible for having an appropriate legal basis to store educational records, including any institutional FERPA or GDPR requirements.</p>
    <h2>Team archive purchase</h2><p>Team archive costs $39 once for one tutor. It searches and reopens lesson links saved on that device. Sociobot/Dodo is the merchant of record. Its hosted checkout handles payment and refunds. A refund revokes the license. Accessibility, deletion, and export remain free.</p>
    <h2>Availability and warranty</h2><p>The service is provided “as is” without a promise of uninterrupted availability. It is not a source backup, grading authority, or emergency communication channel. To the extent allowed by law, liability is limited to the amount paid for the service.</p>
    <h2>Changes</h2><p>Material changes will be reflected by a new effective date. Continued use after a change means you accept the revised terms.</p>`;
  app.innerHTML = shell(`<article class="legal-page">${content}</article>`, { compact: true });
  finishRoute(isPrivacy ? 'Learn what lesson and device data this product stores and how to delete it.' : 'Read the terms for lesson records and the optional Team archive.', `/${kind}`);
}

function route(): void {
  const license = new URLSearchParams(location.search).get('license');
  if (license) {
    localStorage.setItem(`sb_license:${PRODUCT_SLUG}`, license);
    history.replaceState({}, '', location.pathname);
  }
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const demoQuery = path === '/' && new URLSearchParams(location.search).get('demo') === '1';
  const canonicalPath = demoQuery ? '/demo' : path;
  const canonicalUrl = `https://code-lesson-checkpoints.sociobot.in${canonicalPath === '/' ? '/' : canonicalPath}`;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  if (demoQuery) void demoPage();
  else if (path === '/') home();
  else if (path === '/demo') void demoPage();
  else if (path === '/new') newLesson();
  else if (path === '/join') join();
  else if (path === '/pricing') void pricing();
  else if (path === '/team') teamArchive();
  else if (path === '/privacy') legal('privacy');
  else if (path === '/terms') legal('terms');
  else if (/^\/lesson\/[^/]+$/.test(path)) void lessonPage('tutor', decodeURIComponent(path.split('/')[2]));
  else if (/^\/join\/[^/]+$/.test(path)) void lessonPage('learner', normalizeShareCode(decodeURIComponent(path.split('/')[2])));
  else {
    document.title = 'Page not found — Code Lesson Checkpoints';
    app.innerHTML = shell('<section class="error-state paper-layer"><span class="error-mark">404</span><h1>Page not found</h1><p>The page may have moved, or the address may be incomplete.</p><a class="button primary" href="/">Return home</a></section>');
    finishRoute('The requested page was not found. Return to Code Lesson Checkpoints.', path);
  }
}

function navigate(url: string): void {
  history.pushState({}, '', url);
  routeFocusRequested = true;
  route();
}

function bindConnectivity(): void {
  const banner = document.querySelector<HTMLElement>('#offline');
  const update = () => { if (banner) banner.hidden = navigator.onLine; };
  window.addEventListener('online', update, { once: true });
  window.addEventListener('offline', update, { once: true });
  update();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const target = new URL(link.href, location.href);
  if (target.origin !== location.origin || (target.pathname === location.pathname && target.search === location.search && target.hash)) return;
  event.preventDefault();
  navigate(`${target.pathname}${target.search}${target.hash}`);
});
document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.querySelector<HTMLElement>('#main');
  main?.focus();
  main?.scrollIntoView();
});
window.addEventListener('popstate', () => {
  routeFocusRequested = true;
  route();
});
route();
