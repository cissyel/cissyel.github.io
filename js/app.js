import { downloadSkill } from './skill-package.js';
import { api, setToken, getToken, runWithApiKey, downloadSource, downloadRunner, adminApprovalExecuteDownload, adminCertFile, adminRealnameFile } from './api.js';
import { esc, avatarHTML, money, timeAgo, coverStyle } from './util.js';
import { toast, openModal, closeModal, BOAT_SVG } from './components.js';
import { icon } from './icons.js';
import * as views from './views.js';

const state = {
  user: null,
  unread: 0,
  searchQ: '',
  categories: [],
  skills: [],
  filters: { q: '', model: '', method: '', category: '全部', sort: '' },
  catPage: 0,
  pickIdx: 0,
  galleryIdx: 0,
  reviewRating: 0,
  detail: null,
  library: [],
  mySkills: [],
  balance: 0,
  withdrawals: [],
  inbox: [],
  inboxTab: 'all',
  sellerOverview: null,
  projects: [],
  plans: [],
  planFolders: [],
  plansCount: 0,
  project: null,
  folderAvailable: [],
  chatOther: null,
  messages: [],
  chatCanSendImage: false,
  chatSellerSkills: [],
  chatFromSkill: '',
  profile: null,
  profileSkills: [],
  profileSelf: false,
  adminTab: 'overview',
  adminPending: [],
  adminReviews: [],
  adminLogs: [],
  adminDb: null,
  adminAccess: null,
  adminLedger: { ledger: [], totals: {} },
  adminPayments: { payments: [], totalFen: 0 },
  requests: [],
  myRequests: [],
  tickets: [],
  ticketDetail: null,
  ticketReplies: [],
  myRealname: {},
  sellerTab: 'goods',
  sellerRefunds: [],
  adminRealnames: [],
  adminRequests: [],
  adminTickets: [],
  settingsTab: 'profile',
};

let purchaseCtx = null;
let folderCtx = null;

const app = document.getElementById('app');
const ADMIN_ROLES = ['admin', 'super_admin', 'operator', 'finance', 'support', 'viewer'];

// 加载态:小船 + 依次跳动的省略号;只有加载超过一瞬间才出现,加载完即消失
const loader = document.createElement('div');
loader.id = 'page-loader';
loader.className = 'page-loader hidden';
loader.innerHTML =
  '<span class="loader-boat">' + BOAT_SVG + '</span>' +
  '<span class="loader-dots"><i></i><i></i><i></i></span>';
document.body.appendChild(loader);
let loaderTimer = null;
function showLoaderSoon() {
  clearTimeout(loaderTimer);
  loaderTimer = setTimeout(() => loader.classList.remove('hidden'), 150);
}
function hideLoader() {
  clearTimeout(loaderTimer);
  loader.classList.add('hidden');
}

async function refreshMe() {
  if (!getToken()) {
    state.user = null;
    return;
  }
  try {
    state.user = (await api.me()).user;
    applyPreferences();
  } catch (err) {
    setToken(null);
    state.user = null;
  }
}

function applyPreferences() {
  const s = (state.user && state.user.settings) || {};
  const accents = {
    blue: ['#66c0f4', '#4aa2d8', 'rgba(102, 192, 244, 0.13)'],
    cyan: ['#4dd0c7', '#2fb7ad', 'rgba(77, 208, 199, 0.13)'],
    purple: ['#a78bfa', '#8b6cef', 'rgba(167, 139, 250, 0.13)'],
  };
  const a = accents[s.theme] || accents.blue;
  const root = document.documentElement;
  root.style.setProperty('--accent', a[0]);
  root.style.setProperty('--accent-deep', a[1]);
  root.style.setProperty('--accent-soft', a[2]);
  document.body.classList.toggle('density-compact', s.density === 'compact');
}

async function refreshUnread() {
  if (!state.user) return;
  try {
    state.unread = (await api.notifications()).unread;
  } catch (err) {}
}

async function loadSkills() {
  const f = state.filters;
  const qs = new URLSearchParams();
  if (f.q) qs.set('q', f.q);
  if (f.model) qs.set('model', f.model);
  if (f.method) qs.set('method', f.method);
  if (f.category && f.category !== '全部') qs.set('category', f.category);
  if (f.sort) qs.set('sort', f.sort);
  const data = await api.skills('?' + qs.toString());
  state.skills = data.skills;
}

function currentPath() {
  return (location.hash || '#/login').slice(1);
}

async function render() {
  const path = currentPath();
  if (path === '/login' && state.user) {
    location.replace('#/market');
    return;
  }
  if (!path || path === '/login') {
    app.innerHTML = views.loginView();
    return;
  }
  if (!state.user) {
    location.hash = '#/login';
    return;
  }
  if (path === '/me' && ADMIN_ROLES.includes(state.user.role)) {
    location.replace('#/admin');
    return;
  }
  showLoaderSoon();
  try {
    if (path === '/market') await renderMarket();
    else if (path.startsWith('/skill/')) await renderDetail(path.split('/')[2]);
    else if (path === '/me') await renderMe();
    else if (path === '/plans') await renderPlans();
    else if (path === '/requests') await renderRequests();
    else if (path === '/help') await renderHelp();
    else if (path.startsWith('/ticket/')) await renderTicket(path.split('/')[2]);
    else if (path === '/settings') await renderSettings();
    else if (path === '/admin') await renderAdmin();
    else if (path === '/seller') await renderSeller();
    else if (path === '/inbox') await renderInbox();
    else if (path === '/wallet') await renderWallet();
    else if (path.startsWith('/folder/')) await renderFolder(path.split('/')[2]);
    else if (path.startsWith('/chat/')) await renderChat(path.split('/')[2]);
    else if (path.startsWith('/user/')) await renderProfile(path.split('/')[2]);
    else location.hash = '#/market';
  } catch (err) {
    if (String(err.message).includes('登录')) {
      location.hash = '#/login';
      return;
    }
    app.innerHTML = '<div class="empty"><div class="big">⚠️</div>' + esc(err.message) + '<br/><button class="btn btn-primary" style="margin-top:14px" data-action="nav" data-href="#/market">回到市场</button></div>';
  } finally {
    hideLoader();
  }
  window.scrollTo(0, 0);
}

async function renderMarket() {
  await Promise.all([
    state.categories.length ? Promise.resolve() : api.categories().then((d) => (state.categories = d.categories)),
    loadSkills(),
    refreshUnread(),
  ]);
  state.pickIdx = 0;
  app.innerHTML = views.marketView(state);
}

async function renderDetail(id) {
  const [data, cfgData] = await Promise.all([api.skill(id), api.platformConfig().catch(() => null)]);
  state.detail = data.skill;
  if (cfgData && cfgData.config) state.platform = cfgData.config;
  state.galleryIdx = 0;
  state.reviewRating = state.detail.myReview ? state.detail.myReview.rating : 0;
  await refreshUnread();
  app.innerHTML = views.detailView(state);
  const prompt = state.detail.linkedRequestPrompt;
  if (prompt) {
    state.promptShown = state.promptShown || {};
    if (!state.promptShown[prompt.id]) {
      state.promptShown[prompt.id] = true;
      openModal(
        views.confirmModalHTML(
          '是否关闭这条求购?',
          '你有一条求购「' + esc(prompt.title) + '」由该作者应征。你现在打开了应征者的橱窗,是否关闭这条求购?',
          '关闭求购',
          'close-request-confirm',
          prompt.id
        )
      );
    }
  }
}

async function renderMe() {
  await Promise.all([
    api.library().then((d) => (state.library = d.library)),
    api.projects().then((d) => (state.projects = d.projects)),
    api.plans().then((d) => (state.plansCount = d.plans.length)),
    api.sellerSkills().then((d) => (state.mySkills = d.skills)).catch(() => {}),
    api.wallet().then((d) => {
      state.balance = d.balance;
      state.withdrawable = d.withdrawable;
      state.frozenRefundable = d.frozenRefundable;
      state.withdrawals = d.withdrawals;
    }).catch(() => {}),
    refreshUnread(),
  ]);
  app.innerHTML = views.meView(state);
}

async function renderPlans() {
  const d = await api.plans();
  state.plans = d.plans;
  state.planFolders = d.folders;
  await refreshUnread();
  app.innerHTML = views.plansView(state);
}

async function renderRequests() {
  const [open, mine] = await Promise.all([
    api.requests(''),
    api.requests('?status=mine'),
    refreshUnread(),
  ]);
  state.requests = open.requests;
  state.myRequests = mine.requests;
  app.innerHTML = views.requestsView(state);
}

async function renderHelp() {
  const [d, lib] = await Promise.all([api.tickets(), api.library().catch(() => null)]);
  state.tickets = d.tickets || [];
  if (lib) state.library = lib.library || [];
  await refreshUnread();
  app.innerHTML = views.helpView(state);
}

async function renderTicket(id) {
  const d = await api.ticket(id);
  state.ticketDetail = d.ticket;
  state.ticketReplies = d.replies;
  await refreshUnread();
  app.innerHTML = views.ticketDetailView(state);
}

async function renderSettings() {
  await refreshUnread();
  const cert = await api.myCertification().catch(() => null);
  state.myCert = (cert && cert.certification) || {};
  const rn = await api.myRealname().catch(() => null);
  state.myRealname = (rn && rn.realname) || {};
  app.innerHTML = views.settingsView(state);
}

async function renderAdmin() {
  const ADMIN_ROLES = ['admin', 'super_admin', 'operator', 'finance', 'support', 'viewer'];
  if (!state.user || !ADMIN_ROLES.includes(state.user.role)) {
    toast('需要管理员权限', 'err');
    location.hash = '#/market';
    return;
  }
  let access = null;
  try {
    access = await api.adminAccess();
  } catch (err) {
    toast(err.message, 'err');
    location.hash = '#/market';
    return;
  }
  state.adminAccess = access;
  const perms = access.permissions || {};
  const [stats, users, orders, usage, skills, withdrawals, pcfg, pending, reviews, logs, dbinfo, approvals, vault, ledger, payments, certs, refunds, realnames, requests, tickets, recon] = await Promise.all([
    api.adminStats().catch(() => null),
    api.adminUsers().catch(() => null),
    api.adminOrders().catch(() => null),
    api.adminUsage().catch(() => null),
    api.adminSkills().catch(() => null),
    perms.financeWithdraw ? api.adminWithdrawals().catch(() => null) : Promise.resolve(null),
    perms.platformManage ? api.platformConfig().catch(() => null) : Promise.resolve(null),
    perms.skillsAudit ? api.adminPending().catch(() => null) : Promise.resolve(null),
    perms.reviewsModerate ? api.adminReviews().catch(() => null) : Promise.resolve(null),
    perms.logsView ? api.adminLogs().catch(() => null) : Promise.resolve(null),
    perms.dbManage ? api.adminDb().catch(() => null) : Promise.resolve(null),
    perms.dbManage ? api.adminApprovals().catch(() => null) : Promise.resolve(null),
    perms.dbManage ? api.adminVaultStatus().catch(() => null) : Promise.resolve(null),
    perms.financeWithdraw ? api.adminLedger().catch(() => null) : Promise.resolve(null),
    perms.financeWithdraw ? api.adminPayments().catch(() => null) : Promise.resolve(null),
    perms.certsAudit ? api.adminCertifications().catch(() => null) : Promise.resolve(null),
    perms.certsAudit ? api.adminRealnames().catch(() => null) : Promise.resolve(null),
    perms.skillsAudit ? api.adminRequests().catch(() => null) : Promise.resolve(null),
    perms.ticketsSupport ? api.adminTickets().catch(() => null) : Promise.resolve(null),
    perms.financeWithdraw ? api.adminRefunds().catch(() => null) : Promise.resolve(null),
    perms.financeWithdraw ? api.adminReconciliation().catch(() => null) : Promise.resolve(null),
  ]);
  state.adminStats = stats || {};
  state.adminUsers = (users && users.users) || [];
  state.adminOrders = (orders && orders.orders) || [];
  state.adminUsage = (usage && usage.usage) || [];
  state.adminSkills = (skills && skills.skills) || [];
  state.adminWithdrawals = (withdrawals && withdrawals.withdrawals) || [];
  state.platform = (pcfg && pcfg.config) || {};
  state.adminPending = (pending && pending.pending) || [];
  state.adminReviews = (reviews && reviews.reviews) || [];
  state.adminLogs = (logs && logs.logs) || [];
  state.adminDb = (dbinfo && dbinfo.db) || null;
  state.adminApprovals = (approvals && approvals.approvals) || [];
  state.adminVault = vault || null;
  state.adminLedger = ledger || { ledger: [], totals: {} };
  state.adminPayments = payments || { payments: [], totalFen: 0 };
  state.adminCerts = (certs && certs.certifications) || [];
  state.adminRealnames = (realnames && realnames.realnames) || [];
  state.adminRequests = (requests && requests.requests) || [];
  state.adminTickets = (tickets && tickets.tickets) || [];
  state.adminRefunds = (refunds && refunds.refunds) || [];
  state.adminRecon = recon || null;
  if (!state.categories.length) {
    const c = await api.categories();
    state.categories = c.categories;
  }
  app.innerHTML = views.adminView(state);
}

async function renderSeller() {
  if (!state.user) return;
  const [sk, cats, reqs, refs] = await Promise.all([
    api.sellerSkills(),
    api.categories(),
    api.requests('').catch(() => ({ requests: [] })),
    api.sellerRefunds().catch(() => ({ refunds: [] })),
  ]);
  state.sellerSkills = sk.skills;
  state.categories = cats.categories;
  state.requests = reqs.requests || [];
  state.sellerRefunds = refs.refunds || [];
  state.sellerOverview = await api.sellerOverview();
  const wallet = await api.wallet().catch(() => null);
  if (wallet) {
    state.balance = wallet.balance;
    state.escrowPendingFen = wallet.escrowPendingFen || 0;
  }
  await refreshUnread();
  app.innerHTML = views.sellerView(state);
}

async function renderInbox() {
  const d = await api.inbox();
  state.inbox = d.inbox;
  if (state.inboxTab !== 'all' && !state.inbox.some((c) => c.category === state.inboxTab)) state.inboxTab = 'all';
  await refreshUnread();
  app.innerHTML = views.inboxView(state);
}

async function onInboxReadAll() {
  try {
    await api.markAllRead();
    state.unread = 0;
    for (const c of state.inbox || []) c.unread = 0;
    app.innerHTML = views.inboxView(state);
    toast('已全部标为已读');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function renderWallet() {
  const d = await api.wallet();
  state.balance = d.balance;
  state.withdrawable = d.withdrawable;
  state.frozenRefundable = d.frozenRefundable;
  state.withdrawals = d.withdrawals;
  state.escrowPendingFen = d.escrowPendingFen || 0;
  state.escrowUntil = d.escrowUntil || null;
  state.escrowDays = d.escrowDays || 0;
  await refreshUnread();
  app.innerHTML = views.walletView(state);
}

async function renderFolder(id) {
  const d = await api.projects();
  state.projects = d.projects;
  const project = state.projects.find((p) => p.id === id);
  if (!project) {
    location.hash = '#/me';
    return;
  }
  state.project = project;
  const inFolder = new Set((project.skillIds || []).map(String));
  state.folderAvailable = state.library.length ? state.library.filter((p) => !inFolder.has(String(p.skillId))) : [];
  await refreshUnread();
  app.innerHTML = views.folderView(state);
}

async function renderChat(userId) {
  const d = await api.chat(userId);
  state.chatOther = d.other;
  state.messages = d.messages;
  state.chatCanSendImage = !!d.canSendImage;
  state.chatSellerSkills = d.sellerSkills || [];
  await refreshUnread();
  app.innerHTML = views.chatView(state);
  const body = document.getElementById('chat-body');
  if (body) body.scrollTop = body.scrollHeight;
}

async function renderProfile(userId) {
  const d = await api.userProfile(userId);
  state.profile = d.profile;
  state.profileSkills = d.skills || [];
  state.profileSelf = !!d.self;
  await refreshUnread();
  app.innerHTML = views.profileView(state);
}

// ---------------- 点击事件 ----------------
async function onNav(href) {
  closeModal();
  if (href === '#/market' && currentPath() === '/market') {
    state.filters = { q: '', model: '', method: '', category: '全部' };
    state.searchQ = '';
    await loadSkills();
    await renderMarket();
    window.scrollTo(0, 0);
    return;
  }
  location.hash = href;
}

async function onCatSelect(id) {
  state.filters.category = id;
  await loadSkills();
  await renderMarket();
}

async function onFilterOpt(key, val) {
  state.filters[key] = state.filters[key] === val ? '' : val;
  await loadSkills();
  await renderMarket();
}

async function onFilterClear(key) {
  if (key === 'q') {
    state.filters.q = '';
    state.searchQ = '';
  } else {
    state.filters[key] = '';
  }
  await loadSkills();
  await renderMarket();
}

async function onClearFilters() {
  state.filters = { q: '', model: '', method: '', category: '全部', sort: '' };
  state.searchQ = '';
  await loadSkills();
  await renderMarket();
}

async function onTogglePlan() {
  const s = state.detail;
  if (s.inPlan) {
    await api.removePlan(s.id);
    s.inPlan = false;
    toast('已移出计划');
  } else {
    await api.addPlan(s.id);
    s.inPlan = true;
    toast('已加入计划,可在「计划」里查看');
  }
  app.innerHTML = views.detailView(state);
}

function onBuy() {
  const s = state.detail;
  if (s.mine) {
    openModal(views.confirmModalHTML('购买自己的商品', '你正在购买自己发布的 Skill。这通常用于在不同设备上测试 API 调用等场景,确认要购买吗?', '确认购买', 'buy-own-confirm', ''));
    return;
  }
  const renewal = !!(s.myPurchase && s.myPurchase.method === 'api');
  purchaseCtx = { skill: s, method: 'api', days: 30, channel: 'wechat', amount: 0, renewal, cfg: state.platform || {} };
  openModal(views.purchaseModalHTML(s, purchaseCtx));
  mountPurchaseDays();
}

async function onBuyFromPlan(id) {
  try {
    const d = await api.skill(id);
    const s = d.skill;
    state.detail = s;
    if (!state.platform) {
      const cfg = await api.platformConfig().catch(() => null);
      if (cfg) state.platform = cfg.config;
    }
    const renewal = !!(s.myPurchase && s.myPurchase.method === 'api');
    purchaseCtx = { skill: s, method: 'api', days: 30, channel: 'wechat', amount: 0, renewal, cfg: state.platform || {} };
    openModal(views.purchaseModalHTML(s, purchaseCtx));
    mountPurchaseDays();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onBuyOwnConfirm() {
  const s = state.detail;
  purchaseCtx = { skill: s, method: 'api', days: 30, channel: 'wechat', amount: 0, renewal: !!(s.myPurchase && s.myPurchase.method === 'api'), cfg: state.platform || {} };
  openModal(views.purchaseModalHTML(s, purchaseCtx));
  mountPurchaseDays();
}

function onBuyTab(method) {
  if (!purchaseCtx) return;
  purchaseCtx.method = method;
  openModal(views.purchaseModalHTML(purchaseCtx.skill, purchaseCtx));
  mountPurchaseDays();
}

function onPickDays(days) {
  if (!purchaseCtx) return;
  purchaseCtx.days = Number(days);
  openModal(views.purchaseModalHTML(purchaseCtx.skill, purchaseCtx));
  mountPurchaseDays();
}

function mountPurchaseDays() {
  const input = document.getElementById('days-input');
  if (!input) return;
  input.addEventListener('input', () => {
    let v = parseInt(input.value, 10);
    if (!Number.isFinite(v) || v < 1) v = 1;
    if (v > 365) v = 365;
    purchaseCtx.days = v;
    const total = purchaseTotal(purchaseCtx.method, v);
    const t = document.getElementById('days-total');
    const p = document.getElementById('purchase-total');
    if (t) t.textContent = '¥' + total;
    if (p) p.textContent = '¥' + total;
    document.querySelectorAll('.day-opt').forEach((b) => b.classList.toggle('on', Number(b.dataset.days) === v));
  });
}

function promoApplies(method) {
  if (!purchaseCtx || purchaseCtx.renewal) return false;
  const scope = (purchaseCtx.cfg && purchaseCtx.cfg.cheapScope) || 'all';
  if (method === 'api') return scope === 'all';
  return scope === 'all' || scope === 'buyout';
}

function purchaseTotal(method, days) {
  const sk = purchaseCtx.skill;
  const cfg = (purchaseCtx && purchaseCtx.cfg) || {};
  const cheapPrice = cfg.cheapPrice === undefined ? 0.1 : Number(cfg.cheapPrice);
  const cheapOrders = cfg.cheapOrders === undefined ? 10 : Number(cfg.cheapOrders);
  if (method === 'api') {
    const promo = promoApplies('api') && cheapPrice > 0 && sk.sold < cheapOrders;
    return promo ? Math.round((cheapPrice + sk.priceApi * Math.max(0, days - 1)) * 100) / 100 : sk.priceApi * days;
  }
  const promo = promoApplies('buyout') && cheapPrice > 0 && sk.sold < cheapOrders;
  return promo ? cheapPrice : sk.buyoutPrice;
}

function onToPay() {
  if (!purchaseCtx) return;
  purchaseCtx.amount = purchaseTotal(purchaseCtx.method, purchaseCtx.days);
  purchaseCtx.orderToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  openModal(views.paymentModalHTML(purchaseCtx));
  drawFakeQR();
}

function onPayChannel(val) {
  if (!purchaseCtx) return;
  purchaseCtx.channel = val;
  openModal(views.paymentModalHTML(purchaseCtx));
  drawFakeQR();
}

async function onPayDone() {
  if (!purchaseCtx) return;
  const payBtn = document.querySelector('[data-action="pay-done"]');
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = '支付处理中…';
  }
  const body = purchaseCtx.method === 'api' ? { method: 'api', days: purchaseCtx.days, orderToken: purchaseCtx.orderToken } : { method: 'buyout', orderToken: purchaseCtx.orderToken };
  body.expectedPriceFen = Math.round(purchaseCtx.amount * 100);
  try {
    const d = await api.purchase(purchaseCtx.skill.id, body);
    const purchase = d.purchase;
    state.detail.myPurchase = purchase;
    toast('购买成功!');
    app.innerHTML = views.detailView(state);
    openModal(views.purchaseSuccessHTML(purchase, purchaseCtx.skill));
  } catch (err) {
    const alreadyPaid = /已处理|重复/.test(err.message || '');
    if (alreadyPaid) {
      // 幂等保护:同一订单令牌已被服务器处理,视为成功,刷新当前状态即可
      const d = await api.skill(purchaseCtx.skill.id).catch(() => null);
      if (d && d.skill) {
        state.detail = d.skill;
        app.innerHTML = views.detailView(state);
      }
      toast('该订单此前已支付成功');
      return;
    }
    toast(err.message, 'err');
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.textContent = '我已支付';
      // 网络错误/超时保留原令牌重试;只有进入下一次收银台(onToPay)才生成新令牌,避免断网重试双重扣款
    }
  }
}

function onGallery(dir) {
  const len = state.detail.images.length;
  state.galleryIdx = (state.galleryIdx + Number(dir) + len) % len;
  app.innerHTML = views.detailView(state);
}

function onGalleryDot(i) {
  state.galleryIdx = Number(i);
  app.innerHTML = views.detailView(state);
}

function onStarSet(val) {
  state.reviewRating = Number(val);
  const stars = document.querySelectorAll('#rate-stars span');
  stars.forEach((s, i) => s.classList.toggle('on', i + 1 <= state.reviewRating));
}

async function onLibraryKey(id) {
  try {
    const [usage, data] = await Promise.all([api.usage(id), api.library()]);
    const purchase = data.library.find(p => p.id === id);
    if (!purchase) throw new Error('购买记录不存在');
    const detail = await api.skill(purchase.skillId);
    openModal(views.apiKeyModalHTML(usage, { ...purchase, skill: detail.skill }), true);
  } catch (err) { toast(err.message, 'err'); }
}

async function onDownloadSkill(id, target) {
  try { await downloadSkill(id, target, api); toast('标准 Skill 包已下载，请按包内说明安装并连接真实服务'); }
  catch (err) { toast(err.message, 'err'); }
}

async function onDownloadSource(id) {
  try {
    await downloadSource(id, (state.detail ? state.detail.id : 'skill') + '-source.md');
    toast('源文件已开始下载');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onDownloadRunner() {
  try {
    await downloadRunner();
    toast('本地运行器已下载');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onTestRun(key) {
  const inputEl = document.getElementById('test-input');
  const outEl = document.getElementById('test-output');
  const metaEl = document.getElementById('test-meta');
  const btn = document.querySelector('[data-action="test-run"]');
  if (!inputEl.value.trim()) {
    toast('先输入一点内容再运行');
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = '运行中…';
  }
  try {
    const d = await runWithApiKey(key, inputEl.value);
    if (outEl) {
      outEl.textContent = d.output;
      outEl.classList.remove('hidden');
    }
    if (metaEl) {
      metaEl.innerHTML =
        '<span>今日调用 ' + d.meta.callsToday + ' 次</span><span>剩余 ' + d.meta.remainingDays + ' 天</span><span>' + esc(d.meta.privacy) + '</span>';
      metaEl.classList.remove('hidden');
    }
    toast('调用成功,今天是计费日');
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '▶ 运行 Skill';
    }
  }
}

async function onCopyKey(key) {
  try {
    await navigator.clipboard.writeText(key);
    toast('Key 已复制');
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = key;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Key 已复制');
  }
}

function onEditNick() {
  openModal(views.promptModalHTML('修改昵称', '输入 1-20 个字符', state.user.nickname, 'save-nick', 'nickname'));
  const input = document.querySelector('[data-form="prompt"] input');
  if (input) {
    input.focus();
    input.select();
  }
}

function onAvatarUpload() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg,image/webp';
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('图片太大,请选择 2MB 以内的图片', 'err');
      return;
    }
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      const out = canvas.toDataURL('image/jpeg', 0.86);
      try {
        await api.uploadAvatar(out);
        await refreshMe();
        toast('头像已更新');
        if (currentPath() === '/settings') app.innerHTML = views.settingsView(state);
        else await renderMe();
      } catch (err) {
        toast(err.message, 'err');
      }
    };
    img.src = dataUrl;
  };
  fileInput.click();
}

async function onCreateFolder() {
  openModal(views.promptModalHTML('新建文件夹', '给这个项目文件夹起个名字', '', 'create-folder', 'name'));
  const input = document.querySelector('[data-form="prompt"] input');
  if (input) input.focus();
}

async function onRenameFolder(id, name) {
  folderCtx = { id };
  openModal(views.promptModalHTML('重命名文件夹', '输入新名字', name, 'rename-folder', 'name'));
  const input = document.querySelector('[data-form="prompt"] input');
  if (input) {
    input.focus();
    input.select();
  }
}

async function onDeleteFolder(id) {
  folderCtx = { id };
  openModal(views.confirmModalHTML('删除文件夹', '确定删除这个文件夹吗?里面的 Skill 不会被删除,只是移出文件夹。', '删除', 'delete-folder-confirm', id));
}

async function onDeleteFolderConfirm(id) {
  try {
    await api.deleteProject(id);
    toast('文件夹已删除');
    closeModal();
    await renderMe();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onFolderAdd() {
  openModal(views.folderPickerModalHTML(state.project, state.folderAvailable));
}

async function onFolderAddConfirm(skillId) {
  try {
    await api.addProjectItem(state.project.id, skillId);
    toast('已添加到文件夹');
    closeModal();
    await renderFolder(state.project.id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onFolderRemove(skillId) {
  try {
    await api.removeProjectItem(state.project.id, skillId);
    toast('已移出文件夹');
    await renderFolder(state.project.id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onPlanRemove(id) {
  await api.removePlan(id);
  toast('已移出计划');
  await renderPlans();
}

function onCreatePlanFolder() {
  openModal(views.promptModalHTML('新建计划文件夹', '例如:面试季、办公提效…', '', 'create-plan-folder', 'name'));
  const input = document.querySelector('[data-form="prompt"] input');
  if (input) input.focus();
}

function onRenamePlanFolder(id, name) {
  folderCtx = { id };
  openModal(views.promptModalHTML('重命名文件夹', '输入新名字', name, 'rename-plan-folder', 'name'));
  const input = document.querySelector('[data-form="prompt"] input');
  if (input) {
    input.focus();
    input.select();
  }
}

function onDeletePlanFolder(id) {
  folderCtx = { id };
  openModal(views.confirmModalHTML('删除文件夹', '确定删除这个文件夹吗?里面的待购项会一并移除。', '删除', 'delete-plan-folder-confirm', id));
}

async function onDeletePlanFolderConfirm(id) {
  try {
    await api.deletePlanFolder(id);
    toast('文件夹已删除');
    closeModal();
    await renderPlans();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onPlanMove(skillId) {
  if (!state.planFolders.length) {
    toast('先新建一个文件夹,才能归档');
    return;
  }
  const rows = state.planFolders
    .map(
      (f) =>
        '<div class="plan-item" style="margin-bottom:8px">' +
        '<span class="folder-ico">' + icon('folder', 'lg') + '</span>' +
        '<div class="plan-info"><h3>' + esc(f.name) + '</h3><div class="p-meta">' + f.skills.length + ' 个待购</div></div>' +
        '<button class="btn btn-outline btn-sm" data-action="plan-move-confirm" data-id="' + esc(skillId) + '" data-folder="' + esc(f.id) + '">归档到这里</button>' +
        '</div>'
    )
    .join('');
  openModal(
    '<div class="modal-head"><h3>归档到文件夹</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body">' + rows + '</div>'
  );
}

async function onPlanMoveConfirm(skillId, folderId) {
  try {
    await api.addPlanFolderItem(folderId, skillId);
    toast('已归档到文件夹');
    closeModal();
    await renderPlans();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onPlanFolderRemoveItem(skillId) {
  const folder = state.planFolders.find((f) => (f.skills || []).some((s) => s.id === skillId));
  if (!folder) return;
  await api.removePlanFolderItem(folder.id, skillId);
  toast('已移出文件夹');
  await renderPlans();
}

function onOpenChat(id) {
  state.chatFromSkill = state.detail ? state.detail.id : '';
  if (currentPath().startsWith('/skill/')) {
    history.replaceState(null, '', '#/market');
  }
  location.hash = '#/chat/' + id;
}

function onOpenProfile(id) {
  location.hash = '#/user/' + id;
}

// 第一次聊天:点「咨询商品/咨询开发者」→ 发送系统默认提示给商家,随后显示聊天框
async function onChatIntent(intent) {
  const skillId = intent === 'product' && state.chatFromSkill ? state.chatFromSkill : '';
  const text = intent === 'product'
    ? (skillId ? '你好,我想咨询你橱窗里的这个商品。' : '你好,我想咨询你的商品。')
    : '你好,我想和你聊聊合作。';
  try {
    const d = await api.sendMessage(state.chatOther.id, { kind: 'intent', text });
    const fresh = await api.chat(state.chatOther.id);
    state.messages = fresh.messages;
    state.chatCanSendImage = !!fresh.canSendImage;
    app.innerHTML = views.chatView(state);
    const b = document.getElementById('chat-body');
    if (b) b.scrollTop = b.scrollHeight;
    toast('已发送咨询,商家会收到系统提醒');
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onChatPlus() {
  const menu = document.getElementById('chat-plus-menu');
  const picker = document.getElementById('chat-skill-picker');
  if (menu) menu.style.display = menu.style.display === 'none' ? '' : 'none';
  if (picker) picker.style.display = 'none';
}

function onChatSendLink() {
  const picker = document.getElementById('chat-skill-picker');
  const menu = document.getElementById('chat-plus-menu');
  if (picker) picker.style.display = picker.style.display === 'none' ? '' : 'none';
  if (menu) menu.style.display = 'none';
}

async function onChatLinkConfirm(skillId) {
  try {
    await api.sendMessage(state.chatOther.id, { kind: 'skill_link', skillId, text: '' });
    const d = await api.chat(state.chatOther.id);
    state.messages = d.messages;
    app.innerHTML = views.chatView(state);
    const b = document.getElementById('chat-body');
    if (b) b.scrollTop = b.scrollHeight;
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onChatSendImage() {
  const input = document.querySelector('.chat-input input[name="image"]');
  if (!input) return;
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const image = await readFileDataURL(file);
    if (!image) {
      toast('图片读取失败', 'err');
      return;
    }
    try {
      await api.sendMessage(state.chatOther.id, { kind: 'image', image, text: '' });
      const d = await api.chat(state.chatOther.id);
      state.messages = d.messages;
      state.chatCanSendImage = !!d.canSendImage;
      app.innerHTML = views.chatView(state);
      const b = document.getElementById('chat-body');
      if (b) b.scrollTop = b.scrollHeight;
    } catch (err) {
      toast(err.message, 'err');
    }
  };
  input.click();
}

function readFileDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => resolve('');
    r.readAsDataURL(file);
  });
}

function openReportUser(id) {
  openModal(
    '<div class="modal-head"><h3>举报用户</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="report" data-target="' + esc(id) + '">' +
      '<div class="field"><label>举报理由</label><select name="reason">' +
      ['站外交易/私下收款', '诈骗/虚假交付', '辱骂/骚扰', '侵权/盗版', '批量注册/刷单', '其他']
        .map((x) => '<option>' + x + '</option>')
        .join('') +
      '</select></div>' +
      '<div class="field"><label>详细说明</label><textarea name="text" rows="4" placeholder="请尽量提供证据与上下文…"></textarea></div>' +
      '<div class="modal-foot" style="padding:12px 0 0"><button class="btn btn-primary" type="submit">提交举报</button></div>' +
      '</form></div>'
  );
}

async function onLogout() {
  setToken(null);
  state.user = null;
  location.replace('#/login');
}

async function onSendSms() {
  const phoneEl = document.querySelector('#form-register input[name="phone"]');
  const btn = document.getElementById('sms-btn');
  if (!phoneEl || !/^1\d{10}$/.test(phoneEl.value)) {
    toast('请输入正确的 11 位手机号', 'err');
    return;
  }
  try {
    const d = await api.sms(phoneEl.value);
    const codeEl = document.querySelector('#form-register input[name="code"]');
    if (codeEl) codeEl.value = d.code;
    toast('验证码已发送(演示环境已自动填入)');
    let left = 60;
    btn.disabled = true;
    const timer = setInterval(() => {
      left -= 1;
      btn.textContent = left + 's';
      if (left <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '获取验证码';
      }
    }, 1000);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onToggleSetting(key) {
  const cur = !!(state.user.settings && state.user.settings[key]);
  try {
    const d = await api.updateSettings({ [key]: !cur });
    state.user = d.user;
    const btn = document.querySelector('[data-action="toggle-setting"][data-key="' + key + '"]');
    if (btn) btn.classList.toggle('on', !cur);
    toast('设置已保存');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminSaveCat(btn) {
  const row = btn.closest('.cat-edit-row');
  const id = row.dataset.catId;
  const name = row.querySelector('[data-field="name"]').value.trim();
  const color = row.querySelector('[data-field="color"]').value;
  try {
    await api.adminUpdateCategory(id, { name, color });
    const c = await api.categories();
    state.categories = c.categories;
    toast('分类已保存');
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onAdminNewCat() {
  openModal(
    '<div class="modal-head"><h3>新增分类</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="cat-create">' +
      '<div class="field"><label>分类名称</label><input name="name" maxlength="8" placeholder="例如:运营" /></div>' +
      '<div class="field"><label>图标</label><select name="icon" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
      ['grid', 'box', 'resume', 'chart', 'mic', 'pen', 'shield', 'target', 'note', 'trend', 'coin', 'users', 'code', 'briefcase', 'building', 'palette', 'megaphone', 'gradcap', 'list'].map((k) => '<option value="' + k + '">' + k + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label>颜色</label><input name="color" type="color" value="#4a90d9" style="height:38px;padding:3px;background:#0b2242;border:1px solid var(--line)" /></div>' +
      '<div class="field-error" id="cat-error"></div>' +
      '<button class="btn btn-primary btn-block" type="submit">创建</button>' +
      '</form></div>',
    false
  );
}

async function onAdminDeleteCat(id) {
  openModal(views.confirmModalHTML('删除分类', '删除后不可恢复;仅没有商品使用的分类可删除。', '确认删除', 'admin-delete-cat-confirm', id));
}

async function onAdminDeleteCatConfirm(id) {
  try {
    await api.adminDeleteCategory(id);
    toast('分类已删除');
    closeModal();
    const c = await api.categories();
    state.categories = c.categories;
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminSkillTakedown(id, op) {
  try {
    if (op === 'delist') {
      openAdminDelistModal(id);
      return;
    } else {
      await api.adminUpdateSkill(id, { action: 'reinstate' });
      toast('已恢复上架');
    }
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function openAdminDelistModal(skillId) {
  const reasons = ['违规内容', '侵权/盗版', '虚假宣传', '质量问题', '虚假交付', '其他'];
  openModal(
    '<div class="modal-head"><h3>下架商品</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="admin-delist" data-skill="' + esc(skillId) + '">' +
      '<div class="field"><label>下架原因(会反馈给商家)</label><select name="reason">' +
      reasons.map((r) => '<option>' + r + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label>补充说明(可选,也会反馈给商家)</label><input name="note" maxlength="200" placeholder="例如:第 X 条简介与源文件不符" /></div>' +
      '<div class="modal-foot" style="padding:12px 0 0"><button class="btn btn-danger" type="submit">确认下架</button></div>' +
      '</form></div>'
  );
}

function onAdminReviewSkill(id) {
  const s = state.detail;
  if (!s) return;
  const statusLabel = { active: '已上架', pending: '待审核', rejected: '已驳回', delisted: '已下架', restricted: '评分下架' }[s.status] || s.status;
  const isPending = s.status === 'pending';
  openModal(
    '<div class="modal-head"><h3>审查橱窗:『' + esc(s.title) + '』</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body">' +
      '<div class="sys-line"><span>卖家</span><b>' + esc((s.seller && s.seller.nickname) || '') + '</b></div>' +
      '<div class="sys-line"><span>状态</span><b>' + statusLabel + '</b></div>' +
      '<div class="sys-line"><span>版本</span><b>v' + (s.version || 1) + ' · ' + esc(s.changelog || '无更新说明') + '</b></div>' +
      '<div class="sys-line"><span>分类 / 价格</span><b>' + esc(s.category) + ' · ' + money(s.priceApi) + '/天' + (s.buyoutAvailable ? ' · 买断 ' + money(s.buyoutPrice) : '') + '</b></div>' +
      (s.security
        ? '<div class="sys-line"><span>安全扫描</span><b style="color:' + (s.security.risk === 'high' ? 'var(--red)' : s.security.risk === 'medium' ? 'var(--amber)' : 'var(--mint)') + '">' + (s.security.risk || 'none') + ' · 命中 ' + (s.security.findings || []).map((f) => f.label).join('、') + '</b></div>'
        : '') +
      '<div class="sys-line"><span>简介</span><b>' + esc(s.intro || '') + '</b></div>' +
      '<div class="sys-line"><span>说明</span><b>' + esc(s.description || '') + '</b></div>' +
      (s.fileName ? '<div class="sys-line"><span>源文件</span><b>' + esc(s.fileName) + '</b></div>' : '') +
      (isPending
        ? '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary" data-action="admin-review-approve" data-id="' + esc(s.id) + '">审核通过</button><button class="btn btn-danger-ghost" data-action="admin-review-reject" data-id="' + esc(s.id) + '">驳回</button></div>'
        : '<div style="margin-top:12px">' +
          (['delisted', 'rejected', 'restricted'].includes(s.status)
            ? '<button class="btn btn-outline" data-action="admin-review-reinstate" data-id="' + esc(s.id) + '">恢复上架</button>'
            : '<button class="btn btn-danger" data-action="admin-review-delist" data-id="' + esc(s.id) + '">下架商品</button>') +
          '</div>') +
      '</div>',
    true
  );
}

function onSellerVersion(id) {
  openModal(
    '<div class="modal-head"><h3>发布新版本</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="seller-version" data-id="' + esc(id) + '">' +
      '<div class="field"><label>源文件(.js / .py / .md / .txt / .json)</label><input name="srcfile" type="file" accept=".js,.py,.md,.txt,.json" style="background:#0b2242;border:1px solid var(--line);padding:10px;width:100%;color:var(--ink)" /></div>' +
      '<div class="field"><label>更新说明(必填)</label><textarea name="changelog" rows="3" maxlength="500" placeholder="例如:v2 修复…,新增…"></textarea></div>' +
      '<div class="field-hint">新版本会进入审核队列并重新锁定审核哈希;审核通过前,已买断的买家仍下载旧版本。</div>' +
      '<div class="field-error" id="version-error"></div>' +
      '<div class="modal-foot" style="padding:12px 0 0"><button class="btn btn-primary" type="submit">' + icon('shield', 'sm') + ' 提交新版本审核</button></div>' +
      '</form></div>'
  );
}

async function refreshDetailAfterAdmin(skillId) {
  const d = await api.skill(skillId);
  state.detail = d.skill;
  closeModal();
  app.innerHTML = views.detailView(state);
}

async function onAdminReviewApprove(id) {
  try {
    await api.adminApprove(id, true);
    toast('已通过并上架');
    await refreshDetailAfterAdmin(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminReviewReject(id) {
  try {
    await api.adminApprove(id, false);
    toast('已驳回');
    await refreshDetailAfterAdmin(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminReviewReinstate(id) {
  try {
    // delisted 走 reinstate;rejected/restricted 走 status=active 两条都兼容
    await api.adminUpdateSkill(id, { action: 'reinstate', status: 'active' });
    toast('已恢复上架');
    await refreshDetailAfterAdmin(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminSaveSkill(btn) {
  const row = btn.closest('.cat-edit-row');
  const id = row.dataset.skillId;
  const title = row.querySelector('[data-field="title"]').value.trim();
  const priceApi = Number(row.querySelector('[data-field="priceApi"]').value);
  const buyoutPrice = Number(row.querySelector('[data-field="buyoutPrice"]').value);
  const sold = Number(row.querySelector('[data-field="sold"]').value);
  try {
    await api.adminUpdateSkill(id, { title, priceApi, buyoutPrice, sold });
    toast('技能信息已保存');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminApprove(id, approve) {
  try {
    await api.adminApprove(id, approve);
    toast(approve ? '已通过并上架' : '已驳回');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminSavePlatform(btn) {
  const card = btn.closest('.settings-card');
  const v = (f) => card.querySelector('[data-field="' + f + '"]').value;
  try {
    await api.adminUpdatePlatform({
      slotPrice: Number(v('slotPrice')),
      maxSlots: Number(v('maxSlots')),
      commissionRate: Number(v('commissionRate')),
      cheapPrice: Number(v('cheapPrice')),
      cheapOrders: Number(v('cheapOrders')),
      cheapScope: v('cheapScope'),
      ratingFloor: Number(v('ratingFloor')),
      ratingMinCount: Number(v('ratingMinCount')),
      escrowDays: Number(v('escrowDays')),
    });
    toast('运营规则已保存');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminWithdraw(id, status) {
  try {
    await api.adminWithdrawalAction(id, status);
    toast(status === 'success' ? '已打款' : '已驳回并退回余额');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminCert(id, approve) {
  try {
    await api.adminCertificationAction(id, { approve });
    toast(approve ? '认证已通过,徽标已点亮' : '已驳回');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminCertReject(id) {
  const note = window.prompt('填写驳回原因(可选):', '');
  if (note === null) return;
  try {
    await api.adminCertificationAction(id, { approve: false, note: String(note || '').trim() });
    toast('已驳回该认证');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminCertFile(id) {
  try {
    await adminCertFile(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onBuySlot() {
  const ov = state.sellerOverview || { slots: 0, slotPrice: 30, maxSlots: 3 };
  const slotNumber = (ov.slots || 0) + 1;
  const quote = ov.nextSlotQuote || { slotNumber, originalPrice: 30, discountRate: 1, price: 0, display: '0元（-100%）', promotionState: 'prelaunch' };
  openModal(
    views.confirmModalHTML(
      '开通第 ' + slotNumber + ' 个橱窗位',
      '橱窗位标准上架费为 ' + quote.originalPrice + ' 元；公开上线后的前六个月，三个位置均优惠 -100%，本次应付 ' + quote.display + '。平台从每笔成交向卖家收取 3% 服务费。',
      '确认开通 ' + quote.display,
      'buy-slot-confirm',
      ''
    )
  );
}

async function onBuySlotConfirm() {
  try {
    const d = await api.buySlot();
    toast('第 ' + d.slots + ' 个橱窗位已开通，本次应付 ' + (d.quote ? d.quote.display : d.price + ' 元'));
    closeModal();
    await renderSeller();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onUpTab(mode) {
  const input = document.getElementById('srcfile');
  const hint = document.getElementById('src-hint');
  document.querySelectorAll('.up-tab').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  if (!input) return;
  input.value = '';
  if (mode === 'folder') {
    input.removeAttribute('accept');
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('multiple', '');
    if (hint) hint.textContent = '选择一个文件夹,将按真实目录结构打包上传';
  } else if (mode === 'zip') {
    input.setAttribute('accept', '.zip');
    input.removeAttribute('webkitdirectory');
    input.removeAttribute('multiple');
    if (hint) hint.textContent = '支持 zip 压缩包,目录结构按包内真实文件生成';
  } else {
    input.setAttribute('accept', '.js,.py,.md,.txt,.json');
    input.removeAttribute('webkitdirectory');
    input.removeAttribute('multiple');
    if (hint) hint.textContent = '支持 .js / .py / .md / .txt / .json;目录结构按真实文件生成,不会伪造';
  }
}

function onCoverPreview(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const box = document.getElementById('cover-preview');
    if (box) box.innerHTML = '<img src="' + reader.result + '" style="width:100%;height:100%;object-fit:cover" />';
  };
  reader.readAsDataURL(file);
}

function onDelistSkill(id) {
  openModal(views.confirmModalHTML('下架商品', '下架后商品从市场隐藏,已购买的买家仍可正常调用;橱窗位会空出来,之后可以重新上架。', '确认下架', 'delist-skill-confirm', id));
}

async function onDelistSkillConfirm(id) {
  try {
    await api.sellerDelist(id);
    toast('已下架');
    closeModal();
    await renderSeller();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onRestoreSkill(id) {
  try {
    await api.sellerRestore(id);
    toast('已重新上架');
    await renderSeller();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onResubmitSkill(id) {
  try {
    await api.sellerResubmit(id);
    toast('已重新提交审核,请等待管理员处理');
    await renderSeller();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onAdminReset() {
  openModal(views.confirmModalHTML('重置演示数据(需双人复核)', '发起后需要第二名管理员在复核队列中确认才会真正执行,单个管理员无法独自重置。', '发起复核', 'admin-approval-create', 'db.reset'));
}

async function onAdminApprovalCreate(action) {
  try {
    const d = await api.adminApprovalCreate(action);
    toast('已提交复核,等待第二名管理员确认');
    closeModal();
    state.adminApprovals = (await api.adminApprovals()).approvals || [];
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminReview(id, op) {
  try {
    await api.adminReviewAction(id, op);
    toast(op === 'delete' ? '评价已删除' : op === 'hide' ? '评价已隐藏' : '评价已恢复显示');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminUserStatus(id, status) {
  try {
    await api.adminUserStatus(id, status);
    toast(status === 'disabled' ? '已禁用该账号' : '已启用该账号');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminUserRole(id, role) {
  try {
    await api.adminUserRole(id, role);
    toast('角色已更新为 ' + role);
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onAdminPenalty(id, act) {
  if (act === 'perma_ban') {
    openModal(
      views.confirmModalHTML(
        '彻底封号',
        '确认永久封禁该账号吗?平台保留相关证据,对严重违规行为将依法追究法律责任。',
        '确认彻底封号',
        'admin-penalty-confirm',
        id + ':ban:permanent'
      )
    );
    return;
  }
  if (act === 'mute' || act === 'ban') {
    openModal(
      '<div class="modal-head"><h3>' + (act === 'ban' ? '封号处罚' : '禁言处罚') + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
        '<div class="modal-body"><form data-form="penalty" data-target="' + esc(id) + '" data-act="' + act + '">' +
        '<div class="field"><label>天数</label><input name="days" type="number" min="1" placeholder="封禁/禁言天数" /></div>' +
        (act === 'ban' ? '<div class="field"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="permanent" /> 彻底封号(依法追究责任)</label></div>' : '') +
        '<div class="field"><label>处罚原因</label><input name="note" maxlength="200" placeholder="将通知该用户并写入审计日志" /></div>' +
        '<div class="modal-foot" style="padding:12px 0 0"><button class="btn btn-danger btn-sm" type="submit">确认处罚</button></div>' +
        '</form></div>'
    );
    return;
  }
  const labelMap = { down_all: '下架该卖家的全部商品', unban: '解除封号', unmute: '解除禁言' };
  openModal(views.confirmModalHTML(labelMap[act] || '执行处罚', '确认执行该操作吗?该操作会通知用户并写入审计日志。', '确认执行', 'admin-penalty-confirm', id + ':' + act));
}

async function onAdminPenaltyConfirm(idAct) {
  const parts = String(idAct).split(':');
  const id = parts[0];
  const act = parts[1];
  const permanent = parts[2] === 'permanent';
  try {
    await api.adminUserPenalty(id, { action: act, days: 0, permanent });
    toast('处罚已执行');
    closeModal();
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminDbVacuum() {
  try {
    const d = await api.adminDbVacuum();
    state.adminDb = d.db;
    toast('数据库空间已整理');
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminDbBackup() {
  try {
    const d = await api.adminApprovalCreate('db.backup');
    toast('备份已提交复核,等待第二名管理员确认');
    state.adminApprovals = (await api.adminApprovals()).approvals || [];
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminDbExport() {
  try {
    const d = await api.adminApprovalCreate('db.export');
    toast('导出已提交复核,等待第二名管理员确认');
    state.adminApprovals = (await api.adminApprovals()).approvals || [];
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminApprovalExecute(id, action) {
  try {
    await adminApprovalExecuteDownload(id, action);
    toast(action === 'db.reset' ? '数据已重置' : '已执行复核操作');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminApprovalReject(id) {
  try {
    await api.adminApprovalReject(id);
    toast('已驳回该复核请求');
    state.adminApprovals = (await api.adminApprovals()).approvals || [];
    app.innerHTML = views.adminView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onNewRequest() {
  const cats = state.categories.filter((c) => c.id !== '全部');
  openModal(
    '<div class="modal-head"><h3>发布求购</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="request-create">' +
      '<div class="field"><label>需求标题</label><input name="title" maxlength="60" placeholder="例如:我需要一个能自动生成周报的 Skill" /></div>' +
      '<div class="field"><label>详细描述</label><textarea name="description" rows="4" maxlength="2000" placeholder="用途、输入输出、交付时间…写清楚卖家更容易接单"></textarea></div>' +
      '<div class="ticket-form-grid"><div class="field"><label>分类</label><select name="category" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
      (cats.length ? cats.map((c) => '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>').join('') : '<option value="">其他</option>') +
      '</select></div>' +
      '<div class="field"><label>预算(元)</label><input name="budget" type="number" min="1" step="1" placeholder="例如 50" /><div class="field-hint">预算仅供参考,最终价格以与卖家沟通为准</div></div></div>' +
      '<div class="field-error" id="request-error"></div>' +
      '<button class="btn btn-primary btn-block" type="submit">发布求购</button>' +
      '</form></div>',
    true
  );
}

async function onTakeRequest(id) {
  try {
    await api.takeRequest(id);
    toast('接单成功,已通知发布者');
    await renderRequests();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onCloseRequest(id) {
  try {
    await api.closeRequest(id);
    toast('求购已关闭');
    await renderRequests();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onCloseRequestConfirm(id) {
  try {
    await api.closeRequest(id);
    toast('求购已关闭');
    closeModal();
    const d = await api.skill(state.detail.id).catch(() => null);
    if (d && d.skill) state.detail = d.skill;
    app.innerHTML = views.detailView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onRequestReject(id, takerId) {
  openModal(
    views.confirmModalHTML(
      '拒绝这个橱窗',
      '拒绝后该应征者的橱窗会从你的列表移除,对方会收到通知并可以重新上传。确定拒绝吗?',
      '确认拒绝',
      'request-reject-confirm',
      id + ':' + takerId
    )
  );
}

async function onRequestRejectConfirm(idTaker) {
  const parts = String(idTaker).split(':');
  try {
    await api.requestReject(parts[0], parts[1]);
    toast('已拒绝该应征橱窗');
    closeModal();
    await renderRequests();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onRequestDetail(id) {
  const r = (state.requests || []).concat(state.myRequests || []).find((x) => x.id === id);
  if (!r) return;
  openModal(
    '<div class="modal-head"><h3>' + esc(r.title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body">' +
      '<div class="sys-line"><span>状态</span><b>' + esc(r.statusLabel) + '</b></div>' +
      '<div class="sys-line"><span>预算</span><b>' + money(r.budget) + ' <span class="budget-hint">预算仅供参考</span></b></div>' +
      '<div class="sys-line"><span>分类</span><b>' + esc(r.category || '未分类') + '</b></div>' +
      '<div class="sys-line"><span>发布者</span><b>' + esc(r.poster ? r.poster.nickname || r.poster.username : '-') + '</b></div>' +
      '<div class="sys-line"><span>应征</span><b>' + (r.takerCount || 0) + ' 人' + (r.status === 'open' ? '(还可继续应征)' : '') + '</b></div>' +
      '<div class="sys-line"><span>发布时间</span><b>' + timeAgo(r.createdAt) + '</b></div>' +
      '<div class="field"><label>需求详情</label><div class="prose" style="color:var(--ink-2)">' + esc(r.description || '发布者暂未补充细节。') + '</div></div>' +
      ((r.applicants || []).length
        ? '<div class="field"><label>应征橱窗</label><div class="req-apps">' +
          r.applicants
            .map(
              (a) =>
                a.rejected
                  ? '<span class="app-chip rejected">' + icon('x', 'sm') + esc(a.taker.nickname) + '的橱窗已被你拒绝</span>'
                  : a.skill
                    ? '<div class="app-chip-row"><button class="app-chip" data-action="open-skill" data-id="' + esc(a.skill.id) + '">' + icon('box', 'sm') + esc(a.taker.nickname) + '的橱窗:『' + esc(a.skill.title) + '』<span>查看 →</span></button>' +
                      (r.mine ? '<button class="btn btn-danger-ghost btn-sm" data-action="request-reject" data-id="' + esc(r.id) + '" data-taker="' + esc(a.taker.id) + '">拒绝</button>' : '') +
                      '</div>'
                    : '<span class="app-chip wait">' + esc(a.taker.nickname) + ' · 等待上传橱窗链接</span>'
            )
            .join('') +
          '</div></div>'
        : '') +
      '</div>',
    true
  );
}

async function onRequestLink(id) {
  // 求购页可能还没加载卖家自己的橱窗列表,这里实时拉取,保证能上传橱窗链接
  let skills = state.sellerSkills;
  try {
    const d = await api.sellerSkills();
    skills = d.skills || [];
    state.sellerSkills = skills;
  } catch (err) {
    toast(err.message, 'err');
    return;
  }
  const myActive = skills.filter((s) => s.status === 'active' || !s.status);
  if (!myActive.length) {
    toast('你还没有已上架的橱窗,先去发布一个 Skill', 'err');
    return;
  }
  const rows = myActive
    .map(
      (s) =>
        '<div class="plan-item" style="margin-bottom:8px">' +
        '<div class="plan-thumb" style="' + coverStyle(s.cover) + '">' + icon(s.cover.icon || 'box') + '</div>' +
        '<div class="plan-info"><h3>' + esc(s.title) + '</h3><div class="p-meta">' + money(s.priceApi) + '/天起 · 已售 ' + s.sold + '</div></div>' +
        '<button class="btn btn-primary btn-sm" data-action="request-link-confirm" data-request="' + esc(id) + '" data-skill="' + esc(s.id) + '">发送链接</button>' +
        '</div>'
    )
    .join('');
  openModal(
    '<div class="modal-head"><h3>上传橱窗链接</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body">' +
      '<div class="field-hint">选择你已发布的一个橱窗,链接会发送给求购的发布者(请勿私下联系发布者)。</div>' +
      rows +
      '</div>'
  );
}

async function onRequestLinkConfirm(requestId, skillId) {
  try {
    await api.linkRequestSkill(requestId, skillId);
    toast('橱窗链接已发送给发布者');
    closeModal();
    if (currentPath() === '/seller') await renderSeller();
    else await renderRequests();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onNewTicket() {
  const lib = state.library || [];
  openModal(
    '<div class="modal-head"><h3>提交工单</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
      '<div class="modal-body"><form data-form="ticket-create">' +
      '<div class="field"><label>工单类型</label><select name="type" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
      '<option value="support">客服工单</option><option value="refund">退款申请</option><option value="complaint">投诉</option><option value="appeal">申诉</option><option value="dispute">纠纷仲裁</option>' +
      '</select></div>' +
      '<div class="field"><label>标题</label><input name="title" maxlength="80" placeholder="一句话说明问题" /></div>' +
      '<div class="field"><label>详细描述</label><textarea name="text" rows="5" maxlength="2000" placeholder="问题经过、期望的处理结果…"></textarea></div>' +
      '<div class="field"><label>关联订单(退款 / 纠纷必选)</label><select name="purchaseId" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
      '<option value="">不关联订单</option>' +
      lib.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.skill && p.skill.title) + ' · ' + (p.method === 'api' ? 'API ' + money(p.price) + ' 元' : '买断 ' + money(p.price) + ' 元') + '</option>').join('') +
      '</select></div>' +
      '<div class="field-hint">选「退款申请」并关联订单:API 订阅退未调用天数(收 0.5% 服务费),买断需卖家同意。</div>' +
      '<div class="field-error" id="ticket-error"></div>' +
      '<button class="btn btn-primary btn-block" type="submit">提交</button>' +
      '</form></div>',
    true
  );
}

async function onLibraryRefund(id, method) {
  const p = state.library.find((x) => x.id === id);
  const note = p && p.refund ? p.refund.note : '';
  const body =
    method === 'api'
      ? '将退还全部未调用天数(按剩余天数比例),并收取 0.5% 服务费,退款进入账户余额;剩余订阅天数清零。'
      : '买断原则上不退款。提交后需要卖家同意才会退款,建议先在消息里与卖家沟通。';
  openModal(views.confirmModalHTML(method === 'api' ? '确认退未用天数' : '申请买断退款', body + (note ? '<br/>' + esc(note) : ''), '确认提交', 'library-refund-confirm', id));
}

async function onLibraryRefundConfirm(id) {
  try {
    const d = await api.createTicket({ type: 'refund', purchaseId: id, title: '退款申请', text: '' });
    closeModal();
    toast(d.ticket.status === 'resolved' ? '退款已完成,金额已退回余额' : '退款申请已提交,等待卖家确认');
    await renderMe();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onTicketEscalate(id) {
  try {
    await api.escalateTicket(id, '买家申请平台仲裁');
    toast('已升级为平台仲裁,等待管理员裁定');
    await renderTicket(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onSellerTab(tab) {
  state.sellerTab = tab;
  app.innerHTML = views.sellerView(state);
}

async function onSellerRefund(id, approve) {
  try {
    await api.sellerRefundAction(id, approve);
    toast(approve ? '已同意退款' : '已拒绝退款');
    await renderSeller();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminRealname(id, approve) {
  const note = approve ? '' : window.prompt('填写驳回原因(可选):', '');
  if (!approve && note === null) return;
  try {
    await api.adminRealnameAction(id, { approve, note: String(note || '') });
    toast(approve ? '实名已通过' : '已驳回');
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminRealnameFile(id) {
  try {
    await adminRealnameFile(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminRequest(id, op) {
  try {
    await api.adminRequestAction(id, { action: op, reason: '平台内容审核' });
    toast(op === 'remove' ? '已下架该求购' : '已恢复');
    if (currentPath() === '/requests') await renderRequests();
    else await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminTicketOpen(id) {
  try {
    const d = await api.adminTicket(id);
    state.adminTicketDetail = d;
    const t = d.ticket;
    const closed = t.status === 'resolved' || t.status === 'rejected';
    const msgs = (d.replies || [])
      .map((m) => '<div class="chat-msg"><div class="cm-bubble"><div class="cm-name">' + esc(m.fromName) + '</div>' + esc(m.text) + '<div class="cm-time">' + timeAgo(m.at) + '</div></div></div>')
      .join('');
    const canFinance = state.adminAccess && state.adminAccess.permissions && state.adminAccess.permissions.financeWithdraw;
    const canUsers = state.adminAccess && state.adminAccess.permissions && state.adminAccess.permissions.usersManage;
    const penaltyPanel = t.target && canUsers
      ? '<div class="sys-line"><span>被举报人</span><b>' + esc(t.target.nickname || t.target.username) + ' · ' + esc(t.target.username) + '</b></div>' +
        '<div class="field"><label>处罚该用户(处理举报)</label><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="admin-penalty" data-id="' + esc(t.target.id) + '" data-act="down_all">下架商品</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="admin-penalty" data-id="' + esc(t.target.id) + '" data-act="mute">禁言</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="admin-penalty" data-id="' + esc(t.target.id) + '" data-act="ban">封号</button>' +
        '<button class="btn btn-danger btn-sm" data-action="admin-penalty" data-id="' + esc(t.target.id) + '" data-act="perma_ban">彻底封号</button>' +
        '</div></div>'
      : '';
    openModal(
      '<div class="modal-head"><h3>' + esc(t.title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="sys-line"><span>类型 / 状态</span><b>' + esc(t.typeLabel) + ' · ' + esc(t.statusLabel) + '</b></div>' +
        '<div class="sys-line"><span>提交人</span><b>' + esc(t.submitter ? t.submitter.nickname || t.submitter.username : '-') + '</b></div>' +
        penaltyPanel +
        (t.purchase
          ? '<div class="sys-line"><span>关联订单</span><b>' + esc(t.purchase.method === 'api' ? 'API 订阅' : '买断') + ' · 实付 ' + money(t.purchase.price) + ' · 可退上限 ' + money(t.purchase.maxRefund || 0) + '</b></div>'
          : '<div class="sys-line"><span>关联订单</span><b style="color:var(--amber)">未关联订单,不能裁定退款金额</b></div>') +
        (t.refundAmount > 0 ? '<div class="sys-line"><span>退款金额</span><b style="color:var(--price)">' + money(t.refundAmount) + '</b></div>' : '') +
        '<div class="field"><label>回复 / 处理说明</label><textarea id="admin-ticket-text" rows="3" maxlength="2000" placeholder="回复买家或填写处理说明"></textarea></div>' +
        (closed ? '<div style="color:var(--muted);font-size:12.5px;margin-bottom:8px">该工单已关闭,可继续回复记录备注。</div>' : '') +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" data-action="admin-ticket-action" data-id="' + esc(t.id) + '" data-op="reply">回复</button>' +
        (closed
          ? ''
          : '<button class="btn btn-outline btn-sm" data-action="admin-ticket-action" data-id="' + esc(t.id) + '" data-op="processing">标记处理中</button>' +
            '<button class="btn btn-primary btn-sm" data-action="admin-ticket-action" data-id="' + esc(t.id) + '" data-op="resolve">结案解决</button>' +
            '<button class="btn btn-danger-ghost btn-sm" data-action="admin-ticket-action" data-id="' + esc(t.id) + '" data-op="reject">驳回</button>' +
            (canFinance
              ? '<button class="btn btn-danger-ghost btn-sm" data-action="admin-arbitrate" data-id="' + esc(t.id) + '">仲裁退款(财务)</button>'
              : '')) +
        '</div>' +
        '<div class="field" style="margin-top:10px"><label>沟通记录</label></div>' +
        '<div class="chat-flow" style="max-height:220px;overflow:auto">' + (msgs || '<div style="color:var(--muted);font-size:12.5px">暂无回复</div>') + '</div>' +
        '</div>',
      true
    );
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminTicketAction(id, op) {
  const text = document.getElementById('admin-ticket-text');
  const val = String((text && text.value) || '').trim();
  if (op === 'reply' && !val) {
    toast('请先输入回复内容', 'err');
    return;
  }
  if ((op === 'resolve' || op === 'reject') && !val) {
    toast('请填写处理说明', 'err');
    return;
  }
  try {
    await api.adminTicketAction(id, { action: op, text: val, note: val });
    toast('工单已更新');
    closeModal();
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onAdminArbitrate(id) {
  const t = state.adminTicketDetail && state.adminTicketDetail.ticket;
  const max = (t && t.purchase && t.purchase.maxRefund) || 0;
  if (!t || !t.purchase) {
    toast('该工单未关联订单,不能裁定退款金额', 'err');
    return;
  }
  const raw = window.prompt('仲裁退款金额(元,上限 ' + max.toFixed(2) + ',输入 0 表示维持原状):', String(max));
  if (raw === null) return;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    toast('金额无效', 'err');
    return;
  }
  const note = window.prompt('仲裁结论备注(可选):', '') || '';
  try {
    await api.adminArbitrate(id, { refundAmount: amount, note });
    toast('已仲裁结案');
    closeModal();
    await renderAdmin();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onSettingsTab(tab) {
  state.settingsTab = tab;
  app.innerHTML = views.settingsView(state);
}

async function onSettingsAccent(val) {
  if (!state.user.settings) state.user.settings = {};
  state.user.settings.theme = val;
  applyPreferences();
  try {
    await api.updateSettings({ theme: val });
    toast('强调色已保存');
    app.innerHTML = views.settingsView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function onSettingsDensity(val) {
  if (!state.user.settings) state.user.settings = {};
  state.user.settings.density = val;
  applyPreferences();
  try {
    await api.updateSettings({ density: val });
    toast('显示密度已保存');
    app.innerHTML = views.settingsView(state);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function onLogoutDevices() {
  (async () => {
    try {
      const d = await api.logoutOthers();
      setToken(d.token);
      toast('已退出其他设备,当前会话已续签');
    } catch (err) {
      toast(err.message, 'err');
      // 发送失败:回滚本地乐观消息,以服务端为准
      try {
        const d = await api.chat(state.chatOther.id);
        state.messages = d.messages;
        app.innerHTML = views.chatView(state);
        if (textEl) textEl.value = text;
      } catch (ignore) {}
    }
  })();
}

// ---------------- 事件分发 ----------------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  if (action === 'nav') return onNav(el.dataset.href);
  if (action === 'logout') return onLogout();
  if (action === 'open-skill') {
    location.hash = '#/skill/' + id;
    return;
  }
  if (action === 'open-folder') {
    location.hash = '#/folder/' + id;
    return;
  }
  if (action === 'pick' || action === 'pick-dot') {
    const picks = state.skills.filter((s) => s.hot);
    if (!picks.length) return;
    if (action === 'pick') state.pickIdx = (state.pickIdx + Number(el.dataset.dir) + picks.length) % picks.length;
    else state.pickIdx = Math.min(Number(el.dataset.i), picks.length - 1);
    const slides = document.getElementById('picks-slides');
    if (slides) slides.style.transform = 'translateX(-' + state.pickIdx * 100 + '%)';
    document.querySelectorAll('.picks-dots span').forEach((d, i) => d.classList.toggle('on', i === state.pickIdx));
    return;
  }
  if (action === 'cat-page') {
    const pages = 15;
    state.catPage = (state.catPage + Number(el.dataset.dir) + pages) % pages;
    app.innerHTML = views.marketView(state);
    return;
  }
  if (action === 'cat-select') return onCatSelect(id);
  if (action === 'cat-from-detail') {
    state.filters.category = id;
    location.hash = '#/market';
    return;
  }
  if (action === 'filter-toggle') {
    const dd = document.getElementById('filter-dd');
    if (dd) dd.classList.toggle('open');
    return;
  }
  if (action === 'filter-opt') return onFilterOpt(el.dataset.key, el.dataset.val);
  if (action === 'filter-clear') return onFilterClear(el.dataset.key);
  if (action === 'clear-filters') return onClearFilters();
  if (action === 'toggle-plan') return onTogglePlan();
  if (action === 'buy') return onBuy();
  if (action === 'buy-own-confirm') return onBuyOwnConfirm();
  if (action === 'buy-tab') return onBuyTab(el.dataset.method);
  if (action === 'pick-days') return onPickDays(el.dataset.days);
  if (action === 'to-pay') return onToPay();
  if (action === 'pay-channel') return onPayChannel(el.dataset.val);
  if (action === 'pay-done') return onPayDone();
  if (action === 'gallery') return onGallery(el.dataset.dir);
  if (action === 'gallery-dot') return onGalleryDot(el.dataset.i);
  if (action === 'star-set') return onStarSet(el.dataset.val);
  if (action === 'library-key') return onLibraryKey(id);
    if (action === 'download-skill') return onDownloadSkill(id, el.dataset.target);
  if (action === 'download-source') return onDownloadSource(id);
  if (action === 'download-runner') return onDownloadRunner();
  if (action === 'test-run') return onTestRun(el.dataset.key);
  if (action === 'copy-key') return onCopyKey(el.dataset.key);
  if (action === 'edit-nick') return onEditNick();
  if (action === 'avatar-upload') return onAvatarUpload();
  if (action === 'create-folder') return onCreateFolder();
  if (action === 'rename-folder') return onRenameFolder(id, el.dataset.name);
  if (action === 'delete-folder') return onDeleteFolder(id);
  if (action === 'delete-folder-confirm') return onDeleteFolderConfirm(id);
  if (action === 'folder-add') return onFolderAdd();
  if (action === 'folder-add-confirm') return onFolderAddConfirm(id);
  if (action === 'folder-remove') return onFolderRemove(id);
  if (action === 'plan-remove') return onPlanRemove(id);
  if (action === 'plan-folder-toggle') {
    const el2 = document.querySelector('.plan-folder[data-id="' + id + '"]');
    if (el2) el2.classList.toggle('open');
    return;
  }
  if (action === 'create-plan-folder') return onCreatePlanFolder();
  if (action === 'rename-plan-folder') return onRenamePlanFolder(id, el.dataset.name);
  if (action === 'delete-plan-folder') return onDeletePlanFolder(id);
  if (action === 'delete-plan-folder-confirm') return onDeletePlanFolderConfirm(id);
  if (action === 'plan-move') return onPlanMove(id);
  if (action === 'plan-move-confirm') return onPlanMoveConfirm(id, el.dataset.folder);
  if (action === 'plan-folder-remove-item') return onPlanFolderRemoveItem(id);
  if (action === 'open-chat') return onOpenChat(id);
  if (action === 'open-profile') return onOpenProfile(id);
  if (action === 'inbox-tab') {
    state.inboxTab = el.dataset.tab;
    app.innerHTML = views.inboxView(state);
    return;
  }
  if (action === 'inbox-read-all') return onInboxReadAll();
  if (action === 'buy-from-plan') return onBuyFromPlan(id);
  if (action === 'chat-intent') return onChatIntent(el.dataset.intent);
  if (action === 'chat-plus') return onChatPlus();
  if (action === 'chat-send-link') return onChatSendLink();
  if (action === 'chat-link-confirm') return onChatLinkConfirm(id);
  if (action === 'chat-send-image') return onChatSendImage();
  if (action === 'report-user') return openReportUser(id);
  if (action === 'go-back') {
    if (window.history.length > 1) window.history.back();
    else location.hash = '#/market';
    return;
  }
  if (action === 'modal-close') return closeModal();
  if (action === 'modal-mask') {
    if (e.target === el) closeModal();
    return;
  }
  if (action === 'send-sms') return onSendSms();
  if (action === 'toggle-pwd') {
    const wrap = el.closest('.pwd-wrap');
    const input = wrap && wrap.querySelector('input');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
      el.innerHTML = icon(input.type === 'password' ? 'eye' : 'eyeOff', 'sm');
    }
    return;
  }
  if (action === 'toggle-setting') return onToggleSetting(el.dataset.key);
  if (action === 'settings-tab') return onSettingsTab(el.dataset.tab);
  if (action === 'settings-accent') return onSettingsAccent(el.dataset.val);
  if (action === 'settings-density') return onSettingsDensity(el.dataset.val);
  if (action === 'logout-devices') return onLogoutDevices();
  if (action === 'admin-save-cat') return onAdminSaveCat(el);
  if (action === 'admin-save-skill') return onAdminSaveSkill(el);
  if (action === 'admin-new-cat') return onAdminNewCat();
  if (action === 'admin-delete-cat') return onAdminDeleteCat(id);
  if (action === 'admin-delete-cat-confirm') return onAdminDeleteCatConfirm(id);
  if (action === 'admin-skill-takedown') return onAdminSkillTakedown(id, el.dataset.op);
  if (action === 'admin-tab') {
    state.adminTab = el.dataset.tab;
    await renderAdmin(); // 切页签时重新拉取最新数据,避免停留在旧列表(认证/工单等提交后看不到)
    return;
  }
  if (action === 'admin-approve') return onAdminApprove(id, el.dataset.approve === 'true');
  if (action === 'admin-review-skill') return onAdminReviewSkill(id);
  if (action === 'admin-review-approve') return onAdminReviewApprove(id);
  if (action === 'admin-review-reject') return onAdminReviewReject(id);
  if (action === 'admin-review-reinstate') return onAdminReviewReinstate(id);
  if (action === 'admin-review-delist') return openAdminDelistModal(id);
  if (action === 'admin-save-platform') return onAdminSavePlatform(el);
  if (action === 'admin-withdraw') return onAdminWithdraw(id, el.dataset.status);
  if (action === 'admin-review') return onAdminReview(id, el.dataset.op);
  if (action === 'admin-cert') return onAdminCert(id, true);
  if (action === 'admin-cert-reject') return onAdminCertReject(id);
  if (action === 'admin-cert-file') return onAdminCertFile(id);
  if (action === 'admin-user-status') return onAdminUserStatus(id, el.dataset.status);
  if (action === 'admin-penalty') return onAdminPenalty(id, el.dataset.act);
  if (action === 'admin-penalty-confirm') return onAdminPenaltyConfirm(id);
  if (action === 'admin-db-backup') return onAdminDbBackup();
  if (action === 'admin-db-export') return onAdminDbExport();
  if (action === 'admin-db-vacuum') return onAdminDbVacuum();
  if (action === 'admin-approval-create') return onAdminApprovalCreate(id);
  if (action === 'admin-approval-execute') return onAdminApprovalExecute(id, el.dataset.approvalAction);
  if (action === 'admin-approval-reject') return onAdminApprovalReject(id);
  if (action === 'new-request') return onNewRequest();
  if (action === 'take-request') return onTakeRequest(id);
  if (action === 'close-request') return onCloseRequest(id);
  if (action === 'close-request-confirm') return onCloseRequestConfirm(id);
  if (action === 'request-detail') return onRequestDetail(id);
  if (action === 'request-reject') return onRequestReject(id, el.dataset.taker);
  if (action === 'request-reject-confirm') return onRequestRejectConfirm(id);
  if (action === 'request-link') return onRequestLink(id);
  if (action === 'request-link-confirm') return onRequestLinkConfirm(el.dataset.request, el.dataset.skill);
  if (action === 'new-ticket') return onNewTicket();
  if (action === 'open-ticket') {
    location.hash = '#/ticket/' + id;
    return;
  }
  if (action === 'ticket-escalate') return onTicketEscalate(id);
  if (action === 'library-refund') return onLibraryRefund(id, el.dataset.method);
  if (action === 'library-refund-confirm') return onLibraryRefundConfirm(id);
  if (action === 'seller-tab') return onSellerTab(el.dataset.tab);
  if (action === 'seller-refund') return onSellerRefund(id, el.dataset.approve === 'true');
  if (action === 'admin-realname') return onAdminRealname(id, el.dataset.approve === 'true');
  if (action === 'admin-realname-file') return onAdminRealnameFile(id);
  if (action === 'admin-request') return onAdminRequest(id, el.dataset.op);
  if (action === 'admin-ticket-open') return onAdminTicketOpen(id);
  if (action === 'admin-ticket-action') return onAdminTicketAction(id, el.dataset.op);
  if (action === 'admin-arbitrate') return onAdminArbitrate(id);
  if (action === 'buy-slot') return onBuySlot();
  if (action === 'buy-slot-confirm') return onBuySlotConfirm();
  if (action === 'seller-version') return onSellerVersion(id);
  if (action === 'up-tab') return onUpTab(el.dataset.mode);
  if (action === 'cover-preview') return onCoverPreview(el);
  if (action === 'delist-skill') return onDelistSkill(id);
  if (action === 'delist-skill-confirm') return onDelistSkillConfirm(id);
  if (action === 'restore-skill') return onRestoreSkill(id);
  if (action === 'resubmit-skill') return onResubmitSkill(id);
  if (action === 'admin-reset') return onAdminReset();
  if (action === 'toast') return toast(el.dataset.msg);
  if (action === 'switch-auth') return onSwitchAuth();
  if (action === 'demo-login') return doLogin(el.dataset.user, 'demo123');
});

document.addEventListener('change', async (e) => {
  const el = e.target.closest('[data-action="admin-user-role"]');
  if (!el) return;
  await onAdminUserRole(el.dataset.id, el.value);
});

function onSwitchAuth() {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const hint = document.getElementById('switch-hint');
  const btn = document.getElementById('switch-btn');
  const toRegister = registerForm.classList.contains('hidden');
  loginForm.classList.toggle('hidden', toRegister);
  registerForm.classList.toggle('hidden', !toRegister);
  if (toRegister) {
    title.textContent = '创建账号';
    sub.textContent = '注册后即可逛市场、买 Skill';
    hint.textContent = '已有账号?';
    btn.textContent = '去登录';
  } else {
    title.textContent = '欢迎回来';
    sub.textContent = '登录你的访迹账号';
    hint.textContent = '还没有账号?';
    btn.textContent = '立即注册';
  }
}

async function doLogin(username, password) {
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.textContent = '';
  try {
    const d = await api.login({ username, password });
    setToken(d.token);
    state.user = d.user;
    applyPreferences();
    toast('欢迎回来,' + d.user.nickname + '!');
    location.replace('#/market');
  } catch (err) {
    if (errEl) errEl.textContent = err.message;
    else toast(err.message, 'err');
  }
}

// ---------------- 表单 ----------------
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'search') {
    const q = String(new FormData(form).get('q') || '').trim();
    state.filters.q = q;
    state.searchQ = q;
    await loadSkills();
    await renderMarket();
    return;
  }
  if (kind === 'login') {
    const fd = new FormData(form);
    await doLogin(String(fd.get('account') || ''), String(fd.get('password') || ''));
    return;
  }
  if (kind === 'register') {
    const fd = new FormData(form);
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';
    const password = String(fd.get('password') || '');
    if (password !== String(fd.get('confirm') || '')) {
      errEl.textContent = '两次输入的密码不一致';
      return;
    }
    try {
      const d = await api.register({
        username: fd.get('username'),
        password,
        phone: fd.get('phone'),
        code: fd.get('code'),
      });
      setToken(d.token);
      state.user = d.user;
      applyPreferences();
      toast('注册成功,欢迎登船!');
      location.replace('#/market');
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'password') {
    const fd = new FormData(form);
    const errEl = document.getElementById('pwd-error');
    errEl.textContent = '';
    const next = String(fd.get('next') || '');
    if (next !== String(fd.get('confirm') || '')) {
      errEl.textContent = '两次输入的新密码不一致';
      return;
    }
    try {
      const d = await api.changePassword({ old: fd.get('old'), next });
      setToken(d.token);
      toast('密码已修改,其他设备已退出登录');
      form.reset();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'profile') {
    const fd = new FormData(form);
    const nickname = String(fd.get('nickname') || '').trim();
    if (!nickname || nickname.length > 20) {
      toast('昵称需为 1-20 个字符', 'err');
      return;
    }
    try {
      await api.updateMe({ nickname, bio: String(fd.get('bio') || '').trim().slice(0, 200) });
      await refreshMe();
      toast('资料已保存');
      app.innerHTML = views.settingsView(state);
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'certification') {
    const errEl = document.getElementById('cert-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    const fileInput = form.elements.certFile;
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (!file) {
      errEl.textContent = '请选择证明材料图片';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      errEl.textContent = '证明材料需小于 2MB';
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('读取文件失败'));
      r.readAsDataURL(file);
    });
    try {
      await api.submitCertification({
        type: fd.get('type'),
        certTitle: fd.get('certTitle'),
        fileName: file.name,
        fileData: dataUrl,
      });
      toast('认证材料已提交,等待管理员审核');
      await renderSettings();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'realname') {
    const errEl = document.getElementById('realname-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    const fileInput = form.elements.certFile;
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (!file) {
      errEl.textContent = '请上传与证件一致的证件照片';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      errEl.textContent = '证件照片需小于 2MB';
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('读取图片失败'));
      r.readAsDataURL(file);
    });
    try {
      await api.submitRealname({
        name: String(fd.get('name') || '').trim(),
        idNo: String(fd.get('idNo') || '').trim(),
        fileName: file.name,
        fileData: dataUrl,
      });
      toast('实名信息已提交,等待管理员审核');
      await renderSettings();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'cat-create') {
    const errEl = document.getElementById('cat-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    try {
      await api.adminCreateCategory({ name: String(fd.get('name') || '').trim(), icon: fd.get('icon'), color: fd.get('color') });
      toast('分类已创建');
      closeModal();
      const c = await api.categories();
      state.categories = c.categories;
      app.innerHTML = views.adminView(state);
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'request-create') {
    const errEl = document.getElementById('request-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    try {
      await api.createRequest({
        title: fd.get('title'),
        description: fd.get('description'),
        category: fd.get('category'),
        budget: Number(fd.get('budget')),
      });
      toast('求购已发布,等卖家接单');
      closeModal();
      await renderRequests();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'ticket-create') {
    const errEl = document.getElementById('ticket-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    try {
      await api.createTicket({
        type: fd.get('type'),
        title: fd.get('title'),
        text: fd.get('text'),
        skillId: fd.get('skillId') || '',
        purchaseId: fd.get('purchaseId') || '',
        requestId: fd.get('requestId') || '',
      });
      toast('工单已提交,客服会尽快处理');
      closeModal();
      await renderHelp();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'ticket-reply') {
    const text = String(new FormData(form).get('text') || '').trim();
    if (!text) return;
    try {
      await api.replyTicket(state.ticketDetail.id, text);
      await renderTicket(state.ticketDetail.id);
      toast('回复已发送');
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'seller-publish') {
    const errEl = document.getElementById('publish-error');
    errEl.textContent = '';
    const fd = new FormData(form);
    const fileInput = form.elements.srcfile;
    const chosen = fileInput && fileInput.files ? [...fileInput.files] : [];
    if (!chosen.length) {
      errEl.textContent = '请选择要上传的源文件';
      return;
    }
    const totalSize = chosen.reduce((a, f) => a + f.size, 0);
    if (totalSize > 5 * 1024 * 1024) {
      errEl.textContent = '文件合计需小于 5MB';
      return;
    }
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('读取文件失败'));
      r.readAsDataURL(file);
    });
    const models = [...form.querySelectorAll('input[name="models"]:checked')].map((i) => i.value);
    const iconKey = (form.querySelector('input[name="icon"]:checked') || {}).value || 'box';
    const body = {
      title: fd.get('title'),
      category: fd.get('category'),
      priceApi: Number(fd.get('priceApi') || 0),
      buyoutPrice: Number(fd.get('buyoutPrice') || 0),
      buyoutAvailable: Number(fd.get('buyoutPrice') || 0) > 0,
      privacyMode: fd.get('privacyMode') || 'sandbox',
      models,
      icon: iconKey,
      intro: fd.get('intro'),
      description: fd.get('description'),
    };
    if (chosen.length === 1 && /\.zip$/i.test(chosen[0].name)) {
      body.zipName = chosen[0].name;
      body.zipData = String(await toBase64(chosen[0])).split(',')[1];
    } else if (chosen.length > 1) {
      const rel = chosen[0].webkitRelativePath || chosen[0].name;
      body.folderName = rel.split('/')[0] || 'skill';
      body.files = [];
      for (const f of chosen) {
        body.files.push({ name: f.webkitRelativePath || f.name, data: String(await toBase64(f)).split(',')[1] });
      }
    } else {
      body.fileName = chosen[0].name;
      body.fileData = String(await toBase64(chosen[0])).split(',')[1];
    }
    const coverInput = form.elements.coverImage;
    if (coverInput && coverInput.files && coverInput.files[0]) {
      body.coverImage = await toBase64(coverInput.files[0]);
    }
    try {
      const d = await api.sellerCreate(body);
      toast('已加密并提交,目录结构取自你的真实文件(' + d.structure.length + ' 个文件)');
      form.reset();
      await renderSeller();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'seller-version') {
    const errEl = document.getElementById('version-error');
    errEl.textContent = '';
    const file = form.elements.srcfile.files[0];
    const changelog = String(new FormData(form).get('changelog') || '').trim();
    if (!file) {
      errEl.textContent = '请选择源文件';
      return;
    }
    if (!changelog) {
      errEl.textContent = '请填写更新说明';
      return;
    }
    try {
      const dataUrl = await readFileDataURL(file);
      const fileData = String(dataUrl).split(',')[1] || '';
      const d = await api.sellerNewVersion(form.dataset.id, { fileData, fileName: file.name, changelog });
      toast('新版本 v' + d.version + ' 已提交审核');
      closeModal();
      await renderSeller();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'withdraw') {
    const amount = Number(new FormData(form).get('amount'));
    const errEl = document.getElementById('withdraw-error');
    errEl.textContent = '';
    try {
      const d = await api.withdraw(amount);
      toast('提现申请已提交,等待平台打款');
      state.balance = d.balance;
      await renderWallet();
    } catch (err) {
      errEl.textContent = err.message;
    }
    return;
  }
  if (kind === 'review') {
    const rating = state.reviewRating || 5;
    const text = String(new FormData(form).get('text') || '').trim();
    try {
      const d = await api.review(state.detail.id, { rating, text });
      state.detail = d.skill;
      state.reviewRating = 0;
      toast('评价已提交,感谢反馈!');
      const y = window.scrollY;
      app.innerHTML = views.detailView(state);
      window.scrollTo(0, y);
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'report') {
    const targetId = form.dataset.target;
    const reason = String(new FormData(form).get('reason') || '').trim();
    const text = String(new FormData(form).get('text') || '').trim();
    try {
      await api.reportUser(targetId, { reason, text });
      toast('举报已提交,平台会尽快核查');
      closeModal();
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'penalty') {
    const targetId = form.dataset.target;
    const act = form.dataset.act;
    const fd = new FormData(form);
    const days = Number(fd.get('days') || 0);
    const permanent = fd.get('permanent') === 'on';
    const note = String(fd.get('note') || '').trim();
    try {
      await api.adminUserPenalty(targetId, { action: act, days, permanent, note });
      toast('处罚已执行');
      closeModal();
      await renderAdmin();
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'admin-delist') {
    const skillId = form.dataset.skill || (state.detail && state.detail.id);
    const fd = new FormData(form);
    const base = String(fd.get('reason') || '').trim() || '平台审核下架';
    const note = String(fd.get('note') || '').trim();
    const reason = base + (note ? ':' + note : '');
    try {
      await api.adminUpdateSkill(skillId, { action: 'delist', reason });
      toast('已强制下架');
      closeModal();
      if (currentPath() === '/admin') await renderAdmin();
      else await refreshDetailAfterAdmin(skillId);
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'chat') {
    const textEl = form.elements.text;
    const text = String(textEl.value || '').trim();
    if (!text) return;
    textEl.value = '';
    state.messages.push({ from: state.user.id, text, at: Date.now() });
    app.innerHTML = views.chatView(state);
    const body = document.getElementById('chat-body');
    if (body) body.scrollTop = body.scrollHeight;
    body.insertAdjacentHTML(
      'beforeend',
      '<div class="typing">' + avatarHTML(state.chatOther, 'sm') + '<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>'
    );
    try {
      await api.sendMessage(state.chatOther.id, { kind: 'text', text });
      await new Promise((r) => setTimeout(r, 900));
      const d = await api.chat(state.chatOther.id);
      state.messages = d.messages;
      app.innerHTML = views.chatView(state);
      const b2 = document.getElementById('chat-body');
      if (b2) b2.scrollTop = b2.scrollHeight;
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
  if (kind === 'prompt') {
    const input = form.querySelector('input');
    const value = String(input.value || '').trim();
    const submitAction = form.querySelector('[data-submit-action]').dataset.submitAction;
    if (!value) {
      toast('请输入内容', 'err');
      return;
    }
    try {
      if (submitAction === 'create-folder') {
        await api.createProject(value);
        toast('文件夹已创建');
        closeModal();
        await renderMe();
      } else if (submitAction === 'save-nick') {
        await api.updateMe({ nickname: value });
        await refreshMe();
        toast('昵称已更新');
        closeModal();
        await renderMe();
      } else if (submitAction === 'rename-folder') {
        await api.renameProject(folderCtx.id, value);
        toast('已重命名');
        closeModal();
        if (currentPath().startsWith('/folder/')) await renderFolder(state.project.id);
        else await renderMe();
      } else if (submitAction === 'create-plan-folder') {
        await api.createPlanFolder(value);
        toast('计划文件夹已创建');
        closeModal();
        await renderPlans();
      } else if (submitAction === 'rename-plan-folder') {
        await api.renamePlanFolder(folderCtx.id, value);
        toast('已重命名');
        closeModal();
        await renderPlans();
      }
    } catch (err) {
      toast(err.message, 'err');
    }
    return;
  }
});

// ---------------- 工具 ----------------
function drawFakeQR() {
  const canvas = document.getElementById('pay-qr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const n = 21;
  const cell = canvas.width / n;
  let seed = Math.abs((purchaseCtx.amount * 31 + (purchaseCtx.channel === 'wechat' ? 7 : 13)) % 2147483647) || 1;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#10233f';
  const finder = (r, c, fr, fc) => {
    const lr = r - fr;
    const lc = c - fc;
    return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let dark = false;
      if (r < 7 && c < 7) dark = finder(r, c, 0, 0);
      else if (r < 7 && c >= n - 7) dark = finder(r, c, 0, n - 7);
      else if (r >= n - 7 && c < 7) dark = finder(r, c, n - 7, 0);
      else dark = rnd() > 0.52;
      if (dark) ctx.fillRect(c * cell, r * cell, cell + 0.5, cell + 0.5);
    }
  }
}

async function boot() {
  await refreshMe();
  window.addEventListener('hashchange', render);
  await render();
}

boot();
