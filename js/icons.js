// 统一极简白色线条图标(1.6px 描边,currentColor)
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  resume: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
  pen: '<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z"/><path d="M14 6l3 3"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-4h4v4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15c2.8 0 5.5 2 5.5 5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4M12 7v2M12 16v2"/>',
  megaphone: '<path d="M3 10v4l4 1 11 4V5L7 9l-4 1z"/><path d="M7 15l1 4a2 2 0 0 0 3-2"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13 4l-2 16"/>',
  gradcap: '<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 1 1.5-2.5H18a3 3 0 0 0 3-3c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="12" cy="7.5" r=".8"/><circle cx="16.5" cy="10" r=".8"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>',
  chat: '<path d="M4 5h16v11H8l-4 4V5z"/><path d="M8 9h8M8 12h5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  pencil: '<path d="M4 20l4.5-1L20 7.5a2 2 0 0 0-3-3L5.5 16 4 20z"/><path d="M14 7l3 3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronL: '<path d="M14 6l-6 6 6 6"/>',
  chevronR: '<path d="M10 6l6 6-6 6"/>',
  chevronD: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  alert: '<path d="M12 4L2.5 20h19L12 4z"/><path d="M12 10v4M12 17.2v.3"/>',
  flame: '<path d="M12 3c1 3-4 4-4 9a4 4 0 0 0 8 0c0-2-1-3.5-2-5-.5 1.5-2 2-2 2 1-3 0-4.5 0-6z"/>',
  logout: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"/><path d="M10 8l-4 4 4 4M6 12h12"/>',
  boat: '<path d="M4 19l9-13 7 13h-5c-.8 2-3.2 2-4 0H4z"/><path d="M13 6v5M13 6L9.5 13M13 6l3.5 7"/><path d="M5 22q8-3 14 0"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  filter: '<path d="M4 5h16l-6 7v5l-4 2v-7L4 5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.1 3.9M6.2 6.2A17.4 17.4 0 0 0 2 12s3.5 6 10 6a9.9 9.9 0 0 0 5.8-1.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  refresh: '<path d="M20 5v5h-5"/><path d="M20 10a8 8 0 1 0 2 6"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l8-8M17 6l2 2M15 8l2 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
};

export function icon(name, cls) {
  const path = P[name] || P.grid;
  return (
    '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    path +
    '</svg>'
  );
}
