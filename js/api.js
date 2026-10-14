// EdgeOne Pages static demo adapter.
// It keeps the original UI working without a server by serving bundled demo data
// and storing user changes in localStorage. It is not a production backend.

let token = localStorage.getItem('fj_token') || null;
let dataPromise = null;
let activeState = null;

const STATIC_PREFIX = 'static:';
const STATE_PREFIX = 'fj_edgeone_state_';
const REGISTRY_KEY = 'fj_edgeone_registered_users';

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
const now = () => Date.now();
const randomId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function loadData() {
  if (!dataPromise) {
    dataPromise = fetch('/mock-data.json', { cache: 'no-store' }).then((response) => {
      if (!response.ok) throw new Error('静态演示数据加载失败');
      return response.json();
    });
  }
  return dataPromise;
}

function readRegistry() {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function currentAccount() {
  return token && token.startsWith(STATIC_PREFIX) ? token.slice(STATIC_PREFIX.length) : '';
}

function baseRoleFor(account, data) {
  return data.roles[account] ? account : 'demo';
}

function stateStorageKey(account) {
  return STATE_PREFIX + encodeURIComponent(account || 'guest');
}

function normalizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    skillIds: (project.skills || []).map((skill) => skill.id),
  };
}

function normalizePlanFolder(folder) {
  return {
    id: folder.id,
    name: folder.name,
    skillIds: (folder.skills || []).map((skill) => skill.id),
  };
}

async function getState() {
  const data = await loadData();
  const account = currentAccount();
  if (!account) throw new Error('登录已过期,请重新登录');
  if (activeState && activeState.account === account) return activeState;

  const saved = localStorage.getItem(stateStorageKey(account));
  if (saved) {
    try {
      activeState = JSON.parse(saved);
      return activeState;
    } catch {}
  }

  const role = baseRoleFor(account, data);
  const snapshot = data.roles[role];
  const registered = readRegistry()[account];
  const me = clone(snapshot['/api/auth/me'].user);
  if (registered) Object.assign(me, registered.user);
  const plans = clone(snapshot['/api/plans'] || { plans: [], folders: [] });
  const projects = clone(snapshot['/api/projects'] || { projects: [] });
  const inbox = clone(snapshot['/api/inbox'] || { inbox: [] });
  const requests = clone(snapshot['/api/requests'] || { requests: [] });
  const tickets = clone(snapshot['/api/tickets'] || { tickets: [] });
  const sellerSkills = clone(snapshot['/api/seller/skills'] || { skills: [] });

  activeState = {
    account,
    role,
    user: me,
    planIds: plans.plans.map((skill) => skill.id),
    planFolders: plans.folders.map(normalizePlanFolder),
    projects: projects.projects.map(normalizeProject),
    library: clone((snapshot['/api/library'] || { library: [] }).library),
    inbox: inbox.inbox,
    requests: requests.requests,
    tickets: tickets.tickets,
    ticketReplies: {},
    messages: role === 'demo' && snapshot['/api/chat/s1'] ? { s1: snapshot['/api/chat/s1'].messages } : {},
    sellerSkills: sellerSkills.skills,
    wallet: clone(snapshot['/api/wallet'] || { balance: 0, withdrawable: 0, frozenRefundable: 0, escrowPendingFen: 0, withdrawals: [] }),
    certification: clone((snapshot['/api/auth/me/certification'] || { certification: { status: 'none' } }).certification),
    realname: clone((snapshot['/api/auth/me/realname'] || { realname: { status: 'none' } }).realname),
  };
  saveState();
  return activeState;
}

function saveState() {
  if (activeState) localStorage.setItem(stateStorageKey(activeState.account), JSON.stringify(activeState));
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    phone: user.phone || '',
    avatar: user.avatar,
    title: user.title || '',
    bio: user.bio || '',
    verified: !!user.verified,
    certification: user.certification || { status: 'none' },
    realname: user.realname || { status: 'none' },
    role: user.role,
    status: user.status || 'active',
    settings: user.settings || {},
    createdAt: user.createdAt || now(),
    lastLoginAt: user.lastLoginAt || now(),
  };
}

function findSkill(data, state, id) {
  return (
    state.sellerSkills.find((skill) => skill.id === id) ||
    data.shared['/api/skills'].skills.find((skill) => skill.id === id) ||
    null
  );
}

function hydratePurchase(data, state, purchase) {
  const skill = findSkill(data, state, purchase.skillId) || purchase.skill;
  const days = Number(purchase.days || 0);
  const usedDays = purchase.usedDays || [];
  return {
    ...clone(purchase),
    skill: clone(skill),
    remainingDays: purchase.method === 'api' ? Math.max(0, days - usedDays.length) : 0,
    latestVersion: (skill && skill.version) || purchase.latestVersion || 1,
    hasUpdate: false,
    refunded: !!purchase.refunded,
  };
}

function skillDetail(data, state, id) {
  const raw = findSkill(data, state, id);
  if (!raw) throw new Error('Skill 不存在');
  const skill = clone(raw);
  const purchase = state.library.find((item) => item.skillId === id && !item.refunded);
  skill.myPurchase = purchase ? hydratePurchase(data, state, purchase) : null;
  skill.inPlan = state.planIds.includes(id) || state.planFolders.some((folder) => folder.skillIds.includes(id));
  skill.mine = skill.sellerId === state.user.id;
  skill.myReview = (skill.reviews || []).find((review) => review.userId === state.user.id) || null;
  return skill;
}

function roleSnapshot(data, state, path, fallback = null) {
  const roleData = data.roles[state.role] || data.roles.demo;
  return clone(roleData[path] ?? fallback);
}

function filterSkills(data, state, url) {
  let skills = clone(data.shared['/api/skills'].skills);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const category = url.searchParams.get('category') || '';
  const model = url.searchParams.get('model') || '';
  const method = url.searchParams.get('method') || '';
  const sort = url.searchParams.get('sort') || '';
  if (q) {
    skills = skills.filter((skill) => [skill.title, skill.intro, skill.description, skill.category, skill.seller && skill.seller.nickname].join(' ').toLowerCase().includes(q));
  }
  if (category && category !== '全部') skills = skills.filter((skill) => skill.category === category || (skill.breadcrumb || []).includes(category));
  if (model) skills = skills.filter((skill) => (skill.models || []).includes(model));
  if (method === 'buyout') skills = skills.filter((skill) => skill.buyoutAvailable);
  if (method === 'api') skills = skills.filter((skill) => Number(skill.priceApi) >= 0);
  if (sort === 'latest') skills.sort((a, b) => Number(b.createdAt || b.updatedAt || 0) - Number(a.createdAt || a.updatedAt || 0));
  else if (sort === 'rating') skills.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  else skills.sort((a, b) => Number(b.hot) - Number(a.hot) || Number(b.sold || 0) - Number(a.sold || 0));
  return { skills };
}

function userProfile(data, state, userId) {
  if (state.user.id === userId) {
    return { profile: publicUser(state.user), self: true, skills: state.sellerSkills.map(clone) };
  }
  const skill = data.shared['/api/skills'].skills.find((item) => item.sellerId === userId);
  const seller = skill && skill.seller;
  const profile = seller
    ? { ...clone(seller), username: '', phone: '', role: 'seller', status: 'active', settings: { contactable: true }, createdAt: 1750000000000, lastLoginAt: 0 }
    : { id: userId, nickname: '访迹用户', avatar: { type: 'initials', text: '访', bg: '#2563eb' }, verified: false, status: 'active' };
  return {
    profile,
    self: false,
    skills: data.shared['/api/skills'].skills.filter((item) => item.sellerId === userId).map(clone),
  };
}

function requestBody(opts) {
  if (opts.body == null) return {};
  if (typeof opts.body === 'string') {
    try {
      return JSON.parse(opts.body);
    } catch {
      return {};
    }
  }
  return opts.body;
}

export function setToken(value) {
  token = value;
  activeState = null;
  if (value) localStorage.setItem('fj_token', value);
  else localStorage.removeItem('fj_token');
}

export function getToken() {
  return token;
}

export async function request(path, opts = {}) {
  await new Promise((resolve) => setTimeout(resolve, 45));
  const data = await loadData();
  const method = String(opts.method || 'GET').toUpperCase();
  const body = requestBody(opts);
  const url = new URL(path, location.origin);
  const route = url.pathname;

  if (route === '/api/auth/login' && method === 'POST') {
    const account = String(body.username || body.account || '').trim();
    const known = ['demo', 'seller', 'admin'];
    const registry = readRegistry();
    if ((!known.includes(account) && !registry[account]) || (!registry[account] && body.password !== 'demo123')) {
      throw new Error('账号或密码错误');
    }
    setToken(STATIC_PREFIX + account);
    const state = await getState();
    return { token, user: publicUser(state.user) };
  }

  if (route === '/api/auth/register' && method === 'POST') {
    const account = String(body.username || '').trim();
    if (!account) throw new Error('请输入用户名');
    const registry = readRegistry();
    if (['demo', 'seller', 'admin'].includes(account) || registry[account]) throw new Error('用户名已存在');
    registry[account] = {
      user: {
        id: randomId('u'),
        username: account,
        nickname: account,
        phone: String(body.phone || '').replace(/^(\d{3})\d+(\d{4})$/, '$1****$2'),
        avatar: { type: 'initials', text: account.slice(0, 1).toUpperCase(), bg: '#2563eb' },
        title: '',
        bio: '',
        verified: false,
        role: 'buyer',
        status: 'active',
        settings: { notify: true, contactable: true, theme: 'blue', density: 'comfortable' },
        createdAt: now(),
        lastLoginAt: now(),
      },
    };
    writeRegistry(registry);
    setToken(STATIC_PREFIX + account);
    const state = await getState();
    return { token, user: publicUser(state.user) };
  }

  if (route === '/api/auth/sms' && method === 'POST') return { code: '246810', demo: true };

  const state = await getState();

  if (route === '/api/auth/me' && method === 'GET') return { user: publicUser(state.user) };
  if (route === '/api/auth/me' && method === 'PATCH') {
    Object.assign(state.user, body);
    saveState();
    return { user: publicUser(state.user) };
  }
  if (route === '/api/auth/settings' && method === 'PATCH') {
    state.user.settings = { ...(state.user.settings || {}), ...body };
    saveState();
    return { user: publicUser(state.user) };
  }
  if (route === '/api/auth/password' && method === 'POST') return { token: STATIC_PREFIX + state.account };
  if (route === '/api/auth/logout-others' && method === 'POST') return { token: STATIC_PREFIX + state.account };
  if (route === '/api/auth/me/avatar' && method === 'POST') {
    state.user.avatar = { type: 'image', data: body.data };
    saveState();
    return { user: publicUser(state.user) };
  }
  if (route === '/api/auth/me/certification' && method === 'GET') return { certification: clone(state.certification) };
  if (route === '/api/auth/me/certification' && method === 'POST') {
    state.certification = { ...body, status: 'pending', submittedAt: now(), hasFile: true };
    saveState();
    return { certification: clone(state.certification) };
  }
  if (route === '/api/auth/me/realname' && method === 'GET') return { realname: clone(state.realname) };
  if (route === '/api/auth/me/realname' && method === 'POST') {
    state.realname = { ...body, idNo: '330***********001', status: 'pending', submittedAt: now() };
    saveState();
    return { realname: clone(state.realname) };
  }

  if (route === '/api/categories' && method === 'GET') return clone(data.shared['/api/categories']);
  if (route === '/api/skills' && method === 'GET') return filterSkills(data, state, url);
  const skillMatch = route.match(/^\/api\/skills\/([^/]+)$/);
  if (skillMatch && method === 'GET') return { skill: skillDetail(data, state, decodeURIComponent(skillMatch[1])) };

  const planMatch = route.match(/^\/api\/skills\/([^/]+)\/plan$/);
  if (planMatch && method === 'POST') {
    const id = decodeURIComponent(planMatch[1]);
    if (!state.planIds.includes(id)) state.planIds.push(id);
    saveState();
    return { ok: true };
  }
  if (planMatch && method === 'DELETE') {
    const id = decodeURIComponent(planMatch[1]);
    state.planIds = state.planIds.filter((value) => value !== id);
    for (const folder of state.planFolders) folder.skillIds = folder.skillIds.filter((value) => value !== id);
    saveState();
    return { ok: true };
  }
  if (route === '/api/plans' && method === 'GET') {
    return {
      plans: state.planIds.map((id) => findSkill(data, state, id)).filter(Boolean).map(clone),
      folders: state.planFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        skills: folder.skillIds.map((id) => findSkill(data, state, id)).filter(Boolean).map(clone),
      })),
    };
  }
  if (route === '/api/plan-folders' && method === 'POST') {
    const folder = { id: randomId('pf'), name: body.name || '新计划', skillIds: [] };
    state.planFolders.push(folder);
    saveState();
    return { folder: clone(folder) };
  }
  const planFolderMatch = route.match(/^\/api\/plan-folders\/([^/]+)(?:\/items(?:\/([^/]+))?)?$/);
  if (planFolderMatch) {
    const folder = state.planFolders.find((item) => item.id === planFolderMatch[1]);
    if (!folder) throw new Error('计划文件夹不存在');
    if (method === 'PATCH') folder.name = body.name || folder.name;
    else if (method === 'DELETE' && !planFolderMatch[2]) state.planFolders = state.planFolders.filter((item) => item.id !== folder.id);
    else if (method === 'POST') {
      const id = body.skillId;
      if (id && !folder.skillIds.includes(id)) folder.skillIds.push(id);
      state.planIds = state.planIds.filter((value) => value !== id);
    } else if (method === 'DELETE' && planFolderMatch[2]) folder.skillIds = folder.skillIds.filter((id) => id !== planFolderMatch[2]);
    saveState();
    return { ok: true };
  }

  const purchaseMatch = route.match(/^\/api\/skills\/([^/]+)\/purchase$/);
  if (purchaseMatch && method === 'POST') {
    const skill = findSkill(data, state, decodeURIComponent(purchaseMatch[1]));
    if (!skill) throw new Error('Skill 不存在');
    const isApi = body.method !== 'buyout';
    const purchase = {
      id: randomId('p'),
      skillId: skill.id,
      method: isApi ? 'api' : 'buyout',
      price: isApi ? Number(skill.priceApi || 0) * Number(body.days || 1) : Number(skill.buyoutPrice || 0),
      at: now(),
      days: isApi ? Number(body.days || 1) : 0,
      apiKey: isApi ? `fj_static_${Math.random().toString(36).slice(2, 18)}` : '',
      usedDays: [],
      remainingDays: isApi ? Number(body.days || 1) : 0,
      skill: clone(skill),
      refunded: false,
    };
    state.library = state.library.filter((item) => !(item.skillId === skill.id && item.method === purchase.method));
    state.library.unshift(purchase);
    saveState();
    return { purchase: hydratePurchase(data, state, purchase) };
  }
  if (route === '/api/library' && method === 'GET') return { library: state.library.map((item) => hydratePurchase(data, state, item)) };
  const usageMatch = route.match(/^\/api\/purchases\/([^/]+)\/usage$/);
  if (usageMatch && method === 'GET') {
    const purchase = state.library.find((item) => item.id === usageMatch[1]);
    if (!purchase) throw new Error('购买记录不存在');
    const usedDays = purchase.usedDays || [];
    return {
      apiKey: purchase.apiKey,
      daysTotal: purchase.days || 0,
      usedDays,
      remainingDays: Math.max(0, Number(purchase.days || 0) - usedDays.length),
      records: usedDays.map((date) => ({ date, count: 1 })),
    };
  }
  const reviewMatch = route.match(/^\/api\/skills\/([^/]+)\/review$/);
  if (reviewMatch && method === 'POST') {
    const skill = findSkill(data, state, decodeURIComponent(reviewMatch[1]));
    const review = { id: randomId('r'), userId: state.user.id, rating: Number(body.rating || 5), text: body.text || '', at: now(), hidden: false, user: publicUser(state.user) };
    skill.reviews = (skill.reviews || []).filter((item) => item.userId !== state.user.id).concat(review);
    skill.myReview = review;
    skill.ratingCount = skill.reviews.length;
    skill.rating = skill.reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(1, skill.reviews.length);
    saveState();
    return { skill: skillDetail(data, state, skill.id) };
  }

  if (route === '/api/projects' && method === 'GET') {
    return {
      projects: state.projects.map((project) => ({
        id: project.id,
        name: project.name,
        skills: project.skillIds.map((id) => findSkill(data, state, id)).filter(Boolean).map(clone),
        count: project.skillIds.length,
      })),
    };
  }
  if (route === '/api/projects' && method === 'POST') {
    const project = { id: randomId('pr'), name: body.name || '新文件夹', skillIds: [] };
    state.projects.push(project);
    saveState();
    return { project: clone(project) };
  }
  const projectMatch = route.match(/^\/api\/projects\/([^/]+)(?:\/items(?:\/([^/]+))?)?$/);
  if (projectMatch) {
    const project = state.projects.find((item) => item.id === projectMatch[1]);
    if (!project) throw new Error('文件夹不存在');
    if (method === 'PATCH') project.name = body.name || project.name;
    else if (method === 'DELETE' && !projectMatch[2]) state.projects = state.projects.filter((item) => item.id !== project.id);
    else if (method === 'POST') {
      const id = body.skillId;
      if (id && !project.skillIds.includes(id)) project.skillIds.push(id);
    } else if (method === 'DELETE' && projectMatch[2]) project.skillIds = project.skillIds.filter((id) => id !== projectMatch[2]);
    saveState();
    return { ok: true };
  }

  const chatMatch = route.match(/^\/api\/chat\/([^/]+)$/);
  if (chatMatch && method === 'GET') {
    const userId = decodeURIComponent(chatMatch[1]);
    const profile = userProfile(data, state, userId).profile;
    return {
      messages: clone(state.messages[userId] || []),
      other: profile,
      canSendImage: true,
      sellerSkills: data.shared['/api/skills'].skills.filter((skill) => skill.sellerId === userId).slice(0, 6).map((skill) => ({ id: skill.id, title: skill.title, priceApi: skill.priceApi, buyoutPrice: skill.buyoutPrice, cover: skill.cover })),
    };
  }
  if (chatMatch && method === 'POST') {
    const userId = decodeURIComponent(chatMatch[1]);
    state.messages[userId] = state.messages[userId] || [];
    state.messages[userId].push({ id: randomId('m'), from: state.user.id, to: userId, text: body.text || '', image: body.image || '', skillId: body.skillId || '', kind: body.kind || 'text', at: now(), read: true });
    saveState();
    return { ok: true };
  }
  const profileMatch = route.match(/^\/api\/users\/([^/]+)$/);
  if (profileMatch && method === 'GET') return userProfile(data, state, decodeURIComponent(profileMatch[1]));
  if (/^\/api\/users\/[^/]+\/report$/.test(route) && method === 'POST') return { ok: true };

  if (route === '/api/notifications' && method === 'GET') return { unread: state.inbox.reduce((sum, item) => sum + Number(item.unread || 0), 0) };
  if (route === '/api/inbox' && method === 'GET') return { inbox: clone(state.inbox) };
  if (route === '/api/inbox/read-all' && method === 'POST') {
    state.inbox.forEach((item) => { item.unread = 0; });
    saveState();
    return { ok: true };
  }
  if (route === '/api/platform' && method === 'GET') return clone(data.shared['/api/platform']);

  if (route === '/api/requests' && method === 'GET') return { requests: clone(state.requests) };
  if (route === '/api/requests' && method === 'POST') {
    const item = { id: randomId('rq'), ...body, status: 'open', statusLabel: '征集中', createdAt: now(), updatedAt: now(), mine: true, takenMine: false, takerCount: 0, applicants: [], poster: publicUser(state.user) };
    state.requests.unshift(item);
    saveState();
    return { request: clone(item) };
  }
  const requestAction = route.match(/^\/api\/requests\/([^/]+)\/(take|close|reject|link)$/);
  if (requestAction && method === 'POST') {
    const item = state.requests.find((requestItem) => requestItem.id === requestAction[1]);
    if (item) {
      if (requestAction[2] === 'take') { item.takenMine = true; item.takerCount = Number(item.takerCount || 0) + 1; }
      if (requestAction[2] === 'close') { item.status = 'closed'; item.statusLabel = '已关闭'; }
      if (requestAction[2] === 'link') item.linkedSkillId = body.skillId;
      item.updatedAt = now();
    }
    saveState();
    return { ok: true };
  }

  if (route === '/api/tickets' && method === 'GET') return { tickets: clone(state.tickets) };
  if (route === '/api/tickets' && method === 'POST') {
    const ticket = { id: randomId('tk'), type: body.type || 'support', typeLabel: '客服工单', title: body.title || '新工单', text: body.text || '', status: 'open', statusLabel: '处理中', adminNote: '', refundAmount: 0, createdAt: now(), updatedAt: now(), mine: true, replyCount: 0, canEscalate: body.type === 'refund' };
    state.tickets.unshift(ticket);
    state.ticketReplies[ticket.id] = [];
    saveState();
    return { ticket: clone(ticket) };
  }
  const ticketMatch = route.match(/^\/api\/tickets\/([^/]+)$/);
  if (ticketMatch && method === 'GET') {
    const ticket = state.tickets.find((item) => item.id === ticketMatch[1]);
    if (!ticket) throw new Error('工单不存在');
    return { ticket: clone(ticket), replies: clone(state.ticketReplies[ticket.id] || []) };
  }
  const ticketAction = route.match(/^\/api\/tickets\/([^/]+)\/(reply|escalate)$/);
  if (ticketAction && method === 'POST') {
    const ticket = state.tickets.find((item) => item.id === ticketAction[1]);
    if (!ticket) throw new Error('工单不存在');
    if (ticketAction[2] === 'reply') {
      state.ticketReplies[ticket.id] = state.ticketReplies[ticket.id] || [];
      state.ticketReplies[ticket.id].push({ id: randomId('tr'), userId: state.user.id, text: body.text || '', at: now(), user: publicUser(state.user) });
      ticket.replyCount = state.ticketReplies[ticket.id].length;
    } else {
      ticket.status = 'arbitrating';
      ticket.statusLabel = '平台仲裁中';
    }
    ticket.updatedAt = now();
    saveState();
    return { ticket: clone(ticket) };
  }

  if (route === '/api/seller/skills' && method === 'GET') return { skills: clone(state.sellerSkills) };
  if (route === '/api/seller/skills' && method === 'POST') {
    const structure = body.structure || [body.fileName || 'SKILL.md'];
    const skill = { id: randomId('skill'), title: body.title || '新 Skill', sellerId: state.user.id, seller: publicUser(state.user), cover: body.cover || { from: '#104090', to: '#2090d0', icon: 'box' }, images: [], breadcrumb: ['其他'], category: body.category || '其他', priceApi: Number(body.priceApi || 0), buyoutPrice: Number(body.buyoutPrice || 0), buyoutAvailable: !!body.buyoutAvailable, sold: 0, soldCap: 120, rating: 0, ratingCount: 0, ratings: [0, 0, 0, 0, 0], models: body.models || ['codex'], intro: body.intro || '', description: body.description || '', structure, reviews: [], status: 'pending', createdAt: now(), updatedAt: now(), version: 1, hasFile: true, fileName: body.fileName || 'SKILL.md' };
    state.sellerSkills.unshift(skill);
    saveState();
    return { skill: clone(skill), structure };
  }
  const sellerSkillAction = route.match(/^\/api\/seller\/skills\/([^/]+)(?:\/(version|restore|resubmit))?$/);
  if (sellerSkillAction) {
    const skill = state.sellerSkills.find((item) => item.id === sellerSkillAction[1]);
    if (!skill) throw new Error('Skill 不存在');
    if (method === 'DELETE') skill.status = 'delisted';
    if (method === 'POST' && sellerSkillAction[2] === 'restore') skill.status = 'active';
    if (method === 'POST' && sellerSkillAction[2] === 'resubmit') skill.status = 'pending';
    if (method === 'POST' && sellerSkillAction[2] === 'version') { skill.version = Number(skill.version || 1) + 1; skill.status = 'pending'; }
    saveState();
    return { skill: clone(skill), version: skill.version || 1 };
  }
  if (route === '/api/seller/overview' && method === 'GET') return roleSnapshot(data, state, route, { slots: 0, maxSlots: 3, slotPrice: 30, commissionRate: 0.03, published: state.sellerSkills.length, pending: 0, rejected: 0, balance: state.wallet.balance, freeSlots: 0 });
  if (route === '/api/seller/slots' && method === 'POST') {
    const overview = roleSnapshot(data, state, '/api/seller/overview', { slots: 0 });
    overview.slots = Number(overview.slots || 0) + 1;
    return { slots: overview.slots, price: 0, quote: { display: '0元（静态演示）' } };
  }
  if (route === '/api/seller/refunds' && method === 'GET') return roleSnapshot(data, state, route, { refunds: [] });
  if (/^\/api\/seller\/refunds\/[^/]+$/.test(route) && method === 'POST') return { ok: true };

  if (route === '/api/wallet' && method === 'GET') return clone(state.wallet);
  if (route === '/api/wallet/withdraw' && method === 'POST') {
    const amount = Number(body.amount || 0);
    state.wallet.balance = Math.max(0, Number(state.wallet.balance || 0) - amount);
    state.wallet.withdrawable = Math.max(0, Number(state.wallet.withdrawable || 0) - amount);
    state.wallet.withdrawals = state.wallet.withdrawals || [];
    state.wallet.withdrawals.unshift({ id: randomId('wd'), amount, status: 'pending', at: now() });
    saveState();
    return { balance: state.wallet.balance, withdrawal: clone(state.wallet.withdrawals[0]) };
  }

  if (route === '/api/admin/db/vacuum' && method === 'POST') return roleSnapshot(data, state, '/api/admin/db', { db: {} });
  if (route === '/api/admin/approvals' && method === 'POST') return { approval: { id: randomId('ap'), action: body.action, status: 'pending', createdAt: now() } };
  if (route === '/api/admin/platform' && method === 'PATCH') {
    Object.assign(data.shared['/api/platform'].config, body);
    return clone(data.shared['/api/platform']);
  }
  if (route.startsWith('/api/admin/') && method === 'GET') {
    const snapshot = roleSnapshot(data, state, route, null);
    if (snapshot != null) return snapshot;
    const ticketDetail = route.match(/^\/api\/admin\/tickets\/([^/]+)$/);
    if (ticketDetail) {
      const tickets = roleSnapshot(data, state, '/api/admin/tickets', { tickets: [] }).tickets;
      const ticket = tickets.find((item) => item.id === ticketDetail[1]);
      if (!ticket) throw new Error('工单不存在');
      return { ticket, replies: [] };
    }
  }
  if (route.startsWith('/api/admin/') && ['POST', 'PATCH', 'DELETE'].includes(method)) return { ok: true };

  throw new Error(`静态演示暂不支持该操作: ${method} ${route}`);
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  sms: (phone) => request('/api/auth/sms', { method: 'POST', body: { phone } }),
  me: () => request('/api/auth/me'),
  updateMe: (body) => request('/api/auth/me', { method: 'PATCH', body }),
  updateSettings: (body) => request('/api/auth/settings', { method: 'PATCH', body }),
  changePassword: (body) => request('/api/auth/password', { method: 'POST', body }),
  logoutOthers: () => request('/api/auth/logout-others', { method: 'POST', body: {} }),
  uploadAvatar: (data) => request('/api/auth/me/avatar', { method: 'POST', body: { data } }),
  myCertification: () => request('/api/auth/me/certification'),
  submitCertification: (body) => request('/api/auth/me/certification', { method: 'POST', body }),
  myRealname: () => request('/api/auth/me/realname'),
  submitRealname: (body) => request('/api/auth/me/realname', { method: 'POST', body }),
  skills: (query) => request('/api/skills' + (query || '')),
  categories: () => request('/api/categories'),
  skill: (id) => request('/api/skills/' + id),
  plans: () => request('/api/plans'),
  addPlan: (id) => request('/api/skills/' + id + '/plan', { method: 'POST', body: {} }),
  removePlan: (id) => request('/api/skills/' + id + '/plan', { method: 'DELETE' }),
  createPlanFolder: (name) => request('/api/plan-folders', { method: 'POST', body: { name } }),
  renamePlanFolder: (id, name) => request('/api/plan-folders/' + id, { method: 'PATCH', body: { name } }),
  deletePlanFolder: (id) => request('/api/plan-folders/' + id, { method: 'DELETE' }),
  addPlanFolderItem: (id, skillId) => request('/api/plan-folders/' + id + '/items', { method: 'POST', body: { skillId } }),
  removePlanFolderItem: (id, skillId) => request('/api/plan-folders/' + id + '/items/' + skillId, { method: 'DELETE' }),
  purchase: (id, body) => request('/api/skills/' + id + '/purchase', { method: 'POST', body }),
  library: () => request('/api/library'),
  usage: (purchaseId) => request('/api/purchases/' + purchaseId + '/usage'),
  review: (id, body) => request('/api/skills/' + id + '/review', { method: 'POST', body }),
  projects: () => request('/api/projects'),
  createProject: (name) => request('/api/projects', { method: 'POST', body: { name } }),
  renameProject: (id, name) => request('/api/projects/' + id, { method: 'PATCH', body: { name } }),
  deleteProject: (id) => request('/api/projects/' + id, { method: 'DELETE' }),
  addProjectItem: (id, skillId) => request('/api/projects/' + id + '/items', { method: 'POST', body: { skillId } }),
  removeProjectItem: (id, skillId) => request('/api/projects/' + id + '/items/' + skillId, { method: 'DELETE' }),
  chat: (userId) => request('/api/chat/' + userId),
  sendMessage: (userId, body) => request('/api/chat/' + userId, { method: 'POST', body }),
  userProfile: (userId) => request('/api/users/' + userId),
  reportUser: (userId, body) => request('/api/users/' + userId + '/report', { method: 'POST', body }),
  notifications: () => request('/api/notifications'),
  adminStats: () => request('/api/admin/stats'),
  adminAccess: () => request('/api/admin/access'),
  adminUsers: () => request('/api/admin/users'),
  adminUserStatus: (id, status) => request('/api/admin/users/' + id + '/status', { method: 'POST', body: { status } }),
  adminUserRole: (id, role) => request('/api/admin/users/' + id + '/role', { method: 'POST', body: { role } }),
  adminUserPenalty: (id, body) => request('/api/admin/users/' + id + '/penalty', { method: 'POST', body }),
  adminOrders: () => request('/api/admin/orders'),
  adminUsage: () => request('/api/admin/usage'),
  adminUpdateCategory: (id, body) => request('/api/admin/categories/' + id, { method: 'PATCH', body }),
  adminCreateCategory: (body) => request('/api/admin/categories', { method: 'POST', body }),
  adminDeleteCategory: (id) => request('/api/admin/categories/' + id, { method: 'DELETE' }),
  adminSkills: () => request('/api/admin/skills'),
  adminUpdateSkill: (id, body) => request('/api/admin/skills/' + id, { method: 'PATCH', body }),
  sellerSkills: () => request('/api/seller/skills'),
  sellerCreate: (body) => request('/api/seller/skills', { method: 'POST', body }),
  sellerNewVersion: (id, body) => request('/api/seller/skills/' + id + '/version', { method: 'POST', body }),
  sellerDelist: (id) => request('/api/seller/skills/' + id, { method: 'DELETE' }),
  sellerRestore: (id) => request('/api/seller/skills/' + id + '/restore', { method: 'POST', body: {} }),
  sellerResubmit: (id) => request('/api/seller/skills/' + id + '/resubmit', { method: 'POST', body: {} }),
  sellerOverview: () => request('/api/seller/overview'),
  buySlot: () => request('/api/seller/slots', { method: 'POST', body: {} }),
  wallet: () => request('/api/wallet'),
  withdraw: (amount) => request('/api/wallet/withdraw', { method: 'POST', body: { amount } }),
  inbox: () => request('/api/inbox'),
  markAllRead: () => request('/api/inbox/read-all', { method: 'POST', body: {} }),
  platformConfig: () => request('/api/platform'),
  adminUpdatePlatform: (body) => request('/api/admin/platform', { method: 'PATCH', body }),
  adminWithdrawals: () => request('/api/admin/withdrawals'),
  adminWithdrawalAction: (id, status) => request('/api/admin/withdrawals/' + id, { method: 'POST', body: { status } }),
  adminPending: () => request('/api/admin/pending'),
  adminApprove: (id, approve) => request('/api/admin/skills/' + id + '/approve', { method: 'POST', body: { approve } }),
  adminReviews: () => request('/api/admin/reviews'),
  adminReviewAction: (id, action) => request('/api/admin/reviews/' + id, { method: 'POST', body: { action } }),
  adminCertifications: () => request('/api/admin/certifications'),
  adminCertificationAction: (id, body) => request('/api/admin/certifications/' + id, { method: 'POST', body }),
  adminRefunds: () => request('/api/admin/refunds'),
  adminLogs: () => request('/api/admin/logs'),
  adminDb: () => request('/api/admin/db'),
  adminDbVacuum: () => request('/api/admin/db/vacuum', { method: 'POST', body: {} }),
  adminApprovals: () => request('/api/admin/approvals'),
  adminApprovalCreate: (action) => request('/api/admin/approvals', { method: 'POST', body: { action } }),
  adminApprovalExecute: (id) => request('/api/admin/approvals/' + id + '/execute', { method: 'POST', body: {} }),
  adminApprovalReject: (id) => request('/api/admin/approvals/' + id + '/reject', { method: 'POST', body: {} }),
  adminVaultStatus: () => request('/api/admin/vault/status'),
  adminLedger: () => request('/api/admin/ledger'),
  adminPayments: () => request('/api/admin/payments'),
  requests: (query) => request('/api/requests' + (query || '')),
  createRequest: (body) => request('/api/requests', { method: 'POST', body }),
  takeRequest: (id) => request('/api/requests/' + id + '/take', { method: 'POST', body: {} }),
  closeRequest: (id) => request('/api/requests/' + id + '/close', { method: 'POST', body: {} }),
  requestReject: (id, takerId) => request('/api/requests/' + id + '/reject', { method: 'POST', body: { takerId } }),
  linkRequestSkill: (id, skillId) => request('/api/requests/' + id + '/link', { method: 'POST', body: { skillId } }),
  tickets: () => request('/api/tickets'),
  createTicket: (body) => request('/api/tickets', { method: 'POST', body }),
  ticket: (id) => request('/api/tickets/' + id),
  replyTicket: (id, text) => request('/api/tickets/' + id + '/reply', { method: 'POST', body: { text } }),
  escalateTicket: (id, text) => request('/api/tickets/' + id + '/escalate', { method: 'POST', body: { text } }),
  sellerRefunds: () => request('/api/seller/refunds'),
  sellerRefundAction: (id, approve) => request('/api/seller/refunds/' + id, { method: 'POST', body: { approve } }),
  adminRealnames: () => request('/api/admin/realnames'),
  adminRealnameAction: (id, body) => request('/api/admin/realnames/' + id, { method: 'POST', body }),
  adminRequests: () => request('/api/admin/requests'),
  adminRequestAction: (id, body) => request('/api/admin/requests/' + id, { method: 'POST', body }),
  adminTickets: () => request('/api/admin/tickets'),
  adminTicket: (id) => request('/api/admin/tickets/' + id),
  adminTicketAction: (id, body) => request('/api/admin/tickets/' + id, { method: 'POST', body }),
  adminArbitrate: (id, body) => request('/api/admin/tickets/' + id + '/arbitrate', { method: 'POST', body }),
  adminReconciliation: () => request('/api/admin/reconciliation'),
};

export async function adminApprovalExecuteDownload(id, action) {
  if (action === 'db.export') {
    const data = await loadData();
    downloadText('fangji-static-demo-export.json', JSON.stringify({ staticDemo: true, exportedAt: new Date().toISOString(), data }, null, 2), 'application/json;charset=utf-8');
  } else {
    downloadText('fangji-static-demo-backup.txt', '访迹 EdgeOne Pages 静态演示版不包含真实数据库。\n');
  }
}

function openPlaceholder(title) {
  const html = `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui;padding:40px;background:#081a32;color:#fff}main{max-width:680px;margin:auto;border:1px solid #4a6b8d;padding:28px}small{color:#9fb3c8}</style><main><h1>${title}</h1><p>这是 EdgeOne Pages 静态演示版的占位材料，不包含真实证件或隐私文件。</p><small>所有状态仅保存在当前浏览器。</small></main>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function adminCertFile() {
  openPlaceholder('认证材料（静态演示）');
}

export async function adminRealnameFile() {
  openPlaceholder('实名材料（静态演示）');
}

export async function runWithApiKey(apiKey, input) {
  const state = await getState();
  const purchase = state.library.find((item) => item.apiKey === apiKey);
  if (!purchase) throw new Error('API Key 无效');
  const date = new Date().toISOString().slice(0, 10);
  purchase.usedDays = purchase.usedDays || [];
  if (!purchase.usedDays.includes(date)) purchase.usedDays.push(date);
  saveState();
  return {
    output: `【静态演示输出】\n已接收 ${String(input).length} 个字符。\n\n${String(input).slice(0, 500)}`,
    meta: {
      callsToday: 1,
      remainingDays: Math.max(0, Number(purchase.days || 0) - purchase.usedDays.length),
      privacy: '浏览器本地演示，未上传数据',
    },
  };
}

export async function downloadSource(purchaseId, filename) {
  const state = await getState();
  const purchase = state.library.find((item) => item.id === purchaseId);
  if (!purchase) throw new Error('购买记录不存在');
  downloadText(filename || 'SKILL.md', `# ${purchase.skill && purchase.skill.title ? purchase.skill.title : '访迹 Skill'}\n\n这是 EdgeOne Pages 静态演示版生成的示例文件，不包含真实商品源代码。\n`);
}

export async function downloadRunner() { throw new Error('旧占位运行器已停用，请从安装到助手入口下载标准 Skill 包'); }
