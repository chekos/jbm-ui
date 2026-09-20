import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(root + '/registry/').href)) {
      const base = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['.ts', '.tsx']) if (existsSync(base + ext)) return {url:pathToFileURL(base + ext).href,shortCircuit:true};
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(root + '/registry/').href) && /\.tsx?$/.test(url)) return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,shortCircuit:true};
    return next(url,context);
  },
});
const {SceneFromSpec,resolveAt} = await import('../registry/jbm/motion/compile.tsx');
const {CodeCard} = await import('../registry/jbm/motion/code-card.tsx');
const {StatCard} = await import('../registry/jbm/ui/stat-card.tsx');
function find(node,type) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(n=>find(n,type));
  return [...(node.type === type ? [node] : []), ...find(node.props?.children,type)];
}
const host={resolve:()=>2,t:s=>`translated:${s}`};
test('anchors support offsets and reject invalid timing',()=>{
  const spec={id:'test',anchors:{cue:'spoken', 'my-cue':'other'},blocks:[]};
  for (const [at,result] of [[0.5,0.5],['cue',2],['cue+0.2',2.2],['cue-1',1],['my-cue-0.5',1.5]]) assert.equal(resolveAt(at,spec,host),result);
  for (const at of ['missing','cue+1.2.3',Infinity]) assert.throws(()=>resolveAt(at,spec,host),/scene test/);
  assert.throws(()=>resolveAt('cue',spec,{resolve:()=>NaN}),/non-finite/);
});
test('all blocks compile in both orientations; code speed and translation reach components',()=>{
  const spec={id:'all',gap:{landscape:20,vertical:30},blocks:[
    {type:'big',at:0,text:'heading'}, {type:'stat-row',items:[{at:0,label:'a',value:'1'},{at:1,label:'b',value:'2'}]},
    {type:'note',at:0,text:'note'}, {type:'callout',at:0,text:'callout'}, {type:'bullets',at:0,items:['bullet']},
    {type:'chips',at:0,items:['chip']}, {type:'code',at:0,charsPerSecond:12,lines:[{text:'abc',at:0.5,color:'soft'}]},
    {type:'spacer',h:{landscape:10,vertical:20}},
  ]};
  for(const orientation of ['landscape','vertical']) {
    const tree=SceneFromSpec({spec,orientation,host});
    const code=find(tree,CodeCard)[0];
    assert.equal(code.props.charsPerSecond,12);
    assert.equal(code.props.lines[0].t,'translated:abc');
    assert.equal(code.props.lines[0].at,0.5);
    const stats=find(tree,StatCard);
    assert.equal(stats.length,2);
    assert.equal(stats[0].props.row,orientation==='vertical');
    assert.equal(tree.props.children.props.style.width,orientation==='vertical'?936:1680);
  }
  const tree=SceneFromSpec({spec:{id:'default',blocks:[{type:'code',at:0,lines:[]}]},orientation:'landscape',host});
  assert.equal(find(tree,CodeCard)[0].props.charsPerSecond,undefined);
});
test('published dependency closure typechecks in a strict fresh video consumer',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'jbm-scene-spec-'));
  try {
    const seen=new Set();
    function install(name) {
      if(seen.has(name)) return; seen.add(name);
      const item=JSON.parse(readFileSync(join(root,'public/r',name+'.json'),'utf8'));
      for(const dep of item.registryDependencies??[]) install(dep.replace('@jbm/',''));
      for(const f of item.files) {
        const target=join(tmp,'src/jbm',f.path.replace('registry/jbm/',''));
        mkdirSync(dirname(target),{recursive:true});writeFileSync(target,f.content);
      }
    }
    install('scene-spec');
    symlinkSync(join(root,'node_modules'),join(tmp,'node_modules'),'dir');
    writeFileSync(join(tmp,'src/Video.tsx'),`import {SceneFromSpec} from './jbm/motion/compile';\nimport type {ScenesFile} from './jbm/motion/spec';\nconst data:ScenesFile={scenes:[{id:'test',blocks:[{type:'code',at:0,charsPerSecond:24,lines:[{text:'hello',at:0}]}]}]};\nexport const Video=()=> <SceneFromSpec spec={data.scenes[0]} orientation="vertical" host={{resolve:()=>0}}/>;`);
    writeFileSync(join(tmp,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2018',module:'Preserve',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true},include:['src/**/*']}));
    execFileSync(join(root,'node_modules/.bin/tsc'),['-p',tmp],{encoding:'utf8'});
    assert.ok(seen.has('code-card'));
  } finally {rmSync(tmp,{recursive:true,force:true});}
});
