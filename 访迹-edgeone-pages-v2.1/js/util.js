export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function money(n) {
  return '¥' + (Number(n) || 0);
}

export function starsHTML(rating, sizeClass) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const pct = Math.round((r / 5) * 100);
  return (
    '<span class="stars ' + (sizeClass || '') + '" title="' + r.toFixed(1) + ' 分">' +
    '★★★★★<span class="fill" style="width:' + pct + '%">★★★★★</span></span>'
  );
}

export function timeAgo(ms) {
  const diff = Date.now() - Number(ms);
  if (!ms || Number.isNaN(diff)) return '';
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return '今天';
  if (d === 1) return '昨天';
  if (d < 30) return d + ' 天前';
  return new Date(ms).toLocaleDateString('zh-CN');
}

const AVATAR_COLORS = ['#1774f6', '#00aaf1', '#14b8a6', '#8b5cf6', '#6366f1', '#2790d4', '#48b0e8', '#5eead4', '#7dd3fc', '#93c5fd'];

export function avatarColor(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) % 100000;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function avatarHTML(user, size) {
  const cls = 'avatar ' + (size || '');
  if (user && user.avatar && user.avatar.type === 'data') {
    return '<span class="' + cls + '"><img src="' + user.avatar.data + '" alt="头像" /></span>';
  }
  const name = (user && user.nickname) || '访';
  const text = (user && user.avatar && user.avatar.text) || name.slice(0, 1);
  const bg = (user && user.avatar && user.avatar.bg) || avatarColor(name);
  return '<span class="' + cls + '" style="background:' + bg + '">' + esc(text) + '</span>';
}

const VERIFIED_SVG =
  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#f2b94b"/><path d="M8.8 12.2l2.2 2.2 4.4-4.4" stroke="#3a2505" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function avatarWithBadge(user, size, badgeSize, showTitle) {
  return (
    '<span class="avatar-stack">' +
    avatarHTML(user, size) +
    (user && user.verified ? '<span class="verified-badge ' + (badgeSize || '') + '">' + VERIFIED_SVG + '</span>' : '') +
    '</span>'
  );
}

export const MODEL_LABEL = { codex: 'Codex', claude: 'Claude Code', workbuddy: 'WorkBuddy' };

export function modelTags(models) {
  return (models || [])
    .map((m) => '<span class="model-tag ' + esc(m) + '">' + (MODEL_LABEL[m] || esc(m)) + '</span>')
    .join('');
}

export function soldLabel(sold) {
  return sold >= 100 ? '99+' : String(sold);
}

export function coverStyle(cover) {
  if (cover && /^data:image\/(png|jpeg|webp);base64,/.test(String(cover.image))) {
    return 'background-image:url(' + cover.image + ');background-size:cover;background-position:center;';
  }
  const hex = (v, fallback) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v) : fallback);
  const from = hex(cover && cover.from, '#2f7cf6');
  const to = hex(cover && cover.to, '#1d5fd0');
  return 'background:linear-gradient(135deg,' + from + ',' + to + ');';
}

export function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function formatDate(dayStr) {
  return String(dayStr || '');
}

export function treeHTML(structure) {
  const root = { name: '访迹-skill', children: {}, files: [] };
  const add = (parts) => {
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node.files.push(part);
      else {
        node.children[part] = node.children[part] || { name: part, children: {}, files: [] };
        node = node.children[part];
      }
    });
  };
  (structure || []).forEach((line) => {
    const clean = String(line).replace(/^\.?\/+/, '').split('/').filter(Boolean);
    if (clean.length) add(clean);
  });
  const out = [];
  const walk = (node, prefix, isLast) => {
    out.push(prefix + (prefix ? (isLast ? '└── ' : '├── ') : '') + '<span class="dir">' + esc(node.name) + '/</span>');
    const dirs = Object.values(node.children);
    const files = node.files;
    const childPrefix = prefix + (prefix ? (isLast ? '    ' : '│   ') : '');
    dirs.forEach((d, i) => walk(d, childPrefix, i === dirs.length - 1 && files.length === 0));
    files.forEach((f, i) => {
      out.push(childPrefix + (i === files.length - 1 && dirs.length === 0 ? '└── ' : '├── ') + '<span class="file">' + esc(f) + '</span>');
    });
  };
  walk(root, '', true);
  return '<div class="tree">' + out.map((l) => '<div class="line">' + l + '</div>').join('') + '</div>';
}
