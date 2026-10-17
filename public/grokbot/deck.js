import { mascotSvg } from './mascots.js';

const presentation = document.querySelector('#presentation');
const stage = document.querySelector('#stage');
const ribbon = document.querySelector('#ribbon');
const slides = [...document.querySelectorAll('.slide')];
const agents = [...document.querySelectorAll('.agent')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const overview = document.querySelector('#overview');
const blackout = document.querySelector('#blackout');
const announcer = document.querySelector('#announcer');
const slideNames = ['grok bot meetup', 'some use cases', 'job finder', 'researcher', 'gork', 'creating a new bot', 'demo 1 — huber', 'demo 5 — stupid ideas hackathon', 'demo 6 — instagram reels', 'demo 7 — placeholder', 'thank you'];
let index = 0;
let revealed = false;
let controlTimer;
let pointerStart;

// Matching rings around the opening and closing slides, with an open centre.
const perimeterAgents = [
  ['pebble', '#FF6700', 170, 138, 183, -19, -1.4],
  ['hexagon', '#FF309B', 455, 78, 125, 16, -4.2],
  ['capsule', '#1084FE', 790, 100, 164, -12, -2.1],
  ['triangle', '#FFCC45', 1125, 90, 142, 14, -5.6],
  ['squircle', '#9159FE', 1430, 172, 209, 19, -3.3],
  ['circle', '#00BCA6', 1503, 424, 139, -23, -6.4],
  ['droplet', '#00C972', 1400, 722, 204, 18, -1.1],
  ['cloud', '#FF263C', 1110, 801, 154, -14, -4.7],
  ['pebble', '#F4ECDD', 768, 782, 180, 12, -2.8],
  ['hexagon', '#A3A3A3', 425, 817, 122, -18, -5.2],
  ['cloud', '#97683D', 148, 690, 209, -17, -3.9],
  ['capsule', '#FF9800', 77, 400, 143, 24, -6.8],
];
document.querySelectorAll('.cover-agents').forEach(container => container.replaceChildren(...perimeterAgents.map(([shape, colour, x, y, size, turn, delay], i) => {
  const bot = document.createElement('div');
  bot.className = 'perimeter-agent';
  bot.dataset.shape = shape;
  bot.style.cssText = `--x:${x}px;--y:${y}px;--size:${size}px;--turn:${turn}deg;--delay:${delay}s;--duration:${8 + i % 5}s;--blink-period:${5.8 + i * .39}s;--blink-phase:${delay * 1.37}s;color:${colour}`;
  bot.innerHTML = `<div class="perimeter-float">${mascotSvg(shape)}</div>`;
  return bot;
})));

slides.forEach((slide, i) => { slide.style.top = `${i * 900}px`; });

function resize() {
  stage.style.setProperty('--scale', Math.min(innerWidth / 1600, innerHeight / 900));
}

function positionCast() {
  const inCast = index >= 1 && index <= 4;
  const focus = ['job-finder', 'researcher', 'gork'][index - 2];
  agents.forEach((agent, i) => {
    let x = [355, 800, 1245][i], y = 453, z = 0, size = .94, rotate = 0, opacity = 1;
    if (!inCast) { y = index === 0 ? 1300 : -500; z = -450; size = .45; opacity = 0; }
    else if (index === 1 && !revealed) {
      x = [205, 1310, 1190][i];
      y = [465, 210, 715][i];
      size = [.94, .78, .83][i];
      z = [35, -40, 15][i];
      rotate = [-13, 14, -10][i];
    } else if (index > 1) {
      if (agent.dataset.agent === focus) { x = 1160; y = 450; z = 80; size = 1.34; rotate = -3; }
      else {
        const secondary = agents.filter(a => a.dataset.agent !== focus).indexOf(agent);
        x = secondary ? 1435 : 1370;
        y = secondary ? 700 : 165;
        z = -320; size = .32; rotate = secondary ? 15 : -12; opacity = .28;
      }
    }
    agent.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${index > 1 && agent.dataset.agent !== focus ? -18 : 0}deg) rotateZ(${rotate}deg) scale(${size})`;
    agent.style.opacity = opacity;
  });
}

function render({ updateHash = true, cut = false } = {}) {
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && slides.some((slide, i) => i !== index && slide.contains(focused))) focused.blur();
  if (cut) { ribbon.style.transition = 'none'; agents.forEach(a => a.style.transition = 'none'); }
  presentation.dataset.slide = slides[index].id;
  presentation.dataset.revealed = String(revealed || (index >= 2 && index <= 4));
  presentation.dataset.index = String(index);
  ribbon.style.transform = `translate3d(0,${-index * 900}px,0)`;
  slides.forEach((slide, i) => { slide.inert = i !== index; slide.setAttribute('aria-hidden', String(i !== index)); });
  positionCast();
  previous.disabled = index === 0;
  next.disabled = index === slides.length - 1;
  document.querySelector('#slide-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
  document.querySelector('#progress').style.width = `${index / (slides.length - 1) * 100}%`;
  announcer.textContent = `Slide ${index + 1} of ${slides.length}: ${slideNames[index]}${index === 1 && revealed ? '. Gork, job finder, researcher revealed.' : ''}`;
  document.title = `${slideNames[index]} · grok bot meetup`;
  if (updateHash) history.replaceState(null, '', `#${slides[index].id}${index === 1 && revealed ? '/revealed' : ''}`);
  document.querySelectorAll('#overview-list button').forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
  if (cut) requestAnimationFrame(() => requestAnimationFrame(() => { ribbon.style.transition = ''; agents.forEach(a => a.style.transition = ''); }));
}

function step(direction) {
  if (!blackout.hidden) { blackout.hidden = true; return; }
  if (overview.open) return;
  if (index === 1 && ((direction > 0 && !revealed) || (direction < 0 && revealed))) {
    revealed = !revealed;
  } else {
    const target = Math.max(0, Math.min(slides.length - 1, index + direction));
    if (target === index) return;
    index = target;
    revealed = index === 1 && direction < 0;
  }
  render();
}

function fromHash() {
  const [id, phase] = location.hash.slice(1).split('/');
  const target = slides.findIndex(slide => slide.id === (id === 'solitaire' ? 'instagram-reels' : id));
  if (target >= 0) { index = target; revealed = phase === 'revealed'; }
  render({ cut: true });
}

async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { announcer.textContent = 'Use F11 or the browser fullscreen command.'; }
}

function showControls() {
  document.body.classList.add('show-controls');
  clearTimeout(controlTimer);
  controlTimer = setTimeout(() => document.body.classList.remove('show-controls'), 2100);
}

function showOverview() { overview.showModal(); showControls(); }

document.querySelector('#overview-list').replaceChildren(...slides.map((slide, i) => {
  const button = document.createElement('button');
  const number = document.createElement('span');
  number.textContent = String(i + 1).padStart(2, '0');
  button.append(number, document.createTextNode(slideNames[i]));
  button.addEventListener('click', () => { index = i; revealed = false; overview.close(); render(); });
  return button;
}));

previous.addEventListener('click', () => step(-1));
next.addEventListener('click', () => step(1));
document.querySelector('#fullscreen').addEventListener('click', fullscreen);
document.querySelector('#overview-toggle').addEventListener('click', showOverview);
document.querySelector('#overview-close').addEventListener('click', () => overview.close());
overview.addEventListener('click', event => { if (event.target === overview) { const r = overview.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) overview.close(); } });

window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input,textarea,select,[contenteditable]')) return;
  if (overview.open) return;
  const forward = ['ArrowRight', 'ArrowUp', 'PageDown', ' ', 'Enter'];
  const backward = ['ArrowLeft', 'ArrowDown', 'PageUp', 'Backspace'];
  if (forward.includes(event.key) || backward.includes(event.key)) {
    if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('a,button')) return;
    event.preventDefault(); if (!event.repeat) step(forward.includes(event.key) ? 1 : -1);
  } else if (!event.repeat) {
    if (event.key.toLowerCase() === 'f') fullscreen();
    if (event.key.toLowerCase() === 'o' || event.key === 'Escape') showOverview();
    if (event.key.toLowerCase() === 'b' || event.key === '.') blackout.hidden = !blackout.hidden;
    if (event.key === 'Home') { index = 0; revealed = false; render(); }
    if (event.key === 'End') { index = slides.length - 1; revealed = false; render(); }
  }
});

const isInteractive = target => target instanceof Element && target.closest('a,button,input,textarea,select,dialog,[contenteditable]');
presentation.addEventListener('pointerdown', event => {
  pointerStart = event.isPrimary && event.button === 0 && !isInteractive(event.target)
    ? { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() } : null;
});
presentation.addEventListener('pointermove', event => {
  if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12) pointerStart = null;
});
presentation.addEventListener('pointercancel', () => { pointerStart = null; });
presentation.addEventListener('pointerup', event => {
  const start = pointerStart; pointerStart = null;
  if (start?.id === event.pointerId && performance.now() - start.time < 650 && !isInteractive(event.target)) step(1);
});
blackout.addEventListener('click', () => { blackout.hidden = true; });
window.addEventListener('pointermove', showControls);
window.addEventListener('touchstart', showControls, { passive: true });
window.addEventListener('resize', resize);
window.addEventListener('hashchange', fromHash);
resize(); fromHash();

// The penultimate slide is a separate HTML document so Grok Bot can replace it live.
// Poll only a local revision number; reloading keeps the current hash/reveal.
let knownRevision;
async function checkForChanges() {
  try {
    const response = await fetch('/__revision', { cache: 'no-store' });
    if (!response.ok) return;
    const { revision } = await response.json();
    if (knownRevision !== undefined && revision !== knownRevision) location.reload();
    knownRevision = revision;
  } catch { /* The deck keeps working if the development server is restarting. */ }
}
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  checkForChanges(); setInterval(checkForChanges, 1800);
}
