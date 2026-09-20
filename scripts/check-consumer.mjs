import { cp, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(join(root, 'registry.json'), 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'jbm-consumer-'));
function run(command, args, cwd) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, {cwd, stdio:'inherit', env:{...process.env, CI:'true'}});
    child.on('error', reject);
    child.on('exit', code => code === 0 ? accept() : reject(new Error(`${command} exited ${code}`)));
  });
}
const server = createServer(async (req,res) => {
  const name = req.url?.match(/^\/([\w-]+)\.json$/)?.[1];
  if (!name) {res.writeHead(404).end();return;}
  try {res.setHeader('Content-Type','application/json');res.end(await readFile(join(root,'public/r',name+'.json')));}
  catch {res.writeHead(404).end();}
});
try {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const address = `http://127.0.0.1:${server.address().port}/{name}.json`;
  for (const mode of ['copy','registry']) {
    console.log(`Consumer contract: ${mode}`);
    const cwd = join(temp,mode);
    await mkdir(join(cwd,'src'),{recursive:true});
    await cp(join(root,'fixtures/consumer/tsconfig.json'),join(cwd,'tsconfig.json'));
    await writeFile(join(cwd,'package.json'),JSON.stringify({name:'jbm-consumer-fixture',private:true,type:'module',dependencies:{react:'19.2.8','react-dom':'19.2.8',remotion:'4.0.526'},devDependencies:{'@types/react':'19.2.7','@types/node':'20.19.0'}}));
    await run('npm',['install','--ignore-scripts','--no-audit','--no-fund'],cwd);
    if(mode === 'copy') await cp(join(root,'registry/jbm'),join(cwd,'src/jbm'),{recursive:true});
    else {
      await writeFile(join(cwd,'src/styles.css'),'');
      await writeFile(join(cwd,'components.json'),JSON.stringify({$schema:'https://ui.shadcn.com/schema.json',style:'new-york',rsc:false,tsx:true,tailwind:{config:'',css:'src/styles.css',baseColor:'neutral',cssVariables:true},aliases:{components:'@/components',ui:'@/components/ui',lib:'@/lib',hooks:'@/hooks',utils:'@/lib/utils'},registries:{'@jbm':address}}));
      await run(join(root,'node_modules/.bin/shadcn'),['add','--yes','--overwrite',...new Set(['@jbm/scene-spec','@jbm/captions','@jbm/counter','@jbm/prob-bar',...registry.items.map(i=>'@jbm/'+i.name)])],cwd);
    }
    await cp(join(root,'fixtures/consumer/Video.tsx'),join(cwd,'src/Video.tsx'));
    await run(join(root,'node_modules/.bin/tsc'),['--project',cwd],cwd);
  }
} finally {
  server.close();
  await rm(temp,{recursive:true,force:true});
}
