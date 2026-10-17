// Eye projection follows the surface: flat faces stay parallel; round faces wrap.
const straightEye = 'M0-11.5V11.5';
const softEye = 'M-.8-11.5Q1.5 0 .8 11.5';
const roundEye = 'M-3-11.5C3.2-8 5.5 2.5 4.2 11.5';
const farRoundEye = 'M-2-10.5C2.5-7 4.1 2.6 3.2 10.5';

const shapes = {
  circle: {
    body: 'M153.6 96A57.6 57.6 0 0 0 96 38.4A57.6 57.6 0 0 0 38.4 96A57.6 57.6 0 0 0 96 153.6A57.6 57.6 0 0 0 153.6 96Z',
    surface: 'round',
    eyeMode: 'curved',
    eyes: [[103, 79, -16, 1, 1, roundEye, 8.5], [127, 70, -12, .8, .9, farRoundEye, 8.5]],
  },
  pebble: {
    body: 'M150 66C165 90 153 127 127 147C102 166 66 159 46 135C26 112 30 81 49 59C69 36 96 30 121 40C134 45 144 55 150 66Z',
    surface: 'pebble',
    eyeMode: 'gently-curved',
    eyes: [[102, 80, -13, 1, 1, 'M-1.5-11.5C1.3-7 3.2 3 2 11.5', 8.7], [126, 73, -10, .83, .92, softEye, 8.7]],
  },
  squircle: {
    body: 'M75 35H117Q157 35 157 75V117Q157 157 117 157H75Q35 157 35 117V75Q35 35 75 35Z',
    surface: 'flat',
    eyeMode: 'straight',
    eyes: [[93, 80, 0, 1, 1, straightEye, 8.5], [119, 80, 0, 1, 1, straightEye, 8.5]],
  },
  capsule: {
    body: 'M68 50H124A46 46 0 0 1 124 142H68A46 46 0 0 1 68 50Z',
    surface: 'cylinder',
    eyeMode: 'gently-curved',
    eyes: [[97, 86, 0, 1, 1, softEye, 8.5], [123, 86, 0, 1, 1, softEye, 8.5]],
  },
  triangle: {
    body: 'M87 36Q96 21 105 36L164 141Q173 157 154 157H38Q19 157 28 141Z',
    surface: 'triangle',
    eyeMode: 'straight',
    eyes: [[83, 112, 0, 1, .93, straightEye, 8.5], [110, 112, 0, 1, .93, straightEye, 8.5]],
  },
  hexagon: {
    body: 'M88 32Q96 27 104 32L151 59Q159 64 159 74V126Q159 136 151 141L104 168Q96 173 88 168L41 141Q33 136 33 126V74Q33 64 41 59Z',
    surface: 'hexagon',
    eyeMode: 'straight',
    eyes: [[86, 94, 0, 1, 1, straightEye, 8.5], [113, 94, 0, 1, 1, straightEye, 8.5]],
  },
  cloud: {
    body: 'M53 66C38 43 65 22 87 41C108 20 134 36 135 56C164 53 176 83 155 101C178 125 152 153 129 143C112 170 81 165 73 147C46 165 21 140 36 117C13 99 26 71 53 66Z',
    surface: 'cloud',
    eyeMode: 'almost-straight',
    eyes: [[88, 99, -2, 1, .95, softEye, 8.5], [115, 99, 2, 1, .95, softEye, 8.5]],
  },
  droplet: {
    body: 'M96 24C108 46 156 76 156 112C156 143 131 164 99 164C64 164 35 142 35 111C35 78 80 49 96 24Z',
    surface: 'droplet',
    eyeMode: 'gently-curved',
    eyes: [[90, 116, -6, 1, 1, softEye, 8.5], [116, 111, -11, .87, .94, 'M-1-11Q2.8 0 1.7 11', 8.5]],
  },
};

let instance = 0;

function lighting(surface, id) {
  const flat = ['flat', 'triangle', 'hexagon'].includes(surface);
  let light;
  if (surface === 'cylinder') {
    // A long, soft band follows the horizontal capsule's cylindrical surface.
    light = `<linearGradient id="${id}-light" gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="0" y2="142">
      <stop stop-color="#fff" stop-opacity=".17"/>
      <stop offset=".28" stop-color="#fff" stop-opacity=".035"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".15"/>
    </linearGradient>`;
  } else if (flat) {
    light = `<linearGradient id="${id}-light" gradientUnits="userSpaceOnUse" x1="48" y1="35" x2="146" y2="161">
      <stop stop-color="#fff" stop-opacity=".13"/>
      <stop offset=".46" stop-color="#fff" stop-opacity=".015"/>
      <stop offset="1" stop-color="#000" stop-opacity=".075"/>
    </linearGradient>`;
  } else if (surface === 'droplet') {
    light = `<linearGradient id="${id}-light" gradientUnits="userSpaceOnUse" x1="73" y1="35" x2="123" y2="160">
      <stop stop-color="#fff" stop-opacity=".14"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".035"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>`;
  } else {
    const transform = surface === 'pebble' ? ' gradientTransform="translate(88 87) rotate(-23) scale(1 .82) translate(-88 -87)"' : '';
    light = `<radialGradient id="${id}-light" gradientUnits="userSpaceOnUse" cx="73" cy="62" r="103"${transform}>
      <stop stop-color="#fff" stop-opacity="${surface === 'cloud' ? '.12' : '.20'}"/>
      <stop offset=".52" stop-color="#fff" stop-opacity=".03"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>`;
  }
  const shadow = surface === 'cylinder' || flat
    ? `<linearGradient id="${id}-shade" gradientUnits="userSpaceOnUse" x1="35" y1="45" x2="158" y2="155"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${flat ? '.10' : '.07'}"/></linearGradient>`
    : `<radialGradient id="${id}-shade" gradientUnits="userSpaceOnUse" cx="${surface === 'droplet' ? '78' : '72'}" cy="${surface === 'droplet' ? '99' : '61'}" r="112"><stop offset=".32" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity=".025"/><stop offset="1" stop-color="#000" stop-opacity="${surface === 'cloud' ? '.13' : '.21'}"/></radialGradient>`;
  return `${light}${shadow}
    <linearGradient id="${id}-rim" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#fff" stop-opacity=".23"/><stop offset=".45" stop-color="#fff" stop-opacity=".035"/><stop offset="1" stop-color="#000" stop-opacity=".16"/>
    </linearGradient>
    <radialGradient id="${id}-lobe"><stop stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
}

function contour(surface, id) {
  if (surface === 'triangle') return '<path d="M96 30V144L27 157Z" fill="#fff" opacity=".035"/><path d="M96 30V144L166 157Z" fill="#000" opacity=".035"/><path d="M27 157L96 144L166 157Z" fill="#000" opacity=".055"/>';
  if (surface === 'hexagon') return '<path d="M34 70L96 30L158 70L149 75L96 43L43 75Z" fill="#fff" opacity=".05"/><path d="M34 125L96 171L158 125L148 122L96 157L44 122Z" fill="#000" opacity=".055"/>';
  if (surface === 'cloud') return [[70, 53], [113, 48], [145, 78], [142, 125], [104, 144], [53, 132], [40, 94]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="29" fill="url(#${id}-lobe)"/>`).join('');
  if (surface === 'droplet') return '<path d="M86 52C75 70 47 92 48 114C48 134 66 147 82 150" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.3" stroke-linecap="round"/>';
  return '';
}

export function mascotSvg(shape = 'circle') {
  const { body, surface, eyeMode, eyes } = shapes[shape] || shapes.circle;
  const id = `mascot-${++instance}`;
  return `<svg class="bot-art" data-shape="${shape}" data-eyes="${eyeMode}" data-blink="${instance % 4 === 0 ? 'double' : 'single'}" viewBox="16 16 160 160" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${lighting(surface, id)}
      <clipPath id="${id}-body"><path d="${body}"/></clipPath>
    </defs>
    <g class="bot-shell">
      <path d="${body}" fill="currentColor"/>
      <path d="${body}" fill="url(#${id}-light)"/>
      <path d="${body}" fill="url(#${id}-shade)"/>
      <g clip-path="url(#${id}-body)">${contour(surface, id)}</g>
      <path d="${body}" fill="none" stroke="url(#${id}-rim)" stroke-width=".8"/>
    </g>
    <g class="bot-face" clip-path="url(#${id}-body)">
      ${eyes.map(([x, y, angle, sx, sy, path, width]) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${sx} ${sy})"><g class="bot-eye"><path d="${path}" fill="none" stroke="#10100e" stroke-width="${width}" stroke-linecap="round"/></g></g>`).join('')}
    </g>
  </svg>`;
}

// Inline artwork lets every mascot keep its own blink timing and lighting IDs.
export function mountMascots(root = document) {
  root.querySelectorAll('[data-mascot]').forEach((element, i) => {
    element.innerHTML = mascotSvg(element.dataset.mascot);
    element.style.setProperty('--blink-period', `${6.3 + i * .7}s`);
    element.style.setProperty('--blink-phase', `${-i * 1.83 - .6}s`);
  });
}

mountMascots();
