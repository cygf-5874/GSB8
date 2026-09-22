
const {JSDOM}=await import('jsdom');
const fs=await import('node:fs');
const path=await import('node:path');
const root="C:/Users/Administrator/Desktop/B7/";
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom;
global.window=window; global.document=window.document;
global.localStorage=window.localStorage;
global.requestAnimationFrame=window.requestAnimationFrame;
global.cancelAnimationFrame=window.cancelAnimationFrame; global.setTimeout=setTimeout; global.setInterval=()=>0;
for(const f of ['js/data.js','js/state.js','js/battle.js','js/ui.js','js/main.js']){
  const code=fs.readFileSync(path.join(root,f),'utf8');
  window.eval(code);
}
await new Promise(r=>setTimeout(r,200));
const w=window;
console.log('buildings rendered:',w.document.querySelectorAll('#buildings .bld').length);
console.log('party slots:',w.document.querySelectorAll('#party-slots .slot').length);
console.log('map nodes:',w.document.querySelectorAll('#map .node').length);
console.log('gold text:',w.document.getElementById('r-gold').textContent);
// 直接触发一场战斗
const G=w.Game, UI=w.UI, Battle=w.Battle;
const map=G.state.map;
const node=map.nodes[0];
G.realizeFoes(node);
Battle.start({foes:node.foes,node,onEnd:res=>{
  console.log('BATTLE END victory='+res.victory, JSON.stringify(res.rewards).slice(0,160));
  const party=G.state.heroes.filter(h=>G.state.party.includes(h.id));
  console.log('party alive after:',party.filter(h=>h.alive).length+'/4');
}});
console.log('battle stage active:',w.document.getElementById('battle-root').classList.contains('active'));
console.log('enemy units:',w.document.querySelectorAll('#battle-root .unit.enemy').length);
console.log('hero units:',w.document.querySelectorAll('#battle-root .unit.hero').length);
console.log('skill buttons:',w.document.querySelectorAll('#battle-root .sk-btn').length);
// 高速推进战斗 40 秒模拟
let ticks=0;
const iv=setInterval(()=>{
  // 狂点每个可用技能与战吼
  w.document.querySelectorAll('.sk-btn').forEach(b=>{try{if(!b.disabled)b.click();}catch(e){}});
  const ult=w.document.getElementById('bs-ult');
  try{if(ult&&!ult.disabled)ult.click();}catch(e){}
  if(++ticks>800||!w.document.getElementById('battle-root').classList.contains('active')){clearInterval(iv);console.log('sim done at tick',ticks);process.exit(0);}
},50);
