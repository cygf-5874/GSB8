/* ================= 游戏状态与存档 ================= */
const SAVE_KEY = "abyss_keep_save_v1";

const State = {
  // 资源
  res: { gold:300, iron:60, gem:10, soul:30, timber:40 },
  // 建筑
  buildings: {
    manor: { lv:1 },   // 庄园：铁+建材
    tower: { lv:1 },   // 招魂塔：魂火+灵魂经验
    smith: { lv:1 },   // 铁匠铺：打造装备
    guild: { lv:1 },   // 公会：招募
  },
  // 人口与岗位
  population: { total:6, manor:2, tower:2, idle:2 },
  // 共享等级（核心创新）
  soulLv:1, soulExp:0,       // 灵魂等级：全员共享
  forgeLv:1, forgeExp:0,     // 锻造等级：装备共享
  // 英雄与编队
  heroes: [],                // 已获得英雄
  party: [null,null,null,null],
  // 装备
  equips: [],                // {id,slot,q,attr,val,lv}
  // 地图
  floor:1, map:null,
  // 战斗增益（事件获得）
  tempBuffs: {},
  // 战吼
  warCry: 0,                 // 0-100 充能
  lastTick: Date.now(),
};

const CFG = {
  saveEvery: 5000,
  tickMs: 1000,
  offlineCapHours: 8,
  soulExpNeed: lv => Math.floor(80 * Math.pow(1.35, lv-1)),
  forgeExpNeed: lv => Math.floor(60 * Math.pow(1.3, lv-1)),
  buildCost: lv => ({ gold: 100*lv, timber: 30*lv }),
  recruitCost: 150,
  forgeCost: 25,             // 每次打造钢铁
  temperCost: q => 15*(q+1), // 回火钢铁
};

/* ---- 产出速率（每秒） ---- */
function productionRates(){
  const p = State.population, b = State.buildings;
  return {
    iron:   p.manor * 0.4 * b.manor.lv,
    timber: p.manor * 0.25 * b.manor.lv,
    soul:   p.tower * 0.2 * b.tower.lv,
    soulExp:p.tower * 0.5 * b.tower.lv,
    gold:   0.1 * b.manor.lv * b.guild.lv,
  };
}

/* ---- 挂机结算（含离线） ---- */
function settleIdle(seconds){
  seconds = Math.min(seconds, CFG.offlineCapHours*3600);
  if(seconds <= 0) return null;
  const r = productionRates();
  if(!State._frac) State._frac = {gold:0,iron:0,timber:0,soul:0,soulExp:0};
  const gain = {};
  for(const k of ["gold","iron","timber","soul","soulExp"]){
    const total = (State._frac[k]||0) + r[k]*seconds;
    gain[k] = Math.floor(total);
    State._frac[k] = total - gain[k];
  }
  State.res.gold += gain.gold; State.res.iron += gain.iron;
  State.res.timber += gain.timber; State.res.soul += gain.soul;
  addSoulExp(gain.soulExp);
  return gain;
}

/* ---- 灵魂等级（全员共享） ---- */
function addSoulExp(n){
  State.soulExp += n;
  while(State.soulExp >= CFG.soulExpNeed(State.soulLv)){
    State.soulExp -= CFG.soulExpNeed(State.soulLv);
    State.soulLv++;
    UI.toast(`灵魂等级提升至 Lv.${State.soulLv}！全员属性增强`);
  }
}
function soulMult(){ return 1 + (State.soulLv-1)*0.08; }

/* ---- 锻造等级（装备共享） ---- */
function addForgeExp(n){
  State.forgeExp += n;
  while(State.forgeExp >= CFG.forgeExpNeed(State.forgeLv)){
    State.forgeExp -= CFG.forgeExpNeed(State.forgeLv);
    State.forgeLv++;
    UI.toast(`锻造等级提升至 Lv.${State.forgeLv}！装备强化上限提高`);
  }
}

/* ---- 英雄生成 ---- */
let _uid = 1;
function rollRarity(){
  const r = Math.random()*100; let acc=0;
  for(const k of ["SSR","SR","R","N"]){ acc += DATA.rarity[k].weight; if(r<acc) return k; }
  return "N";
}
function makeHero(){
  const cls = DATA.classes[Math.floor(Math.random()*DATA.classes.length)];
  const rarity = rollRarity();
  const name = DATA.heroNames[Math.floor(Math.random()*DATA.heroNames.length)];
  const faces = DATA.heroFaces[cls.family];
  const m = DATA.rarity[rarity].mult;
  const role = DATA.roles[cls.family];
  const base = role==="坦克" ? {hp:180,atk:14} : role==="辅助" ? {hp:110,atk:12} : {hp:100,atk:20};
  return {
    uid:_uid++, name, clsId:cls.id, rarity,
    face: faces[Math.floor(Math.random()*faces.length)],
    hp:Math.round(base.hp*m), atk:Math.round(base.atk*m),
    skill: Object.assign({}, DATA.skillByFamily[cls.family]),
  };
}
function heroStats(h){
  Object.keys(h).forEach(k=>{ if(k.startsWith("_bonus_")) delete h[k]; });
  const m = soulMult();
  let hp = Math.round(h.hp*m), atk = Math.round(h.atk*m);
  // 装备加成（锻造等级共享：装备强化等级=锻造等级）
  State.equips.filter(e=>e.owner===h.uid).forEach(e=>{
    const v = Math.round(e.val * DATA.equipQuality[e.q].mult * (1+(State.forgeLv-1)*0.1));
    if(e.attr==="攻击") atk+=v; else if(e.attr==="生命") hp+=v;
    else h["_bonus_"+e.attr]=(h["_bonus_"+e.attr]||0)+v;
  });
  return {hp, atk};
}

/* ---- 装备打造 ---- */
function forgeEquip(){
  const smithLv = State.buildings.smith.lv;
  // 铁匠铺等级提升高品质概率
  const bonus = (smithLv-1)*3;
  const r = Math.random()*100; let acc=0, q=0;
  const w = DATA.equipQuality.map((x,i)=> i>=2 ? x.weight+bonus : x.weight);
  const total = w.reduce((a,b)=>a+b,0);
  for(let i=DATA.equipQuality.length-1;i>=0;i--){ if(r < w[i]/total*100){q=i;break;} acc+=w[i]; }
  const slot = DATA.equipSlots[Math.floor(Math.random()*3)];
  const attr = DATA.equipAttrs[Math.floor(Math.random()*DATA.equipAttrs.length)];
  const val = 5 + Math.floor(Math.random()*6) + State.buildings.smith.lv*2;
  const eq = { id:Date.now()+Math.random(), slot, q, attr, val, owner:null };
  State.equips.push(eq);
  addForgeExp(10);
  return eq;
}
/* 回火：低品质升品质 */
function temperEquip(eq){
  if(eq.q >= DATA.equipQuality.length-1) return false;
  const cost = CFG.temperCost(eq.q);
  if(State.res.iron < cost) return false;
  State.res.iron -= cost; eq.q++;
  addForgeExp(15);
  return true;
}

/* ---- 地图生成 ---- */
function genMap(floor){
  const nodes = []; const cols = 3; const rows = 4;
  let id=0;
  const types = ["battle","event","chest","battle","elite","rest","event","battle","chest","battle","elite","boss"];
  // 打乱前11个，boss固定最后
  const head = types.slice(0,11).sort(()=>Math.random()-.5);
  const order = [...head, "boss"];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const i = r*cols+c; if(i>=order.length) break;
      const t = order[i];
      nodes.push({ id:id++, type:t, row:r, col:c, done:false,
        // 第一层节点初始可用
        available: r===0 });
    }
  }
  return { floor, nodes };
}
function unlockNext(node){
  // 解锁下一行所有节点
  State.map.nodes.forEach(n=>{ if(n.row === node.row+1) n.available = true; });
}

/* ---- 存档 ---- */
function saveGame(){
  State.lastTick = Date.now();
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(State)); }catch(e){}
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const s = JSON.parse(raw);
    Object.assign(State, s);
    return true;
  }catch(e){ return false; }
}
function offlineSettle(){
  const now = Date.now();
  const secs = Math.floor((now - (State.lastTick||now))/1000);
  if(secs > 30){
    const gain = settleIdle(secs);
    if(gain && (gain.gold+gain.iron+gain.soul+gain.timber) > 0){
      UI.showOfflineGain(secs, gain);
    }
  }
  State.lastTick = now;
}