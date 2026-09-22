/* ================= UI 渲染 ================= */
const UI = {
  $: s => document.querySelector(s),
  $$: s => document.querySelectorAll(s),

  /* ---- 资源栏 ---- */
  renderRes(){
    const r = State.res;
    this.setRes("gold", r.gold); this.setRes("iron", r.iron);
    this.setRes("gem", r.gem); this.setRes("soul", r.soul); this.setRes("timber", r.timber);
  },
  setRes(k, v){
    const el = this.$("#res-"+k+" b");
    if(el && el.textContent != String(v)){
      el.textContent = v >= 10000 ? (v/1000).toFixed(1)+"k" : v;
      const p = el.parentElement; p.classList.remove("flash"); void p.offsetWidth; p.classList.add("flash");
    }
  },

  /* ---- 城堡 ---- */
  renderCastle(){
    for(const k in State.buildings){
      const el = this.$("#b-"+k+" .b-lv");
      if(el) el.textContent = "Lv."+State.buildings[k].lv;
    }
    const r = productionRates();
    this.$("#idle-gain-tip").textContent =
      `产出中：铁+${r.iron.toFixed(1)}/s 木+${r.timber.toFixed(1)}/s 魂+${r.soul.toFixed(1)}/s 金+${r.gold.toFixed(1)}/s`;
    this.$("#soul-lv-tip").textContent = `魂 Lv.${State.soulLv}`;
  },

  /* ---- 队伍栏 ---- */
  renderParty(){
    const box = this.$("#party-slots"); box.innerHTML = "";
    State.party.forEach((h, i)=>{
      const div = document.createElement("div");
      if(!h){
        div.className = "hero-slot empty"; div.textContent = "空位";
      } else {
        const s = heroStats(h);
        const ratio = h._hpRatio !== undefined ? h._hpRatio : 1;
        div.className = "hero-slot";
        div.innerHTML = `<div class="skill-dot"></div>
          <div class="hero-face">${h.face}</div>
          <div class="hero-name">${h.name}</div>
          <div class="hp-bar"><i style="width:${Math.round(ratio*100)}%"></i></div>
          <div class="cd-bar"><i style="width:0%"></i></div>`;
        div.onclick = ()=> {
          if(Combat.active) Combat.castSkill(i);
          else UI.openHeroDetail(i);
        };
      }
      box.appendChild(div);
    });
    this.$("#btn-war-cry").classList.toggle("hidden", !Combat.active || State.warCry<100);
  },

  /* ---- 地图 ---- */
  renderMap(){
    const area = this.$("#map-nodes"); area.innerHTML = "";
    const map = State.map; if(!map) return;
    this.$("#map-title").textContent = `${DATA.floors[(map.floor-1)%DATA.floors.length]} · 第${map.floor}层`;
    const W = area.clientWidth || 320, H = area.clientHeight || 220;
    const padX = 40, padY = 34;
    const pos = n => ({
      x: padX + n.col*( (W-padX*2)/2 ) - 26,
      y: padY + n.row*( (H-padY*2)/3 ) - 26,
    });
    // 连线
    map.nodes.forEach(n=>{
      const next = map.nodes.filter(m=>m.row===n.row+1);
      next.forEach(m=>{
        const a=pos(n), b=pos(m);
        const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy);
        const line=document.createElement("div");
        line.className="map-path";
        line.style.cssText=`left:${a.x+26}px;top:${a.y+26}px;width:${len}px;transform:rotate(${Math.atan2(dy,dx)}rad)`;
        area.appendChild(line);
      });
    });
    // 节点
    map.nodes.forEach(n=>{
      const t = DATA.nodeTypes[n.type];
      const el = document.createElement("div");
      el.className = "map-node" + (n.type==="boss"?" boss":"")
        + (n.done?" done": n.available?" available":" locked");
      el.innerHTML = `${t.icon}<small>${t.label}</small>`;
      const p = pos(n);
      el.style.left = p.x+"px"; el.style.top = p.y+"px";
      el.onclick = ()=> GameMap.enterNode(n);
      area.appendChild(el);
    });
    const bossDone = map.nodes.find(n=>n.type==="boss")?.done;
    this.$("#btn-next-floor").classList.toggle("hidden", !bossDone);
  },

  /* ---- 弹窗框架 ---- */
  openModal(title, bodyHTML, footBtns){
    this.$("#modal-title").textContent = title;
    this.$("#modal-body").innerHTML = bodyHTML;
    const foot = this.$("#modal-foot"); foot.innerHTML = "";
    (footBtns||[{t:"关闭", cls:"", fn:null}]).forEach(b=>{
      const btn = document.createElement("button");
      btn.className = "btn "+(b.cls||""); btn.textContent = b.t;
      btn.onclick = ()=>{ if(b.fn) b.fn(); if(!b.keep) UI.closeModal(); };
      foot.appendChild(btn);
    });
    this.$("#modal-mask").classList.remove("hidden");
  },
  closeModal(){ this.$("#modal-mask").classList.add("hidden"); },

  toast(msg){
    const t = document.createElement("div");
    t.className = "toast-item"; t.textContent = msg;
    this.$("#toast").appendChild(t);
    setTimeout(()=>t.remove(), 2200);
  },

  showOfflineGain(secs, g){
    const mins = Math.floor(secs/60);
    this.openModal("🌙 离线收益",
      `<p style="text-align:center;color:var(--dim)">你离开了 ${mins} 分钟，城堡持续运转…</p>
       <div class="row"><span>🪙 金币</span><b>+${g.gold}</b></div>
       <div class="row"><span>⛓️ 钢铁</span><b>+${g.iron}</b></div>
       <div class="row"><span>🪵 建材</span><b>+${g.timber}</b></div>
       <div class="row"><span>🔥 魂火</span><b>+${g.soul}</b></div>
       <div class="row"><span>✨ 灵魂经验</span><b>+${g.soulExp}</b></div>`,
      [{t:"收下", cls:"primary"}]);
  },
};/* ================= 建筑弹窗 ================= */
UI.openBuilding = function(key){
  if(key==="manor") this.openManor();
  else if(key==="tower") this.openTower();
  else if(key==="smith") this.openSmith();
  else if(key==="guild") this.openGuild();
};

function upgradeCost(key){ return CFG.buildCost(State.buildings[key].lv); }
function canUpgrade(key){
  const c = upgradeCost(key);
  return State.res.gold>=c.gold && State.res.timber>=c.timber;
}
function doUpgrade(key){
  const c = upgradeCost(key);
  State.res.gold -= c.gold; State.res.timber -= c.timber;
  State.buildings[key].lv++;
  UI.toast("升级成功！");
  UI.renderCastle(); UI.renderRes();
}

/* ---- 庄园：人口与工匠岗位分配 ---- */
UI.openManor = function(){
  const b = State.buildings.manor, p = State.population;
  const c = upgradeCost("manor");
  const r = productionRates();
  const body = `
    <p class="sub" style="margin-bottom:6px">分配人口到岗位，控制资源产出。当前总人口 ${p.total}，空闲 ${p.idle}。</p>
    <div class="row"><span>🌾 庄园工匠<br><span class="sub">产铁+${r.iron.toFixed(1)}/s 木+${r.timber.toFixed(1)}/s</span></span>
      <span class="alloc"><button data-a="manor,-1">-</button><b>${p.manor}</b><button data-a="manor,1">+</button></span></div>
    <div class="row"><span>🔮 塔楼侍僧<br><span class="sub">产魂火+${r.soul.toFixed(1)}/s 魂经验+${r.soulExp.toFixed(1)}/s</span></span>
      <span class="alloc"><button data-a="tower,-1">-</button><b>${p.tower}</b><button data-a="tower,1">+</button></span></div>
    <div class="row"><span>💤 空闲人口</span><b>${p.idle}</b></div>
    <div class="row"><span>⬆️ 升级庄园 Lv.${b.lv} → Lv.${b.lv+1}</span>
      <span class="sub">🪙${c.gold} 🪵${c.timber}</span></div>`;
  this.openModal("🏰 庄园管理", body, [
    {t:"升级", cls:"gold", keep:true, fn:()=>{ if(canUpgrade("manor")){ doUpgrade("manor"); this.openManor(); } else UI.toast("资源不足"); }},
    {t:"招募人口(50金)", cls:"primary", keep:true, fn:()=>{
      if(State.res.gold>=50){ State.res.gold-=50; p.total++; p.idle++; UI.renderRes(); this.openManor(); }
      else UI.toast("金币不足");
    }},
    {t:"关闭"},
  ]);
  this.$("#modal-body").querySelectorAll(".alloc button").forEach(btn=>{
    btn.onclick = ()=>{
      const [k,d] = btn.dataset.a.split(","); const delta = +d;
      if(delta>0 && p.idle<=0) return UI.toast("没有空闲人口");
      if(delta<0 && p[k]<=0) return;
      p[k]+=delta; p.idle-=delta;
      this.openManor();
    };
  });
};

/* ---- 招魂塔 ---- */
UI.openTower = function(){
  const b = State.buildings.tower;
  const c = upgradeCost("tower");
  const need = CFG.soulExpNeed(State.soulLv);
  const body = `
    <div class="row"><span>✨ 灵魂等级（全员共享）</span><b>Lv.${State.soulLv}</b></div>
    <div class="row"><span>经验进度</span><span>${State.soulExp}/${need}</span></div>
    <div class="row"><span>属性加成</span><span class="sub">+${Math.round((soulMult()-1)*100)}% 全属性</span></div>
    <div class="row"><span>🔥 注入魂火</span><span class="sub">10魂火 = 30经验</span></div>
    <div class="row"><span>⬆️ 升级招魂塔 Lv.${b.lv} → Lv.${b.lv+1}</span>
      <span class="sub">🪙${c.gold} 🪵${c.timber}</span></div>`;
  this.openModal("🗼 招魂塔", body, [
    {t:"注入10魂火", cls:"primary", keep:true, fn:()=>{
      if(State.res.soul>=10){ State.res.soul-=10; addSoulExp(30); UI.renderRes(); this.openTower(); }
      else UI.toast("魂火不足");
    }},
    {t:"升级", cls:"gold", keep:true, fn:()=>{ if(canUpgrade("tower")){ doUpgrade("tower"); this.openTower(); } else UI.toast("资源不足"); }},
    {t:"关闭"},
  ]);
};

/* ---- 铁匠铺：打造与回火 ---- */
UI.openSmith = function(){
  const b = State.buildings.smith;
  const c = upgradeCost("smith");
  const fneed = CFG.forgeExpNeed(State.forgeLv);
  let list = State.equips.slice(-8).reverse().map((e,i)=>{
    const qn = DATA.equipQuality[e.q].name;
    const real = Math.round(e.val * DATA.equipQuality[e.q].mult * (1+(State.forgeLv-1)*0.1));
    const owner = e.owner!=null ? "已装备" : `<button class="mini-btn" data-eq="${e.id}">装备</button>`;
    const temper = e.q<4 ? `<button class="mini-btn" data-tp="${e.id}">回火⛓️${CFG.temperCost(e.q)}</button>` : "";
    return `<div class="equip-row"><span class="q-${qn}">[${qn}] ${e.slot}·${e.attr}+${real}</span>
      <span>${owner} ${temper}</span></div>`;
  }).join("") || `<p class="sub">暂无装备，点击打造获取。</p>`;
  const body = `
    <div class="row"><span>🔨 锻造等级（装备共享）</span><b>Lv.${State.forgeLv}</b></div>
    <div class="row"><span>锻造经验</span><span>${State.forgeExp}/${fneed}</span></div>
    <div class="row"><span>打造消耗</span><span>⛓️${CFG.forgeCost}/次（铁匠铺Lv.${b.lv} 提升极品率）</span></div>
    <div style="margin:8px 0">${list}</div>
    <div class="row"><span>⬆️ 升级铁匠铺 Lv.${b.lv} → Lv.${b.lv+1}</span>
      <span class="sub">🪙${c.gold} 🪵${c.timber}</span></div>`;
  this.openModal("⚒️ 铁匠铺", body, [
    {t:"打造x1", cls:"primary", keep:true, fn:()=>this.doForge(1)},
    {t:"打造x10", cls:"gold", keep:true, fn:()=>this.doForge(10)},
    {t:"升级", keep:true, fn:()=>{ if(canUpgrade("smith")){ doUpgrade("smith"); this.openSmith(); } else UI.toast("资源不足"); }},
    {t:"关闭"},
  ]);
  this.$("#modal-body").querySelectorAll("[data-eq]").forEach(btn=>{
    btn.onclick = ()=>{
      const eq = State.equips.find(e=>e.id==btn.dataset.eq);
      const emptyIdx = State.party.findIndex(h=>h && !State.equips.some(x=>x.owner===h.uid && x.slot===eq.slot));
      if(emptyIdx<0) return UI.toast("没有可装备的英雄或部位冲突");
      eq.owner = State.party[emptyIdx].uid;
      UI.toast(`已装备给 ${State.party[emptyIdx].name}`);
      UI.renderParty(); this.openSmith();
    };
  });
  this.$("#modal-body").querySelectorAll("[data-tp]").forEach(btn=>{
    btn.onclick = ()=>{
      const eq = State.equips.find(e=>e.id==btn.dataset.tp);
      if(temperEquip(eq)){ UI.toast(`回火成功！品质提升至[${DATA.equipQuality[eq.q].name}]`); UI.renderRes(); this.openSmith(); }
      else UI.toast("钢铁不足");
    };
  });
};
UI.doForge = function(n){
  if(State.res.iron < CFG.forgeCost*n) return UI.toast("钢铁不足");
  State.res.iron -= CFG.forgeCost*n;
  let best = null;
  for(let i=0;i<n;i++){ const e = forgeEquip(); if(!best || e.q>best.q) best=e; }
  UI.toast(`打造完成！最佳：[${DATA.equipQuality[best.q].name}]${best.slot}·${best.attr}`);
  UI.renderRes(); this.openSmith();
};

/* ---- 冒险者公会：金币招募 ---- */
UI.openGuild = function(){
  const b = State.buildings.guild;
  const c = upgradeCost("guild");
  const owned = State.heroes.length;
  const body = `
    <p class="sub" style="margin-bottom:6px">所有英雄均可使用金币免费抽取。已招募 ${owned} 名英雄。</p>
    <div class="row"><span>🪙 单次招募</span><span>${CFG.recruitCost} 金币</span></div>
    <div class="row"><span>概率</span><span class="sub">SSR 3% · SR 12% · R 30% · N 55%</span></div>
    <div class="row"><span>⬆️ 升级公会 Lv.${b.lv} → Lv.${b.lv+1}</span>
      <span class="sub">🪙${c.gold} 🪵${c.timber}（提升金币产出）</span></div>`;
  this.openModal("🏚️ 冒险者公会", body, [
    {t:"招募x1", cls:"primary", keep:true, fn:()=>this.doRecruit(1)},
    {t:"招募x10", cls:"gold", keep:true, fn:()=>this.doRecruit(10)},
    {t:"升级", keep:true, fn:()=>{ if(canUpgrade("guild")){ doUpgrade("guild"); this.openGuild(); } else UI.toast("资源不足"); }},
    {t:"关闭"},
  ]);
};
UI.doRecruit = function(n){
  if(State.res.gold < CFG.recruitCost*n) return UI.toast("金币不足");
  State.res.gold -= CFG.recruitCost*n;
  const got = [];
  for(let i=0;i<n;i++){ const h = makeHero(); State.heroes.push(h); got.push(h); }
  // 自动填入空位
  got.forEach(h=>{
    const idx = State.party.findIndex(p=>!p);
    if(idx>=0) State.party[idx]=h;
  });
  UI.renderRes(); UI.renderParty();
  const cards = got.map(h=>{
    const cls = DATA.classById[h.clsId];
    return `<div class="hero-card rarity-${h.rarity}">
      <div class="face">${h.face}</div><div class="nm">${h.name}</div>
      <div class="cls">${DATA.rarity[h.rarity].name}·${cls.name}</div>
      <span class="tag">${DATA.classFamilies[cls.family].name}</span>
      <span class="tag">${DATA.roles[cls.family]}</span></div>`;
  }).join("");
  this.openModal("✨ 招募结果", `<div class="card-grid">${cards}</div>`, [{t:"收入麾下", cls:"primary"}]);
};

/* ---- 英雄详情/下阵 ---- */
UI.openHeroDetail = function(idx){
  const h = State.party[idx]; if(!h) return;
  const cls = DATA.classById[h.clsId]; const s = heroStats(h);
  const eqs = State.equips.filter(e=>e.owner===h.uid);
  const eqTxt = eqs.map(e=>`<span class="q-${DATA.equipQuality[e.q].name}">[${DATA.equipQuality[e.q].name}]${e.slot}</span>`).join(" ") || "无";
  this.openModal(`${h.face} ${h.name}`,
    `<div class="row"><span>职业</span><span>${DATA.classFamilies[cls.family].name}·${cls.name}（${DATA.roles[cls.family]}）</span></div>
     <div class="row"><span>稀有度</span><span>${DATA.rarity[h.rarity].name}</span></div>
     <div class="row"><span>生命 / 攻击</span><span>${s.hp} / ${s.atk}</span></div>
     <div class="row"><span>技能</span><span class="sub">【${h.skill.name}】${h.skill.desc}（CD ${h.skill.cd}s）</span></div>
     <div class="row"><span>装备</span><span>${eqTxt}</span></div>`,
    [{t:"移出编队", cls:"danger", fn:()=>{ State.party[idx]=null; UI.renderParty(); }},
     {t:"关闭"}]);
};/* ================= 战斗 UI ================= */
UI.renderBattle = function(){
  this.$("#battle-layer").classList.remove("hidden");
  const eb = this.$("#battle-enemies"); eb.innerHTML = "";
  Combat.enemies.forEach((e,i)=>{
    const d = document.createElement("div");
    d.className = "unit enemy"; d.id = "ue-"+i;
    d.innerHTML = `<div class="face">${e.face}</div><div class="nm">${e.name}</div>
      <div class="hp-bar"><i style="width:100%"></i></div>`;
    eb.appendChild(d);
  });
  const hb = this.$("#battle-heroes"); hb.innerHTML = "";
  Combat.heroes.forEach((h,i)=>{
    const d = document.createElement("div");
    d.className = "unit hero"; d.id = "uh-"+i;
    d.innerHTML = `<div class="face">${h.face}</div><div class="nm">${h.name}</div>
      <div class="hp-bar"><i style="width:100%"></i></div>`;
    d.onclick = ()=>Combat.castSkill(i);
    hb.appendChild(d);
  });
  this.$("#battle-log").innerHTML = "";
  this.renderParty();
};
UI.updateBattleBars = function(){
  Combat.enemies.forEach((e,i)=>{
    const el = this.$("#ue-"+i); if(!el) return;
    el.querySelector(".hp-bar i").style.width = (e.hp/e.maxHp*100)+"%";
    el.classList.toggle("dead", !e.alive);
    el.classList.toggle("enraged", Combat.enraged && Combat.isBoss);
  });
  Combat.heroes.forEach((h,i)=>{
    const el = this.$("#uh-"+i); if(!el) return;
    el.querySelector(".hp-bar i").style.width = (h.hp/h.maxHp*100)+"%";
    el.classList.toggle("dead", !h.alive);
  });
  // 底部队伍栏同步
  const slots = this.$$("#party-slots .hero-slot");
  Combat.heroes.forEach((h,i)=>{
    const s = slots[i]; if(!s) return;
    const hp = s.querySelector(".hp-bar i"); if(hp) hp.style.width = (h.hp/h.maxHp*100)+"%";
    const cd = s.querySelector(".cd-bar i");
    if(cd) cd.style.width = h.skill.cd ? (100 - h.cd/h.skill.cd*100)+"%" : "100%";
    const dot = s.querySelector(".skill-dot");
    if(dot) dot.classList.toggle("ready", h.cd<=0 && h.alive);
  });
  this.$("#btn-war-cry").classList.toggle("hidden", State.warCry<100);
};
UI.hitUnit = function(side, idx){
  const el = this.$((side==="e"?"#ue-":"#uh-")+idx);
  if(el){ el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit"); }
};
UI.floatDmg = function(side, idx, val, tag){
  const anchor = this.$((side==="e"?"#ue-":"#uh-")+idx);
  if(!anchor) return;
  const f = document.createElement("div");
  f.className = "dmg-float";
  f.style.color = String(val).startsWith("+") ? "#5cb85c" : (tag==="💥"?"#ffb84d":"#ff6b6b");
  f.textContent = (tag||"") + val;
  const r = anchor.getBoundingClientRect(), pr = this.$("#battle-field").getBoundingClientRect();
  f.style.left = (r.left - pr.left + 10 + Math.random()*20)+"px";
  f.style.top = (r.top - pr.top)+"px";
  this.$("#battle-effects").appendChild(f);
  setTimeout(()=>f.remove(), 1000);
};
UI.pushBattleLog = function(t){
  const log = this.$("#battle-log");
  const p = document.createElement("p"); p.textContent = t;
  log.appendChild(p); log.scrollTop = log.scrollHeight;
};
UI.bossWarn = function(text){
  const w = document.createElement("div");
  w.className = "boss-warn"; w.textContent = "⚠️ " + text;
  this.$("#battle-field").appendChild(w);
  setTimeout(()=>w.remove(), 3000);
};
UI.flashWarCry = function(){
  const f = this.$("#battle-field");
  f.style.boxShadow = "0 0 80px #ff9a3d inset";
  setTimeout(()=>f.style.boxShadow="", 500);
};
UI.closeBattle = function(){
  this.$("#battle-layer").classList.add("hidden");
  this.renderParty();
};

/* ================= 地图探索 ================= */
const GameMap = {
  enterNode(n){
    if(n.done || !n.available || Combat.active) return;
    const t = n.type;
    if(t==="battle" || t==="elite" || t==="boss"){
      if(!State.party.some(Boolean)) return UI.toast("编队为空！请先在公会招募英雄");
      Combat.start(genEncounter(t), {
        isBoss: t==="boss",
        onEnd: win=>{
          if(win){
            n.done = true; unlockNext(n);
            GameMap.reward(t);
            UI.renderMap();
          } else {
            UI.toast("战斗失败…英雄们撤回城堡休整");
            State.party.forEach(h=>{ if(h) h._hpRatio = Math.max(h._hpRatio||0.3, 0.3); });
            UI.renderParty();
          }
        }
      });
    } else if(t==="chest"){
      n.done = true; unlockNext(n);
      const gold = 40+State.floor*20, iron = 15+State.floor*8;
      State.res.gold+=gold; State.res.iron+=iron;
      if(Math.random()<0.3){ const eq = forgeEquip(); UI.toast(`🎁 宝箱：🪙${gold} ⛓️${iron} + [${DATA.equipQuality[eq.q].name}]装备！`); }
      else UI.toast(`🎁 宝箱：🪙${gold} ⛓️${iron}`);
      UI.renderRes(); UI.renderMap();
    } else if(t==="rest"){
      n.done = true; unlockNext(n);
      State.party.forEach(h=>{ if(h) h._hpRatio = 1; });
      UI.toast("🔥 队伍在篝火旁休整，生命完全恢复");
      UI.renderParty(); UI.renderMap();
    } else if(t==="event"){
      this.openEvent(n);
    }
  },

  reward(t){
    const f = State.floor;
    const gold = (t==="boss"?150: t==="elite"?80:30) + f*15;
    const soul = (t==="boss"?40: t==="elite"?20:8) + f*3;
    State.res.gold += gold; State.res.soul += soul;
    addSoulExp(t==="boss"?120: t==="elite"?60:25);
    if(t==="boss"){ State.res.gem += 5; UI.toast(`💀 BOSS讨伐！🪙${gold} 🔥${soul} 💎5`); }
    else UI.toast(`胜利！🪙${gold} 🔥${soul}`);
    UI.renderRes();
  },

  openEvent(n){
    const ev = DATA.events[Math.floor(Math.random()*DATA.events.length)];
    const body = `<p style="margin-bottom:8px">${ev.text}</p>` +
      ev.choices.map((c,i)=>{
        const locked = c.need && Object.entries(c.need).some(([k,v])=>State.res[k]<v);
        return `<button class="event-choice" data-i="${i}" ${locked?"disabled":""}>
          ${c.t}<span class="sub">${c.sub||""}</span></button>`;
      }).join("");
    UI.openModal("❓ "+ev.title, body, []);
    UI.$("#modal-body").querySelectorAll(".event-choice").forEach(btn=>{
      btn.onclick = ()=>{
        const c = ev.choices[+btn.dataset.i];
        if(c.need) Object.entries(c.need).forEach(([k,v])=>State.res[k]-=v);
        GameMap.applyEvent(c.effect);
        n.done = true; unlockNext(n);
        UI.closeModal(); UI.renderRes(); UI.renderMap(); UI.renderParty();
      };
    });
  },

  applyEvent(e){
    if(e.buff){ State.tempBuffs.atk = e.val; UI.toast(`💪 祝福：本层攻击+${e.val*100}%`); }
    if(e.fight){
      Combat.start(genEncounter(e.fight), { onEnd: win=>{
        if(win){ State.res.gold+=100; UI.toast("胜利！双倍奖励 🪙100"); UI.renderRes(); }
      }});
    }
    if(e.hurt){ State.party.forEach(h=>{ if(h) h._hpRatio = Math.max(0.05,(h._hpRatio??1)-e.hurt); }); UI.toast("💔 全队受伤"); }
    if(e.gamble==="iron"){
      if(Math.random()<0.5){ State.res.iron+=40; UI.toast("拆除成功！⛓️40"); }
      else { State.party.forEach(h=>{ if(h) h._hpRatio=Math.max(0.05,(h._hpRatio??1)-0.1); }); UI.toast("拆除失败，触发陷阱！"); }
    }
    if(e.soulExp){ addSoulExp(e.soulExp); UI.toast(`✨ 灵魂经验+${e.soulExp}`); }
    if(e.gainSoul){ State.res.soul+=e.gainSoul; UI.toast(`🔥 魂火+${e.gainSoul}`); }
    if(e.equip){ const eq=forgeEquip(); UI.toast(`获得[${DATA.equipQuality[eq.q].name}]${eq.slot}装备`); }
    if(e.steal){
      if(Math.random()<0.6){ State.res.iron+=e.steal; UI.toast(`偷取成功！⛓️${e.steal}`); }
      else { UI.toast("被发现了！铁匠抄起了锤子…"); Combat.start(genEncounter("elite"), {onEnd:()=>{}}); }
    }
  },

  nextFloor(){
    State.floor++;
    State.map = genMap(State.floor);
    State.tempBuffs = {};
    State.party.forEach(h=>{ if(h) h._hpRatio = Math.min(1,(h._hpRatio??1)+0.3); });
    UI.renderMap(); UI.renderParty();
    UI.toast(`进入 ${DATA.floors[(State.floor-1)%DATA.floors.length]} 第${State.floor}层`);
  },
};