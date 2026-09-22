/* ========== 即时策略战斗 battle.js ========== */
(function(global){
"use strict";
const $=s=>document.querySelector(s);

let B=null; // 当前战斗实例

function isMagic(h){ return h.arch==="mys" || (h.arch==="cle" && /heal|buff/.test("")) || false; }

function startBattle(opts){
  const foes=opts.foes, node=opts.node, onEnd=opts.onEnd;
  const party=Game.living().map(h=>{
    const st=Game.heroStats(h);
    const boons=Game.state.boons||{};
    if(boons.atk) st.atk*=1+boons.atk;
    if(boons.spd) st.spd*=1+boons.spd;
    if(boons.crit) st.crit+=boons.crit;
    if(boons.cursed){ st.hp*=.85; st.atk*=.9; }
    const maxHp=Math.round(st.hp);
    return {
      side:"p", ref:h, name:st.name, ico:st.ico, role:st.role, arch:st.arch,
      maxHp, hp:Math.max(1,Math.round(maxHp*h.hpPct)), atk:st.atk, spd:st.spd,
      crit:st.crit, critdmg:st.critdmg, pen:st.pen, mpen:st.mpen, def:st.def,
      reduce:st.reduce, dodge:st.dodge, lifesteal:st.lifesteal, healbonus:st.healbonus,
      skillId:st.sk, magic: st.arch==="mys",
      atkT: .6+Math.random()*.5, skillT: 2+Math.random()*2, alive:true,
      buffs:{}, dots:[], shield:0, el:null
    };
  });
  const {s}=Game.scaleBase(Game.state.region,node.layer);
  const enemies=foes.map(f=>{
    const maxHp=f.hp, atk=f.atk;
    const magic= /fire|frost|drain|curse|void|blood|poison|breath|fate|chain/i.test(f.sk||"");
    const front = f.role==="先锋"||f.role==="护卫"||f.role==="boss";
    return {
      side:"e", name:f.name, ico:f.ico, role:f.role, arch:"foe",
      maxHp, hp:maxHp, atk, spd:f.spd, crit:.05, critdmg:.5,
      pen:0,mpen:0, def: f.boss? 20*s+10 : 8*s,
      reduce:0, dodge: f.role==="斥候"? .06:0, lifesteal:0, healbonus:0,
      skillId:f.sk, magic,
      atkT:.8+Math.random()*.6, skillT: 3.5+Math.random()*2, alive:true,
      buffs:{}, dots:[], shield:0, el:null,
      boss:!!f.boss, telegraph:f.telegraph, enraged:false, front, elite:f.elite
    };
  });

  B={party,enemies,node,onEnd,over:false,t:0,speed:1,auto:false,
    ult:0, target:null, timers:{}, raf:0,last:0,leader:party[0]};
  B.target = defaultTarget();
  mountStage();
  layoutUnits();
  B.last=performance.now();
  loop(B.last);
  if(enemies.some(e=>e.boss)) log(B.enemies.find(e=>e.boss).telegraph||"首领在阴影中现身。");
  return B;
}

/* ---------- 舞台 DOM ---------- */
function mountStage(){
  const root=$("#battle-root");
  const reg=D.REGIONS[Game.state.region];
  root.innerHTML=`
  <div class="battle-stage" id="bs">
    <div class="bs-bg" style="filter:hue-rotate(${Game.state.region*28}deg) brightness(${1-Game.state.region*.08})"></div>
    <div class="bs-fog"></div>
    <div class="bs-top">
      <div><div class="bs-title">${reg.name} · ${B.node.kind==="boss"?"首领战":B.node.kind==="elite"?"精英战":"遭遇战"}</div>
      <div class="bs-wave" id="bs-wave"></div></div>
      <div class="bs-controls">
        <button class="bs-btn" id="bs-speed">速度 x1</button>
        <button class="bs-btn" id="bs-auto">手动</button>
        <button class="bs-btn" id="bs-flee">撤退</button>
      </div>
    </div>
    <div class="bs-units" id="bs-units"></div>
    <div class="bs-floor"></div>
    <div id="bs-enrage"></div>
    <div class="bs-bottom">
      <div class="bs-log" id="bs-log"></div>
      <div class="bs-skills" id="bs-skills"></div>
    </div>
  </div>`;
  root.classList.add("active");
  $("#bs-speed").onclick=()=>{B.speed=B.speed===1?2:B.speed===2?3:1;$("#bs-speed").textContent="速度 x"+B.speed;};
  $("#bs-auto").onclick=()=>{B.auto=!B.auto;$("#bs-auto").textContent=B.auto?"自动":"手动";
    $("#bs-auto").style.color=B.auto?"#8ee06a":"";};
  $("#bs-flee").onclick=flee;
  // 英雄技能按钮
  const sk=$("#bs-skills");
  B.party.forEach((u,i)=>{
    const sdef=D.SKILLS[u.skillId];
    const btn=document.createElement("button");
    btn.className="sk-btn"; btn.title=u.name+" · "+sdef.n;
    btn.innerHTML=`${sdef.ico}<span class="sk-k">${u.name.slice(0,3)}</span><span class="sk-cd" style="display:none"></span>`;
    btn.onclick=()=>castSkill(i);
    u.skillBtn=btn;
    sk.appendChild(btn);
  });
  const ub=document.createElement("button");
  ub.className="bs-ult"; ub.id="bs-ult"; ub.disabled=true;
  ub.innerHTML=`战吼<i></i>`; ub.onclick=castUlt;
  sk.appendChild(ub);
}
function layoutUnits(){
  const box=$("#bs-units"); box.innerHTML="";
  // 敌方：上半区两行（前排靠下）
  const fronts=B.enemies.filter(e=>e.front||!isBack(e));
  const backs=B.enemies.filter(e=>isBack(e)&&!fronts.includes(e));
  placeRow(B.enemies, true);
  placeRow(B.party, false);
}
function isBack(e){ return e.role==="异士"||e.role==="斥候"||e.role==="支援"; }
function placeRow(units,enemy){
  const box=$("#bs-units");
  const fronts=units.filter(u=>enemy ? (!isBack(u)) : (u.role==="先锋"||u.role==="护卫"));
  const backs=units.filter(u=> !fronts.includes(u));
  const halfW=190;
  const lay=(row,top,minX)=>{
    const n=row.length;
    row.forEach((u,i)=>{
      const el=document.createElement("div");
      el.className="unit "+(enemy?"enemy":"hero");
      const x = n===1? halfW : (minX + i*( (halfW*2-70)/(n-1)) );
      el.style.left=(x-24)+"px"; el.style.top=top+"px";
      el.innerHTML=`<div class="u-body">${u.ico}<div class="u-shield"></div>
        ${u.boss?'<span class="u-bossmark">👑</span>':""}
        <span class="u-status"></span><span class="u-telegraph" style="display:none">💥</span></div>
        <div class="u-hp"><i style="width:100%"></i></div><div class="u-name">${u.name}</div>`;
      el.onclick=()=>{ if(enemy&&u.alive){B.target=u;refreshTarget();} };
      box.appendChild(el);
      u.el=el; u.posX=x; u.posY=enemy?60:230;
    });
  };
  if(enemy){
    lay(backs, 10, 40);
    lay(fronts, 90, 30);
  }else{
    lay(fronts, 230, 20);
    lay(backs, 310, 50);
  }
}
function refreshTarget(){
  [...document.querySelectorAll(".unit")].forEach(el=>el.classList.remove("targeted"));
  if(B.target&&B.target.el) B.target.el.classList.add("targeted");
}
function defaultTarget(){
  const fronts=B.enemies.filter(e=>e.alive&&!isBack(e));
  return (fronts[0]||B.enemies.find(e=>e.alive)||null);
}

/* ---------- 主循环 ---------- */
function loop(now){
  if(!B||B.over) return;
  let dt=(now-B.last)/1000; B.last=now;
  dt=Math.min(dt,.1)*B.speed; B.t+=dt;
  tickUnits(B.party,dt); tickUnits(B.enemies,dt);
  if(!B.over && B.auto) autoAct(dt);
  render();
  checkEnd();
  B.raf=requestAnimationFrame(loop);
}
let autoCd=0;
function autoAct(dt){
  autoCd-=dt;
  if(autoCd<=0){
    autoCd=.4;
    B.party.forEach((u,i)=>{ if(u.alive&&u.skillT<=0.1) castSkill(i,true); });
  }
}
function tickUnits(units,dt){
  units.forEach(u=>{
    if(!u.alive) return;
    let spd=u.spd;
    if(u.buffs.spd) spd*=1+u.buffs.spd.v;
    if(u.buffs.slow) spd*=1-u.buffs.slow.v;
    if(u.buffs.stun) spd=0;
    u.atkT-=dt*Math.max(0,spd);
    u.skillT-=dt;
    // buff 计时
    Object.entries(u.buffs).forEach(([k,b])=>{
      b.t-=dt; if(b.t<=0) delete u.buffs[k];
    });
    // dot
    for(let i=u.dots.length-1;i>=0;i--){
      const dot=u.dots[i]; dot.t-=dt; dot.tick-=dt;
      if(dot.tick<=0){ dot.tick=1;
        if(dot.kind==="hot") healUnit(dot.caster||u,u,u.maxHp*dot.v);
        else directDamage(u,{raw:u.maxHp*dot.v},null,dot.kind||"poison",true); }
      if(dot.t<=0) u.dots.splice(i,1);
    }
    // 护盾衰减（独立持续）
  });
  // 自动行动：敌人到点放技能；玩家单位仅普攻(技能手动)
  units.forEach(u=>{
    if(!u.alive||u.buffs.stun||u.casting) return;
    if(u.side==="e" && u.skillId && u.skillT<=0){
      u.skillT=(u.boss?7:8)+Math.random()*2;
      enemySkill(u);
      if(u.boss) u.casting=true;
      setTimeout(()=>{ if(u) u.casting=false; },950);
      return;
    }
    if(u.atkT<=0){ basicAttack(u); u.atkT=1.6; }
  });
}

/* ---------- 目标选择 ---------- */
function foeTargetOf(att){
  const heroes=B.party.filter(u=>u.alive);
  const taunt=heroes.find(u=>u.buffs.taunt);
  if(taunt) return taunt;
  const front=heroes.filter(u=>u.role==="先锋"||u.role==="护卫");
  const back=heroes.filter(u=>!front.includes(u));
  if(att.role==="斥候"||att.role==="异士"){
    // 优先后排脆皮 40%
    if(back.length && Math.random()<.45) return Game.pick(back);
  }
  return Game.pick(front.length?front:heroes);
}
function heroTargetOf(att){
  if(B.target&&B.target.alive){
    // 若目标是后排而对方仍有前排，先锋/护卫无法越过
    const front=B.enemies.filter(e=>e.alive&&!isBack(e));
    const canReachBack = att.role==="斥候"||att.role==="异士"||att.role==="支援"||att.arch==="mys";
    if(isBack(B.target)&&front.length&&!canReachBack) return Game.pick(front);
    return B.target;
  }
  B.target=defaultTarget(); return B.target;
}

/* ---------- 伤害 ---------- */
function dealDamage(att,vict,mult,opts){
  opts=opts||{};
  if(!vict.alive) return 0;
  if(Math.random()<vict.dodge){ float(vict,"miss","miss"); return 0; }
  let atk=att.atk*(mult||1);
  // buff
  if(att.buffs.atk) atk*=1+att.buffs.atk.v;
  if(att.buffs.dmgup) atk*=1+att.buffs.dmgup.v;
  if(vict.buffs.atkdown) atk*=1-vict.buffs.atkdown.v;
  if(att.buffs.weak) atk*=.85;
  const magic=opts.magic!==undefined?opts.magic:att.magic;
  const pen = magic? att.mpen:att.pen;
  let armor=(vict.def||0);
  if(vict.buffs.defdown) armor*=1-vict.buffs.defdown.v;
  armor=Math.max(0,armor*(1-(pen||0)));
  let dmg=atk*(1+ (Math.random()-.5)*.12) * (100/(100+armor));
  let crit=false;
  let critChance=(att.crit||0)+(att.buffs.critBuff?att.buffs.critBuff.v:0);
  if(!opts.dot && Math.random()<critChance){ dmg*=1+(att.critdmg||.5); crit=true; }
  if(vict.buffs.stun) {} 
  dmg*=1-getReduce(vict);
  // 护盾
  if(vict.shield>0){
    const absorbed=Math.min(vict.shield,dmg); vict.shield-=absorbed; dmg-=absorbed;
    if(absorbed>0) float(vict,"-"+Math.round(absorbed),"shield-f");
  }
  dmg=Math.max(1,Math.round(dmg));
  vict.hp-=dmg;
  float(vict,"-"+dmg,crit?"crit":"dmg");
  fxHit(vict, crit);
  if(att.side==="p") gainUlt(dmg/vict.maxHp*0.10);
  if(att.lifesteal>0 && dmg>0){ const heal=Math.round(dmg*att.lifesteal); healUnit(att,att,heal,true); }
  if(vict.hp<=0) kill(vict,att);
  return dmg;
}
function directDamage(vict,opts,att,kind,dot){
  let dmg=opts.raw||0;
  // DOT 无视护盾，真实侵蚀
  if(!dot && vict.shield>0){const a=Math.min(vict.shield,dmg);vict.shield-=a;dmg-=a;}
  dmg=Math.round(Math.max(1,dmg));
  vict.hp-=dmg; float(vict,"-"+dmg,"dmg"); fxHit(vict,false,kind==="burn"?"🔥":"☠️");
  if(vict.hp<=0) kill(vict,att);
}
function healUnit(cast,vict,amount,pct){
  if(!vict.alive) return;
  amount*=1+(cast.healbonus||0);
  amount=Math.round(Math.min(amount, vict.maxHp-vict.hp));
  if(amount<=0) return;
  vict.hp+=amount; float(vict,"+"+amount,"heal");
}
function shieldUnit(vict,pct){
  vict.shield=Math.max(vict.shield||0, vict.maxHp*pct);
}
function kill(u){
  u.alive=false; u.hp=0;
  if(u.el) u.el.classList.add("dead");
  if(u.side==="e"&&B.target===u){ B.target=null; }
  if(u.side==="p"&&u.buffs.taunt){}
}
function basicAttack(att){
  let tgt;
  if(att.side==="e") tgt=foeTargetOf(att);
  else tgt=heroTargetOf(att);
  if(!tgt) return;
  actAnim(att,tgt);
  dealDamage(att,tgt,1,{});
}
function actAnim(att,tgt){
  if(att.el){ att.el.classList.add("acting"); setTimeout(()=>att.el&&att.el.classList.remove("acting"),220); }
}
function gainUlt(v){ if(!B)return; B.ult=Math.min(1,B.ult+v); }

/* ---------- 技能 ---------- */
function castSkill(idx,silent){
  const u=B.party[idx];
  if(!u||!u.alive||u.skillT>0) return;
  const sdef=D.SKILLS[u.skillId];
  u.skillT=sdef.cd;
  applySkill(u,sdef);
}
function enemySkill(u){
  const sdef=D.SKILLS[u.skillId]; if(!sdef){return;}
  // BOSS 技能：先预警 0.9 秒（狂暴阶段机制提示）
  if(u.boss && u.el){
    const tel=u.el.querySelector(".u-telegraph");
    if(tel){ tel.style.display="block"; setTimeout(()=>{tel.style.display="none";},900); }
    log("⚠ "+u.name+" 正在蓄力【"+sdef.n+"】！");
    setTimeout(()=>{ if(u.alive) applySkill(u,sdef); },900);
  } else {
    applySkill(u,sdef);
  }
}
function applySkill(u,sdef){
  fxCast(u,sdef.ico);
  const side=u.side;
  const foes = side==="p"? B.enemies:B.party;
  const allies = side==="p"? B.party:B.enemies;
  const tgtPick = ()=> side==="p"? heroTargetOf(u):foeTargetOf(u);
  const hits=sdef.hit||1;
  for(let h=0;h<hits;h++){
    if(sdef.type==="dmg"){
      const t=tgtPick(); if(t) dealDamage(u,t,sdef.pow/hits*hits,{magic:u.magic});
    }else if(sdef.type==="aoe"){
      foes.filter(x=>x.alive).forEach(t=> dealDamage(u,t,sdef.pow,{magic:u.magic}));
    }
  }
  if(sdef.type==="heal"){
    const need=allies.filter(x=>x.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
    const n=Math.max(1,(sdef.hit||1));
    need.slice(0,n).forEach(t=> healUnit(u,t,t.maxHp*0.18*sdef.pow/1.8+u.atk*.6));
  }
  const e=sdef.extra;
  if(e){
    if(e.poison){ const t=sdef.type==="aoe"?foes.filter(x=>x.alive):[tgtPick()];
      t.filter(Boolean).forEach(x=>x.dots.push({v:e.poison[0],t:e.poison[1],tick:.6,kind:"poison"})); }
    if(e.burn){ const t=sdef.type==="aoe"?foes.filter(x=>x.alive):[tgtPick()];
      t.filter(Boolean).forEach(x=>x.dots.push({v:e.burn[0],t:e.burn[1],tick:.6,kind:"burn"})); }
    if(e.bleed){ const t=sdef.type==="aoe"?foes.filter(x=>x.alive):[tgtPick()];
      t.filter(Boolean).forEach(x=>x.dots.push({v:e.bleed[0],t:e.bleed[1],tick:.7,kind:"bleed"})); }
    if(e.stun){ [tgtPick()].filter(Boolean).forEach(t=>{t.buffs.stun={t:e.stun};}); }
    if(e.slow){ [tgtPick()].filter(Boolean).forEach(t=>t.buffs.slow={v:e.slow[0],t:e.slow[1]}); }
    if(e.atkdown){ foes.filter(x=>x.alive).forEach(t=>t.buffs.atkdown={v:e.atkdown,t:e.dur}); }
    if(e.defdown){ (sdef.type==="aoe"?foes.filter(x=>x.alive):[tgtPick()]).filter(Boolean)
      .forEach(t=>t.buffs.defdown={v:e.defdown,t:e.dur}); }
    if(e.lifesteal!==undefined){ /* 由伤害函数已处理普攻；技能附加 */ }
    if(e.healself) healUnit(u,u,u.maxHp*e.healself);
    if(e.shield){
      if(e.taunt){ shieldUnit(u,u.maxHp*e.shield); }
      else allies.filter(x=>x.alive).forEach(t=>shieldUnit(t,t.maxHp*e.shield));
    }
    if(e.taunt) u.buffs.taunt={t:e.taunt};
    if(e.atk) u.buffs.atk={v:e.atk,t:e.dur};
    if(e.spd) u.buffs.spd={v:e.spd,t:e.dur};
    if(e.crit) u.buffs.critBuff={v:e.crit,t:e.dur};
    if(e.dmgup) u.buffs.dmgup={v:e.dmgup,t:e.dur};
    if(e.hot){ allies.filter(x=>x.alive).forEach(t=>t.dots.push({v:e.hot[0],t:e.hot[1],tick:1,kind:"hot",caster:u})); }
    if(e.cleanse){ allies.forEach(t=>{["stun","slow","atkdown","defdown","weak"].forEach(k=>delete t.buffs[k]);}); }
  }
  // 玩家技能给少量大招能量
  if(side==="p") gainUlt(.05);
}

/* ---------- 战吼大招（由队长职业体系决定）---------- */
function castUlt(){
  if(B.ult<1||!B.leader) return;
  const u=B.leader, type=u.arch;
  fxCast(u,D.ARCH[type].ult.ico);
  log("【"+D.ARCH[type].ult.n+"】！");
  const E=B.enemies.filter(e=>e.alive), P=B.party.filter(p=>p.alive);
  if(type==="war"){
    E.forEach(t=>dealDamage(u,t,2.6,{}));
    P.filter(p=>p.role==="先锋"||p.role==="护卫").forEach(p=>p.buffs.tough={v:.25,t:6});
  }else if(type==="mys"){
    for(let i=0;i<5;i++){ const t=E[Math.floor(Math.random()*E.length)]; if(t)dealDamage(u,t,.9,{magic:true}); }
    // 引爆灼烧
    E.forEach(t=>{ const b=t.dots.find(x=>x.kind==="burn"); if(b){ directDamage(t,{raw:t.maxHp*.08},u,"burn"); } });
  }else if(type==="rng"){
    for(let k=0;k<3;k++){
      const t=B.enemies.filter(e=>e.alive).sort((a,b)=>a.hp-b.hp)[0];
      if(!t)break;
      const before=t.alive;
      const oldPen=u.pen; u.pen=Math.max(u.pen,.5);
      dealDamage(u,t,4.2,{});
      u.pen=oldPen;
      if(t.alive) break;
    }
  }else if(type==="cle"){
    P.forEach(t=>{ healUnit(u,t,t.maxHp*.35); shieldUnit(t,t.maxHp*.2);
      ["stun","slow","atkdown","defdown","weak"].forEach(k=>delete t.buffs[k]); });
  }else if(type==="nat"){
    P.forEach(t=>{ healUnit(u,t,t.maxHp*.28); t.buffs.atk={v:.3,t:8}; t.buffs.spd={v:.2,t:8}; });
  }else if(type==="mon"){
    E.forEach(t=>{ const before=t.hp; dealDamage(u,t,2.0,{magic:u.magic});
      const dealt=before-t.hp; healUnit(u,u,dealt*.5); t.buffs.weak={t:5}; });
  }
  B.ult=0;
}
function getReduce(u){ let r=u.reduce||0; if(u.buffs.tough)r+=u.buffs.tough.v; return Math.min(r,.75); }

/* ---------- 狂暴阶段 ---------- */
function checkEnrage(){
  const boss=B.enemies.find(e=>e.boss&&e.alive);
  if(boss&&!boss.enraged&&boss.hp<boss.maxHp*.45){
    boss.enraged=true;
    boss.atk*=1.45; boss.spd*=1.25;
    const el=$("#bs-enrage");
    el.innerHTML='<div class="bs-enrage">💢 '+boss.name+' 进入狂暴！立即开启护盾/减伤！</div>';
    log("⚠⚠ "+boss.name+" 进入狂暴阶段，伤害与速度暴涨！");
    setTimeout(()=>{ if($("#bs-enrage")) $("#bs-enrage").innerHTML=""; },4000);
  }
}

/* ---------- 渲染 ---------- */
function render(){
  const all=B.party.concat(B.enemies);
  all.forEach(u=>{
    if(!u.el) return;
    const pct=Math.max(0,u.hp/u.maxHp*100);
    u.el.querySelector(".u-hp i").style.width=pct+"%";
    u.el.classList.toggle("shielded",u.shield>0);
    u.el.classList.toggle("dead",!u.alive);
    // 状态图标
    const st=u.el.querySelector(".u-status");
    let icons="";
    if(u.buffs.taunt)icons+="🛡️";
    if(u.buffs.atk)icons+="💢";
    if(u.buffs.stun)icons+="💫";
    if(u.buffs.slow)icons+="🐌";
    if(u.buffs.atkdown)icons+="⬇️";
    if(u.buffs.defdown)icons+="🔻";
    if(u.enraged)icons+="🔥";
    if(u.dots.some(x=>x.kind==="burn"))icons+="🔥";
    if(u.dots.some(x=>x.kind==="poison"))icons+="☠️";
    if(u.dots.some(x=>x.kind==="bleed"))icons+="🩸";
    st.textContent=icons;
  });
  refreshTarget();
  // 技能 CD
  B.party.forEach(u=>{
    const cd=u.skillBtn.querySelector(".sk-cd");
    if(u.skillT>0&&u.alive){ cd.style.display="flex"; cd.textContent=u.skillT.toFixed(1); u.skillBtn.disabled=true; }
    else { cd.style.display="none"; u.skillBtn.disabled=false; }
  });
  const ult=$("#bs-ult");
  if(ult){ ult.style.setProperty; ult.querySelector("i").style.height=(B.ult*100)+"%"; ult.disabled=B.ult<1; }
  const wave=$("#bs-wave");
  if(wave) wave.textContent="敌方 "+B.enemies.filter(e=>e.alive).length+" / "+B.enemies.length;
}
function float(u,text,cls){
  if(!u.el)return;
  const f=document.createElement("div"); f.className="float "+cls; f.textContent=text;
  f.style.left=(14+Math.random()*16)+"px"; f.style.top="-6px";
  u.el.appendChild(f); setTimeout(()=>f.remove(),1000);
}
function fxHit(u,crit,ico){
  if(!u.el)return;
  u.el.querySelector(".u-body").classList.add("hitshake");
  setTimeout(()=>u.el&&u.el.querySelector(".u-body").classList.remove("hitshake"),250);
  if(ico){ const f=document.createElement("div"); f.className="fx"; f.textContent=ico;
    f.style.left="8px"; f.style.top="4px"; u.el.appendChild(f); setTimeout(()=>f.remove(),500); }
}
function fxCast(u,ico){
  if(!u.el)return;
  const f=document.createElement("div"); f.className="fx"; f.textContent=ico||"✦";
  f.style.left="6px"; f.style.top="-2px";
  u.el.appendChild(f); setTimeout(()=>f.remove(),500);
  actAnim(u);
}
function log(msg){
  const box=$("#bs-log"); if(!box)return;
  const div=document.createElement("div"); div.textContent=msg;
  box.prepend(div);
  while(box.children.length>3) box.lastChild.remove();
}

/* ---------- 结束 ---------- */
function checkEnd(){
  checkEnrage();
  const pAlive=B.party.some(u=>u.alive), eAlive=B.enemies.some(u=>u.alive);
  if(!pAlive) finish(false);
  else if(!eAlive) finish(true);
}
function finish(victory){
  if(B.over)return; B.over=true;
  cancelAnimationFrame(B.raf);
  // 同步英雄生命百分比
  B.party.forEach(u=>{
    u.ref.hpPct = u.alive? clamp01(u.hp/u.maxHp):0;
    u.ref.alive = u.alive;
  });
  const rewards=Game.battleRewards(B.node,victory);
  setTimeout(()=>{
    $("#battle-root").classList.remove("active");
    $("#battle-root").innerHTML="";
    B.onEnd&&B.onEnd({victory,rewards});
    B=null;
  },650);
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function flee(){
  if(!B||B.over)return;
  B.over=true; cancelAnimationFrame(B.raf);
  B.party.forEach(u=>{u.ref.hpPct=u.alive?clamp01(u.hp/u.maxHp):0;u.ref.alive=u.alive;});
  $("#battle-root").classList.remove("active"); $("#battle-root").innerHTML="";
  B.onEnd&&B.onEnd({victory:false,fled:true,rewards:{}}); B=null;
}

global.Battle={start:startBattle};
})(window);
