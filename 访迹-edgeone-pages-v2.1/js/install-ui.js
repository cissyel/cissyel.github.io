const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function installationPanel(purchase, skill = {}) {
  if (skill.privacyMode === 'local') return '<div class="note-box">此商品要求输入不出本机，不能使用远程订阅适配器。当前静态版本尚未提供它的本地执行 Skill 包；旧解密运行器也不能保证源码保密。</div>';
  return `<div class="note-box" style="margin:16px 0;text-align:left"><strong>作为任务配件安装，不必在网页里聊天</strong><p>本地 Skill 负责被助手发现、整理任务输入、接回结果；卖家核心逻辑留在服务端。订阅版也能安装。</p><p style="color:var(--muted)">当前：安装包可下载 · 真实服务待连接。此站的演示授权不能用于生产调用。</p></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-action="download-skill" data-target="codex" data-id="${esc(purchase.id)}">下载 Codex Skill 包</button><button class="btn btn-outline" data-action="download-skill" data-target="workbuddy" data-id="${esc(purchase.id)}">下载 WorkBuddy Skill 包</button></div>
    <ol style="text-align:left;line-height:1.9;padding-left:22px;margin-top:16px"><li><b>安装一次：</b>Codex 解压后运行 <code>node install.mjs</code>，安装到用户 <code>.agents/skills</code>；WorkBuddy 在“添加技能 → 上传技能”导入 ZIP。</li><li><b>连接订阅：</b>在本机终端运行包内配置命令，填写真实后端和 Key。不要把 Key 发到聊天。</li><li><b>回到原任务：</b>选择已安装的 Skill，让助手处理指定文件并继续任务，无需来回复制内容。</li></ol>
    <div class="key-box" style="white-space:normal">试着在原任务里说：“用访迹的${esc(skill.title || '这个技能')}处理我指定的文件，再把结果整合进当前任务。”</div>
    <p style="font-size:12px;color:var(--muted);text-align:left">调用时必要文本会发送至已配置的业务后端。浏览器无法静默写入本机助手目录；首次需用户导入或运行安装脚本。安装包不含卖家源码或 API Key。</p>`;
}

export function purchaseSuccessHTML(purchase, skill) {
  const body = purchase.method === 'api' ? installationPanel(purchase, skill) : '<div class="note-box">当前为静态交易演示，不能交付真实卖家源文件。生产版需由授权后端提供源码 Skill 包。</div>';
  return `<div class="modal-head"><h3>演示订单已完成</h3><button class="modal-close" data-action="modal-close">✕</button></div><div class="modal-body"><h3>${esc(skill.title)}</h3>${body}</div><div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close">关闭</button><button class="btn btn-primary" data-action="nav" data-href="#/me">去我的 Skill 库</button></div>`;
}

export function apiKeyModalHTML(usage, purchase) {
  const records = (usage.records || []).map(r => `<div>${esc(r.date)} · ${esc(r.count)} 次调用</div>`).join('');
  return `<div class="modal-head"><h3>安装到助手 · 订阅授权</h3><button class="modal-close" data-action="modal-close">✕</button></div><div class="modal-body">${installationPanel(purchase, purchase.skill)}
    <details style="margin-top:20px"><summary>查看演示授权与调用记录</summary><p>以下 Key 和用量仅在当前浏览器演示，不是真实授权。</p><div class="key-box"><code>${esc(usage.apiKey)}</code></div><p>套餐 ${esc(usage.daysTotal)} 天 · 剩余 ${esc(usage.remainingDays)} 天</p>${records || '暂无演示记录'}</details>
    <details style="margin-top:16px"><summary>可选：网页内模拟测试</summary><p style="color:var(--muted)">仅回显输入，未调用卖家技能，不验证安装、授权或生产服务。</p><div class="run-panel"><textarea id="test-input" placeholder="输入少量测试文本（非任务工作区）"></textarea><button class="btn btn-outline btn-sm" data-action="test-run" data-key="${esc(usage.apiKey)}">模拟回显</button><div class="run-output hidden" id="test-output"></div><div class="run-meta hidden" id="test-meta"></div></div></details></div>`;
}
