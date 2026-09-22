/* ========== 状态与逻辑 state.js ========== */
(function(global){
"use strict";
const SAVE_KEY = "twilight_dungeon_save_v1";
let uid = 1;
const nid = p => p + (uid++) + "_" + Math.floor(Math.random()*9000+1000);

function defaultState(){
  return {
    v:1, ts: Date.now(),
    res:{gold:1200, steel:300, soulfire:20, xp:0, mat:60, gem:5},
    bld:{manor:{lv:1,w:3}, tower:{lv:1,w:2}, smith:{lv:1,w:0}, guild:{lv:1,w:0}},
    soulLv:1, forgeLv:1,
    heroes:[], inv:[],
    party:[null,null,null,null],
    region:0, map:null, mapId:0,
    bossKills:0,
    boons:{},                 // 当前冒险临时增益
    muted:false,
    seenHarvest:false
  };
}

let G = null;
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){ G = JSON.parse(raw); uid = G._uid||1; return true; }
  }catch(e){ console.warn(e); }
  return false;
}
function fresh(){
  G = defaultState();
  D.START_HEROES.forEach((cid,i)=>{
    const h = makeHero(cid, i===0?2:1);
    G.heroes.push(h); G.party[i] = h.id;
  });
}
function save(){ if(!G) return; G._uid=uid; G.ts=Date.now();
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(G)); }catch(e){}
}

/* ---------- 数值工具 ---------- */
const rnd = Math.random;
const ri = (a,b) => Math.floor(rnd()*(b-a+1))+a;
function pick(arr){ return arr[Math.floor(rnd()*arr.length)]; }
function chance(p){ return rnd()<p; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function fmt(n){
  n=Math.floor(n);
  if(n>=1e9) return (n/1e9).toFixed(2)+"B";
  if(n>=1e6) return (n/1e6).toFixed(2)+"M";
  if(n>=1e4) return (n/1e3).toFixed(1)+"k";
  return ""+n;
}
function canCost(cost){ return Object.entries(cost||{}).every(([k,v])=> (G.res[k]||0)>=v); }
function pay(cost){ if(!canCost(cost)) return false;
  Object.entries(cost||{}).forEach(([k,v])=> G.res[k]-=v); return true; }
function gain(res){ Object.entries(res).forEach(([k,v])=> G.res[k]=(G.res[k]||0)+v); }

/* ---------- 英雄 ---------- */
function classDef(cid){ return D.CLASS_LIST.find(c=>c[0]===cid); }
function makeHero(cid, forceR){
  const c = classDef(cid);
  let r = forceR || rollRarity();
  return {id:nid("h"), cid, r,
    awaken:0, equip:{1:null,2:null,3:null},
    hpPct:1, alive:true
  };
}
function rollRarity(){
  const luck = (G.bld.guild.lv-1)*0.004; // 公会等级小幅提高
  const rates = D.GACHA.rates.map((p,i)=> i===1? p-luck*0.4 : (i>=2? p+luck/3 : p));
  let t=rnd(), acc=0;
  for(let i=0;i<rates.length;i++){ acc+=rates[i]; if(t<=acc) return i+1; }
  return 1;
}
/* 英雄属性：灵魂等级共享；装备与锻造等级共享 */
function heroBaseStats(h){
  const c = classDef(h.cid);
  const roleHp = {"先锋":110,"护卫":140,"异士":82,"支援":90,"斥候":86}[c[3]];
  const roleAt = {"先锋":16,"护卫":12,"异士":18,"支援":13,"斥候":17}[c[3]];
  const lv = G.soulLv;
  let hp = (roleHp + lv*13) * c[7] * (1 + (h.r-1)*0.18 + h.awaken*0.08);
  let atk = (roleAt + lv*2.7) * c[8] * (1 + (h.r-1)*0.16 + h.awaken*0.07);
  let spd = c[9] * (1+(h.r-1)*0.02+h.awaken*0.02);
  return {hp,atk,spd,arch:c[2],role:c[3],name:c[1],ico:c[5],cid:h.cid,r:h.r,
          crit:.08,critdmg:.6,pen:0,mpen:0,def:0,reduce:0,dodge:0,lifesteal:0,healbonus:0,
          sk:c[6]};
}
function equipBonus(h){
  const b={atk:0,hp:0,crit:0,critdmg:0,pen:0,mpen:0,def:0,spd:0,reduce:0,dodge:0,lifesteal:0,healbonus:0};
  [1,2,3].forEach(slot=>{
    const it=h.equip[slot]; if(!it) return;
    const mult = (D.QUALITY_MULT[it.q]||1) * (1 + (G.forgeLv-1)*0.05);
    it.aff.forEach(af=>{ b[af.k]=(b[af.k]||0)+af.v*mult*(af.main?1:.6); });
  });
  return b;
}
function heroStats(h){
  const s=heroBaseStats(h), e=equipBonus(h);
  s.atk += s.atk*e.atk; s.hp += s.hp*e.hp;
  ["crit","critdmg","pen","mpen","def","spd","reduce","dodge","lifesteal","healbonus"].forEach(k=> s[k]=(s[k]||0)+(e[k]||0));
  s.spd=Math.max(.5,s.spd);
  s.crit=clamp(s.crit,0,.9); s.dodge=clamp(s.dodge,0,.6); s.reduce=clamp(s.reduce,0,.6);
  return s;
}
function heroPower(h){ const s=heroStats(h); return Math.floor(s.atk*8 + s.hp*.55 + s.crit*300 + (s.pen+s.mpen)*400); }

/* ---------- 装备生成 ---------- */
function rollQuality(){
  // 基础概率 + 铁匠铺极品率：把概率从粗制逐级向高品质转移
  const up=Math.min(.45,(G.bld.smith.lv-1)*D.CRAFT_QUP);
  let qs=[.50,.28,.14,.065,.014,.001];
  let moved=0;
  for(let k=0;k<6;k++){
    if(moved>=up) break;
    const take=Math.min(qs[k]*(k===0?.8:.5), up-moved);
    qs[k]-=take;
    for(let i=k+1;i<6;i++) qs[i]+=take/(6-k-1);
    moved+=take;
  }
  const total=qs.reduce((a,b)=>a+b,0);
  qs=qs.map(x=>x/total);
  let t=rnd(),acc=0;
  for(let i=0;i<6;i++){acc+=qs[i]; if(t<=acc) return i+1;}
  return 1;
}
function makeItem(slot, forceQ){
  const q = forceQ||rollQuality();
  const pool = D.AFFIXES.filter(a=>a.slots.includes(slot));
  const chosen=[];
  // 武器必带一种穿透（优先堆叠穿透的设计点）
  if(slot===1){
    const pens=pool.filter(a=>a.weapon);
    chosen.push({...pick(pens), main:true});
  }
  const mains=pool.filter(a=>a.main && !chosen.find(c=>c.k===a.k));
  if(mains.length) chosen.push({...pick(mains),main:true});
  while(chosen.length < D.QUALITY_AFFIX[q]){
    const cand=pool.filter(a=> !chosen.find(c=>c.k===a.k));
    if(!cand.length) break;
    chosen.push({...pick(cand),main:false});
  }
  const names=D.ITEM_NAMES[slot], icos=D.ITEM_ICONS[slot];
  const idx=ri(0,names.length-1);
  return {id:nid("i"), slot, q, name:names[idx], ico:icos[idx%icos.length], aff:chosen, tempered:0};
}
function itemName(it){ return D.QUALITY[it.q]+"·"+it.name; }
function itemPower(it){
  const mult=(D.QUALITY_MULT[it.q]||1)*(1+(G.forgeLv-1)*0.05);
  return Math.floor(it.aff.reduce((s,a)=>s+a.v*mult*(a.main?600:320),0)*it.slot*4);
}

/* ---------- 招募 ---------- */
function gacha(times){
  const cost=times===10?D.GACHA.cost10:D.GACHA.cost;
  if(G.heroes.length>=D.GUILD_CAP(G.bld.guild.lv)) return {err:"英雄栏已满，升级冒险者公会扩容"};
  if(G.res.gold<cost) return {err:"金币不足"};
  G.res.gold-=cost;
  const got=[];
  for(let i=0;i<times;i++){
    if(G.heroes.length>=D.GUILD_CAP(G.bld.guild.lv)) break;
    const cid=pick(D.CLASS_LIST)[0];
    const h=makeHero(cid);
    G.heroes.push(h); got.push(h);
  }
  save();
  return {got};
}
function dupeHero(h){
  // 重复英雄：按稀有度返还精粹（这里简化为直接转化为该英雄觉醒材料：英雄之粹->魂火+金币）
  G.res.soulfire += D.GACHA.dupe[h.r];
  G.res.gold += 20*h.r;
  G.heroes = G.heroes.filter(x=>x.id!==h.id);
  G.party = G.party.map(p=> p===h.id?null:p);
}
function dismissHero(h){
  G.res.gold += 30*h.r + h.awaken*50;
  [1,2,3].forEach(s=>{ if(h.equip[s]) G.inv.push(h.equip[s]); h.equip[s]=null; });
  G.heroes = G.heroes.filter(x=>x.id!==h.id);
  G.party = G.party.map(p=> p===h.id?null:p);
}
function awakenHero(h){
  const cost={soulfire: 20*h.r*(h.awaken+1), gold:200*h.r*(h.awaken+1)};
  if(h.awaken>=5) return {err:"已达最高觉醒"};
  if(!pay(cost)) return {err:"资源不足"};
  h.awaken++; save(); return {ok:true};
}

/* ---------- 装备穿戴 / 打造 / 回火 ---------- */
function equipItem(h, it){
  const cur=h.equip[it.slot];
  h.equip[it.slot]=it;
  G.inv=G.inv.filter(x=>x.id!==it.id);
  if(cur) G.inv.push(cur);
  save();
}
function unequip(h,slot){ const it=h.equip[slot]; if(it){G.inv.push(it);h.equip[slot]=null;save();} }
function craft(n){
  n=n||1;
  const cost=D.CRAFT_COST*n;
  if(G.res.steel<cost) return {err:"钢铁不足"};
  const cap=200;
  if(G.inv.length+n>cap) return {err:"背包已满(200)"};
  G.res.steel-=cost;
  const made=[];
  for(let i=0;i<n;i++){
    const slot = chance(.55)?1:(chance(.6)?2:3);
    const it=makeItem(slot); G.inv.push(it); made.push(it);
  }
  save(); return {made};
}
function temper(it){
  if(it.q>=6) return {err:"已达最高品质"};
  const steel=D.TEMPER_COST[it.q+1]*(it.slot===1?1:0.7)|0;
  const mat=5*it.q;
  if(G.res.steel<steel||G.res.mat<mat) return {err:"材料不足，需要 "+steel+" 钢铁、"+mat+" 材料"};
  G.res.steel-=steel; G.res.mat-=mat;
  it.q++;
  // 提升词条数值并补一条新词条
  it.aff.forEach(a=> a.v*=1.12);
  const pool=D.AFFIXES.filter(a=>a.slots.includes(it.slot)&&!it.aff.find(x=>x.k===a.k));
  if(it.aff.length<D.QUALITY_AFFIX[it.q]&&pool.length){
    it.aff.push({...pick(pool),main:false});
  }
  save(); return {ok:true};
}
/* ---------- 建筑：人口/产出/升级 ---------- */
function popCap(){ return 8 + G.bld.manor.lv*2 + G.bld.tower.lv; }
function popUsed(){ return G.bld.manor.w + G.bld.tower.w; }
function setWorkers(b,n){
  const b0=G.bld[b]; n=clamp(n,0,99);
  const other = b==="manor"? G.bld.tower.w : G.bld.manor.w;
  b0.w = clamp(n,0,Math.max(0,popCap()-other));
  save();
}
function prodRate(){
  const ml=G.bld.manor.lv, mw=G.bld.manor.w, tl=G.bld.tower.lv, tw=G.bld.tower.w;
  return {
    gold: mw*D.MANOR_PROD.gold[0]*Math.pow(D.MANOR_PROD.gold[1],ml-1)
        + tw*D.TOWER_PROD.gold[0]*Math.pow(D.TOWER_PROD.gold[1],tl-1),
    xp:   mw*D.MANOR_PROD.xp[0]*Math.pow(D.MANOR_PROD.xp[1],ml-1),
    mat:  mw*D.MANOR_PROD.mat[0]*Math.pow(D.MANOR_PROD.mat[1],ml-1),
    soulfire: tw*D.TOWER_PROD.soulfire[0]*Math.pow(D.TOWER_PROD.soulfire[1],tl-1),
    gem:  tw*D.TOWER_PROD.gem[0]*Math.pow(D.TOWER_PROD.gem[1],tl-1)
  };
}
function buildUpgradeCost(id){
  const lv=G.bld[id].lv;
  if(id==="manor"||id==="tower"){
    return {gold:Math.floor(400*Math.pow(1.6,lv-1)), mat:Math.floor(30*Math.pow(1.55,lv-1))};
  }
  if(id==="smith") return {steel:Math.floor(200*Math.pow(1.55,lv-1)), mat:Math.floor(25*Math.pow(1.5,lv-1))};
  return {gold:Math.floor(600*Math.pow(1.65,lv-1)), mat:Math.floor(20*Math.pow(1.5,lv-1))};
}
function upgradeBld(id){
  const cost=buildUpgradeCost(id);
  if(!pay(cost)) return {err:"资源不足"};
  G.bld[id].lv++; save(); return {ok:true};
}
/* 在线/离线产出 */
function accrue(seconds){
  const rate=prodRate(), cap=Math.min(seconds,D.OFFLINE_CAP);
  const got={};
  ["gold","xp","mat","soulfire","gem"].forEach(k=>{
    const v=rate[k]*cap; if(v>0){got[k]=v; (G.res[k]=(G.res[k]||0)+v);}
  });
  return got;
}
function soulCost(){ return D.SOUL_COST(G.soulLv); }
function upgradeSoul(){
  const c=soulCost();
  if(!pay(c)) return {err:"经验或金币不足"};
  G.soulLv++; save(); return {ok:true};
}
function forgeCost(){ return D.FORGE_COST(G.forgeLv); }
function upgradeForge(){
  const c=forgeCost();
  if(!pay(c)) return {err:"材料不足"};
  G.forgeLv++; G.bld.smith.lv=G.forgeLv; save(); return {ok:true};
}

/* ---------- 冒险地图（箱庭节点路径）---------- */
function genMap(regionIdx){
  const nodes=[];
  // 固定箱庭结构：战→(战/事件)→(宝藏/战)→(事件/精英)→精英→(事件/战)→(篝火/战)→战→首领
  const plans=[
    "battle",
    chance(.55)?"battle":"event",
    chance(.4)?"treasure":"battle",
    chance(.5)?"event":"battle",
    "elite",
    chance(.5)?"event":"battle",
    chance(.55)?"rest":"battle",
    "battle",
    "boss"
  ];
  plans.forEach((kind,layer)=>{
    const node={layer,kind,done:false,shift:layer===0?0:(chance(.5)?-1:1)};
    if(kind==="event") node.ev=pick(D.EVENTS).id;
    if(kind==="battle"||kind==="elite"||kind==="boss") node.foes=makeFoes(regionIdx,kind);
    nodes.push(node);
  });
  return {nodes, layer:0, regionIdx, finished:false};
}
function scaleBase(regionIdx, layer){
  const r=D.REGIONS[regionIdx];
  const s=1 + regionIdx*0.9 + layer*0.14;
  return {pow:r.pow*(0.85+layer*.06), s};
}
function makeFoes(regionIdx, kind){
  const r=D.REGIONS[regionIdx], layer = kind==="boss"?8:3;
  const {s}=scaleBase(regionIdx,layer);
  const arr=[];
  if(kind==="boss"){
    const b=r.boss;
    const adds = regionIdx>=1 && chance(.6) ? 1:0;
    arr.push({name:b[0],ico:b[1],role:"boss",hpM:b[2],atM:b[3],spd:b[4],sk:b[5],boss:true,
      telegraph:b[6],enrage: regionIdx+1, hp:0,atk:0});
    for(let i=0;i<adds;i++){
      const f=pick(r.foes);
      arr.push({name:f[0],ico:f[1],role:f[2],hpM:f[3]*.8,atM:f[4]*.85,spd:f[5],sk:f[6]||null,boss:false,hp:0,atk:0});
    }
    return arr;
  }
  const count=kind==="elite"?ri(2,3):ri(2,3);
  const elite=kind==="elite";
  for(let i=0;i<count;i++){
    const f=pick(r.foes);
    arr.push({name:f[0]+(elite?"·精英":""),ico:f[1],role:f[2],
      hpM:f[3]*(elite?1.6:1)*(0.92+rnd()*.16),
      atM:f[4]*(elite?1.35:1)*(0.92+rnd()*.16),
      spd:f[5],sk:f[6]||null,boss:false,elite,hp:0,atk:0});
  }
  return arr;
}
/* 进入节点时把倍率转成实际数值 */
function realizeFoes(node){
  const {s}=scaleBase(G.region,node.layer);
  node.foes.forEach(f=>{
    f.hp = Math.round(70*s*f.hpM*(f.boss?2.4:1));
    f.atk = Math.round(9*s*f.atM*(f.boss?1.5:1));
    f.def=0;
  });
  return node.foes;
}
function startRegion(idx){
  if(idx>0 && G.bossKills < D.REGION_REQ[idx]) return {err:"需要累计击败 "+D.REGION_REQ[idx]+" 个区域首领"};
  G.region=idx; G.boons={};
  G.map=genMap(idx); G.mapId++;
  save(); return {ok:true};
}

/* ---------- 随机事件结算 ---------- */
const living = ()=> G.party.filter(id=>id).map(id=>G.heroes.find(h=>h.id===id)).filter(h=>h&&h.alive);
function healParty(pct){ living().forEach(h=> h.hpPct=clamp(h.hpPct+pct,0,1)); }
function hurtPartyPctMax(pct){ // 按最大生命比例掉血（由战斗侧直接换算，这里记录百分比掉当前上限等效）
  living().forEach(h=>{ h.hpPct=clamp(h.hpPct-pct,0,1); if(h.hpPct<=0) h.alive=false; });
}
function partyHasRole(...roles){ return living().some(h=> roles.includes(classDef(h.cid)[3])); }
function partyStars(){ return living().reduce((s,h)=>s+h.r,0); }

function eventDef(id){ return D.EVENTS.find(e=>e.id===id); }

function applyEvent(evId, choiceIdx){
  const ev=eventDef(evId), ch=ev.c[choiceIdx], a=ch.a;
  const reg=G.region;
  const scale=1+reg;
  let log="";
  if(ch.cost){
    if(ch.cost.hp){ /* 百分比血在动作里处理 */ }
    else if(!pay(ch.cost)) return {err:"资源不足"};
  }
  const R={};
  switch(a){
  case "none": log="你选择了谨慎离开。"; break;
  case "buybox": { const q=chance(.2)?4:(chance(.5)?3:2); const it=makeItem(pick([1,1,2,3]),q);
    G.inv.push(it); log="你从箱中取出了 "+D.QUALITY[q]+" 装备。"; break; }
  case "supply": healParty(.3); log="温热的肉汤恢复了队伍 30% 生命。"; break;
  case "boonAtk": hurtPartyPctMax(.15); G.boons.atk=(G.boons.atk||0)+.2;
    log="鲜血滴落祭坛，全队获得 +20% 攻击祝福。"; break;
  case "pray": {
    if(chance(.55)){ R.gold=ri(80,200)*scale; gain(R); log="神祇似乎心情不错，你获得了金币。"; }
    else if(chance(.5)){ G.boons.crit=(G.boons.crit||0)+.15; log="你获得了 +15% 暴击祝福。"; }
    else { hurtPartyPctMax(.1); log="祈祷变作刺耳低语，队伍受到了惊吓。"; }
    break; }
  case "trapDodge":
    if(partyHasRole("斥候")) log="斥候一个侧身，全队毫发无伤地通过。";
    else { hurtPartyPctMax(.08); log="闪避慢了半拍，被尖刺划伤。"; }
    break;
  case "trapHurt": hurtPartyPctMax(.08); R.mat=ri(5,12)*scale; gain({mat:R.mat});
    log="硬扛伤害后，你从机关上拆下一些可用零件。"; break;
  case "trapMat": {
    if(chance(.6)){ R.mat=ri(8,16)*scale; gain({mat:R.mat}); log="成功拆解机关，获得材料。"; }
    else { hurtPartyPctMax(.12); log="拆解失败，机关弹开了！"; }
    break; }
  case "gasHold": hurtPartyPctMax(.05); R.soulfire=ri(3,7)+reg; gain({soulfire:R.soulfire});
    log="你们屏息冲过毒雾，并收集了残余的魂火微粒。"; break;
  case "gasBurn": R.mat=ri(3,8); gain({mat:R.mat}); log="钢铁撞出的火星瞬间引爆了毒雾——但安全。"; break;
  case "divine":
    if(chance(.45)){ G.boons.atk=(G.boons.atk||0)+.12; log="乌鸦旅人预言了胜利：+12% 攻击。"; }
    else if(chance(.45)){ G.boons.spd=(G.boons.spd||0)+.15; log="他在你脚下画下疾风符文：+15% 攻速。"; }
    else { R.gold=0; log="他笑着消失在雾里，金币也不翼而飞。"; }
    break;
  case "share": R.mat=ri(6,12)*scale; gain({mat:R.mat}); log="旅人留下一枚温热的信物便离开了。"; break;
  case "chestOpen":
    if(chance(.7)){ rewardTreasure(1.0); log="宝箱中是闪闪发光的战利品！"; }
    else { hurtPartyPctMax(.12); log="符文爆炸！这是个陷阱箱。"; }
    break;
  case "chestSafe": R.gem=ri(2,4)+Math.floor(reg/2); gain({gem:R.gem});
    log="你安全拆除符文，箱中有数枚钻石。"; break;
  case "wellTake": R.soulfire=ri(6,12)+reg*2; gain({soulfire:R.soulfire});
    G.boons.def=(G.boons.def||0); living()[ri(0,living().length-1)]; log="你汲取了魂火，但寒意浸透了一名英雄的脊背。";
    break;
  case "wellPurify": R.soulfire=ri(12,22)+reg*3; gain({soulfire:R.soulfire});
    log="金币沉入井底，换来大团纯净魂火。"; break;
  case "graveLoot": { const it=makeItem(pick([1,2]),chance(.3)?3:2); G.inv.push(it);
    log="你得到了一件陪葬装备。"; break; }
  case "graveRest": healParty(.15); gain({xp:40*scale}); log="你让逝者安息，心中涌起平静与经验。"; break;
  case "shrinePray": healParty(.25); G.boons.shield=true; log="烛火轻颤：全队回复 25%，下场战斗获得开局护盾。"; break;
  case "shrineSteal": R.gold=ri(120,220)*scale; gain({gold:R.gold}); G.boons.cursed=true;
    log="金器到手，但一道阴影缠上了队伍（下场战斗减益）。"; break;
  case "ambushFight": return {fight:true, log:"你拔剑迎战！"};
  case "ambushPay": log="劫匪掂了掂钱袋，骂骂咧咧地让路。"; break;
  case "ambushScare":
    if(partyStars()>=6){ log="你们重装上前，劫匪吓得落荒而逃，还丢下了钱袋！"; gain({gold:80*scale}); }
    else { hurtPartyPctMax(.1); log="演技不到家，混战中受了点伤。"; }
    break;
  case "oldForge": { const it=makeItem(pick([1,1,2,3]),chance(.25)?4:3); G.inv.push(it);
    log="锻炉重燃，锤声在洞穴中回荡。"; break; }
  case "forgeParts": R.mat=ri(10,18)*scale; gain({mat:R.mat}); log="你拆下了还能用的零件。"; break;
  case "shroomEat":
    if(chance(.55)){ G.boons.spd=(G.boons.spd||0)+.12; log="味道意外地甜：+12% 攻速。"; }
    else { hurtPartyPctMax(.1); log="菌菇有毒，腹中翻江倒海。"; }
    break;
  case "shroomPick": R.mat=ri(5,10)*scale; gain({mat:R.mat}); log="你小心地收集了荧光孢子。"; break;
  case "cageFree":
    if(chance(.6)){ R.gem=ri(1,3); gain({gem:R.gem}); log="渡鸦叼回了一枚闪亮的钻石！"; }
    else log="渡鸦怪叫一声飞走了……鸟话果然不能信。";
    break;
  case "monoTouch": gain({xp:120*scale}); hurtPartyPctMax(.1);
    log="古老知识灌入脑海（大量经验），七窍却渗出血来。"; break;
  case "monoBreak": gain({soulfire:8+reg*2,mat:10*scale});
    log="石碑碎裂，涌出魂火与可用碎石。"; break;
  }
  save();
  return {ok:true,log,boons:G.boons};
}
function rewardTreasure(mul){
  const reg=G.region, m=mul*(1+reg);
  const r={gold:ri(80,160)*m|0, steel:ri(30,70)*m|0};
  if(chance(.4)) r.mat=ri(5,12)*m|0;
  if(chance(.18)) r.soulfire=ri(3,8)+reg;
  if(chance(.1)) r.gem=ri(1,2);
  gain(r);
  if(chance(.5)){ const it=makeItem(pick([1,1,2,3]),chance(.2)?4:(chance(.4)?3:2)); G.inv.push(it); r.item=it; }
  save(); return r;
}

/* ---------- 战斗结果 / 节点推进 ---------- */
function battleRewards(node, victory){
  if(!victory) return {};
  const reg=G.region, layer=node.layer;
  const m=1+reg*0.8+layer*0.15;
  const r={gold:ri(60,110)*m|0, xp:ri(40,80)*m|0, steel:ri(20,45)*m|0};
  if(node.kind==="elite"){ r.gold*=2; r.xp*=2; r.steel*=2; r.mat=ri(6,12)+reg*3;
    if(chance(.6)) r.item=(G.inv.push(makeItem(pick([1,1,2,3]),chance(.25)?4:3)),G.inv[G.inv.length-1]); }
  if(node.kind==="boss"){
    r.gold*=5; r.xp*=4; r.steel*=4; r.soulfire=15+reg*8; r.gem=5+reg*3; r.mat=20+reg*10;
    const qq=chance(.15)?5:4;
    r.item=(G.inv.push(makeItem(pick([1,1,2,3]),qq)),G.inv[G.inv.length-1]);
    G.bossKills++;
  }
  gain(r);
  return r;
}
function completeNode(){
  const map=G.map; if(!map) return;
  map.nodes[map.layer].done=true;
  map.layer++;
  if(map.layer>=D.LAYERS) map.finished=true;
  save();
}
function restNode(){
  healParty(.35);
  living().forEach(h=>{});
  // 休整也少量清除诅咒
  G.boons.cursed=false;
  save();
}
function townHeal(dt){
  // 在城堡每秒恢复 0.5% 生命
  living().forEach(h=> h.hpPct=clamp(h.hpPct+0.005*dt,0,1));
}
function reviveAll(){
  // 魂火复活倒下英雄
  const dead=G.heroes.filter(h=>!h.alive);
  const cost=dead.length*10;
  if(!cost) return {err:"没有倒下的英雄"};
  if(G.res.soulfire<cost) return {err:"魂火不足，需要 "+cost};
  G.res.soulfire-=cost;
  dead.forEach(h=>{h.alive=true;h.hpPct=.5;});
  save(); return {ok:true,cost};
}

/* ---------- 导出 ---------- */
global.Game = {
  SAVE_KEY,
  get state(){return G;},
  load, fresh, save, reset(){ try{localStorage.removeItem(SAVE_KEY);}catch(e){} fresh(); },
  fmt, pick, chance, ri, clamp, rnd, canCost, pay, gain,
  classDef, makeHero, heroStats, heroPower, equipBonus,
  rollRarity, gacha, dupeHero, dismissHero, awakenHero,
  makeItem, itemName, itemPower, equipItem, unequip, craft, temper, rollQuality,
  popCap, popUsed, setWorkers, prodRate, buildUpgradeCost, upgradeBld,
  accrue, soulCost, upgradeSoul, forgeCost, upgradeForge,
  genMap, realizeFoes, startRegion, scaleBase,
  eventDef, applyEvent, rewardTreasure,
  battleRewards, completeNode, restNode, townHeal, reviveAll,
  healParty, living, popCapNow:popCap
};
})(window);
