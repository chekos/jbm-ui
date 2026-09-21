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

test('illustrated blocks resolve anchors and exits without moving overlays into the flow', async () => {
  const {Leave} = await import('../registry/jbm/motion/pop.tsx');
  const {Catalog} = await import('../registry/jbm/motion/catalog.tsx');
  const {Propagate, propagationProgress} = await import('../registry/jbm/motion/propagate.tsx');
  const {RebuildScreens} = await import('../registry/jbm/motion/rebuild-screens.tsx');
  const {Shelf,Twice} = await import('../registry/jbm/motion/shelf.tsx');
  const spec={id:'illustrated',anchors:{cue:'narration'},valign:'center',blocks:[
    {type:'screens',pieces:[{kind:'card',at:'cue'}],again:['cue+1']},
    {type:'catalog',at:0,items:[{kind:'button',label:'button',at:'cue'}],tokens:[{kind:'type',label:'type',at:'cue+1'}]},
    {type:'propagate',at:0,bug:'cue',fix:'cue+1',fixed:'cue+1.1'},
    {type:'shelf',items:[{text:'library',at:'cue'}]},
    {type:'twice',at:0,second:'cue'},
    {type:'overlay',until:'cue+3',blocks:[{type:'brand',at:'cue',tagline:'tagline'}]},
  ]};
  for(const orientation of ['landscape','vertical']) {
    const tree=SceneFromSpec({spec,orientation,host});
    assert.equal(find(tree,RebuildScreens)[0].props.again[0],3);
    assert.equal(find(tree,Catalog)[0].props.items[0].label,'translated:button');
    assert.equal(find(tree,Propagate)[0].props.fixed,3.1);
    assert.equal(find(tree,Shelf)[0].props.items[0].text,'translated:library');
    assert.equal(find(tree,Twice)[0].props.second,2);
    const overlay=tree.props.children.props.children[1].at(-1);
    assert.equal(overlay.type,'div');
    assert.equal(overlay.props.style.position,'absolute');
    assert.equal(find(overlay,Leave)[0].props.at,5);
  }
  assert.equal(propagationProgress(1.1,1,1.1),1);
  assert.equal(propagationProgress(0,1,1.1),0);
  assert.equal(propagationProgress(2,undefined,3),-1);
  assert.throws(()=>propagationProgress(1,2,1),RangeError);
  assert.throws(()=>Propagate({w:900,h:600,at:0,targets:0}),RangeError);
});

test('completed replay uses a solid path; charging dash offsets never become negative', async () => {
  const {ReplayButton} = await import('../registry/jbm/ui/replay-button.tsx');
  for(const charging of [true,false]) {
    const tree=ReplayButton({progress:1,charging,onReplay:()=>{}});
    const paths=find(tree,'path');
    assert.equal(paths.length,1);
    assert.ok(paths[0].props.d.includes('H21 V3'));
    assert.equal(paths[0].props.strokeDashoffset,undefined);
    assert.equal(paths[0].props.strokeDasharray,undefined);
    assert.equal(tree.props.disabled,charging);
  }
  for(const progress of [0,0.85,0.9,0.999999999,NaN]) {
    const tree=ReplayButton({progress,charging:true,onReplay:()=>{}});
    for(const path of find(tree,'path')) if(path.props.strokeDashoffset!==undefined) assert.ok(path.props.strokeDashoffset>=0 && path.props.strokeDashoffset<=1);
  }
});

test('each UI Bit installs and typechecks from its own dependency closure',()=>{
  for(const name of ['ui-button','ui-input','ui-card','piece','phone-frame','badge','token-glyph']) {
    const tmp=mkdtempSync(join(tmpdir(),'jbm-bit-'));
    try {
      const seen=new Set();
      function install(itemName) {
        if(seen.has(itemName)) return; seen.add(itemName);
        const item=JSON.parse(readFileSync(join(root,'public/r',itemName+'.json'),'utf8'));
        for(const dep of item.registryDependencies??[]) install(dep.replace('@jbm/',''));
        for(const f of item.files) {
          const target=join(tmp,f.target);
          mkdirSync(dirname(target),{recursive:true});writeFileSync(target,f.content);
        }
      }
      install(name);
      symlinkSync(join(root,'node_modules'),join(tmp,'node_modules'),'dir');
      writeFileSync(join(tmp,'tsconfig.json'),readFileSync(join(root,'fixtures/consumer/tsconfig.json')));
      execFileSync(join(root,'node_modules/.bin/tsc'),['-p',tmp],{encoding:'utf8'});
      assert.ok(!seen.has('ui-bits'));
    } finally {rmSync(tmp,{recursive:true,force:true});}
  }
});

test('portrait safe areas are explicit and legacy remains compatible', async () => {
  const {sceneGeometry} = await import('../registry/jbm/motion/compile.tsx');
  assert.deepEqual(sceneGeometry('vertical'), {left:72,top:100,width:936,height:1340});
  assert.deepEqual(sceneGeometry('vertical','full'), {left:72,top:100,width:936,height:1720});
  assert.deepEqual(sceneGeometry('vertical','social'), {left:72,top:160,width:848,height:1440});
  assert.deepEqual(sceneGeometry('landscape',{left:0,right:0,top:0,bottom:0}),{left:0,top:0,width:1920,height:1080});
  for(const insets of [{left:-1,right:0,top:0,bottom:0},{left:1080,right:0,top:0,bottom:0},{left:0,right:0,top:NaN,bottom:0}]) assert.throws(()=>sceneGeometry('vertical',insets));
});

test('portrait variants replace blocks while sharing anchors; subjects fit allocated boxes', async () => {
  const {RebuildScreens} = await import('../registry/jbm/motion/rebuild-screens.tsx');
  const spec={id:'portrait',anchors:{cue:'spoken'},blocks:[{type:'note',at:0,text:'landscape'}],variants:{vertical:{layout:'headline-illustration',safeArea:'full',headlineRatio:.25,gap:40,subjectScale:1.5,blocks:[{type:'big',at:0,text:'Portrait'},{type:'screens',phoneScale:1.5,pieces:[{kind:'button',at:'cue'}]}]}}};
  const tree=SceneFromSpec({spec,orientation:'vertical',host});
  const screen=find(tree,RebuildScreens)[0];
  assert.equal(screen.props.phoneScale,1.5);
  assert.equal(screen.props.w*1.5,936);
  assert.equal(screen.props.h*1.5,(1720-40)*.75);
  assert.equal(screen.props.pieces[0].at,2);
  assert.equal(find(SceneFromSpec({spec,orientation:'landscape',host}),RebuildScreens).length,0);
  for(const composition of [{layout:'headline-illustration'},{layout:'illustration',subjectScale:0},{headlineRatio:1}]) assert.throws(()=>SceneFromSpec({spec:{id:'invalid',blocks:[],composition},orientation:'vertical',host}));
});
