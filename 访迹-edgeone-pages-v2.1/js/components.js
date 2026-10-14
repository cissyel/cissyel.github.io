import { esc, money, starsHTML, avatarHTML, avatarWithBadge, modelTags, soldLabel, coverStyle } from './util.js';
import { icon } from './icons.js';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'operator', 'finance', 'support', 'viewer']);

export const BOAT_SVG = icon('boat');

export const WAVE_SVG =
  '<svg viewBox="0 0 1200 34" preserveAspectRatio="none"><path d="M0 18 Q 50 6 100 18 T 200 18 T 300 18 T 400 18 T 500 18 T 600 18 T 700 18 T 800 18 T 900 18 T 1000 18 T 1100 18 T 1200 18" fill="none" stroke="#7fb3ff" stroke-width="2" opacity="0.8"/><path d="M0 25 Q 50 15 100 25 T 200 25 T 300 25 T 400 25 T 500 25 T 600 25 T 700 25 T 800 25 T 900 25 T 1000 25 T 1100 25 T 1200 25" fill="none" stroke="#7fb3ff" stroke-width="1.6" opacity="0.5"/></svg>';

export function topbar(user, active, unread, searchQ) {
  const isAdmin = ADMIN_ROLES.has(user && user.role);
  const meHref = isAdmin ? '#/admin' : '#/me';
  const meLabel = isAdmin ? '后台' : '我的';
  return (
    '<header class="topbar"><div class="container topbar-inner">' +
    '<a class="brand" data-action="nav" data-href="#/market">' +
    '<span class="brand-mark">' + BOAT_SVG + '</span>' +
    '<span><span class="brand-name">访迹</span><div class="brand-sub">SKILL 交易市场</div></span>' +
    '</a>' +
    '<form class="top-search" data-form="search">' +
    '<span class="search-ico">' + icon('search', 'sm') + '</span>' +
    '<input name="q" placeholder="搜索 Skill、分类或作者…" value="' + esc(searchQ || '') + '" />' +
    '</form>' +
    '<nav class="nav-tabs">' +
    '<button class="nav-tab ' + (active === 'market' ? 'active' : '') + '" data-action="nav" data-href="#/market">市场</button>' +
    '<button class="nav-tab ' + (active === 'requests' ? 'active' : '') + '" data-action="nav" data-href="#/requests">求购</button>' +
    (isAdmin ? '' : '<button class="nav-tab ' + (active === 'plans' ? 'active' : '') + '" data-action="nav" data-href="#/plans">计划</button>') +
    '<div class="nav-item">' +
    '<button class="nav-tab ' + ((active === 'me' || active === 'admin' || active === 'inbox') ? 'active' : '') + '" data-action="nav" data-href="' + meHref + '">' + meLabel +
    (unread > 0 ? '<span class="nav-badge">' + (unread > 99 ? '99+' : unread) + '</span>' : '') +
    '</button>' +
    '<div class="nav-drop">' +
    (isAdmin
      ? '<button data-action="nav" data-href="#/admin">' + icon('grid', 'sm') + ' 管理后台</button>'
      : '<button data-action="nav" data-href="#/me">' + icon('users', 'sm') + ' 我的主页</button>') +
    '<button data-action="nav" data-href="#/inbox">' + icon('chat', 'sm') + ' 我的消息' + (unread > 0 ? '<span class="drop-badge">' + unread + '</span>' : '') + '</button>' +
    (isAdmin ? '' : '<button data-action="nav" data-href="#/help">' + icon('note', 'sm') + ' 帮助与售后</button>') +
    '</div></div>' +
    '<span class="user-chip">' + avatarHTML(user, 'sm') +
    '<span class="u-name">' + esc(user.nickname) + '</span>' +
    '<button class="logout" data-action="logout" title="退出登录">' + icon('logout', 'sm') + '</button></span>' +
    '</nav></div></header>'
  );
}

export function skillCard(s, opts = {}) {
  const extra = opts.extra || '';
  const coverIcon = (s.cover && s.cover.icon) || 'box';
  return (
    '<article class="skill-card ' + (opts.wide ? 'wide' : '') + '" data-action="open-skill" data-id="' + esc(s.id) + '">' +
    '<div class="card-cover" style="' + coverStyle(s.cover) + '">' +
    (s.cover && s.cover.image ? '<img class="cover-img" src="' + s.cover.image + '" alt="" />' : '<span class="cover-icon">' + icon(coverIcon, 'xl') + '</span>') +
    (s.sold >= s.soldCap ? '<span class="card-soldout">已售罄</span>' : s.category ? '<span class="card-cat">' + esc(s.category) + '</span>' : '') +
    (s.buyoutAvailable ? '<span class="card-buyout">可买断</span>' : '') +
    '<span class="cover-models">' + modelTags(s.models) + '</span>' +
    extra +
    '</div>' +
    '<div class="card-body">' +
    '<div class="card-title-row">' +
    '<div class="card-title"><h3>' + esc(s.title) + '</h3>' +
    '<div class="card-rating">' + starsHTML(s.rating) + '<span>' + s.rating.toFixed(1) + '</span><span class="cnt">(' + s.ratingCount + ')</span></div>' +
    '</div>' +
    '<div class="card-price">' + money(s.priceApi) + '<small>/天起</small></div>' +
    '</div>' +
    '<div class="card-meta"><span>已售 ' + soldLabel(s.sold) + '</span><span>限售 ' + s.soldCap + '</span></div>' +
    '</div></article>'
  );
}

export function toast(msg, type) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

export function openModal(html, wide) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '<div class="modal-mask" data-action="modal-mask"><div class="modal-card ' + (wide ? 'wide' : '') + '">' + html + '</div></div>';
  return root;
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

export function modalShell(title, body, foot) {
  return (
    '<div class="modal-head"><h3>' + esc(title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body">' + body + '</div>' +
    (foot ? '<div class="modal-foot">' + foot + '</div>' : '')
  );
}

export function authBadge(user) {
  if (!user) return '';
  return avatarWithBadge(user, 'sm');
}
