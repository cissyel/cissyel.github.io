import { readFile, mkdir, cp, access, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

async function main() {
  const source = path.dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
  if (!/^fangji-[a-z0-9-]+$/.test(manifest.name)) throw new Error('无效 Skill 名称');
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--directory' && args[1])) throw new Error('用法: node install.mjs [--directory 技能根目录]');
  const root = path.resolve(args[1] || path.join(homedir(), '.agents', 'skills'));
  const target = path.join(root, manifest.name);
  if (target === source || root.startsWith(source + path.sep)) throw new Error('不能安装到包自身或其子目录');
  // Refuse incomplete / repacked payloads and existing installations. No credentials are copied.
  for (const file of ['SKILL.md', 'manifest.json', 'scripts/client.mjs']) await access(path.join(source, file));
  if ((await readdir(path.join(source, 'scripts'))).some(name => name !== 'client.mjs')) throw new Error('安装包包含意外脚本，请先人工检查');
  await mkdir(root, { recursive: true });
  await mkdir(target); // EEXIST is intentional: never overwrite another skill.
  for (const file of ['SKILL.md', 'manifest.json', 'scripts']) await cp(path.join(source, file), path.join(target, file), { recursive: true, errorOnExist: true, force: false });
  console.log(`已安装到 ${target}\n请在助手中刷新或重新打开会话，再按包内说明由用户配置真实服务授权。`);
  console.log(`配置命令: node "${path.join(target, 'scripts', 'client.mjs')}" --configure`);
}
main().catch(error => { console.error(error.code === 'EEXIST' ? '目标 Skill 已存在，未覆盖。请先人工检查现有版本。' : error.message); process.exitCode = 1; });
