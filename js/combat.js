/* ================= 即时战斗系统 ================= */
const Combat = {
  active:false, heroes:[], enemies:[], timer:null,
  log:[], onEnd:null, isBoss:false, enraged:false,

  /* 组建战斗单位 */
  start(enemyList, opts={}){
    this.active = true; this.isBoss = !!opts.isBoss; this.enraged = false;
    this.onEnd = opts.onEnd || null;
    this.log = [];
    // 英雄：从编队生成
    this.heroes = State.party.filter(Boolean).map((h,i)=>{
      const s = heroStats(h);
      const buff = State.tempBuffs.atk ? 1+State.tempBuffs.atk : 1;
      return { ref:h, name:h.name, face:h.face, idx:i,
        maxHp:s.hp, hp:s.hp, atk:Math.round(s.atk*buff),
        skill:Object.assign({}, h.skill), cd:0, shield:0, alive:true, atkT:0 };
    });
    // 敌人
    const fscale = 1 + (State.floor-1)*0.35;
    this.enemies = enemyList.map((e,i)=>({
      id:e.id, name:e.name, face:e.face, family:e.family,
      maxHp:Math.round(e.hp*fscale), hp:Math.round(e.hp*fscale),
      atk:Math.round(e.atk*fscale), alive:true, atkT:Math.random()*1.5,
      enrageAt:e.enrageAt, enrageMult:e.enrageMult, warn:e.warn, dots:[],
    }));
    UI.renderBattle();
    this.pushLog(this.isBoss ? "⚠️ BOSS战开始！注意狂暴阶段！" : "战斗开始！");
    let last = performance.now();
    this.timer = setInterval(()=>{
      const now = performance.now(); const dt = (now-last)/1000; last = now;
      this.update(dt);
    }, 100);
  },

  update(dt){
    if(!this.active) return;
    // 英雄行动
    this.heroes.forEach(h=>{
      if(!h.alive) return;
      h.atkT += dt;
      if(h.cd > 0) h.cd = Math.max(0, h.cd - dt);
      if(h.atkT >= 1.6){ h.atkT = 0; this.heroAttack(h); }
    });
    // 敌人行动
    this.enemies.forEach(e=>{
      if(!e.alive) return;
      // DoT 结算
      if(e.dots.length){
        e.dots.forEach(d=>{ d.t += dt; if(d.t>=1){ d.t=0; d.n--; this.damageEnemy(e, d.dmg, "☠️"); } });
        e.dots = e.dots.filter(d=>d.n>0);
      }
      // BOSS 狂暴检测
      if(this.isBoss && !this.enraged && e.enrageAt && e.hp/e.maxHp <= e.enrageAt){
        this.enraged = true; e.atk = Math.round(e.atk*e.enrageMult);
        UI.bossWarn(e.warn || "BOSS狂暴了！");
        this.pushLog(`🔥 ${e.name} 进入狂暴阶段！伤害大幅提升！`);
      }
      e.atkT += dt;
      const interval = this.enraged ? 1.4 : 2.0;
      if(e.atkT >= interval){ e.atkT = 0; this.enemyAttack(e); }
    });
    // 战吼充能
    State.warCry = Math.min(100, State.warCry + dt*4);
    UI.updateBattleBars();
    this.checkEnd();
  },

  heroAttack(h){
    const t = this.enemies.find(e=>e.alive); if(!t) return;
    let dmg = h.atk * (0.9+Math.random()*0.2);
    let crit = false;
    const critBonus = h.ref["_bonus_暴击"]||0;
    if(Math.random() < 0.1 + critBonus/100){ dmg*=1.8; crit=true; }
    dmg = Math.round(dmg);
    this.damageEnemy(t, dmg, crit?"💥":"");
    UI.hitUnit("e", this.enemies.indexOf(t));
  },
  enemyAttack(e){
    const alive = this.heroes.filter(h=>h.alive); if(!alive.length) return;
    const t = alive[Math.floor(Math.random()*alive.length)];
    let dmg = Math.round(e.atk*(0.9+Math.random()*0.2));
    if(t.shield > 0){
      const absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed; dmg -= absorbed;
    }
    if(dmg>0){ t.hp -= dmg; }
    UI.hitUnit("h", t.idx);
    if(t.hp<=0){ t.hp=0; t.alive=false; this.pushLog(`💀 ${t.name} 倒下了…`); }
  },

  damageEnemy(e, dmg, tag=""){
    e.hp -= dmg;
    UI.floatDmg("e", this.enemies.indexOf(e), dmg, tag);
    if(e.hp<=0){ e.hp=0; e.alive=false; this.pushLog(`☠️ ${e.name} 被消灭`); }
  },

  /* 手动释放技能（点击英雄头像） */
  castSkill(idx){
    const h = this.heroes[idx];
    if(!h || !h.alive || h.cd>0) return false;
    const s = h.skill; h.cd = s.cd;
    if(s.type==="dmg" || s.type==="aoe"){
      const targets = s.type==="aoe" ? this.enemies.filter(e=>e.alive) : [this.enemies.find(e=>e.alive)];
      targets.forEach(t=>{ if(t) this.damageEnemy(t, Math.round(h.atk*s.mult), "✨"); });
      this.pushLog(`✨ ${h.name} 释放【${s.name}】`);
    } else if(s.type==="heal"){
      const weak = this.heroes.filter(x=>x.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
      if(weak){ const heal=Math.round(h.atk*s.mult); weak.hp=Math.min(weak.maxHp, weak.hp+heal);
        UI.floatDmg("h", weak.idx, "+"+heal, "💚"); }
      this.pushLog(`💚 ${h.name} 释放【${s.name}】`);
    } else if(s.type==="shield"){
      this.heroes.forEach(x=>{ if(x.alive) x.shield += Math.round(h.atk*s.mult); });
      this.pushLog(`🛡️ ${h.name} 释放【${s.name}】全队护盾`);
    } else if(s.type==="dot"){
      this.enemies.filter(e=>e.alive).forEach(e=>e.dots.push({dmg:Math.round(h.atk*s.mult), n:3, t:0}));
      this.pushLog(`☠️ ${h.name} 释放【${s.name}】全体中毒`);
    }
    return true;
  },

  /* 战吼大招：极限翻盘 */
  warCry(){
    if(State.warCry < 100 || !this.active) return false;
    State.warCry = 0;
    this.heroes.forEach(h=>{
      if(!h.alive) return;
      h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp*0.3));
      h.cd = 0;
    });
    this.enemies.filter(e=>e.alive).forEach(e=>{
      this.damageEnemy(e, Math.round(e.maxHp*0.15), "🔥");
    });
    this.pushLog("📣 【战吼】全队回复30%生命、技能重置，敌全体受15%最大生命伤害！");
    UI.flashWarCry();
    return true;
  },

  checkEnd(){
    const hAlive = this.heroes.some(h=>h.alive);
    const eAlive = this.enemies.some(e=>e.alive);
    if(!hAlive || !eAlive){
      this.active = false;
      clearInterval(this.timer);
      const win = eAlive === false;
      // 回写英雄血量比例（阵亡保留1点）
      this.heroes.forEach(h=>{
        h.ref._hpRatio = h.alive ? h.hp/h.maxHp : 0.05;
      });
      setTimeout(()=>{ UI.closeBattle(); if(this.onEnd) this.onEnd(win); }, 900);
    }
  },

  pushLog(t){ this.log.push(t); UI.pushBattleLog(t); },
};

/* ---- 敌人编队生成 ---- */
function genEncounter(type){
  const f = State.floor;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  if(type==="boss"){
    const b = DATA.bosses[(f-1) % DATA.bosses.length];
    return [b, pick(DATA.enemies)];
  }
  if(type==="elite") return [pick(DATA.elites), pick(DATA.enemies)];
  const n = 2 + Math.min(2, Math.floor(f/2));
  const list = [];
  for(let i=0;i<n;i++) list.push(pick(DATA.enemies));
  return list;
}