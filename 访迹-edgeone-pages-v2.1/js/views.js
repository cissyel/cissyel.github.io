export { purchaseSuccessHTML, apiKeyModalHTML } from './install-ui.js';
﻿import { esc, money, starsHTML, timeAgo, avatarHTML, avatarWithBadge, modelTags, soldLabel, coverStyle, treeHTML, MODEL_LABEL } from './util.js';
import { topbar, skillCard, BOAT_SVG, WAVE_SVG } from './components.js';
import { icon } from './icons.js';

const ADMIN_ROLES_SET = new Set(['admin', 'super_admin', 'operator', 'finance', 'support', 'viewer']);

// ---------------- 登录页 ----------------
export function loginView() {
  const title = '访迹';
  const chars = [...title]
    .map((c, i) => '<span style="animation-delay:' + (0.18 + i * 0.14) + 's">' + c + '</span>')
    .join('');
  const pwdField = (name, ph) =>
    '<div class="pwd-wrap">' +
    '<input name="' + name + '" type="password" placeholder="' + ph + '" autocomplete="current-password" />' +
    '<button type="button" class="pwd-toggle" data-action="toggle-pwd" title="显示/隐藏密码">' + icon('eye', 'sm') + '</button>' +
    '</div>';
  return (
    '<div class="login-page">' +
    '<div class="login-brand-panel">' +
    '<div class="login-logo">' + BOAT_SVG + '</div>' +
    '<div class="login-title">' + chars + '</div>' +
    '<p class="login-slogan">让每一个好用的 Skill,都有迹可循</p>' +
    '<p class="login-sub">把专业能力封装成可购买、可调用的 Skill · 支持 Codex / Claude Code / WorkBuddy</p>' +
    '<div class="boat-scene">' +
    '<div class="boat">' + BOAT_SVG + '</div>' +
    '<div class="wave-line">' + WAVE_SVG + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="login-form-panel"><div class="login-card">' +
    '<div class="welcome" id="auth-title">欢迎回来</div>' +
    '<div class="welcome-sub" id="auth-sub">登录你的访迹账号</div>' +
    '<form data-form="login" id="form-login">' +
    '<div class="field"><label>手机号 / 用户名</label><input name="account" placeholder="请输入手机号或用户名" autocomplete="username" /></div>' +
    '<div class="field"><label>密码</label>' + pwdField('password', '请输入密码') + '</div>' +
    '<div class="field-error" id="login-error"></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">登 录</button>' +
    '</form>' +
    '<form data-form="register" id="form-register" class="hidden">' +
    '<div class="field"><label>用户名</label><input name="username" placeholder="2-20 位字母、数字或中文" /></div>' +
    '<div class="field"><label>手机号(必填)</label>' +
    '<div class="sms-row"><input name="phone" placeholder="11 位手机号" maxlength="11" /><button type="button" class="btn btn-outline btn-sm" data-action="send-sms" id="sms-btn">获取验证码</button></div></div>' +
    '<div class="field"><label>验证码</label><input name="code" placeholder="6 位验证码" maxlength="6" /></div>' +
    '<div class="field"><label>密码(至少 6 位)</label>' + pwdField('password', '设置登录密码') + '</div>' +
    '<div class="field"><label>确认密码</label>' + pwdField('confirm', '再次输入密码') + '</div>' +
    '<div class="field-error" id="register-error"></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">注册并登录</button>' +
    '</form>' +
    '<div class="login-switch"><span id="switch-hint">还没有账号?</span> <button data-action="switch-auth" id="switch-btn">立即注册</button></div>' +
    '<div class="demo-hint">' +
    '<div style="font-weight:700;margin-bottom:6px">演示账号(一键登录)</div>' +
    '<div class="row"><span>买家</span><code>demo / demo123</code><button data-action="demo-login" data-user="demo">登录</button></div>' +
    '<div class="row"><span>卖家</span><code>seller / demo123</code><button data-action="demo-login" data-user="seller">登录</button></div>' +
    '<div class="row"><span>管理员</span><code>admin / demo123</code><button data-action="demo-login" data-user="admin">登录</button></div>' +
    '</div>' +
    '</div></div></div>'
  );
}

// ---------------- 市场页 ----------------
export function marketView(state) {
  const f = state.filters;
  const picks = state.skills.filter((s) => s.hot);
  const pickIdx = Math.min(state.pickIdx || 0, Math.max(0, picks.length - 1));
  const pageSize = 4;
  const totalPages = 15; // 分类分页固定 15 页,后续扩充分类
  const page = Math.min(state.catPage, totalPages - 1);
  const cats = state.categories.slice(page * pageSize, page * pageSize + pageSize);
  const catTiles =
    cats
      .map(
        (c) =>
          '<button class="cat-tile ' + (f.category === c.id ? 'active' : '') + '" data-action="cat-select" data-id="' + esc(c.id) + '" style="background:' + c.color + '">' +
          icon(c.icon || 'grid') + '<span>' + esc(c.name) + '</span></button>'
      )
      .join('') +
    Array.from({ length: Math.max(0, pageSize - cats.length) }, () => '<button class="cat-tile soon" disabled><span>· · ·</span><span>筹备中</span></button>').join('');

  const filterTags =
    (f.model
      ? '<span class="filter-tag">模型:' + MODEL_LABEL[f.model] + ' <button data-action="filter-clear" data-key="model">✕</button></span>'
      : '') +
    (f.method
      ? '<span class="filter-tag">' + (f.method === 'api' ? 'API 调用' : '可买断') + ' <button data-action="filter-clear" data-key="method">✕</button></span>'
      : '') +
    (f.sort
      ? '<span class="filter-tag">排序:' + ({ hot: '综合热门', new: '最新上架', rating: '评分优先' }[f.sort] || f.sort) + ' <button data-action="filter-clear" data-key="sort">✕</button></span>'
      : '') +
    (f.q ? '<span class="filter-tag">搜索:' + esc(f.q) + ' <button data-action="filter-clear" data-key="q">✕</button></span>' : '');

  return (
    topbar(state.user, 'market', state.unread, state.searchQ) +
    '<div class="container page">' +
    '<div class="market-layout">' +
    '<main>' +
    (f.q
      ? ''
      : '<div class="section-head"><h2>今日特选</h2><span class="sub">热门 · 高下载 · 高流量</span></div>' +
        '<div class="picks-stage">' +
        '<div class="picks-viewport"><div class="picks-slides" id="picks-slides" style="transform:translateX(-' + pickIdx * 100 + '%)">' +
        picks
          .map(
            (s) =>
              '<article class="feature-slide" data-action="open-skill" data-id="' + esc(s.id) + '">' +
              '<div class="fs-cover" style="' + coverStyle(s.cover) + '">' +
              (s.cover && s.cover.image ? '<img class="cover-img" src="' + s.cover.image + '" alt="" />' : '<span class="cover-icon">' + icon(s.cover.icon || 'box') + '</span>') +
              '</div>' +
              (s.buyoutAvailable ? '<span class="card-buyout">可买断</span>' : '') +
              (s.sold >= s.soldCap ? '<span class="fs-soldout">已售罄</span>' : '') +
              '<div class="fs-overlay">' +
              '<h3>' + esc(s.title) + '</h3>' +
              '<div class="fs-meta">' + starsHTML(s.rating) + '<b style="color:var(--gold)">' + s.rating.toFixed(1) + '</b><span>(' + s.ratingCount + ' 评价)</span><span>·</span><span>' + esc(s.category) + '</span><span>·</span><span>已售 ' + soldLabel(s.sold) + '</span></div>' +
              '<div class="fs-price">' + money(s.priceApi) + '<small> / 天起</small>' + (s.buyoutAvailable ? '<small> · 可买断 ' + money(s.buyoutPrice) + '</small>' : '') + '</div>' +
              '</div></article>'
          )
          .join('') +
        '</div>' +
        '<button class="picks-nav left" data-action="pick" data-dir="-1" title="上一个">' + icon('chevronL', 'lg') + '</button>' +
        '<button class="picks-nav right" data-action="pick" data-dir="1" title="下一个">' + icon('chevronR', 'lg') + '</button>' +
        '</div>' +
        '<div class="picks-dots">' +
        picks.map((s, i) => '<span class="' + (i === pickIdx ? 'on' : '') + '" data-action="pick-dot" data-i="' + i + '"></span>').join('') +
        '</div></div>' +
        '<hr class="hr" />') +
    '<div class="section-head"><h2>' + (f.q ? '搜索结果' : '为你推荐') + '</h2><span class="sub">' + (f.q ? '共 ' + state.skills.length + ' 个结果' : '根据你的偏好推荐') + '</span><span class="spacer"></span>' + (f.q ? '' : '<button class="btn btn-ghost btn-sm" data-action="clear-filters">查看全部 ' + icon('chevronR', 'sm') + '</button>') + '</div>' +
    '<div class="filter-bar">' +
    '<div class="filter-dd" id="filter-dd">' +
    '<button class="filter-btn" data-action="filter-toggle">' + icon('filter', 'sm') + ' 筛选 ' + icon('chevronD', 'sm') + '</button>' +
    '<div class="filter-menu">' +
    '<div><div class="filter-group-title">接入模型</div>' +
    ['codex', 'claude', 'workbuddy']
      .map((m) => '<div class="filter-option ' + (f.model === m ? 'on' : '') + '" data-action="filter-opt" data-key="model" data-val="' + m + '"><span class="check">' + (f.model === m ? '✓' : '') + '</span>' + MODEL_LABEL[m] + '</div>')
      .join('') +
    '</div>' +
    '<div><div class="filter-group-title">购买方式</div>' +
    '<div class="filter-option ' + (f.method === 'api' ? 'on' : '') + '" data-action="filter-opt" data-key="method" data-val="api"><span class="check">' + (f.method === 'api' ? '✓' : '') + '</span>API 调用</div>' +
    '<div class="filter-option ' + (f.method === 'buyout' ? 'on' : '') + '" data-action="filter-opt" data-key="method" data-val="buyout"><span class="check">' + (f.method === 'buyout' ? '✓' : '') + '</span>可买断</div>' +
    '</div>' +
    '<div><div class="filter-group-title">排序</div>' +
    [['hot', '综合热门'], ['new', '最新上架'], ['rating', '评分优先']]
      .map(([k, label]) => '<div class="filter-option ' + (f.sort === k ? 'on' : '') + '" data-action="filter-opt" data-key="sort" data-val="' + k + '"><span class="check">' + (f.sort === k ? '✓' : '') + '</span>' + label + '</div>')
      .join('') +
    '</div></div></div>' +
    filterTags +
    '</div>' +
    '<div class="recs-grid">' +
    (state.skills.length
      ? state.skills.map((s) => skillCard(s)).join('')
      : '<div class="empty" style="grid-column:1/-1"><div class="big">' + icon('boat', 'xl') + '</div>没有找到符合条件的 Skill,换个筛选试试</div>') +
    '</div>' +
    '</main>' +
    '<aside class="market-side">' +
    '<div class="cat-panel">' +
    '<div class="cat-head"><h3>分类</h3>' +
    '<div class="cat-arrows">' +
    '<button class="arrow-btn sm" data-action="cat-page" data-dir="-1">' + icon('chevronL', 'sm') + '</button>' +
    '<button class="arrow-btn sm" data-action="cat-page" data-dir="1">' + icon('chevronR', 'sm') + '</button>' +
    '</div></div>' +
    '<div class="cat-grid">' +
    catTiles +
    '</div>' +
    '<div class="cat-page-note">第 ' + (page + 1) + ' / ' + totalPages + ' 页 · 点箭头换一批</div>' +
    '</div>' +
    '<div class="side-promo"><h4>把你的专业,变成商品</h4><p>上传源文件,平台加密后上架销售,按天或买断赚钱。</p><button class="btn btn-sm" data-action="nav" data-href="#/seller">卖家中心 ' + icon('arrowR', 'sm') + '</button></div>' +
    '</aside>' +
    '</div></div>'
  );
}

// ---------------- 详情页 ----------------
function securityPanelHTML(s) {
  const sec = s.security;
  if (!sec) return '';
  const labels = { none: '未发现风险', low: '低风险', medium: '中等风险', high: '高风险' };
  const tone = sec.risk === 'high' ? 'var(--red)' : sec.risk === 'medium' ? 'var(--amber)' : sec.risk === 'low' ? 'var(--price)' : 'var(--mint)';
  const tagFor = {
    network: '可联网',
    filesystem: '可读写文件',
    exec: '可执行命令',
    secret: '密钥硬编码',
    prompt: '注入风险',
    exfil: '数据外传',
  };
  const permTags = (sec.findings || [])
    .map((f) => '<span class="perm-tag ' + f.level + '" title="命中文件:' + esc((f.files || []).join(', ')) + '">' + esc(tagFor[f.key] || f.label) + '</span>')
    .join('') + ((sec.findings || []).length === 0 ? '<span class="perm-tag clean">无网络/文件/命令/外传权限</span>' : '');
  const hash = s.approvalHash && s.approvalHash.content ? String(s.approvalHash.content).slice(0, 12) : (s.fileSha256 ? String(s.fileSha256).slice(0, 12) : '');
  return (
    '<div class="detail-section"><h2>' + icon('shield', 'sm') + ' 安全与权限</h2>' +
    '<div class="sec-head"><span class="sec-badge" style="color:' + tone + ';border-color:' + tone + '">' + (labels[sec.risk] || sec.risk) + '</span>' +
    '<span style="font-size:12.5px;color:var(--muted)">上传时自动扫描 ' + sec.checks + ' 项(网络/文件/命令/密钥/注入/外传)</span></div>' +
    '<div class="perm-row">' + permTags + '</div>' +
    (sec.findings && sec.findings.length
      ? '<div class="sec-list">' +
        sec.findings
          .map(
            (f) =>
              '<div class="sec-item ' + f.level + '">' + icon('alert', 'sm') + '<b>' + esc(f.label) + '</b>' +
              '<span>' + (f.files || []).map(esc).join(', ') + '</span></div>'
          )
          .join('') +
        '</div>'
      : '<div class="sec-clean">' + icon('check', 'sm') + ' 未检出以上高风险模式,可放心使用(仅作静态扫描参考)</div>') +
    (hash ? '<div class="sec-hash">审核锁定内容哈希 <code>' + hash + '…</code>' + (s.approvalHash && s.approvalHash.by ? ' · 审核人 ' + esc(s.approvalHash.by) : '') + '</div>' : '') +
    '</div>'
  );
}

export function detailView(state) {
  const s = state.detail;
  const img = s.images[state.galleryIdx] || s.images[0];
  const bought = s.myPurchase;
  const totalRatings = s.ratingCount || 1;
  const isAdminViewer = ADMIN_ROLES_SET.has(state.user && state.user.role);

  let actions = '';
  if (isAdminViewer) {
    actions =
      '<div class="owned-strip"><span>' + icon('shield', 'sm') + ' 管理员视角 · 只审核与下架,不购买</span></div>' +
      '<div class="detail-actions">' +
      '<button class="btn btn-primary" data-action="admin-review-skill" data-id="' + esc(s.id) + '">审查该橱窗(审核 / 下架 / 恢复)</button>' +
      '</div>';
  } else if (s.mine) {
    actions =
      '<div class="owned-strip"><span>' + icon('box', 'sm') + ' 这是你发布的 Skill</span></div>' +
      '<div class="detail-actions"><button class="btn btn-primary" data-action="buy">自购测试</button><button class="btn btn-outline" data-action="nav" data-href="#/seller">去卖家中心管理</button></div>';
  } else if (bought && bought.refunded) {
    actions = '<div class="owned-strip"><span>已退款 · 使用与下载权限已收回</span></div>' +
      '<div class="detail-actions">' + (bought.method === 'api' ? '<button class="btn btn-primary" data-action="buy">重新订阅</button>' : '') +
      '<button class="btn btn-outline" data-action="nav" data-href="#/help">查看售后</button></div>';
  } else if (bought) {
    if (bought.method === 'api') {
      actions =
      '<div class="owned-strip"><span>' + icon('check', 'sm') + ' 已拥有 · API 订阅(剩 ' + bought.remainingDays + ' 天)</span></div>' +
        '<div class="detail-actions"><button class="btn btn-primary" data-action="library-key" data-id="' + bought.id + '">安装到助手</button><button class="btn btn-outline" data-action="buy">续费追加天数</button><button class="btn btn-outline" data-action="nav" data-href="#/me">前往我的</button></div>';
    } else {
      actions =
        '<div class="owned-strip"><span>' + icon('check', 'sm') + ' 已买断 · 已获得源文件' + (bought.hasUpdate ? ' · <b style="color:var(--mint)">有新版本 v' + bought.latestVersion + ' 可下载</b>' : '') + '</span></div>' +
        '<div class="detail-actions"><button class="btn btn-primary" data-action="download-source" data-id="' + bought.id + '">下载源文件(v' + (bought.hasUpdate ? bought.latestVersion : s.version) + ')</button><button class="btn btn-outline" data-action="nav" data-href="#/me">前往我的</button></div>';
    }
  } else if (s.sold >= s.soldCap) {
    actions =
      '<div class="owned-strip" style="background:var(--amber-soft);border-color:rgba(255,195,92,.4);color:var(--amber)"><span>已售罄 · 限量 120 份已售完</span></div>' +
      '<div class="detail-actions"><button class="btn btn-outline" data-action="nav" data-href="#/market">回到市场</button></div>';
  } else {
    actions =
      '<div class="detail-actions">' +
      '<button class="btn btn-outline btn-lg" data-action="toggle-plan">' + (s.inPlan ? icon('check', 'sm') + ' 已加入计划' : icon('plus', 'sm') + ' 加入计划') + '</button>' +
      '<button class="btn btn-primary btn-lg" data-action="buy">获取 Skill</button>' +
      '</div>';
  }

  const privacyBadge = s.privacyMode === 'local'
    ? '<span class="privacy-badge local" title="该 Skill 只在买家本机运行,平台与卖家接触不到买家数据">' + icon('shield', 'sm') + ' 仅本机运行</span>'
    : '<span class="privacy-badge sandbox" title="买家输入在平台隔离沙箱中处理一次,禁网、用完即弃">' + icon('shield', 'sm') + ' 沙箱运行</span>';
  const restrictedBanner = s.restricted
    ? '<div class="owned-strip" style="background:var(--red-soft);border-color:rgba(255,107,107,.4);color:var(--red)"><span>' + icon('alert', 'sm') + ' 该商品因评分不达标已被强制下架，购买、调用与下载已暂停。' + esc(s.restricted.reason || '') + '</span></div>'
    : '';

  const reviews = (s.reviews || []).slice().sort((a, b) => b.at - a.at);

  let reviewBox = '';
  if (bought) {
    const mine = s.myReview;
    reviewBox =
      '<div class="rate-box" style="border:1px solid ' + (mine ? 'var(--line)' : 'var(--accent)') + ';border-radius:0;padding:14px 16px;background:' + (mine ? 'var(--bg-soft)' : '#0b2242') + '">' +
      '<div style="font-weight:700;margin-bottom:8px">' + (mine ? '修改我的评价' : '写下你的评价') + '</div>' +
      '<form data-form="review">' +
      '<div class="big-stars" id="rate-stars">' +
      [1, 2, 3, 4, 5]
        .map((i) => '<span data-action="star-set" data-val="' + i + '" class="' + ((mine ? mine.rating : 0) >= i ? 'on' : '') + '">★</span>')
        .join('') +
      '</div>' +
      '<div style="margin-top:10px"><textarea name="text" rows="3" placeholder="说说这个 Skill 好用在哪里?有什么建议?">' + esc(mine ? mine.text : '') + '</textarea></div>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn btn-primary btn-sm" type="submit">' + (mine ? '更新评价' : '提交评价') + '</button></div>' +
      '</form></div>';
  } else {
    reviewBox = '<div class="note-box">购买后即可对这份 Skill 打分(满分 5 分)并写下你的评价。</div>';
  }

  return (
    topbar(state.user, '', state.unread) +
    '<div class="detail-hero"><div class="container breadcrumb">' +
    '<span class="crumb" data-action="nav" data-href="#/market">市场</span>' +
    s.breadcrumb.map((b) => '<span class="sep">›</span><span class="crumb' + (b === s.breadcrumb[s.breadcrumb.length - 1] ? ' here' : '') + '" data-action="cat-from-detail" data-id="' + esc(b) + '">' + esc(b) + '</span>').join('') +
    '</div></div>' +
    '<div class="container detail-layout">' +
    '<main>' +
    '<div class="gallery">' +
    '<div class="gallery-main" style="' + coverStyle(img) + '">' + (img.image ? '<img class="cover-img" src="' + img.image + '" alt="" />' : '<span class="cover-icon">' + icon(img.icon || 'box', 'xl') + '</span>') + '</div>' +
    (s.images.length > 1
      ? '<button class="arrow-btn gallery-nav left" data-action="gallery" data-dir="-1">' + icon('chevronL', 'sm') + '</button>' +
        '<button class="arrow-btn gallery-nav right" data-action="gallery" data-dir="1">' + icon('chevronR', 'sm') + '</button>' +
        '<div class="gallery-dots">' +
        s.images.map((im, i) => '<span class="' + (i === state.galleryIdx ? 'on' : '') + '" data-action="gallery-dot" data-i="' + i + '"></span>').join('') +
        '</div>'
      : '') +
    '</div>' +
    '<div class="detail-title-row">' +
    '<div><h1>' + esc(s.title) + '</h1>' +
    '<div class="detail-meta">' +
    starsHTML(s.rating) + '<span class="rating-num">' + s.rating.toFixed(1) + ' 分</span>' +
    '<span>·</span><span>' + s.ratingCount + ' 条评价</span>' +
    '<span>·</span><span>已售 ' + soldLabel(s.sold) + '</span>' +
    '<span>·</span><span>v' + s.version + '</span>' +
    '<span>·</span><span class="cover-models" style="position:static">' + modelTags(s.models) + '</span>' +
    '<span>·</span>' + privacyBadge +
    '</div></div>' +
    '<div class="detail-pricebox">' +
    '<div class="price">' + money(s.priceApi) + '<small>/天起</small></div>' +
    (s.buyoutAvailable ? '<div class="alt">或 ' + money(s.buyoutPrice) + ' 一次买断</div>' : '') +
    '</div></div>' +
    restrictedBanner + actions +
    '<div class="detail-section"><h2>简介</h2><p class="lead">' + esc(s.intro) + '</p></div>' +
    '<hr class="hr" />' +
    '<div class="detail-section"><h2>详细说明</h2><p class="prose">' + esc(s.description) + '</p></div>' +
    (s.changelog
      ? '<div class="detail-section"><h2>v' + s.version + ' 更新说明</h2><p class="prose">' + esc(s.changelog) + '</p></div>'
      : '') +
    '<div class="detail-section"><h2>目录结构</h2>' + treeHTML(s.structure) + '</div>' +
    securityPanelHTML(s) +
    (s.versions && s.versions.length > 1
      ? '<div class="detail-section"><h2>版本历史</h2><div class="version-list">' +
        s.versions
          .slice()
          .reverse()
          .map((ver) => {
            const st = { pending: '审核中', approved: '已通过', rejected: '已驳回' }[ver.status] || ver.status;
            return (
              '<div class="version-item"><div class="v-head"><b>v' + ver.version + '</b>' +
              '<span class="status-pill ' + (ver.status === 'approved' ? 'success' : ver.status === 'rejected' ? 'rejected' : 'pending') + '">' + st + '</span>' +
              (ver.contentSha256 ? '<span class="v-hash" title="' + esc(ver.contentSha256) + '">sha256 ' + esc(String(ver.contentSha256).slice(0, 10)) + '…</span>' : '') +
              '</div><div class="v-change">' + esc(ver.changelog || '') + '</div></div>'
            );
          })
          .join('') +
        '</div></div>'
      : '') +
    '<hr class="hr" />' +
    '<div class="detail-section"><h2>买家评价</h2>' +
    '<div class="review-overview">' +
    '<div><div class="big">' + s.rating.toFixed(1) + '</div><div style="font-size:12px;color:var(--muted)">综合评分</div></div>' +
    '<div class="review-bars">' +
    [5, 4, 3, 2, 1]
      .map((star) => {
        const cnt = s.ratings ? s.ratings[star - 1] : 0;
        const pct = Math.round((cnt / totalRatings) * 100);
        return '<div class="review-bar-row"><span>' + star + '★</span><span class="track"><i style="width:' + pct + '%"></i></span><span>' + cnt + '</span></div>';
      })
      .join('') +
    '</div></div>' +
    reviewBox +
    (reviews.length
      ? '<div>' +
        reviews
          .map(
            (r) =>
              '<div class="review-item">' +
              avatarHTML(r.author, '') +
              '<div style="flex:1"><div class="r-head"><span class="r-name">' + esc((r.author && r.author.nickname) || '匿名用户') + '</span>' +
              starsHTML(r.rating) + '<span class="r-time">' + timeAgo(r.at) + '</span></div>' +
              '<div class="r-text">' + esc(r.text) + '</div></div></div>'
          )
          .join('') +
        '</div>'
      : '<div class="empty" style="padding:30px"><div class="big" style="font-size:28px">' + icon('chat', 'xl') + '</div>还没有评价,买下它,留下第一条吧</div>') +
    '</div>' +
    '</main>' +
    '<aside>' +
    '<div class="author-card">' +
    '<div class="a-label">开发人简介</div>' +
    '<div class="a-head">' +
    '<button class="avatar-link" data-action="open-profile" data-id="' + esc(s.seller.id) + '" title="进入对方主页">' + avatarWithBadge(s.seller, 'md', '', true) + '</button>' +
    '<div class="a-info"><div class="a-name">' + esc(s.seller.nickname) + '</div>' +
    '<div class="a-title">' + esc(s.seller.title || 'Skill 创作者') + '</div></div>' +
    '</div>' +
    '<p class="a-bio">' + esc(s.seller.bio || '这位作者还没有填写简介。') + '</p>' +
    (isAdminViewer
      ? '<button class="btn btn-outline btn-block" data-action="admin-review-skill" data-id="' + esc(s.id) + '">' + icon('shield', 'sm') + ' 审查该橱窗</button>'
      : s.mine
        ? '<button class="btn btn-outline btn-block" data-action="nav" data-href="#/seller">' + icon('gear', 'sm') + ' 管理我的橱窗</button>'
        : '<button class="btn btn-outline btn-block" data-action="open-chat" data-id="' + esc(s.seller.id) + '">' + icon('chat', 'sm') + ' 联系对方</button>') +
    '</div>' +
    '<div class="methods-card">' +
    '<h4>购买方式</h4>' +
    '<div class="method-label">接入模型</div><div class="methods-row">' + modelTags(s.models) + '</div>' +
    '<div class="method-label">API 调用</div><div style="font-size:13px;color:var(--ink-2)">' + money(s.priceApi) + '/天 · 按实际使用天数计费,只获得调用权限</div>' +
    (s.buyoutAvailable ? '<div class="method-label" style="margin-top:10px">买断</div><div style="font-size:13px;color:var(--ink-2)">' + money(s.buyoutPrice) + ' 一次性 · 直接交付源文件,可商用可修改</div>' : '') +
    '</div>' +
    '</aside>' +
    '</div>'
  );
}

// ---------------- 我的页 ----------------
export function meView(state) {
  const lib = state.library || [];
  const mySkills = state.mySkills || [];
  const projects = state.projects || [];
  const balance = state.balance || 0;

  const libCards = lib
    .map((p) => {
      const s = p.skill || { title: '商品已不可用', cover: {} };
      const badge = p.refunded ? '<span class="lib-badge">已退款</span>' : p.method === 'api' ? '<span class="lib-badge api">API 订阅 · 剩 ' + p.remainingDays + ' 天</span>' : '<span class="lib-badge buyout">已买断</span>';
      const actions =
        p.refunded ? '<span>使用与下载权限已收回</span>' : p.method === 'api'
          ? '<button class="btn btn-outline btn-sm" data-action="library-key" data-id="' + p.id + '">安装到助手</button>'
          : '<button class="btn btn-outline btn-sm" data-action="download-source" data-id="' + p.id + '">下载源文件</button>';
      return (
        '<article class="skill-card" data-action="open-skill" data-id="' + esc(p.skillId) + '">' +
        '<div class="card-cover" style="' + coverStyle(s.cover) + '"><span class="cover-icon">' + icon(s.cover.icon || 'box', 'xl') + '</span>' + badge + '</div>' +
        '<div class="card-body"><div class="card-title"><h3>' + esc(s.title) + '</h3>' +
        '<div class="card-meta" style="border:none;padding:0;margin-top:8px"><span>实付 ' + money(p.price) + '</span><span>' + timeAgo(p.at) + ' 获得</span></div>' +
        '<div class="lib-actions">' + actions + '</div></div></div></article>'
      );
    })
    .join('');

  const myCards = mySkills
    .map(
      (s) =>
        '<article class="skill-card" data-action="open-skill" data-id="' + esc(s.id) + '">' +
        '<div class="card-cover" style="' + coverStyle(s.cover) + '">' +
        (s.cover.image ? '<img class="cover-img" src="' + s.cover.image + '" alt="" />' : '<span class="cover-icon">' + icon(s.cover.icon || 'box', 'xl') + '</span>') +
        '</div>' +
        '<div class="card-body"><div class="card-title"><h3>' + esc(s.title) + '</h3>' +
        '<div class="card-meta" style="border:none;padding:0;margin-top:8px"><span>已售 ' + s.sold + '</span><span>' + starsHTML(s.rating) + ' ' + s.rating.toFixed(1) + '</span></div></div></div></article>'
    )
    .join('');

  const folderCards = projects
    .map(
      (p) =>
        '<div class="folder-card" data-action="open-folder" data-id="' + esc(p.id) + '">' +
        '<span class="folder-ico">' + icon('folder', 'lg') + '</span>' +
        '<div><div class="f-name">' + esc(p.name) + '</div><div class="f-count">' + p.count + ' 个内容</div></div>' +
        '<div class="f-actions">' +
        '<button data-action="rename-folder" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" title="重命名">' + icon('pencil', 'sm') + '</button>' +
        '<button class="del" data-action="delete-folder" data-id="' + esc(p.id) + '" title="删除">' + icon('trash', 'sm') + '</button>' +
        '<button data-action="open-folder" data-id="' + esc(p.id) + '" class="open-btn" title="进入并管理内容">' + icon('chevronR', 'sm') + '</button>' +
        '</div></div>'
    )
    .join('');

  return (
    topbar(state.user, 'me', state.unread) +
    '<div class="container page">' +
    '<div class="profile-card">' +
    '<div class="profile-tools">' +
    '<button class="btn btn-outline btn-sm" data-action="nav" data-href="#/seller">' + icon('upload', 'sm') + ' 卖家中心</button>' +
    '<button class="btn btn-outline btn-sm" data-action="nav" data-href="#/help">' + icon('note', 'sm') + ' 帮助与售后</button>' +
    (ADMIN_ROLES_SET.has(state.user.role) ? '<button class="btn btn-outline btn-sm" data-action="nav" data-href="#/admin">' + icon('database', 'sm') + ' 管理后台</button>' : '') +
    '<button class="settings-btn" data-action="nav" data-href="#/settings" title="设置">' + icon('gear') + '</button>' +
    '</div>' +
    '<div class="avatar-edit" data-action="avatar-upload" title="点击上传头像">' +
    avatarHTML(state.user, 'xl') +
    '<span class="cam">' + icon('camera', 'sm') + '</span>' +
    '</div>' +
    '<div class="profile-info">' +
    '<div class="nick-row">' +
    '<span class="nick" id="nick-text">' + esc(state.user.nickname) + '</span>' +
    '<button class="nick-edit" data-action="edit-nick" title="编辑昵称">' + icon('pencil', 'sm') + '</button>' +
    '</div>' +
    '<div class="profile-phone">' + esc(state.user.phone || '未绑定手机号') + '</div>' +
    '<div class="profile-stats">' +
    '<div class="stat"><b>' + lib.length + '</b><span>我的 Skill</span></div>' +
    '<div class="stat"><b>' + mySkills.length + '</b><span>我发布的</span></div>' +
    '<div class="stat"><b>' + (state.plansCount || 0) + '</b><span>计划中</span></div>' +
    '<div class="stat"><b>' + projects.length + '</b><span>项目文件夹</span></div>' +
    (balance > 0 || mySkills.length ? '<div class="stat" data-action="nav" data-href="#/wallet" style="cursor:pointer"><b style="color:var(--price)">' + money(balance) + '</b><span>余额 · 点击提现</span></div>' : '') +
    '</div></div>' +
    '</div>' +
    '<hr class="hr" />' +
    (lib.length
      ? '<div class="section-head"><h2>我的 Skill 库</h2><span class="sub">你购买的 Skill 都在这里</span><span class="spacer"></span><button class="btn btn-outline btn-sm" data-action="nav" data-href="#/market">去市场逛逛 →</button></div><div class="lib-grid">' + libCards + '</div>'
      : '') +
    (mySkills.length
      ? '<div class="section-head"><h2>我发布的 Skill</h2><span class="sub">你上架的橱窗都在这里</span><span class="spacer"></span><button class="btn btn-outline btn-sm" data-action="nav" data-href="#/seller">卖家中心 →</button></div><div class="lib-grid">' + myCards + '</div>'
      : '') +
    '<hr class="hr" />' +
    '<div class="section-head"><h2>项目文件夹</h2><span class="sub">把 Skill 按项目收纳,或存放你的工作流</span></div>' +
    '<div class="folder-grid">' +
    folderCards +
    '<button class="folder-new" data-action="create-folder">' + icon('plus', 'sm') + ' 新建文件夹</button>' +
    '</div>' +
    '</div>'
  );
}

// ---------------- 计划页 ----------------
export function plansView(state) {
  const plans = state.plans || [];
  const folders = state.planFolders || [];

  const row = (s, opts = {}) =>
    '<div class="plan-item">' +
    '<div class="plan-thumb" style="' + coverStyle(s.cover) + '">' + icon(s.cover.icon || 'box') + '</div>' +
    '<div class="plan-info"><h3>' + esc(s.title) + '</h3>' +
    '<div class="p-meta">' + esc(s.category) + ' · ' + starsHTML(s.rating) + ' ' + s.rating.toFixed(1) + '</div></div>' +
    '<div class="plan-price">' + money(s.priceApi) + '<small>/天起</small></div>' +
    '<div class="plan-actions">' +
    '<button class="btn btn-outline btn-sm" data-action="open-skill" data-id="' + esc(s.id) + '">查看</button>' +
    (opts.inFolder
      ? '<button class="btn btn-primary btn-sm" data-action="buy-from-plan" data-id="' + esc(s.id) + '">购买</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="plan-folder-remove-item" data-id="' + esc(s.id) + '">移出</button>'
      : '<button class="btn btn-ghost btn-sm" data-action="plan-move" data-id="' + esc(s.id) + '">' + icon('folder', 'sm') + ' 归档</button>' +
        '<button class="btn btn-primary btn-sm" data-action="buy-from-plan" data-id="' + esc(s.id) + '">购买</button>') +
    '</div></div>';

  const rows = plans
    .map(
      (s) => row(s)
    )
    .join('');

  const folderBlocks = folders
    .map(
      (fl) =>
        '<div class="plan-folder" data-action="plan-folder-toggle" data-id="' + esc(fl.id) + '">' +
        '<div class="plan-folder-head">' +
        '<span class="folder-ico">' + icon('folder', 'lg') + '</span>' +
        '<span class="pf-name">' + esc(fl.name) + '</span>' +
        '<span class="pf-count">' + fl.skills.length + ' 个待购</span>' +
        '<button class="btn btn-ghost btn-sm" data-action="rename-plan-folder" data-id="' + esc(fl.id) + '" data-name="' + esc(fl.name) + '">' + icon('pencil', 'sm') + '</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="delete-plan-folder" data-id="' + esc(fl.id) + '">' + icon('trash', 'sm') + '</button>' +
        '<span class="chev">' + icon('chevronR', 'sm') + '</span>' +
        '</div>' +
        '<div class="plan-folder-body">' +
        (fl.skills.length
          ? fl.skills.map((s) => row(s, { inFolder: true })).join('')
          : '<div style="color:var(--muted);font-size:12.5px;padding:10px 0">文件夹还是空的,把上方待购项「归档」进来</div>') +
        '</div></div>'
    )
    .join('');

  const hasContent = rows.length > 0 || folders.length > 0;

  return (
    topbar(state.user, 'plans', state.unread) +
    '<div class="container page" style="max-width:900px">' +
    '<div class="section-head" style="margin-top:6px"><h2>我的计划</h2><span class="sub">用文件夹给待购清单分类,没分组的默认放最上面</span><span class="spacer"></span><button class="btn btn-primary btn-sm" data-action="create-plan-folder">' + icon('plus', 'sm') + ' 新建文件夹</button></div>' +
    (hasContent
      ? '<div class="plan-group-title">未分组</div>' +
        (rows ? '<div class="plan-list">' + rows + '</div>' : '<div style="color:var(--muted);font-size:12.5px;margin-bottom:10px">未分组清单为空</div>') +
        (folders.length ? '<div class="plan-group-title">文件夹</div><div class="plan-list">' + folderBlocks + '</div>' : '')
      : '<div class="empty"><div class="big">' + icon('grid', 'xl') + '</div>计划清单还是空的<br/>在橱窗详情页点击「加入计划」,就会出现在这里</div>') +
    '</div>'
  );
}

// ---------------- 我的消息(收件箱) ----------------
export function inboxView(state) {
  const tab = state.inboxTab || 'all';
  const list = (state.inbox || []).filter((c) => tab === 'all' || c.category === tab);
  const tabDefs = [
    ['all', '全部'],
    ['seller', '卖家消息'],
    ['buyer', '买家消息'],
    ['platform', '平台通知'],
  ];
  const rows = list
    .map(
      (c) =>
        '<div class="inbox-item" data-action="open-chat" data-id="' + esc(c.user.id) + '">' +
        avatarWithBadge(c.user, '') +
        '<div class="i-info"><div class="i-name">' + esc(c.user.nickname) + '</div><div class="i-last">' + esc(c.text || '') + '</div></div>' +
        '<span class="i-time">' + timeAgo(c.at) + '</span>' +
        (c.unread > 0 ? '<span class="i-unread">' + c.unread + '</span>' : '') +
        '</div>'
    )
    .join('');
  return (
    topbar(state.user, 'inbox', state.unread) +
    '<div class="container page" style="max-width:820px">' +
    '<div class="section-head" style="margin-top:6px"><h2>我的消息</h2><span class="sub">卖家消息(买家咨询我) / 买家消息(我咨询卖家) / 平台通知</span><span class="spacer"></span>' +
    (state.unread > 0 ? '<button class="btn btn-ghost btn-sm" data-action="inbox-read-all">' + icon('check', 'sm') + ' 全部标为已读</button>' : '') +
    '</div>' +
    '<div class="inbox-tabs">' +
    tabDefs.map(([k, label]) => '<button class="inbox-tab ' + (tab === k ? 'on' : '') + '" data-action="inbox-tab" data-tab="' + k + '">' + label + '</button>').join('') +
    '</div>' +
    (rows
      ? '<div class="plan-list">' + rows + '</div>'
      : '<div class="empty"><div class="big">' + icon('chat', 'xl') + '</div>还没有消息。去逛逛市场,点开任意橱窗「联系对方」就能开始对话。</div>') +
    '</div>'
  );
}

// ---------------- 求购大厅 ----------------
export function requestsView(state) {
  const list = state.requests || [];
  const mine = state.myRequests || [];
  const isAdmin = ADMIN_ROLES_SET.has(state.user && state.user.role);
  const applicantsHTML = (r) => {
    const apps = r.applicants || [];
    if (!apps.length) return '';
    if (r.mine) {
      return (
        '<div class="req-apps">' +
        apps
          .map(
            (a) =>
              a.rejected
                ? '<span class="app-chip rejected">' + icon('x', 'sm') + esc(a.taker.nickname) + '的橱窗已被你拒绝</span>'
                : a.skill
                  ? '<div class="app-chip-row"><button class="app-chip" data-action="open-skill" data-id="' + esc(a.skill.id) + '">' + icon('box', 'sm') + esc(a.taker.nickname) + '的橱窗:『' + esc(a.skill.title) + '』<span>查看 →</span></button><button class="btn btn-danger-ghost btn-sm" data-action="request-reject" data-id="' + esc(r.id) + '" data-taker="' + esc(a.taker.id) + '">拒绝</button></div>'
                  : '<span class="app-chip wait">' + esc(a.taker.nickname) + ' · 等待上传橱窗链接</span>'
          )
          .join('') +
        '</div>'
      );
    }
    if (r.takenMine) {
      const mineApp = apps.find((a) => a.mine);
      if (mineApp && mineApp.skill) {
        return '<div class="req-apps"><span style="color:var(--green);font-size:12px">' + icon('check', 'sm') + ' 我已应征,并已发送橱窗链接:『' + esc(mineApp.skill.title) + '』</span></div>';
      }
    }
    return '';
  };
  const cards = list
    .map((r) => {
      return (
        '<div class="request-card">' +
        '<div class="req-head">' +
        '<div><h3>' + esc(r.title) + '</h3>' +
        '<div class="p-meta">预算 ' + money(r.budget) + ' <span class="budget-hint">预算仅供参考</span> · ' + esc(r.category || '未分类') + ' · ' + timeAgo(r.createdAt) + '</div></div>' +
        '<span class="status-pill ' + (r.status === 'open' ? 'success' : r.status === 'taken' ? 'pending' : 'rejected') + '">' + esc(r.statusLabel) + (r.status === 'taken' ? ' · ' + r.takerCount + ' 人应征' : '') + '</span>' +
        '</div>' +
        '<div class="req-desc">' + esc(r.description || '发布者暂未补充细节,接单后可在消息中沟通。') + '</div>' +
        applicantsHTML(r) +
        '<div class="req-foot">' +
        '<span style="color:var(--muted);font-size:12px">发布者:' + esc(r.poster ? r.poster.nickname || r.poster.username : '-') + '</span>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn-ghost btn-sm" data-action="request-detail" data-id="' + esc(r.id) + '">' + icon('eye', 'sm') + ' 查看详情</button>' +
        (isAdmin
          ? (r.status === 'removed'
              ? '<button class="btn btn-outline btn-sm" data-action="admin-request" data-id="' + esc(r.id) + '" data-op="restore">恢复求购</button>'
              : '<button class="btn btn-danger-ghost btn-sm" data-action="admin-request" data-id="' + esc(r.id) + '" data-op="remove">下架求购</button>')
          : r.mine
            ? '<button class="btn btn-ghost btn-sm" data-action="close-request" data-id="' + esc(r.id) + '">' + (r.status === 'taken' ? '完成并关闭' : '取消求购') + '</button>'
          : r.takenMine
            ? ((r.applicants || []).find((a) => a.mine) || {}).rejected
              ? '<span style="color:var(--amber);font-size:12px">' + icon('alert', 'sm') + ' 发布者暂未选择你的橱窗,可重新上传</span>' +
                '<button class="btn btn-primary btn-sm" data-action="request-link" data-id="' + esc(r.id) + '">' + icon('upload', 'sm') + ' 重新上传橱窗链接</button>'
              : ((r.applicants || []).find((a) => a.mine) || {}).skill
                ? '<span style="color:var(--green);font-size:12px">' + icon('check', 'sm') + ' 已应征并发送橱窗链接</span>'
                : '<button class="btn btn-primary btn-sm" data-action="request-link" data-id="' + esc(r.id) + '">' + icon('upload', 'sm') + ' 上传橱窗链接</button>'
            : (r.status === 'open' || r.status === 'taken')
              ? '<button class="btn btn-primary btn-sm" data-action="take-request" data-id="' + esc(r.id) + '">' + icon('check', 'sm') + ' 我要接单</button>'
              : '<span style="color:var(--muted);font-size:12px">已结束</span>') +
        '</div></div>'
      );
    })
    .join('');
  const mineCards = mine
    .filter((r) => !list.some((x) => x.id === r.id))
    .map((r) => {
      return (
        '<div class="request-card muted">' +
        '<div class="req-head"><div><h3>' + esc(r.title) + '</h3>' +
        '<div class="p-meta">预算 ' + money(r.budget) + ' <span class="budget-hint">预算仅供参考</span> · ' + timeAgo(r.createdAt) + '</div></div>' +
        '<span class="status-pill rejected">' + esc(r.statusLabel) + '</span></div>' +
        '<div class="req-desc">' + esc(r.description || '') + '</div>' +
        ((r.applicants || []).length
          ? '<div class="req-foot"><span style="color:var(--muted);font-size:12px">共有 ' + r.applicants.length + ' 位应征</span></div>'
          : '') +
        '</div>'
      );
    })
    .join('');
  return (
    topbar(state.user, 'requests', state.unread) +
    '<div class="container page" style="max-width:900px">' +
    '<div class="section-head" style="margin-top:6px"><h2>求购大厅</h2><span class="sub">' + (isAdmin ? '管理员只管理求购,不能发布或接单' : '发布需求、写明预算,卖家看到后会接单并私聊你') + '</span><span class="spacer"></span>' + (isAdmin ? '' : '<button class="btn btn-primary btn-sm" data-action="new-request">' + icon('plus', 'sm') + ' 发布求购</button>') + '</div>' +
    (cards
      ? '<div class="plan-list">' + cards + '</div>'
      : '<div class="empty"><div class="big">' + icon('target', 'xl') + '</div>还没有进行中的求购<br/>你可以发布第一条需求,等卖家来接单。</div>') +
    (mineCards ? '<div class="section-head"><h2>我的求购</h2><span class="sub">已关闭 / 已取消的求购</span></div><div class="plan-list">' + mineCards + '</div>' : '') +
    '</div>'
  );
}

// ---------------- 帮助与售后(工单/投诉/申诉/退款/纠纷) ----------------
export function helpView(state) {
  const tickets = state.tickets || [];
  const rows = tickets
    .map(
      (t) =>
        '<div class="inbox-item" data-action="open-ticket" data-id="' + esc(t.id) + '">' +
        '<span class="t-ico">' + icon(t.type === 'refund' ? 'coin' : t.type === 'complaint' ? 'alert' : 'note', 'sm') + '</span>' +
        '<div class="i-info"><div class="i-name">' + esc(t.title) + '</div><div class="i-last">' + esc(t.typeLabel) + (t.skill ? ' · ' + esc(t.skill.title) : '') + '</div></div>' +
        '<span class="status-pill ' + (t.status === 'resolved' ? 'success' : t.status === 'rejected' ? 'rejected' : 'pending') + '">' + esc(t.statusLabel) + '</span>' +
        '<span class="i-time">' + timeAgo(t.updatedAt || t.createdAt) + '</span>' +
        '</div>'
    )
    .join('');
  return (
    topbar(state.user, 'help', state.unread) +
    '<div class="container page" style="max-width:820px">' +
    '<div class="section-head" style="margin-top:6px"><h2>帮助与售后</h2><span class="sub">客服工单 · 投诉 · 申诉 · 退款 · 纠纷仲裁</span><span class="spacer"></span><button class="btn btn-primary btn-sm" data-action="new-ticket">' + icon('plus', 'sm') + ' 提交工单</button></div>' +
    '<div class="settings-card" style="margin-bottom:14px"><h3>' + icon('shield', 'sm') + ' 售后规则速览</h3>' +
    '<div class="sys-line"><span>API 订阅退款</span><b>退未调用天数,收 0.5% 服务费(买家承担),退款进账户余额</b></div>' +
    '<div class="sys-line"><span>买断退款</span><b>原则上不退款;需先与卖家沟通,卖家同意后由平台执行</b></div>' +
    '<div class="sys-line"><span>纠纷仲裁</span><b>卖家拒绝退款后可一键升级,平台根据双方证据裁定</b></div>' +
    '<div class="sys-line"><span>余额提现</span><b>最低 10 元;API 未调用天数可退款部分会冻结,不可提现</b></div>' +
    '</div>' +
    (rows
      ? '<div class="plan-list">' + rows + '</div>'
      : '<div class="empty"><div class="big">' + icon('note', 'xl') + '</div>还没有工单<br/>遇到问题点右上角「提交工单」;退款申请选「退款申请」类型并关联订单。</div>') +
    '</div>'
  );
}

export function ticketDetailView(state) {
  const t = state.ticketDetail;
  if (!t) return '<div class="container page">工单不存在</div>';
  const replies = state.ticketReplies || [];
  const msgs = replies
    .map(
      (m) =>
        '<div class="chat-msg ' + (m.mine ? 'me' : '') + '">' +
        '<div class="cm-bubble"><div class="cm-name">' + esc(m.fromName) + '</div>' + esc(m.text) + '<div class="cm-time">' + timeAgo(m.at) + '</div></div></div>'
    )
    .join('');
  const closed = t.status === 'resolved' || t.status === 'rejected';
  return (
    topbar(state.user, 'help', state.unread) +
    '<div class="container page" style="max-width:760px">' +
    '<div class="section-head" style="margin-top:6px"><h2>' + esc(t.title) + '</h2><span class="sub">' + esc(t.typeLabel) + ' · ' + esc(t.statusLabel) + '</span></div>' +
    '<div class="settings-card">' +
    '<div class="sys-line"><span>工单编号</span><b class="mono">' + esc(t.id) + '</b></div>' +
    (t.skill ? '<div class="sys-line"><span>关联商品</span><b>' + esc(t.skill.title) + '</b></div>' : '') +
    (t.purchase ? '<div class="sys-line"><span>关联订单</span><b>' + esc(t.purchase.method === 'api' ? 'API 订阅' : '买断') + ' · 实付 ' + money(t.purchase.price) + ' · 可退上限 ' + money(t.purchase.maxRefund || 0) + '</b></div>' : '') +
    (t.refundAmount > 0 ? '<div class="sys-line"><span>退款金额</span><b style="color:var(--price)">' + money(t.refundAmount) + '</b></div>' : '') +
    (t.adminNote ? '<div class="sys-line"><span>处理说明</span><b>' + esc(t.adminNote) + '</b></div>' : '') +
    '</div>' +
    (t.canEscalate ? '<div class="settings-card" style="border-color:rgba(23,116,246,0.5)"><h3>' + icon('alert', 'sm') + ' 卖家拒绝了你的退款</h3><p style="color:var(--ink-2);font-size:13.5px;margin-bottom:12px">如认为不合理,可申请平台介入仲裁,管理员将根据双方证据裁定退款金额。</p><button class="btn btn-danger-ghost" data-action="ticket-escalate" data-id="' + esc(t.id) + '">一键升级平台仲裁</button></div>' : '') +
    '<div class="settings-card"><h3>' + icon('chat', 'sm') + ' 沟通记录</h3>' +
    '<div class="chat-flow">' + (msgs || '<div style="color:var(--muted);font-size:12.5px">暂无回复</div>') + '</div>' +
    (closed
      ? '<div style="color:var(--muted);font-size:12.5px;padding:8px 2px">该工单已关闭,如需继续请另开工单。</div>'
      : '<form data-form="ticket-reply" style="display:flex;gap:10px;margin-top:12px"><input name="text" placeholder="补充说明…" style="flex:1;background:#0b2242;border:1px solid var(--line);color:var(--ink);padding:10px 12px" /><button class="btn btn-primary" type="submit">发送</button></form>') +
    '</div></div>'
  );
}

// ---------------- 钱包 / 提现 ----------------
export function walletView(state) {
  const withdrawable = state.withdrawable === undefined ? state.balance || 0 : Number(state.withdrawable) || 0;
  const withdrawals = state.withdrawals || [];
  const pendingFen = state.escrowPendingFen || 0;
  const frozenRefundable = Number(state.frozenRefundable) || 0;
  const settleText = state.escrowUntil
    ? new Date(state.escrowUntil).toLocaleDateString('zh-CN') + ' 后自动结算'
    : state.escrowDays
      ? '成交后 ' + state.escrowDays + ' 天自动结算'
      : '成交后按平台规则自动结算';
  const rows = withdrawals
    .map(
      (w) =>
        '<div class="wallet-row"><div><b>' + money(w.amount) + '</b><span style="color:var(--muted);font-size:12px"> · ' + timeAgo(w.at) + '</span></div><span class="status-pill ' + w.status + '">' + (w.status === 'pending' ? '待打款' : w.status === 'success' ? '已到账' : '已退回') + '</span></div>'
    )
    .join('');
  return (
    topbar(state.user, 'me', state.unread) +
    '<div class="container page" style="max-width:760px">' +
    '<div class="section-head" style="margin-top:6px"><h2>我的钱包</h2><span class="sub">销售 Skill 的收益</span></div>' +
    '<div class="settings-card" style="text-align:center">' +
    '<div style="color:var(--muted);font-size:13px">可提现余额</div>' +
    '<div class="balance-big">' + money(withdrawable) + '</div>' +
    '<div class="wallet-row" style="max-width:420px;margin:14px auto 0;text-align:left"><div class="s-info"><b>托管中(待结算)</b><span>' + settleText + '</span></div><b style="color:var(--amber)">' + money(pendingFen / 100) + '</b></div>' +
    (frozenRefundable > 0
      ? '<div class="wallet-row" style="max-width:420px;margin:10px auto 0;text-align:left"><div class="s-info"><b>冻结中(API 未调用天数可退款)</b><span>买家未调用的天数还能退款,对应金额暂时不能提现</span></div><b style="color:var(--amber)">' + money(frozenRefundable) + '</b></div>'
      : '') +
    '<form data-form="withdraw" style="display:flex;gap:10px;max-width:420px;margin:16px auto 0">' +
    '<input name="amount" type="number" min="10" step="1" placeholder="输入提现金额(最低 10 元)" style="flex:1;background:#0b2242;border:1px solid var(--line);color:var(--ink);padding:10px 12px" />' +
    '<button class="btn btn-primary" type="submit">' + icon('download', 'sm') + ' 申请提现</button>' +
    '</form>' +
    '<div class="field-error" id="withdraw-error"></div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:8px">低于 10 元的金额不支持在线提现,请走客服渠道:<button class="btn btn-ghost btn-sm" data-action="toast" data-msg="客服渠道(演示):打开「我的消息」联系平台客服,说明金额即可人工处理" style="margin-left:6px">联系客服</button></div>' +
    '</div>' +
    '<div class="settings-card"><h3>' + icon('list', 'sm') + ' 提现记录</h3>' +
    (rows ? rows : '<div style="color:var(--muted);font-size:12.5px">还没有提现记录</div>') +
    '</div>' +
    '</div>'
  );
}

// ---------------- 卖家中心 ----------------
export function sellerView(state) {
  const skills = state.sellerSkills || [];
  const sellerTab = state.sellerTab || 'goods';
  const ov = state.sellerOverview || { slots: 0, maxSlots: 3, slotPrice: 30, published: skills.length, freeSlots: 0, balance: 0 };
  const nextSlotQuote = ov.nextSlotQuote || { slotNumber: (ov.slots || 0) + 1, originalPrice: 30, price: 0, display: '0元（-100%）' };
  const escrowPendingFen = state.escrowPendingFen || 0;
  const cats = (state.categories || []).filter((c) => c.id !== '全部');
  const iconKeys = ['box', 'resume', 'chart', 'mic', 'pen', 'shield', 'target', 'note', 'trend', 'coin', 'users', 'code', 'briefcase', 'building', 'palette', 'megaphone', 'gradcap', 'list'];
  const rows = skills
    .map(
      (s) =>
        '<div class="plan-item">' +
        '<div class="plan-thumb" style="' + coverStyle(s.cover) + '">' + icon(s.cover.icon || 'box') + '</div>' +
        '<div class="plan-info"><h3>' + esc(s.title) + '</h3>' +
        '<div class="p-meta">v' + (s.version || 1) + ' · ' + esc(s.category) + ' · 已售 ' + s.sold + ' · ' + starsHTML(s.rating) + ' ' + s.rating.toFixed(1) +
        (s.hasFile ? ' · ' + icon('shield', 'sm') + ' 已加密' : ' · 未上传源文件') +
        (s.status === 'delisted' ? ' · <span style="color:var(--amber)">已下架</span>' : s.status === 'pending' ? ' · <span style="color:var(--accent)">审核中</span>' : s.status === 'rejected' ? ' · <span style="color:var(--red)">已驳回</span>' : '') + '</div></div>' +
        '<div class="plan-price">' + money(s.priceApi) + '<small>/天</small></div>' +
        '<div class="plan-actions">' +
        '<button class="btn btn-outline btn-sm" data-action="open-skill" data-id="' + esc(s.id) + '">查看</button>' +
        (s.status !== 'pending' ? '<button class="btn btn-outline btn-sm" data-action="seller-version" data-id="' + esc(s.id) + '">' + icon('upload', 'sm') + ' 更新版本</button>' : '') +
        (s.status === 'delisted'
          ? '<button class="btn btn-primary btn-sm" data-action="restore-skill" data-id="' + esc(s.id) + '">重新上架</button>'
          : s.status === 'rejected'
            ? '<button class="btn btn-primary btn-sm" data-action="resubmit-skill" data-id="' + esc(s.id) + '">重新提交审核</button>'
            : '<button class="btn btn-danger-ghost btn-sm" data-action="delist-skill" data-id="' + esc(s.id) + '">下架</button>') +
        '</div>' +
        '</div>'
    )
    .join('');
  const takeRows = (state.requests || [])
    .filter((r) => r.status === 'open')
    .map(
      (r) =>
        '<div class="request-card"><div class="req-head"><div><h3>' + esc(r.title) + '</h3>' +
        '<div class="p-meta">预算 ' + money(r.budget) + ' · ' + esc(r.category || '未分类') + ' · ' + timeAgo(r.createdAt) + '</div></div>' +
        '<span class="status-pill success">求购中</span></div>' +
        '<div class="req-desc">' + esc(r.description || '') + '</div>' +
        '<div class="req-foot"><span style="color:var(--muted);font-size:12px">发布者:' + esc(r.poster ? r.poster.nickname || r.poster.username : '-') + '</span><span class="spacer"></span>' +
        '<button class="btn btn-primary btn-sm" data-action="take-request" data-id="' + esc(r.id) + '">' + icon('check', 'sm') + ' 接单并联系买家</button></div></div>'
    )
    .join('');
  const takenMineRows = (state.requests || [])
    .filter((r) => r.takenMine && r.status === 'taken')
    .map(
      (r) =>
        '<div class="request-card"><div class="req-head"><div><h3>' + esc(r.title) + '</h3>' +
        '<div class="p-meta">预算 ' + money(r.budget) + ' <span class="budget-hint">预算仅供参考</span> · 发布者 ' + esc(r.poster ? r.poster.nickname || r.poster.username : '-') + ' · ' + timeAgo(r.takenAt || r.updatedAt) + '</div></div>' +
        '<span class="status-pill pending">我已应征' + (r.takerCount > 1 ? ' · 共 ' + r.takerCount + ' 人应征' : '') + '</span></div>' +
        '<div class="req-desc">' + esc(r.description || '') + '</div>' +
        '<div class="req-foot"><span style="color:var(--muted);font-size:12px">接单后请勿私下联系发布者,把你的橱窗链接发给 TA</span><span class="spacer"></span>' +
        (((r.applicants || []).find((a) => a.mine) || {}).skill
          ? '<span style="color:var(--green);font-size:12px">' + icon('check', 'sm') + ' 已发送:『' + esc(((r.applicants || []).find((a) => a.mine) || {}).skill.title) + '』</span>'
          : '<button class="btn btn-primary btn-sm" data-action="request-link" data-id="' + esc(r.id) + '">' + icon('upload', 'sm') + ' 上传橱窗链接</button>') +
        '</div></div>'
    )
    .join('');
  const refundRows = (state.sellerRefunds || [])
    .map(
      (t) =>
        '<div class="request-card"><div class="req-head"><div><h3>' + esc(t.title) + '</h3>' +
        '<div class="p-meta">买家 ' + esc(t.purchase ? t.purchase.method === 'api' ? 'API' : '买断' : '') + ' · 金额 ' + money(t.refundAmount || 0) + ' · ' + timeAgo(t.updatedAt || t.createdAt) + '</div></div>' +
        '<span class="status-pill ' + (t.status === 'pending_seller' ? 'pending' : t.status === 'resolved' ? 'success' : 'rejected') + '">' + esc(t.statusLabel) + '</span></div>' +
        '<div class="req-desc">' + esc(t.text || '') + '</div>' +
        (t.status === 'pending_seller' || (t.status === 'open' && t.type === 'refund')
          ? '<div class="req-foot"><span class="spacer"></span><button class="btn btn-primary btn-sm" data-action="seller-refund" data-id="' + esc(t.id) + '" data-approve="true">同意退款</button> <button class="btn btn-danger-ghost btn-sm" data-action="seller-refund" data-id="' + esc(t.id) + '" data-approve="false">拒绝</button></div>'
          : '<div class="req-foot"><span style="color:var(--muted);font-size:12px">' + esc(t.adminNote || '') + '</span></div>') +
        '</div>'
    )
    .join('');

  const publishGate =
    ov.freeSlots > 0
      ? '<form data-form="seller-publish">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px">' +
        '<div class="field"><label>Skill 标题</label><input name="title" placeholder="例如:竞品价格监控看板" maxlength="30" /></div>' +
        '<div class="field"><label>分类</label><select name="category" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
        cats.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('') +
        '</select></div>' +
        '<div class="field"><label>API 日价(元)</label><input name="priceApi" type="number" min="0" step="0.1" value="2" /></div>' +
        '<div class="field"><label>买断价(元,可不填)</label><input name="buyoutPrice" type="number" min="0" step="1" placeholder="0 表示不开放买断" /></div>' +
        '</div>' +
        '<div class="field"><label>接入模型</label><div style="display:flex;gap:12px">' +
        ['codex', 'claude', 'workbuddy']
          .map((m) => '<label style="display:flex;gap:6px;align-items:center;color:var(--ink-2)"><input type="checkbox" name="models" value="' + m + '" /> ' + MODEL_LABEL[m] + '</label>')
          .join('') +
        '</div></div>' +
        '<div class="field"><label>封面图(可上传自己的图片,不传则用图标)</label>' +
        '<div style="display:flex;gap:12px;align-items:center">' +
        '<div id="cover-preview" style="width:88px;height:56px;border:1px solid var(--line);display:grid;place-items:center;background:#0b2242;color:var(--muted);font-size:20px;overflow:hidden">' + icon('camera', 'lg') + '</div>' +
        '<input name="coverImage" type="file" accept="image/png,image/jpeg,image/webp" data-action="cover-preview" style="background:#0b2242;border:1px solid var(--line);padding:9px;color:var(--ink)" />' +
        '</div></div>' +
        '<div class="field"><label>封面图标(无封面图时使用)</label><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        iconKeys
          .map(
            (k, i) =>
              '<label style="display:flex;align-items:center;gap:5px;border:1px solid var(--line);padding:5px 9px;cursor:pointer;color:var(--ink-2)"><input type="radio" name="icon" value="' + k + '"' + (i === 0 ? ' checked' : '') + ' /> ' + icon(k, 'sm') + '</label>'
          )
          .join('') +
        '</div></div>' +
        '<div class="field"><label>源文件上传方式</label>' +
        '<div class="seg-tabs" style="margin-bottom:10px">' +
        '<button type="button" class="up-tab on" data-action="up-tab" data-mode="single">单文件</button>' +
        '<button type="button" class="up-tab" data-action="up-tab" data-mode="folder">整个文件夹</button>' +
        '<button type="button" class="up-tab" data-action="up-tab" data-mode="zip">ZIP 压缩包</button>' +
        '</div>' +
        '<input name="srcfile" id="srcfile" type="file" accept=".js,.py,.md,.txt,.json" style="background:#0b2242;border:1px solid var(--line);padding:10px;width:100%;color:var(--ink)" />' +
        '<div class="field-hint" id="src-hint">支持 .js / .py / .md / .txt / .json;目录结构按你上传的真实文件生成,不会伪造</div></div>' +
        '<div class="field"><label>一句话简介</label><input name="intro" maxlength="200" placeholder="这个 Skill 能帮买家解决什么?" /></div>' +
        '<div class="field"><label>详细说明</label><textarea name="description" rows="3" placeholder="目录结构、使用方法、适用人群…"></textarea></div>' +
        '<div class="field"><label>数据隐私模式</label><select name="privacyMode" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
        '<option value="sandbox">平台沙箱运行(默认):买家输入进入隔离沙箱,禁网、用完即弃</option>' +
        '<option value="local">仅买家本机运行:买家下载运行器在本机执行,输入全程不出本机</option>' +
        '</select><div class="field-hint">选「仅本机运行」时,平台不代为执行调用,买家数据你与平台都接触不到;选沙箱模式时买家输入会在平台沙箱内存中处理一次。</div></div>' +
        '<div class="field-error" id="publish-error"></div>' +
        '<button class="btn btn-primary" type="submit">' + icon('shield', 'sm') + ' 上传并加密发布</button>' +
        '</form>' +
        '<div class="note-box" style="margin-top:14px;margin-bottom:0">上传后平台立即用 AES-256-GCM 加密存储(密钥由平台托管)。API 买家只能领取当日许可在本机运行,拿不到源文件;买断买家才交付源文件。</div>'
      : (ov.slots >= ov.maxSlots
          ? '<div class="empty" style="padding:36px"><div class="big">' + icon('box', 'xl') + '</div>橱窗位已达上限 ' + ov.maxSlots + ' 个<br/><div style="font-size:12px;margin-top:10px;color:var(--muted)">请先下架一件商品腾出位置,再发布新的 Skill</div></div>'
          : '<div class="empty" style="padding:36px"><div class="big">' + icon('box', 'xl') + '</div>没有空闲橱窗位了<br/><button class="btn btn-primary" style="margin-top:14px" data-action="buy-slot">' + icon('plus', 'sm') + ' 开通第 ' + nextSlotQuote.slotNumber + ' 个橱窗 · ' + nextSlotQuote.display + '</button><div style="font-size:12px;margin-top:10px;color:var(--muted)">标准上架费 30 元；前六个月三个位置均为 0元（-100%）</div></div>');

  const goodsBody =
    '<div class="slot-bar">' +
    '<span>橱窗位:已购 <b>' + ov.slots + '</b> / 上限 ' + ov.maxSlots + '</span>' +
    '<span>已上架 <b>' + ov.published + '</b></span>' +
    (ov.pending ? '<span>审核中 <b>' + ov.pending + '</b></span>' : '') +
    (ov.rejected ? '<span style="color:var(--red)">已驳回 <b>' + ov.rejected + '</b></span>' : '') +
    '<span>空闲 <b>' + ov.freeSlots + '</b></span>' +
    '<span data-action="nav" data-href="#/wallet" style="cursor:pointer" title="点击进入钱包提现">账户余额 <b style="color:var(--price)">' + money(ov.balance || 0) + '</b> · 提现</span>' +
    (escrowPendingFen > 0 ? '<span data-action="nav" data-href="#/wallet" style="cursor:pointer" title="成交后托管,到期自动结算给你">托管中(待结算) <b style="color:var(--amber)">' + money(escrowPendingFen / 100) + '</b></span>' : '') +
    '<span>佣金 <b>' + Math.round((Number(ov.commissionRate) || 0) * 100) + '%</b></span>' +
    '<span style="color:var(--muted)">标准上架费 30 元 · 前六个月三个位置 0元（-100%）</span>' +
    '<span class="spacer"></span>' +
    (ov.slots < ov.maxSlots ? '<button class="btn btn-outline btn-sm" data-action="buy-slot">' + icon('plus', 'sm') + ' 第 ' + nextSlotQuote.slotNumber + ' 个橱窗 · ' + nextSlotQuote.display + '</button>' : '') +
    '</div>' +
    '<div class="settings-card"><h3>' + icon('upload', 'sm') + ' 发布新 Skill</h3>' + publishGate + '</div>' +
    '<div class="section-head"><h2>我的橱窗</h2><span class="sub">共 ' + skills.length + ' 个</span></div>' +
    (rows ? '<div class="plan-list">' + rows + '</div>' : '<div class="empty"><div class="big">' + icon('box', 'xl') + '</div>还没有发布过 Skill</div>');

  return (
    topbar(state.user, '', state.unread) +
    '<div class="container page" style="max-width:860px">' +
    '<div class="section-head" style="margin-top:6px"><h2>卖家中心</h2><span class="sub">上传 → 平台加密 → 上架销售</span></div>' +
    '<div class="seg-tabs" style="margin-bottom:14px">' +
    '<button class="' + (sellerTab === 'goods' ? 'on' : '') + '" data-action="seller-tab" data-tab="goods">' + icon('box', 'sm') + ' 商品橱窗</button>' +
    '<button class="' + (sellerTab === 'take' ? 'on' : '') + '" data-action="seller-tab" data-tab="take">' + icon('target', 'sm') + ' 求购接单</button>' +
    '<button class="' + (sellerTab === 'refunds' ? 'on' : '') + '" data-action="seller-tab" data-tab="refunds">' + icon('coin', 'sm') + ' 售后退款</button>' +
    '</div>' +
    (sellerTab === 'goods'
      ? goodsBody
      : sellerTab === 'take'
        ? (takeRows || takenMineRows
            ? '<div class="plan-list">' +
              (takeRows
                ? '<div class="section-head"><h2>可接的求购</h2><span class="sub">接单后上传你的橱窗链接给买家</span></div>' + takeRows
                : '<div class="empty"><div class="big">' + icon('target', 'xl') + '</div>暂无可接的求购单<br/>买家发布求购后会出现在这里。</div>') +
              (takenMineRows ? '<div class="section-head"><h2>我接下的</h2><span class="sub">把橱窗链接发给买家,完成交付</span></div>' + takenMineRows : '') +
              '</div>'
            : '<div class="empty"><div class="big">' + icon('target', 'xl') + '</div>暂无可接的求购单<br/>买家发布求购后会出现在这里。</div>')
        : (refundRows ? '<div class="plan-list">' + refundRows + '</div>' : '<div class="empty"><div class="big">' + icon('coin', 'xl') + '</div>暂没有买家发起退款申请。</div>')) +
    '</div>'
  );
}

// ---------------- 设置页 ----------------
export function settingsView(state) {
  const s = (state.user && state.user.settings) || { notify: true, contactable: true };
  const u = state.user;
  const tab = state.settingsTab || 'profile';
  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString('zh-CN') : '—');
  const roleLabel = { buyer: '买家', seller: '卖家', super_admin: '超级管理员', admin: '超级管理员', operator: '运营', finance: '财务', support: '客服', viewer: '观察员' };

  const navGroups = [
    ['账号', [['profile', 'users', '账号资料'], ['security', 'shield', '账号安全']]],
    ['偏好', [['notifications', 'alert', '通知'], ['privacy', 'eyeOff', '隐私'], ['appearance', 'palette', '外观']]],
    ['其他', [['about', 'boat', '关于访迹']]],
  ];
  const nav = navGroups
    .map(
      ([group, items]) =>
        '<div class="settings-nav-group">' +
        '<div class="settings-nav-label">' + group + '</div>' +
        items
          .map(
            ([id, ic, label]) =>
              '<button class="settings-nav-item ' + (tab === id ? 'on' : '') + '" data-action="settings-tab" data-tab="' + id + '">' + icon(ic, 'sm') + ' ' + label + '</button>'
          )
          .join('') +
        '</div>'
    )
    .join('');

  const accentChoices = [
    ['blue', '#66c0f4', '蓝'],
    ['cyan', '#4dd0c7', '青'],
    ['purple', '#a78bfa', '紫'],
  ];
  const accent = (s.theme || 'blue');
  const density = (s.density || 'comfortable');

  let panel = '';
  if (tab === 'profile') {
    panel =
      '<div class="settings-panel-head"><h3>账号资料</h3><span>你的公开资料信息</span></div>' +
      '<div class="settings-avatar-row">' + avatarHTML(u, 'lg') +
      '<div><b>' + esc(u.nickname) + '</b><div class="muted-small">用户名:' + esc(u.username) + '</div></div>' +
      '<button class="btn btn-outline btn-sm" data-action="avatar-upload">' + icon('camera', 'sm') + ' 更换头像</button></div>' +
      '<form data-form="profile" class="settings-form">' +
      '<div class="field"><label>昵称</label><input name="nickname" maxlength="20" value="' + esc(u.nickname) + '" /></div>' +
      '<div class="field"><label>个人简介</label><textarea name="bio" maxlength="200" rows="3" placeholder="介绍一下你自己">' + esc(u.bio || '') + '</textarea></div>' +
      '<div class="field"><label>用户名</label><input value="' + esc(u.username) + '" disabled /></div>' +
      '<div class="field"><label>手机号</label><input value="' + esc(u.phone) + '" disabled /><div class="field-hint">手机号用于登录与安全验证,更换请联系客服</div></div>' +
      '<div class="settings-meta-row"><span>角色:' + (roleLabel[u.role] || u.role) + '</span>' +
      '<span>注册时间:' + fmtDate(u.createdAt) + '</span>' +
      '<span>' + (u.verified || (u.realname && u.realname.status === 'verified') ? '<span class="ok-text">已实名认证</span>' : '<span class="muted-text">未实名认证</span>') + '</span></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">保存资料</button>' +
      '</form>' +
      certSection(state) +
      realnameSection(state);
  } else if (tab === 'security') {
    panel =
      '<div class="settings-panel-head"><h3>账号安全</h3><span>密码与登录保护</span></div>' +
      '<div class="settings-section-title">修改密码</div>' +
      '<form data-form="password" class="settings-form" style="max-width:420px">' +
      '<div class="field"><label>当前密码</label><div class="pwd-wrap"><input name="old" type="password" placeholder="输入当前密码" /><button type="button" class="pwd-toggle" data-action="toggle-pwd">' + icon('eye', 'sm') + '</button></div></div>' +
      '<div class="field"><label>新密码</label><div class="pwd-wrap"><input name="next" type="password" placeholder="至少 6 位" /><button type="button" class="pwd-toggle" data-action="toggle-pwd">' + icon('eye', 'sm') + '</button></div></div>' +
      '<div class="field"><label>确认新密码</label><div class="pwd-wrap"><input name="confirm" type="password" placeholder="再次输入新密码" /><button type="button" class="pwd-toggle" data-action="toggle-pwd">' + icon('eye', 'sm') + '</button></div></div>' +
      '<div class="field-error" id="pwd-error"></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">修改密码</button>' +
      '</form>' +
      '<div class="note-box">密码使用 scrypt 加盐哈希后存储,服务器不保存明文;登录令牌为 HMAC 签名、30 天有效,敏感接口均需登录校验。</div>' +
      '<div class="settings-section-title">登录设备</div>' +
      '<div class="device-row"><span class="device-ico">' + icon('gear', 'sm') + '</span><div class="s-info"><b>Windows · 本机(当前)</b><span>最近登录:' + fmtDate(u.lastLoginAt || Date.now()) + '</span></div><button class="btn btn-danger-ghost btn-sm" data-action="logout-devices">退出其他设备</button></div>' +
      '<div class="device-row"><span class="device-ico">' + icon('boat', 'sm') + '</span><div class="s-info"><b>手机浏览器 · 演示设备</b><span>上次登录:从未</span></div><span class="muted-small">已退出</span></div>' +
      '<div class="settings-section-title">账号状态</div>' +
      '<div class="set-row"><div class="s-info"><b>账号正常</b><span>状态:' + (u.status === 'disabled' ? '已禁用' : '正常') + '</span></div><span class="ok-text">' + icon('check', 'sm') + ' 安全</span></div>';
  } else if (tab === 'notifications') {
    panel =
      '<div class="settings-panel-head"><h3>通知</h3><span>决定什么时候收到提醒</span></div>' +
      '<div class="set-row"><div class="s-info"><b>消息提醒</b><span>收到新消息时,导航栏「我的」显示角标</span></div><button class="switch ' + (s.notify ? 'on' : '') + '" data-action="toggle-setting" data-key="notify"></button></div>' +
      '<div class="set-row"><div class="s-info"><b>营销邮件</b><span>平台活动、上新资讯等邮件推送</span></div><button class="switch ' + (s.newsletter !== false ? 'on' : '') + '" data-action="toggle-setting" data-key="newsletter"></button></div>' +
      '<div class="set-row"><div class="s-info"><b>促销优惠</b><span>优惠券、限时折扣等站内提醒</span></div><button class="switch ' + (s.promo !== false ? 'on' : '') + '" data-action="toggle-setting" data-key="promo"></button></div>';
  } else if (tab === 'privacy') {
    panel =
      '<div class="settings-panel-head"><h3>隐私</h3><span>管理谁可以看到你的信息</span></div>' +
      '<div class="set-row"><div class="s-info"><b>允许他人联系我</b><span>关闭后,其他用户将无法给你发消息</span></div><button class="switch ' + (s.contactable ? 'on' : '') + '" data-action="toggle-setting" data-key="contactable"></button></div>' +
      '<div class="set-row"><div class="s-info"><b>公开展示个人主页</b><span>允许其他用户查看你的主页资料</span></div><button class="switch ' + (s.publicProfile !== false ? 'on' : '') + '" data-action="toggle-setting" data-key="publicProfile"></button></div>' +
      '<div class="note-box">你的 API 调用输入仅在本地计算,平台与卖家均不保存;平台只记录调用日期与次数用于计费。</div>';
  } else if (tab === 'appearance') {
    panel =
      '<div class="settings-panel-head"><h3>外观</h3><span>调整界面显示风格</span></div>' +
      '<div class="settings-section-title">强调色</div>' +
      '<div class="accent-row">' +
      accentChoices
        .map(
          ([val, color, label]) =>
            '<button class="accent-chip ' + (accent === val ? 'on' : '') + '" data-action="settings-accent" data-val="' + val + '"><span class="accent-dot" style="background:' + color + '"></span>' + label + (accent === val ? '<span class="accent-check">' + icon('check', 'sm') + '</span>' : '') + '</button>'
        )
        .join('') +
      '</div>' +
      '<div class="settings-section-title">列表密度</div>' +
      '<div class="density-row">' +
      '<button class="density-chip ' + (density === 'comfortable' ? 'on' : '') + '" data-action="settings-density" data-val="comfortable">舒适</button>' +
      '<button class="density-chip ' + (density === 'compact' ? 'on' : '') + '" data-action="settings-density" data-val="compact">紧凑</button>' +
      '</div>';
  } else {
    panel =
      '<div class="settings-panel-head"><h3>关于访迹</h3><span>版本与数据说明</span></div>' +
      '<div class="about-row"><span>当前版本</span><b>Demo v9</b></div>' +
      '<div class="about-row"><span>数据引擎</span><b>SQLite 本地数据库</b></div>' +
      '<div class="about-row"><span>加密方案</span><b>AES-256-GCM + scrypt</b></div>' +
      '<div class="about-copy">访迹是 Skill 交易市场。买家可按天订阅或买断;API 调用在隔离环境执行,只有当天真实调用才计费,输入数据即时丢弃、买卖双方均不可见;买断后交付源文件。</div>' +
      '<div class="about-copy muted-small">演示环境数据保存在本地 SQLite 中,可在管理后台备份、恢复或重置。正式环境应接入短信通道、支付渠道与密钥托管服务(KMS/HSM)。</div>';
  }

  return (
    topbar(state.user, 'me', state.unread) +
    '<div class="container page">' +
    '<div class="section-head" style="margin-top:6px"><h2>设置</h2><span class="sub">管理你的账号、安全与偏好</span></div>' +
    '<div class="settings-head">' + avatarHTML(u, 'lg') +
    '<div class="sh-info"><b>' + esc(u.nickname) + '</b><span>@' + esc(u.username) + ' · ' + (roleLabel[u.role] || u.role) + '</span></div>' +
    '<div class="sh-side"><span class="status-pill active">账号正常</span></div>' +
    '</div>' +
    '<div class="settings-layout"><aside class="settings-nav">' + nav + '</aside><main class="settings-main">' + panel + '</main></div>' +
    '</div>'
  );
}

// 职业资格认证区块(设置页「账号资料」)
function certSection(state) {
  const c = state.myCert || {};
  const status = c.status || 'none';
  const statusText = { none: '未认证', pending: '审核中', verified: '已认证', rejected: '未通过' }[status] || status;
  const statusCls = { none: 'muted-text', pending: 'muted-text', verified: 'ok-text', rejected: 'r-text' }[status] || 'muted-text';
  let statusRow =
    '<div class="set-row"><div class="s-info"><b>职业资格认证</b><span>' +
    (status === 'none' ? '上传职业资格/学历/社保等证明材料,通过后作者卡片会点亮认证徽标' : '当前状态:' + statusText + (c.type ? ' · ' + esc(c.type) : '') + (c.certTitle ? ' · ' + esc(c.certTitle) : '')) +
    (status === 'rejected' && c.reviewNote ? '<br/>驳回原因:' + esc(c.reviewNote) : '') +
    '</span></div><span class="' + statusCls + '">' + statusText + '</span></div>';
  let form = '';
  if (status === 'none' || status === 'rejected') {
    form =
      '<form data-form="certification" class="settings-form" style="max-width:520px">' +
      '<div class="field"><label>认证类型</label><select name="type" style="width:100%;padding:10px;background:#0b2242;border:1px solid var(--line);color:var(--ink)">' +
      ['职业资格', '学历证明', '社保记录', '实名认证', '其他'].map((t) => '<option value="' + t + '">' + t + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label>认证头衔(展示给买家)</label><input name="certTitle" maxlength="40" placeholder="例如:前中兴通讯 HR" /></div>' +
      '<div class="field"><label>证明材料图片</label><input name="certFile" type="file" accept="image/png,image/jpeg,image/webp" style="background:#0b2242;border:1px solid var(--line);padding:9px;color:var(--ink)" /></div>' +
      '<div class="field-error" id="cert-error"></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">提交审核</button>' +
      '</form>';
  }
  return '<div class="settings-section-title">职业认证</div>' + statusRow + form;
}

// 实名认证区块(卖家经营资质:姓名 + 证件号)
function realnameSection(state) {
  const r = state.myRealname || {};
  const status = r.status || 'none';
  const statusText = { none: '未认证', pending: '审核中', verified: '已认证', rejected: '未通过' }[status] || status;
  const statusCls = { none: 'muted-text', pending: 'muted-text', verified: 'ok-text', rejected: 'r-text' }[status] || 'muted-text';
  const row =
    '<div class="set-row"><div class="s-info"><b>卖家实名认证</b><span>' +
    (status === 'none' ? '发布商品前需完成实名认证;姓名与证件号仅平台审核可见,对外只显示脱敏姓名' : '当前状态:' + statusText + (status === 'verified' ? ' · ' + esc(r.name) : '')) +
    (status === 'rejected' && r.reviewNote ? '<br/>驳回原因:' + esc(r.reviewNote) : '') +
    '</span></div><span class="' + statusCls + '">' + statusText + '</span></div>';
  let form = '';
  if (status === 'none' || status === 'rejected') {
    form =
      '<form data-form="realname" class="settings-form" style="max-width:520px">' +
      '<div class="field"><label>真实姓名</label><input name="name" maxlength="20" placeholder="与证件一致的中文姓名" /></div>' +
      '<div class="field"><label>身份证号</label><input name="idNo" maxlength="18" placeholder="15 或 18 位,末位可为 X" /></div>' +
      '<div class="field"><label>证件照片</label><input name="certFile" type="file" accept="image/png,image/jpeg,image/webp" style="background:#0b2242;border:1px solid var(--line);padding:9px;color:var(--ink)" /><div class="field-hint">上传与证件一致的证件照片,平台加密存储,仅管理员审核时可见</div></div>' +
      '<div class="field-error" id="realname-error"></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">提交实名审核</button>' +
      '</form>';
  }
  return '<div class="settings-section-title">实名认证</div>' + row + form;
}

// ---------------- 管理后台 ----------------
export function adminView(state) {
  const tab = state.adminTab || 'overview';
  const stats = state.adminStats || {};
  const users = state.adminUsers || [];
  const orders = state.adminOrders || [];
  const usage = state.adminUsage || [];
  const skills = state.adminSkills || [];
  const withdrawals = state.adminWithdrawals || [];
  const pending = state.adminPending || [];
  const reviews = state.adminReviews || [];
  const logs = state.adminLogs || [];
  const certs = state.adminCerts || [];
  const refunds = state.adminRefunds || [];
  const dbInfo = state.adminDb || null;
  const access = state.adminAccess || { role: '', roleLabel: '', permissions: {}, roles: [] };
  const cats = state.categories || [];
  const pf = state.platform || { slotPrice: 50, maxSlots: 3, commissionRate: 0.2, cheapPrice: 0.1, cheapOrders: 10, cheapScope: 'all' };
  const can = (p) => !!access.permissions[p];
  const fmtDate = (ms) => new Date(ms).toLocaleDateString('zh-CN');
  const fmtTime = (ms) => new Date(ms).toLocaleString('zh-CN', { hour12: false });

  const statCards = [
    ['用户数', stats.users, 'users'],
    ['Skill 数', stats.skills, 'box'],
    ['订单数', stats.purchases, 'briefcase'],
    ['调用记录', stats.usageRecords, 'database'],
    ['总调用次数', stats.usageCalls, 'trend'],
    ['消息数', stats.messages, 'chat'],
    ['平台收入', stats.revenue ? '¥' + stats.revenue : '¥0', 'coin'],
    ['提现单', stats.withdrawals, 'download'],
  ]
    .map(([label, val, ic]) => '<div class="stat-card">' + icon(ic, 'sm') + '<b>' + (val ?? 0) + '</b><span>' + label + '</span></div>')
    .join('');

  const groups = [];
  groups.push(['总览', [['overview', 'grid', '概览']]]);
  const content = [['audit', 'shield', '商品审核', can('skillsAudit')]];
  if (can('reviewsModerate')) content.push(['reviews', 'chat', '评价审核']);
  if (can('skillsManage')) content.push(['skills', 'box', '商品管理']);
  if (can('categoriesManage')) content.push(['cats', 'palette', '分类配置']);
  if (can('skillsAudit')) content.push(['requests', 'target', '求购审核']);
  if (content.length) groups.push(['内容管理', content]);
  const trade = [['users', 'users', '用户管理'], ['orders', 'briefcase', '订单'], ['usage', 'database', '调用记录']];
  if (can('certsAudit')) trade.push(['certs', 'note', '认证审核']);
  if (can('certsAudit')) trade.push(['realname', 'shield', '实名审核']);
  if (can('financeWithdraw')) trade.push(['withdrawals', 'download', '提现审核'], ['ledger', 'coin', '资金流水'], ['payments', 'list', '支付单'], ['refunds', 'refresh', '退款记录'], ['recon', 'trend', '资金对账']);
  groups.push(['用户与交易', trade]);
  const afterSale = [];
  if (can('ticketsSupport')) afterSale.push(['tickets', 'note', '售后工单']);
  if (afterSale.length) groups.push(['售后与服务', afterSale]);
  const config = [];
  if (can('platformManage')) config.push(['rules', 'coin', '运营规则']);
  if (config.length) groups.push(['平台配置', config]);
  const system = [];
  if (can('logsView')) system.push(['logs', 'list', '操作日志']);
  if (can('dbManage')) system.push(['db', 'database', '数据库']);
  system.push(['access', 'key', '权限说明']);
  groups.push(['系统', system]);

  const side =
    '<div class="admin-side">' +
    groups
      .map(
        ([group, items]) =>
          '<div class="admin-nav-label">' + group + '</div>' +
          items
            .map(
              ([id, ic, label]) =>
                '<button class="' + (tab === id ? 'on' : '') + '" data-action="admin-tab" data-tab="' + id + '">' + icon(ic, 'sm') + ' ' + label +
                (id === 'audit' && pending.length ? '<span class="drop-badge">' + pending.length + '</span>' : '') +
                (id === 'realname' && stats.pendingRealnames ? '<span class="drop-badge">' + stats.pendingRealnames + '</span>' : '') +
                (id === 'tickets' && stats.openTickets ? '<span class="drop-badge">' + stats.openTickets + '</span>' : '') +
                '</button>'
            )
            .join('')
      )
      .join('') +
    '</div>';

  let main = '';
  if (tab === 'overview') {
    main =
      '<div class="stats-grid">' + statCards + '</div>' +
      '<div class="admin-two-col">' +
      '<div class="settings-card"><h3>' + icon('trend', 'sm') + ' 快速入口</h3><div class="quick-grid">' +
      (can('skillsAudit') ? '<button class="quick-btn" data-action="admin-tab" data-tab="audit">' + icon('shield', 'sm') + ' 待审核 ' + pending.length + '</button>' : '') +
      (can('certsAudit') ? '<button class="quick-btn" data-action="admin-tab" data-tab="realname">' + icon('shield', 'sm') + ' 实名审核 ' + (state.adminRealnames || []).filter((x) => x.status === 'pending').length + '</button>' : '') +
      (can('certsAudit') ? '<button class="quick-btn" data-action="admin-tab" data-tab="certs">' + icon('gradcap', 'sm') + ' 职业认证 ' + certs.filter((x) => x.status === 'pending').length + '</button>' : '') +
      (can('ticketsSupport') ? '<button class="quick-btn" data-action="admin-tab" data-tab="tickets">' + icon('note', 'sm') + ' 售后工单 ' + (state.adminTickets || []).filter((x) => x.status === 'open' || x.status === 'pending_seller' || x.status === 'processing').length + '</button>' : '') +
      (can('reviewsModerate') ? '<button class="quick-btn" data-action="admin-tab" data-tab="reviews">' + icon('chat', 'sm') + ' 评价审核</button>' : '') +
      (can('financeWithdraw') ? '<button class="quick-btn" data-action="admin-tab" data-tab="withdrawals">' + icon('download', 'sm') + ' 提现处理</button>' : '') +
      (can('usersManage') ? '<button class="quick-btn" data-action="admin-tab" data-tab="users">' + icon('users', 'sm') + ' 用户管理</button>' : '') +
      '</div></div>' +
      (dbInfo ? '<div class="settings-card"><h3>' + icon('database', 'sm') + ' 系统状态</h3>' +
        '<div class="sys-line"><span>数据库</span><b>' + dbInfo.engine + '</b></div>' +
        '<div class="sys-line"><span>数据行数</span><b>' + dbInfo.totalRows + '</b></div>' +
        '<div class="sys-line"><span>文件大小</span><b>' + (dbInfo.size / 1024).toFixed(1) + ' KB</b></div></div>' : '') +
      '</div>' +
      (can('dbManage') ? '<div class="settings-card"><h3>' + icon('refresh', 'sm') + ' 系统维护</h3><p style="color:var(--ink-2);margin-bottom:12px">把平台数据恢复为初始演示状态(清除测试账号、订单与聊天记录)。重置为敏感操作,发起后需第二名管理员复核才执行。</p><button class="btn btn-danger-ghost btn-sm" data-action="admin-reset">发起重置复核</button></div>' : '');
  } else if (tab === 'audit') {
    const pRows = pending
      .map(
        (s) =>
          '<div class="pending-card">' +
          '<div class="p-title">' + esc(s.title) + ' <span style="color:var(--muted);font-weight:400;font-size:12px">· ' + esc(s.category) + '</span></div>' +
          '<div class="p-meta">' + esc((s.seller && s.seller.nickname) || '') + ' · ' + money(s.priceApi) + '/天' + (s.buyoutAvailable ? ' · 可买断 ' + money(s.buyoutPrice) : '') + (s.fileName ? ' · ' + esc(s.fileName) : '') + '</div>' +
          (s.structure && s.structure.length ? '<div class="p-tree">' + esc(s.structure.join('\n')) + '</div>' : '') +
          '<div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" data-action="admin-approve" data-id="' + esc(s.id) + '" data-approve="true">' + icon('check', 'sm') + ' 通过上架</button><button class="btn btn-danger-ghost btn-sm" data-action="admin-approve" data-id="' + esc(s.id) + '" data-approve="false">驳回</button></div>' +
          '</div>'
      )
      .join('');
    main = pRows || '<div class="empty" style="padding:40px"><div class="big">' + icon('check', 'xl') + '</div>暂无待审核商品</div>';
  } else if (tab === 'skills') {
    main =
      '<div class="settings-card"><h3>' + icon('box', 'sm') + ' 商品管理(标题 / 日价 / 买断价 / 销量)</h3><div style="overflow-x:auto">' +
      skills
        .map(
          (s) =>
            '<div class="cat-edit-row" data-skill-id="' + esc(s.id) + '">' +
            '<span class="c-name" style="flex:1;min-width:170px">' + esc(s.title) + '<span style="color:var(--muted);font-size:11px"> · ' + esc(s.seller) + '</span>' +
            (s.status && s.status !== 'active' ? '<span class="status-pill ' + (s.status === 'pending' ? 'pending' : 'rejected') + '" style="margin-left:6px">' + (s.status === 'pending' ? '待审核' : s.status === 'delisted' ? '已下架' : '已驳回') + '</span>' : '') + '</span>' +
            '<input type="text" data-field="title" value="' + esc(s.title) + '" style="width:190px" />' +
            '<input type="number" data-field="priceApi" value="' + s.priceApi + '" style="width:72px" title="日价" />' +
            '<input type="number" data-field="buyoutPrice" value="' + s.buyoutPrice + '" style="width:86px" title="买断价" />' +
            '<input type="number" data-field="sold" value="' + s.sold + '" style="width:64px" title="销量" />' +
            (can('skillsManage') ? '<button class="btn btn-outline btn-sm" data-action="admin-save-skill">保存</button>' : '') +
            (can('skillsManage')
              ? s.status === 'delisted'
                ? '<button class="btn btn-primary btn-sm" data-action="admin-skill-takedown" data-id="' + esc(s.id) + '" data-op="reinstate">恢复上架</button>'
                : '<button class="btn btn-danger-ghost btn-sm" data-action="admin-skill-takedown" data-id="' + esc(s.id) + '" data-op="delist">强制下架</button>'
              : '') + '</div>'
        )
        .join('') +
      '</div></div>';
  } else if (tab === 'users') {
    main =
      '<div class="settings-card"><h3>' + icon('users', 'sm') + ' 用户管理(禁用 / 角色分配)</h3><div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>用户</th><th>手机号</th><th>角色</th><th>余额</th><th>已购</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      users
        .map(
          (u) =>
            '<tr><td><b>' + esc(u.username) + '</b><div style="color:var(--muted);font-size:11px">' + esc(u.nickname) + '</div></td>' +
            '<td>' + esc(u.phone) + '</td>' +
            '<td>' + (can('usersManage') ? '<select class="admin-select" data-action="admin-user-role" data-id="' + esc(u.id) + '">' +
              ['buyer', 'seller', 'super_admin', 'operator', 'finance', 'support', 'viewer']
                .map((r) => '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r + '</option>')
                .join('') +
              '</select>' : esc(u.role)) + '</td>' +
            '<td>' + money(u.balance || 0) + '</td><td>' + u.purchases + '</td>' +
            '<td><span class="status-pill ' + (u.status === 'disabled' ? 'rejected' : 'success') + '">' + (u.status === 'disabled' ? '已禁用' : '正常') + '</span></td>' +
            '<td>' + (can('usersManage') ? '<button class="btn ' + (u.status === 'disabled' ? 'btn-outline' : 'btn-danger-ghost') + ' btn-sm" data-action="admin-user-status" data-id="' + esc(u.id) + '" data-status="' + (u.status === 'disabled' ? 'active' : 'disabled') + '">' + (u.status === 'disabled' ? '启用' : '禁用') + '</button>' : '-') + '</td></tr>'
        )
        .join('') +
      '</tbody></table></div></div>';
  } else if (tab === 'certs') {
    const stText = { pending: '待审核', verified: '已通过', rejected: '未通过' };
    main =
      '<div class="settings-card"><h3>' + icon('note', 'sm') + ' 职业资格认证审核</h3>' +
      (certs.length
        ? '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>用户</th><th>类型</th><th>头衔</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
          certs
            .map(
              (c) =>
                '<tr><td><b>' + esc(c.username) + '</b><div style="color:var(--muted);font-size:11px">' + esc(c.nickname) + ' · ' + esc(c.phone) + '</div></td>' +
                '<td>' + esc(c.type) + '</td><td>' + esc(c.certTitle) + '</td><td>' + fmtDate(c.submittedAt) + '</td>' +
                '<td><span class="status-pill ' + (c.status === 'verified' ? 'success' : c.status === 'rejected' ? 'rejected' : 'pending') + '">' + (stText[c.status] || c.status) + '</span>' +
                (c.reviewNote ? '<div style="color:var(--muted);font-size:11px">' + esc(c.reviewNote) + '</div>' : '') + '</td>' +
                '<td>' +
                (c.hasFile ? '<button class="btn btn-outline btn-sm" data-action="admin-cert-file" data-id="' + esc(c.userId) + '">查看材料</button> ' : '') +
                (c.status === 'pending' ? '<button class="btn btn-primary btn-sm" data-action="admin-cert" data-id="' + esc(c.userId) + '" data-approve="true">通过</button> <button class="btn btn-danger-ghost btn-sm" data-action="admin-cert-reject" data-id="' + esc(c.userId) + '">驳回</button>' : '-') +
                '</td></tr>'
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty" style="padding:36px"><div class="big">' + icon('check', 'xl') + '</div>暂无认证申请</div>') +
      '</div>';
  } else if (tab === 'refunds') {
    const typeLabel = { buyer_refund: '买家退款', platform_commission_reverse: '佣金冲销', withdraw_refund: '提现退回' };
    const fen = (n) => '¥' + ((Number(n) || 0) / 100).toFixed(2);
    main =
      '<div class="settings-card"><h3>' + icon('refresh', 'sm') + ' 退款记录(评分下架退还未结算部分等)</h3><div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>时间</th><th>账号</th><th>类型</th><th>金额</th><th>关联单号</th><th>备注</th></tr></thead><tbody>' +
      refunds
        .map(
          (r) =>
            '<tr><td style="white-space:nowrap">' + fmtTime(r.at) + '</td><td>' + esc(r.username) + '</td><td>' + (typeLabel[r.type] || r.type) + '</td>' +
            '<td style="color:var(--green)">+' + fen(r.amountFen) + '</td><td class="mono">' + esc(r.refId || '—') + '</td><td>' + esc(r.note) + '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (refunds.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无退款记录</div>') + '</div></div>';
  } else if (tab === 'recon') {
    const r = state.adminRecon || null;
    const row = (label, val, color) =>
      '<div class="sys-line"><span>' + label + '</span><b style="color:' + (color || 'var(--ink)') + '">' + money(val ?? 0) + '</b></div>';
    main =
      '<div class="settings-card"><h3>' + icon('trend', 'sm') + ' 资金对账(GMV / 佣金 / 托管 / 退款 / 服务费 / 打款)</h3>' +
      (r
        ? '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0 24px">' +
          row('GMV(买家支付总额)', r.gmv) +
          row('平台佣金', r.commission) +
          row('橱窗位费', r.slotFee) +
          row('买家退款到账', r.buyerRefund, 'var(--red)') +
          row('卖家退款承担', r.sellerRefund, 'var(--red)') +
          row('佣金冲销', r.commissionReverse, 'var(--red)') +
          row('退款服务费(0.5%)', r.serviceFee, 'var(--green)') +
          row('已打款(平台出账)', r.payout, 'var(--amber)') +
          row('托管中(待结算)', r.escrowPending, 'var(--amber)') +
          row('托管已结算', r.escrowSettled) +
          '</div>' +
          '<div class="settings-section-title">平台营收口径</div>' +
          '<div class="sys-line"><span>系统存储值</span><b>' + money(r.revenue.stored) + '</b></div>' +
          '<div class="sys-line"><span>按流水重算</span><b>' + money(r.revenue.formula) + '</b></div>' +
          '<div class="sys-line"><span>差额</span><b style="color:' + (Math.abs(r.revenue.diff) < 0.01 ? 'var(--green)' : 'var(--amber)') + '">' + money(r.revenue.diff) + '</b></div>' +
          '<div class="field-hint">公式:' + esc(r.revenue.formulaText) + '。' + esc(r.revenue.note) + '</div>' +
          '<div class="settings-section-title">退款守恒校验</div>' +
          '<div class="sys-line"><span>退款入账(买家 + 服务费)</span><b>' + money(r.conservation.refundIn) + '</b></div>' +
          '<div class="sys-line"><span>退款出账(卖家 + 佣金冲销)</span><b>' + money(r.conservation.refundOut) + '</b></div>' +
          '<div class="sys-line"><span>守恒状态</span><b style="color:' + (r.conservation.balanced ? 'var(--green)' : 'var(--red)') + '">' + (r.conservation.balanced ? '平衡 ✓' : '不平衡,需人工核查') + '</b></div>'
        : '<div style="color:var(--muted);font-size:12.5px">暂无对账数据</div>') +
      '</div>';
  } else if (tab === 'orders') {
    main =
      '<div class="settings-card"><h3>' + icon('briefcase', 'sm') + ' 订单</h3><table class="admin-table"><thead><tr><th>时间</th><th>买家</th><th>Skill</th><th>方式</th><th>金额</th></tr></thead><tbody>' +
      orders.map((o) => '<tr><td>' + fmtDate(o.at) + '</td><td>' + esc(o.user) + '</td><td>' + esc(o.skill) + '</td><td>' + (o.method === 'api' ? 'API 订阅' : '买断') + '</td><td>' + money(o.price) + '</td></tr>').join('') +
      '</tbody></table></div>';
  } else if (tab === 'usage') {
    main =
      '<div class="settings-card"><h3>' + icon('database', 'sm') + ' API 调用记录(只记日期与次数,不含数据)</h3><table class="admin-table"><thead><tr><th>日期</th><th>Key</th><th>Skill</th><th>调用次数</th></tr></thead><tbody>' +
      usage.map((r) => '<tr><td>' + r.date + '</td><td>' + esc(r.key) + '</td><td>' + esc(r.skill) + '</td><td>' + r.count + '</td></tr>').join('') +
      '</tbody></table></div>';
  } else if (tab === 'withdrawals') {
    main =
      '<div class="settings-card"><h3>' + icon('download', 'sm') + ' 提现审核</h3><table class="admin-table"><thead><tr><th>账号</th><th>金额</th><th>时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      withdrawals
        .map(
          (w) =>
            '<tr><td>' + esc(w.username) + '</td><td>' + money(w.amount) + '</td><td>' + fmtDate(w.at) + '</td><td><span class="status-pill ' + w.status + '">' + (w.status === 'pending' ? '待打款' : w.status === 'success' ? '已到账' : '已退回') + '</span></td><td>' +
            (w.status === 'pending' ? '<button class="btn btn-outline btn-sm" data-action="admin-withdraw" data-id="' + esc(w.id) + '" data-status="success">打款</button> <button class="btn btn-danger-ghost btn-sm" data-action="admin-withdraw" data-id="' + esc(w.id) + '" data-status="rejected">驳回</button>' : '-') +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (withdrawals.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无提现申请</div>') + '</div>';
  } else if (tab === 'ledger') {
    const led = state.adminLedger || { ledger: [], totals: {} };
    const fen = (n) => '¥' + ((Number(n) || 0) / 100).toFixed(2);
    const typeLabel = {
      buyer_pay: '买家支付',
      seller_income: '卖家分成',
      platform_commission: '平台抽佣',
      slot_fee: '橱窗位收入',
      withdraw_submit: '提现扣款',
      withdraw_paid: '提现打款',
      withdraw_refund: '提现退回',
    };
    main =
      '<div class="settings-card"><h3>' + icon('coin', 'sm') + ' 资金流水(分记账,可对账)</h3>' +
      '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">' +
      '<div class="stat-card"><b>' + fen(led.totals.sellerIncome) + '</b><span>累计卖家分成</span></div>' +
      '<div class="stat-card"><b>' + fen(led.totals.commission + led.totals.slotFee) + '</b><span>平台累计收入</span></div>' +
      '<div class="stat-card"><b>' + fen(led.totals.revenueFen) + '</b><span>当前平台营收(对照)</span></div>' +
      '</div>' +
      '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>时间</th><th>账号</th><th>类型</th><th>金额</th><th>账户余额</th><th>关联单号</th><th>备注</th></tr></thead><tbody>' +
      led.ledger
        .map(
          (r) =>
            '<tr><td style="white-space:nowrap">' + fmtTime(r.at) + '</td><td>' + esc(r.username) + '</td><td><code class="log-code">' + esc(r.type) + '</code></td>' +
            '<td style="color:' + (r.amountFen >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (r.amountFen >= 0 ? '+' : '') + fen(r.amountFen) + '</td>' +
            '<td>' + (r.balanceFen === null ? '—' : fen(r.balanceFen)) + '</td><td class="mono">' + esc(r.refId || '—') + '</td><td>' + esc(r.note) + '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (led.ledger.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无流水,完成一笔交易后这里会记录每一笔资金变动</div>') + '</div></div>';
  } else if (tab === 'payments') {
    const pays = state.adminPayments || { payments: [], totalFen: 0 };
    const fen = (n) => '¥' + ((Number(n) || 0) / 100).toFixed(2);
    const kindLabel = { slot: '橱窗位', skill_api: 'API 订阅', skill_buyout: '买断' };
    main =
      '<div class="settings-card"><h3>' + icon('list', 'sm') + ' 支付单(演示为模拟支付,生产接微信/支付宝回调)</h3>' +
      '<div class="sys-line"><span>累计支付金额</span><b>' + fen(pays.totalFen) + '</b></div>' +
      '<div style="overflow-x:auto;margin-top:10px"><table class="admin-table"><thead><tr><th>时间</th><th>账号</th><th>类型</th><th>金额</th><th>渠道</th><th>状态</th><th>关联单号</th></tr></thead><tbody>' +
      pays.payments
        .map(
          (p) =>
            '<tr><td style="white-space:nowrap">' + fmtTime(p.at) + '</td><td>' + esc(p.username) + '</td><td>' + (kindLabel[p.kind] || p.kind) + '</td><td>' + fen(p.amountFen) + '</td><td>' + esc(p.channel) + '</td>' +
            '<td><span class="status-pill success">' + (p.status === 'paid' ? '已支付' : p.status) + '</span></td><td class="mono">' + esc(p.refId || '—') + '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (pays.payments.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无支付单</div>') + '</div></div>';
  } else if (tab === 'reviews') {
    const modActions = (r) =>
      can('reviewsModerate')
        ? (r.hidden
            ? '<button class="btn btn-outline btn-sm" data-action="admin-review" data-id="' + esc(r.id) + '" data-op="show">恢复显示</button> '
            : '<button class="btn btn-outline btn-sm" data-action="admin-review" data-id="' + esc(r.id) + '" data-op="hide">隐藏</button> ') +
          '<button class="btn btn-danger-ghost btn-sm" data-action="admin-review" data-id="' + esc(r.id) + '" data-op="delete">删除</button>'
        : '-';
    main =
      '<div class="settings-card"><h3>' + icon('chat', 'sm') + ' 评价审核(隐藏 / 删除违规评价)</h3><div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Skill</th><th>买家</th><th>评分</th><th>内容</th><th>时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      reviews
        .map(
          (r) =>
            '<tr><td>' + esc(r.skill) + '</td><td>' + esc(r.author) + '</td><td>' + starsHTML(r.rating) + '</td>' +
            '<td style="max-width:280px">' + esc(r.text) + '</td><td>' + fmtDate(r.at) + '</td>' +
            '<td><span class="status-pill ' + (r.hidden ? 'rejected' : 'success') + '">' + (r.hidden ? '已隐藏' : '正常') + '</span></td><td>' + modActions(r) + '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (reviews.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无评价</div>') + '</div></div>';
  } else if (tab === 'rules') {
    main =
      '<div class="settings-card"><h3>' + icon('coin', 'sm') + ' 运营规则(橱窗位 / 佣金 / 推广期定价)</h3>' +
      '<div class="cat-edit-row" style="border:none">' +
      '<span class="c-name" style="flex:1">橱窗位标准上架费(元)</span><input type="number" data-field="slotPrice" value="30" disabled style="width:90px" />' +
      '<span class="c-name">上限个数</span><input type="number" data-field="maxSlots" value="3" disabled style="width:70px" />' +
      '<span class="c-name">佣金比例(0-1)</span><input type="number" step="0.01" data-field="commissionRate" value="' + pf.commissionRate + '" style="width:80px" title="默认 0.02=2%" />' +
      '<span class="c-name">前六个月</span><b style="color:var(--green)">三个位置均 0元（-100%）</b>' +
      '</div>' +
      '<div class="cat-edit-row" style="border:none">' +
      '<span class="c-name" style="flex:1">推广期价格(元,首单/首日)</span><input type="number" step="0.1" data-field="cheapPrice" value="' + pf.cheapPrice + '" style="width:90px" />' +
      '<span class="c-name">低价单数</span><input type="number" data-field="cheapOrders" value="' + pf.cheapOrders + '" style="width:70px" />' +
      '<span class="c-name">适用</span><select data-field="cheapScope" style="background:#0b2242;border:1px solid var(--line);color:var(--ink);padding:6px 8px">' +
      '<option value="all"' + (pf.cheapScope === 'all' ? ' selected' : '') + '>全部方式</option>' +
      '<option value="buyout"' + (pf.cheapScope === 'buyout' ? ' selected' : '') + '>仅买断</option>' +
      '<option value="none"' + (pf.cheapScope === 'none' ? ' selected' : '') + '>关闭</option>' +
      '</select>' +
      '<button class="btn btn-outline btn-sm" data-action="admin-save-platform">保存规则</button>' +
      '</div>' +
      '<div class="cat-edit-row" style="border:none">' +
      '<span class="c-name" style="flex:1">评分强制下架线(星,低于即下架)</span><input type="number" step="0.1" min="1" max="5" data-field="ratingFloor" value="' + (pf.ratingFloor ?? 2) + '" style="width:80px" />' +
      '<span class="c-name">最少评价数(生效门槛)</span><input type="number" min="1" data-field="ratingMinCount" value="' + (pf.ratingMinCount ?? 3) + '" style="width:70px" />' +
      '<span class="c-name">托管天数(到期才结算给卖家)</span><input type="number" min="0" data-field="escrowDays" value="' + (pf.escrowDays ?? 7) + '" style="width:70px" />' +
      '</div>' +
      '<div class="field-hint" style="padding-left:12px">评分不达标被强制下架时,只把“托管中尚未结算给卖家”的部分退回买家,已结算的不退。</div>' +
      '</div>';
  } else if (tab === 'cats') {
    main =
      '<div class="settings-card"><h3>' + icon('palette', 'sm') + ' 分类配置(名称与颜色)</h3><div style="margin-bottom:10px"><button class="btn btn-primary btn-sm" data-action="admin-new-cat">' + icon('plus', 'sm') + ' 新增分类</button></div>' +
      cats
        .map(
          (c) =>
            c.id === '全部'
              ? '<div class="cat-edit-row" style="opacity:0.55"><span class="c-name" style="flex:1">' + icon('grid', 'sm') + ' 全部</span><span style="color:var(--muted);font-size:12px">虚拟分类(市场筛选用),不可编辑</span></div>'
              : '<div class="cat-edit-row" data-cat-id="' + esc(c.id) + '">' +
                '<span class="c-name">' + icon(c.icon || 'grid', 'sm') + ' ' + esc(c.name) + '</span>' +
                '<input type="text" value="' + esc(c.name) + '" data-field="name" maxlength="8" />' +
                '<input type="color" value="' + c.color + '" data-field="color" />' +
                '<button class="btn btn-outline btn-sm" data-action="admin-save-cat">保存</button>' +
                '<button class="btn btn-danger-ghost btn-sm" data-action="admin-delete-cat" data-id="' + esc(c.id) + '">删除</button></div>'
        )
        .join('') +
      '</div>';
  } else if (tab === 'logs') {
    main =
      '<div class="settings-card"><h3>' + icon('list', 'sm') + ' 管理员操作日志(最近 200 条)</h3><div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>时间</th><th>管理员</th><th>操作</th><th>对象</th><th>备注</th></tr></thead><tbody>' +
      logs
        .map(
          (l) =>
            '<tr><td style="white-space:nowrap">' + fmtTime(l.at) + '</td><td>' + esc(l.adminName) + '</td><td><code class="log-code">' + esc(l.action) + '</code></td><td>' + esc(l.target) + '</td><td>' + esc(l.detail) + '</td></tr>'
        )
        .join('') +
      '</tbody></table>' + (logs.length ? '' : '<div style="color:var(--muted);font-size:12.5px;padding:8px 0">暂无操作记录</div>') + '</div></div>';
  } else if (tab === 'db') {
    const rows = (dbInfo && dbInfo.tables) || [];
    const approvals = (state.adminApprovals || []).filter((a) => a.status === 'pending');
    const vault = state.adminVault || null;
    const approvalRows = approvals
      .map(
        (a) =>
          '<tr><td>' + fmtTime(a.createdAt) + '</td><td>' + esc(a.label) + '</td><td>' + esc(a.requestedByName) + '</td><td>' +
          (a.mine
            ? '<span class="status-pill pending">等待他人复核</span>'
            : '<button class="btn btn-primary btn-sm" data-action="admin-approval-execute" data-id="' + esc(a.id) + '" data-approval-action="' + esc(a.action) + '">' + icon('check', 'sm') + ' 确认执行</button> ' +
              '<button class="btn btn-danger-ghost btn-sm" data-action="admin-approval-reject" data-id="' + esc(a.id) + '">驳回</button>') +
          '</td></tr>'
      )
      .join('');
    main =
      '<div class="settings-card"><h3>' + icon('database', 'sm') + ' 数据库</h3>' +
      '<div class="sys-line"><span>引擎</span><b>' + (dbInfo ? dbInfo.engine : '—') + '</b></div>' +
      '<div class="sys-line"><span>文件</span><b class="mono">' + (dbInfo ? esc(dbInfo.file) : '—') + '</b></div>' +
      '<div class="sys-line"><span>总行数</span><b>' + (dbInfo ? dbInfo.totalRows : 0) + '</b></div>' +
      '<div class="sys-line"><span>文件大小</span><b>' + (dbInfo ? (dbInfo.size / 1024).toFixed(1) : 0) + ' KB</b></div>' +
      '<div class="db-tools">' +
      '<button class="btn btn-outline btn-sm" data-action="admin-db-backup">' + icon('download', 'sm') + ' 申请 SQLite 备份</button>' +
      '<button class="btn btn-outline btn-sm" data-action="admin-db-export">' + icon('download', 'sm') + ' 申请导出 JSON</button>' +
      '<button class="btn btn-outline btn-sm" data-action="admin-db-vacuum">' + icon('refresh', 'sm') + ' 整理空间</button>' +
      '</div>' +
      '<div class="field-hint" style="padding:6px 2px 0">备份 / 导出 / 重置均为敏感操作,发起后需第二名管理员在下方复核队列中确认才执行(发起人不能确认自己的请求)。</div>' +
      '<div class="settings-section-title">敏感操作复核队列</div>' +
      (approvalRows
        ? '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>时间</th><th>操作</th><th>发起人</th><th>处理</th></tr></thead><tbody>' + approvalRows + '</tbody></table></div>'
        : '<div style="color:var(--muted);font-size:12.5px;padding:8px 2px">暂无待复核的敏感操作。</div>') +
      '<div class="settings-section-title">Skill 密钥保管库(Shamir 2-of-2 分片)</div>' +
      (vault
        ? '<div class="sys-line"><span>含密钥商品</span><b>' + vault.keyed + '</b></div>' +
          '<div class="sys-line"><span>分片完整</span><b style="color:var(--green)">' + vault.ok + '</b></div>' +
          '<div class="sys-line"><span>缺失 / 异常</span><b style="color:' + (vault.missing + vault.invalid ? 'var(--red)' : 'var(--green)') + '">' + vault.missing + ' / ' + vault.invalid + '</b></div>' +
          '<div class="sys-line"><span>保管目录</span><b class="mono">' + esc(vault.vaultDir) + '</b></div>'
        : '<div style="color:var(--muted);font-size:12.5px;padding:8px 2px">暂无密钥保管库信息。</div>') +
      '<div class="settings-section-title">数据表</div>' +
      '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>表名</th><th>说明</th><th>行数</th></tr></thead><tbody>' +
      rows
        .map(
          (t) =>
            '<tr><td><code class="log-code">' + esc(t.name) + '</code></td><td>' +
            ({ users: '注册用户(密码 scrypt 加盐哈希)', skills: '上架商品(含加密密钥引用)', reviews: '买家评价', purchases: '订单(订阅/买断)', plans: '收藏计划', plan_folders: '计划文件夹', projects: '项目文件夹', messages: '站内消息', usage: 'API 调用心跳(日期+次数)', sms_codes: '短信验证码', withdrawals: '提现申请', categories: '分类配置', platform: '平台运营规则', admin_logs: '管理员操作日志', ledger: '资金流水(分记账)', payment_orders: '支付单' }[t.name] || '') +
            '</td><td>' + t.rows + '</td></tr>'
        )
        .join('') +
      '</tbody></table></div></div>';
  } else if (tab === 'realname') {
    const rn = state.adminRealnames || [];
    main =
      '<div class="settings-card"><h3>' + icon('shield', 'sm') + ' 卖家实名认证审核</h3>' +
      (rn.length
        ? '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>用户</th><th>真实姓名</th><th>证件号</th><th>状态</th><th>提交时间</th><th>操作</th></tr></thead><tbody>' +
          rn
            .map(
              (r) =>
                '<tr><td><b>' + esc(r.username) + '</b><div style="color:var(--muted);font-size:11px">' + esc(r.nickname) + ' · ' + esc(r.phone) + '</div></td>' +
                '<td>' + esc(r.name) + '</td><td class="mono">' + esc(r.idNo) + '</td>' +
                '<td><span class="status-pill ' + (r.status === 'verified' ? 'success' : r.status === 'rejected' ? 'rejected' : 'pending') + '">' + (r.status === 'pending' ? '待审核' : r.status === 'verified' ? '已通过' : '未通过') + '</span></td>' +
                '<td>' + fmtDate(r.submittedAt) + '</td>' +
                '<td>' + (r.status === 'pending'
                  ? (r.hasFile ? '<button class="btn btn-outline btn-sm" data-action="admin-realname-file" data-id="' + esc(r.userId) + '">' + icon('eye', 'sm') + ' 证件</button> ' : '') +
                    '<button class="btn btn-primary btn-sm" data-action="admin-realname" data-id="' + esc(r.userId) + '" data-approve="true">通过</button> <button class="btn btn-danger-ghost btn-sm" data-action="admin-realname" data-id="' + esc(r.userId) + '" data-approve="false">驳回</button>'
                  : '<span style="color:var(--muted);font-size:12px">' + esc(r.reviewNote || '—') + '</span>') + '</td></tr>'
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty" style="padding:36px"><div class="big">' + icon('shield', 'xl') + '</div>暂无实名认证申请</div>') +
      '</div>';
  } else if (tab === 'requests') {
    const reqs = state.adminRequests || [];
    main =
      '<div class="settings-card"><h3>' + icon('target', 'sm') + ' 求购单内容审核</h3>' +
      (reqs.length
        ? '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>需求</th><th>预算</th><th>发布者</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody>' +
          reqs
            .map(
              (r) =>
                '<tr><td><b>' + esc(r.title) + '</b><div style="color:var(--muted);font-size:11px;max-width:260px">' + esc(r.description) + '</div></td>' +
                '<td>' + money(r.budget) + '</td><td>' + esc(r.poster ? r.poster.nickname || r.poster.username : '-') + '</td>' +
                '<td><span class="status-pill ' + (r.status === 'open' ? 'success' : r.status === 'removed' ? 'rejected' : 'pending') + '">' + esc(r.statusLabel) + '</span></td>' +
                '<td>' + fmtDate(r.createdAt) + '</td>' +
                '<td>' + (r.status === 'removed'
                  ? '<button class="btn btn-outline btn-sm" data-action="admin-request" data-id="' + esc(r.id) + '" data-op="restore">恢复</button>'
                  : '<button class="btn btn-danger-ghost btn-sm" data-action="admin-request" data-id="' + esc(r.id) + '" data-op="remove">违规下架</button>') + '</td></tr>'
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty" style="padding:36px"><div class="big">' + icon('target', 'xl') + '</div>暂无求购单</div>') +
      '</div>';
  } else if (tab === 'tickets') {
    const tks = state.adminTickets || [];
    main =
      '<div class="settings-card"><h3>' + icon('note', 'sm') + ' 售后工单(客服 / 投诉 / 申诉 / 退款 / 纠纷)</h3>' +
      (tks.length
        ? '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>类型</th><th>标题</th><th>关联</th><th>状态</th><th>退款</th><th>时间</th><th>操作</th></tr></thead><tbody>' +
          tks
            .map(
              (t) =>
                '<tr><td>' + esc(t.typeLabel) + '</td><td>' + esc(t.title) + '</td><td>' + esc(t.skill ? t.skill.title : t.request ? t.request.title : '—') + '</td>' +
                '<td><span class="status-pill ' + (t.status === 'resolved' ? 'success' : t.status === 'rejected' ? 'rejected' : 'pending') + '">' + esc(t.statusLabel) + '</span></td>' +
                '<td>' + (t.refundAmount > 0 ? money(t.refundAmount) : '—') + '</td>' +
                '<td>' + fmtTime(t.updatedAt || t.createdAt) + '</td>' +
                '<td><button class="btn btn-outline btn-sm" data-action="admin-ticket-open" data-id="' + esc(t.id) + '">处理</button></td></tr>'
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty" style="padding:36px"><div class="big">' + icon('note', 'xl') + '</div>暂无工单</div>') +
      '</div>';
  } else if (tab === 'access') {
    const permLabels = {
      dashboard: '概览',
      skillsAudit: '商品审核',
      skillsManage: '商品管理',
      usersManage: '用户管理',
      certsAudit: '认证审核',
      categoriesManage: '分类配置',
      reviewsModerate: '评价审核',
      financeWithdraw: '财务中心',
      platformManage: '运营规则',
      logsView: '操作日志',
      dbManage: '数据库管理',
      ticketsSupport: '售后工单',
    };
    main =
      '<div class="settings-card"><h3>' + icon('key', 'sm') + ' 当前权限</h3><div class="sys-line"><span>角色</span><b>' + esc(access.roleLabel) + ' (' + esc(access.role) + ')</b></div>' +
      '<div class="perm-row">' +
      Object.keys(permLabels)
        .map((p) => '<span class="status-pill ' + (can(p) ? 'success' : 'rejected') + '">' + permLabels[p] + (can(p) ? ' ✓' : ' ✕') + '</span>')
        .join('') +
      '</div>' +
      '<div class="settings-section-title">角色权限矩阵</div>' +
      '<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>角色</th>' +
      Object.keys(permLabels).map((p) => '<th>' + permLabels[p] + '</th>').join('') +
      '</tr></thead><tbody>' +
      access.roles
        .map(
          (r) =>
            '<tr><td><b>' + esc(r.label) + '</b><div style="color:var(--muted);font-size:11px">' + esc(r.id) + '</div></td>' +
            Object.keys(permLabels)
              .map((p) => '<td>' + (r.perms[p] ? '<span class="ok-text">✓</span>' : '<span class="muted-text">—</span>') + '</td>')
              .join('') +
            '</tr>'
        )
        .join('') +
      '</tbody></table></div></div>';
  }

  return (
    topbar(state.user, 'me', state.unread) +
    '<div class="container page">' +
    '<div class="section-head" style="margin-top:6px"><h2>管理后台</h2><span class="sub">平台数据与运营管理 · ' + esc(access.roleLabel || '管理员') + '</span></div>' +
    '<div class="admin-layout">' + side + '<div class="admin-main">' + main + '</div></div>' +
    '</div>'
  );
}

// ---------------- 项目文件夹详情 ----------------
export function folderView(state) {
  const project = state.project;
  const inFolder = new Set((project.skillIds || []).map(String));
  const skills = (project.skills || []).map((s) => Object.assign({}, s, { _skillId: s.id }));
  const available = (state.library || []).filter((p) => !inFolder.has(String(p.skillId)));

  const rows = skills
    .map(
      (s) =>
        '<div class="plan-item">' +
    '<div class="plan-thumb" style="' + coverStyle(s.cover) + '">' + icon(s.cover.icon || 'box') + '</div>' +
        '<div class="plan-info"><h3>' + esc(s.title) + '</h3><div class="p-meta">' + esc(s.category) + '</div></div>' +
        '<div class="plan-actions">' +
        '<button class="btn btn-outline btn-sm" data-action="open-skill" data-id="' + esc(s.id) + '">打开</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="folder-remove" data-id="' + esc(s.id) + '">移出</button>' +
        '</div></div>'
    )
    .join('');

  return (
    topbar(state.user, 'me', state.unread) +
    '<div class="container page" style="max-width:900px">' +
    '<div class="folder-head"><button class="back" data-action="go-back" data-href="#/me">' + icon('chevronL') + '</button><h2>' + icon('folder', 'lg') + ' ' + esc(project.name) + '</h2><span style="color:var(--muted);font-size:13px">' + skills.length + ' 个内容</span><span class="spacer"></span><button class="btn btn-primary btn-sm" data-action="folder-add"' + (available.length ? '' : ' disabled') + '>' + icon('plus', 'sm') + ' 添加 Skill</button></div>' +
    (rows
      ? '<div class="plan-list">' + rows + '</div>'
      : '<div class="empty"><div class="big">' + icon('folder', 'xl') + '</div>这个文件夹还是空的<br/>把已购买的 Skill 放进来吧</div>') +
    '</div>'
  );
}

// ---------------- 聊天页 ----------------
export function chatView(state) {
  const msgs = state.messages || [];
  const other = state.chatOther;
  const canSendImage = !!state.chatCanSendImage;
  const sellerSkills = state.chatSellerSkills || [];
  const isPlatform = other.id === 'platform';
  // 平台通知直接自由打字;对话完全空白时才显示「二选一」开场,对方已发过消息(例如卖家被咨询)就直接显示聊天框
  const started = isPlatform || (msgs && msgs.length > 0);
  const list = msgs
    .map(
      (m) =>
        '<div class="msg ' + (m.from === state.user.id ? 'mine' : '') + '">' +
        (m.from === state.user.id ? avatarHTML(state.user, 'sm') : avatarHTML(other, 'sm')) +
        '<div><div class="bubble' + (m.kind === 'image' ? ' bubble-image' : '') + '">' +
        (m.kind === 'image' ? '<img class="msg-image" src="' + m.image + '" alt="" />' : '') +
        (m.kind === 'skill_link' && m.skill ? '<a class="msg-skill-link" href="#/skill/' + m.skill.id + '">' + icon('box', 'sm') + esc(m.skill.title) + '<span>查看橱窗 →</span></a>' : '') +
        (m.kind === 'intent' ? '<div class="msg-kind-tag">' + icon('users', 'sm') + ' 咨询' + '</div>' : '') +
        (m.kind === 'image' && m.text !== '[图片]' ? '<div>' + esc(m.text) + '</div>' : m.kind !== 'image' && m.kind !== 'skill_link' ? esc(m.text) : '') +
        '</div><div class="m-time">' + timeAgo(m.at) + '</div></div></div>'
    )
    .join('');

  const composer = started
    ? '<div class="chat-input-row">' +
      '<form class="chat-input" data-form="chat" style="flex:1">' +
      '<textarea name="text" placeholder="输入消息…" rows="1"></textarea>' +
      '<input type="file" name="image" accept="image/png,image/jpeg,image/webp" style="display:none" />' +
      '<button class="btn btn-primary" type="submit">发送</button>' +
      '</form>' +
      (isPlatform ? '' : '<button class="btn btn-ghost chat-plus" data-action="chat-plus" title="更多">' + icon('plus') + '</button>') +
      '</div>' +
      '<div class="chat-plus-menu" id="chat-plus-menu" style="display:none">' +
      '<button data-action="chat-send-link">' + icon('box', 'sm') + ' 发送商品链接</button>' +
      (canSendImage ? '<button data-action="chat-send-image">' + icon('camera', 'sm') + ' 发送图片</button>' : '<span class="chat-plus-lock">' + icon('shield', 'sm') + ' 购买后可发图片</span>') +
      '</div>' +
      '<div class="chat-skill-picker" id="chat-skill-picker" style="display:none">' +
      (sellerSkills.length
        ? sellerSkills.map((s) => '<button data-action="chat-link-confirm" data-id="' + esc(s.id) + '">' + icon('box', 'sm') + esc(s.title) + '<span>' + money(s.priceApi) + '/天起</span></button>').join('')
        : '<span style="color:var(--muted)">对方暂无在售商品</span>') +
      '</div>'
    : '<div class="chat-intro">' +
      '<p>第一次联系,先选择你想咨询的事项:</p>' +
      '<button class="btn btn-primary btn-block" data-action="chat-intent" data-intent="product">' + icon('box', 'sm') + ' 咨询商品</button>' +
      '<button class="btn btn-outline btn-block" data-action="chat-intent" data-intent="author">' + icon('users', 'sm') + ' 咨询开发者</button>' +
      '</div>';

  return (
    '<div class="container" style="padding-top:16px">' +
    '<div class="chat-wrap">' +
    '<div class="chat-head">' +
    '<button class="back" data-action="go-back" data-href="#/market" id="chat-back">' + icon('chevronL') + '</button>' +
    '<button class="chat-avatar-btn" data-action="open-profile" data-id="' + esc(other.id) + '">' + avatarWithBadge(other, '', '', true) + '</button>' +
    '<div><div class="c-name">' + esc(other.nickname) + '</div><div class="c-title">' + esc(other.title || 'Skill 创作者') + '</div></div>' +
    '</div>' +
    '<div class="chat-body" id="chat-body">' +
    (list || '<div style="text-align:center;color:var(--muted);padding:30px">打个招呼吧 👋</div>') +
    '</div>' +
    composer +
    '</div></div>'
  );
}

// ---------------- 用户主页(点对方头像进入;最下方放「举报用户」) ----------------
export function profileView(state) {
  const p = state.profile || {};
  const skills = state.profileSkills || [];
  const isSelf = !!state.profileSelf;
  return (
    topbar(state.user, '', state.unread) +
    '<div class="container page" style="max-width:820px">' +
    '<div class="profile-hero">' +
    '<button class="back" data-action="go-back" data-href="#/market">' + icon('chevronL') + '</button>' +
    avatarWithBadge(p, 'lg', '', true) +
    '<div class="profile-info">' +
    '<div class="profile-name">' + esc(p.nickname || p.username) + (p.verified ? ' <span class="badge-verified">' + icon('shield', 'sm') + ' 已认证</span>' : '') + '</div>' +
    '<div class="profile-title">' + esc(p.title || 'Skill 创作者') + '</div>' +
    '<p class="profile-bio">' + esc(p.bio || '这位作者还没有填写简介。') + '</p>' +
    (isSelf
      ? ''
      : '<div class="profile-actions"><button class="btn btn-primary" data-action="open-chat" data-id="' + esc(p.id) + '">' + icon('chat', 'sm') + ' 联系对方</button></div>') +
    '</div></div>' +
    (skills.length
      ? '<div class="section-head"><h2>TA 的橱窗</h2></div><div class="skill-grid">' +
        skills.map((s) => skillCard(s)).join('') +
        '</div>'
      : '') +
    (isSelf
      ? ''
      : '<div class="report-zone"><span>TA 的行为有问题?</span><button class="btn btn-danger-ghost" data-action="report-user" data-id="' + esc(p.id) + '">' + icon('alert', 'sm') + ' 举报用户</button></div>') +
    '</div>'
  );
}

// ---------------- 购买弹窗 ----------------
export function purchaseModalHTML(skill, ctx) {
  const method = ctx.method;
  const renewal = !!ctx.renewal;
  const cfg = (ctx && ctx.cfg) || {};
  const cheapPrice = cfg.cheapPrice === undefined ? 0.1 : Number(cfg.cheapPrice);
  const cheapOrders = cfg.cheapOrders === undefined ? 10 : Number(cfg.cheapOrders);
  const scope = cfg.cheapScope || 'all';
  const apiTotal = skill.priceApi * ctx.days;
  const promoApi = !renewal && scope === 'all' && cheapPrice > 0 && skill.sold < cheapOrders && method === 'api';
  const promoBuyout = !renewal && (scope === 'all' || scope === 'buyout') && cheapPrice > 0 && skill.sold < cheapOrders;
  const promoTotal = promoApi ? Math.round((cheapPrice + skill.priceApi * Math.max(0, ctx.days - 1)) * 100) / 100 : apiTotal;
  const isApi = method === 'api';
  let body = '';
  if (isApi) {
    body =
      (renewal
        ? '<div class="note-box" style="padding:8px 12px"><b>续费说明</b>:直接在原套餐上追加天数(总时长上限 365 天),按原价计费,不占用商品销量。</div>'
        : promoApi
          ? '<div class="note-box" style="padding:8px 12px"><b>推广期优惠</b>:前 ' + cheapOrders + ' 单首日仅 ' + cheapPrice + ' 元,其余天数按原价,系统自动结算。</div>'
          : '') +
      '<div class="day-picker">' +
      [7, 30, 90]
        .map((d) => '<button type="button" class="day-opt ' + (ctx.days === d ? 'on' : '') + '" data-action="pick-days" data-days="' + d + '"><b>' + d + ' 天</b></button>')
        .join('') +
      '</div>' +
      '<div class="day-calc">' +
      '<span>自定义天数</span>' +
      '<input type="number" id="days-input" min="1" max="365" value="' + ctx.days + '" />' +
      '<span>天</span>' +
      '<b id="days-total">' + money(promoTotal) + '</b>' +
      '</div>' +
      '<div class="note-box"><b>按天计费,买得放心:</b><ul>' +
      '<li>哪天真的调用 API,那天才算 1 天;不调用不扣天数。</li>' +
      '<li>你只获得「调用权限」,拿不到源文件。</li>' +
      '<li>在线测试时,输入只在隔离沙箱计算一次并即时丢弃;下载 local-run.js 在本机运行时,输入完全不出本机。</li>' +
      '</ul></div>' +
      (skill.privacyMode === 'local'
        ? '<div class="note-box" style="padding:8px 12px;border-color:rgba(74,222,128,.4)"><b>本商品为「仅本机运行」模式</b>:平台不代为执行。购买后请下载 local-run.js,用你的 API Key 在本机运行,输入全程不出本机,卖家与平台都接触不到你的数据。</div>'
        : '');
  } else {
    body =
      (promoBuyout ? '<div class="note-box" style="padding:8px 12px"><b>推广期优惠</b>:前 ' + cheapOrders + ' 单买断仅 ' + cheapPrice + ' 元。</div>' : '') +
      '<div style="font-size:15px;margin-bottom:12px">一次性买断 <b style="color:var(--price);font-size:22px">' + money(promoBuyout ? cheapPrice : skill.buyoutPrice) + '</b></div>' +
      '<div class="note-box"><b>买断即交付:</b><ul>' +
      '<li>直接交付程序源文件,可商用、可修改。</li>' +
      '<li>一次付费,永久使用,无需按天计费。</li>' +
      '</ul></div>';
  }
  const total = isApi ? promoTotal : (promoBuyout ? cheapPrice : skill.buyoutPrice);
  return (
    '<div class="modal-head"><h3>' + (renewal ? '续费 · ' : '获取 Skill · ') + esc(skill.title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body">' +
    '<div class="seg-tabs">' +
    '<button type="button" class="' + (isApi ? 'on' : '') + '" data-action="buy-tab" data-method="api">API 订阅(按天)</button>' +
    (renewal ? '' : '<button type="button" class="' + (!isApi ? 'on' : '') + '" data-action="buy-tab" data-method="buyout"' + (skill.buyoutAvailable ? '' : ' disabled style="opacity:.45;cursor:not-allowed"') + '>买断源文件</button>') +
    '</div>' +
    body +
    '</div>' +
    '<div class="modal-foot"><span class="total">合计 <b id="purchase-total">' + money(total) + '</b></span><button class="btn btn-primary btn-lg" data-action="to-pay">确认支付</button></div>'
  );
}

export function paymentModalHTML(ctx) {
  const amount = ctx.amount;
  return (
    '<div class="modal-head"><h3>收银台</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body">' +
    '<div class="pay-channels">' +
    '<button class="channel-btn ' + (ctx.channel === 'wechat' ? 'on' : '') + '" data-action="pay-channel" data-val="wechat">微信支付</button>' +
    '<button class="channel-btn ' + (ctx.channel === 'alipay' ? 'on' : '') + '" data-action="pay-channel" data-val="alipay">支付宝</button>' +
    '</div>' +
    '<div class="pay-qr-wrap">' +
    '<div class="pay-qr" style="margin:0 auto"><canvas id="pay-qr-canvas" width="184" height="184"></canvas></div>' +
    '<div class="pay-amount">应付 <b>' + money(amount) + '</b></div>' +
    '<div class="pay-note">请使用' + (ctx.channel === 'wechat' ? '微信' : '支付宝') + '扫码支付<br/>演示环境:点击下方按钮模拟支付成功</div>' +
    '</div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close">取消</button><button class="btn btn-primary btn-lg" data-action="pay-done">我已支付</button></div>'
  );
}

export function folderPickerModalHTML(project, available) {
  const rows = available
    .map(
      (p) =>
        '<div class="plan-item" style="margin-bottom:8px">' +
    '<div class="plan-thumb" style="' + coverStyle(p.skill.cover) + '">' + icon((p.skill.cover && p.skill.cover.icon) || 'box') + '</div>' +
        '<div class="plan-info"><h3>' + esc(p.skill.title) + '</h3></div>' +
        '<button class="btn btn-outline btn-sm" data-action="folder-add-confirm" data-id="' + esc(p.skillId) + '">添加</button>' +
        '</div>'
    )
    .join('');
  return (
    '<div class="modal-head"><h3>添加到「' + esc(project.name) + '」</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body">' +
    (rows || '<div class="empty" style="padding:30px">你购买的 Skill 都已经在这个文件夹里了</div>') +
    '</div>'
  );
}

export function promptModalHTML(title, placeholder, value, submitAction, inputName) {
  return (
    '<div class="modal-head"><h3>' + esc(title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body"><form data-form="prompt">' +
    '<div class="field"><input name="' + esc(inputName || 'value') + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '" maxlength="20" /></div>' +
    '<button class="btn btn-primary btn-block" type="submit" data-submit-action="' + esc(submitAction) + '">确定</button>' +
    '</form></div>'
  );
}

export function confirmModalHTML(title, body, confirmLabel, confirmAction, confirmId) {
  return (
    '<div class="modal-head"><h3>' + esc(title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>' +
    '<div class="modal-body" style="text-align:center;padding:30px 20px">' +
    '<div style="margin-bottom:12px;display:flex;justify-content:center;color:var(--red)">' + icon('alert', 'xl') + '</div>' +
    '<div style="font-size:14px;color:var(--ink-2)">' + esc(body) + '</div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close">取消</button><button class="btn btn-danger-ghost" data-action="' + esc(confirmAction) + '" data-id="' + esc(confirmId || '') + '">' + esc(confirmLabel) + '</button></div>'
  );
}
