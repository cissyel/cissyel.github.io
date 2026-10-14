import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
if (!/^fangji-[a-z0-9-]+$/.test(manifest.name)) throw new Error('Invalid skill name');
const credentialRoot = process.env.FANGJI_CREDENTIALS_DIR || path.join(homedir(), '.fangji', 'credentials');
const credentialFile = path.join(credentialRoot, manifest.name + '.json');
const args = process.argv.slice(2);

function endpoint(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('服务地址不能包含密码、查询参数或片段');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('服务地址必须使用 HTTPS（仅本机测试允许 HTTP）');
  }
  return new URL('api/v1/run', url.href.replace(/\/?$/, '/'));
}

async function configure() {
  if (!process.stdin.isTTY) throw new Error('请由用户在交互终端执行 --configure；不要把 Key 发到聊天或写入命令参数');
  let hidden = false;
  const output = new Writable({ write(chunk, encoding, done) { if (!hidden) process.stdout.write(chunk, encoding); done(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const baseUrl = (await rl.question('可信访迹业务后端地址（不是静态展示站）: ')).trim();
    endpoint(baseUrl);
    process.stdout.write('真实订阅 API Key（输入不回显）: ');
    hidden = true;
    const apiKey = (await rl.question('')).trim();
    hidden = false;
    process.stdout.write('\n');
    if (!apiKey) throw new Error('Key 不能为空');
    await mkdir(credentialRoot, { recursive: true, mode: 0o700 });
    await writeFile(credentialFile, JSON.stringify({ baseUrl, apiKey }, null, 2), { mode: 0o600 });
    console.log('本机授权配置已保存，未验证服务或扣费。Windows 请确保该用户目录不与其他用户共享。');
  } finally { hidden = false; rl.close(); }
}

async function main() {
  const allowed = new Set(['--configure', '--check', '--input', '--output']);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error('用法: --configure | --check | --input 文件路径 [--output 文件路径]');
    if (args[i] === '--input' || args[i] === '--output') {
      if (!args[++i] || args[i].startsWith('--')) throw new Error('缺少文件路径');
    }
  }
  if (args.includes('--configure')) {
    if (args.length !== 1) throw new Error('--configure 不能与其他参数组合');
    return configure();
  }
  let config = {};
  try { config = JSON.parse(await readFile(credentialFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('本机授权文件无法解析，请重新配置'); }
  const base = process.env.FANGJI_BASE || config.baseUrl;
  const key = process.env.FANGJI_API_KEY || config.apiKey;
  if (!base || !key) throw new Error('待连接服务：请用户运行 node scripts/client.mjs --configure 配置真实业务后端和授权。静态演示 Key 无效。');
  const target = endpoint(base);
  if (args.includes('--check')) {
    if (args.length !== 1) throw new Error('--check 不能与其他参数组合');
    console.log(JSON.stringify({ configured: true, verified: false, skill: manifest.name, serviceOrigin: target.origin, note: '仅检查本机配置；未联网、未验证授权、未扣费' }));
    return;
  }
  const inputIndex = args.indexOf('--input');
  if (inputIndex < 0) throw new Error('需要 --input 文本文件路径；请仅提交当前任务必需且获用户授权的内容');
  const input = (await readFile(args[inputIndex + 1], 'utf8')).trim();
  if (!input || input.length > 6000) throw new Error('输入须为 1–6000 个 UTF-16 字符；当前后端会截断超长输入，因此客户端拒绝静默截断');
  const outputIndex = args.indexOf('--output');
  if (outputIndex >= 0) {
    try { await access(args[outputIndex + 1]); throw new Error('结果文件已存在，未调用服务、未覆盖文件'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await access(path.dirname(path.resolve(args[outputIndex + 1])));
  }
  let response;
  try {
    response = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ input }), redirect: 'error', signal: AbortSignal.timeout(60000) });
  } catch { throw new Error('连接失败或超时；未自动重试，以免重复计费。请确认服务状态，勿将失败当作任务成功。'); }
  if (!response.ok) {
    const reasons = { 401: '授权无效', 402: '额度不足', 403: '授权受限或本商品不支持远程运行', 404: '服务接口或商品不存在', 429: '调用频率过高' };
    throw new Error(`HTTP ${response.status}: ${reasons[response.status] || '服务调用失败'}。未自动重试。`);
  }
  let result;
  try { result = await response.json(); } catch { throw new Error('服务未返回 JSON 结果'); }
  if (typeof result.output !== 'string' || result.meta?.extractionRisk) throw new Error('服务拒绝执行或结果格式异常，不能报告任务完成');
  const value = JSON.stringify({ skill: manifest.name, output: result.output, meta: result.meta || {} }, null, 2);
  if (outputIndex >= 0) await writeFile(args[outputIndex + 1], value + '\n', { flag: 'wx' });
  else console.log(value);
}

main().catch(error => { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; });
