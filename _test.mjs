
global.window={};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.document={addEventListener(){},querySelector(){return null;}};
await import("file://C:/Users/Administrator/Desktop/B7/js/data.js");
globalThis.D=window.D;
await import("file://C:/Users/Administrator/Desktop/B7/js/state.js");
const G=window.Game; G.fresh();
G.state.res.steel=1e7; G.state.res.gold=1e7; G.state.res.xp=1e7; G.state.res.mat=1e7; G.state.res.soulfire=1e7;
const counts=[0,0,0,0,0,0];
for(let i=0;i<10000;i++){const r=G.craft(1); if(!r.made){console.log('ERR',JSON.stringify(r));break;} counts[r.made[0].q-1]++;}
console.log('qdist%', counts.map(c=>(c/100).toFixed(1)).join(','));
const wpn=G.state.inv.filter(i=>i.slot===1);
console.log('weapons',wpn.length,'allHavePen',wpn.every(i=>i.aff.some(a=>a.k==='pen'||a.k==='mpen')));
// 装备+属性
const h=G.state.heroes[0];
G.equipItem(h,G.state.inv.find(i=>i.slot===1));
G.equipItem(h,G.state.inv.find(i=>i.slot===2));
G.equipItem(h,G.state.inv.find(i=>i.slot===3));
console.log('power',G.heroPower(h));
// 地图
const m=G.genMap(0);
console.log('nodes',m.nodes.length,'kinds',m.nodes.map(n=>n.kind).join(','));
const bn=m.nodes.find(n=>n.kind==='boss');
const foes=G.realizeFoes(bn);
console.log('boss hp/atk',foes[0].hp, foes[0].atk,'foes',foes.length);
const en=G.genMap(4); const e4=G.realizeFoes(en.nodes.find(n=>n.kind==='boss'));
console.log('abyss boss hp',e4[0].hp);
// 事件：逐个选项跑一遍无崩溃
let crashes=0;
D.EVENTS.forEach(ev=>ev.c.forEach((c,i)=>{ try{ const r=G.applyEvent(ev.id,i); }catch(e){crashes++;console.log('EVENT CRASH',ev.id,i,e.message);} }));
console.log('event crashes',crashes);
// 升级建筑/灵魂/锻造
console.log('bld up',JSON.stringify(G.upgradeBld('manor')));
console.log('soul up',JSON.stringify(G.upgradeSoul()));
console.log('forge up',JSON.stringify(G.upgradeForge()));
console.log('gacha', (()=>{const r=G.gacha(10);return r.got?r.got.length:JSON.stringify(r);})());
console.log('accrue1h', JSON.stringify(Object.fromEntries(Object.entries(G.accrue(3600)).map(([k,v])=>[k,Math.round(v)]))));
