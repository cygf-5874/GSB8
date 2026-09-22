/* ========== 界面 ui.js ========== */
(function(global){
"use strict";
const $=s=>document.querySelector(s);
const $c=(t,cls,html)=>{const e=document.createElement(t);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;};
function esc(s){return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

function renderRes(){
  const r=Game.state.res;
  $("#r-gold").textContent=Game.fmt(r.gold);
  $("#r-steel").textContent=Game.fmt(r.steel);
  $("#r-soulfire").textContent=Game.fmt(r.soulfire);
  $("#r-xp").textContent=Game.fmt(r.xp);
  $("#r-mat").textContent=Game.fmt(r.mat);
  $("#r-gem").textContent=Game.fmt(r.gem);
  $("#pop-used").textContent=Game.popUsed();
  $("#pop-cap").textContent=Game.popCap();
}

function renderBuildings(){
  const box=$("#buildings"); box.innerHTML="";
  D.BUILDINGS.forEach(b=>{
    const st=Game.state.bld[b.id];
    const el=$c("div","bld"+(st.w>0?" working":""));
    let rate="";
    if(b.id==="manor") rate="金 "+Game.fmt(Game.prodRate().gold)+"/s · 材 "+Game.prodRate().mat.toFixed(2);
    if(b.id==="tower") rate="魂 "+Game.prodRate().soulfire.toFixed(2)+"/s";
    if(b.id==="smith") rate="极品率 +"+((st.lv-1)*6)+"%";
    if(b.id==="guild") rate="容量 "+D.GUILD_CAP(st.lv);
    el.innerHTML=
      '<div class="bld-glow"></div>'+
      '<div class="bld-lv">Lv.'+st.lv+'</div>'+
      ((b.id==="manor"||b.id==="tower")?'<div class="bld-workers">👷'+st.w+'</div>':'')+
      '<div class="bld-icon">'+b.ico+'</div>'+
      '<div class="bld-name">'+b.name+'</div>'+
      '<div class="bld-rate">'+rate+'</div>';
    el.onclick=()=>openBuilding(b.id);
    box.appendChild(el);
  });
  $("#region-name").textContent=D.REGIONS[Game.state.region].name;
}

/* ---------- 弹窗系统 ---------- */
function modal(title, bodyHTML, footHTML, opts){
  closeModal();
  const root=$("#modal-root");
  const mask=$c("div","modal-mask");
  const m=$c("div","modal");
  m.innerHTML='<div class="modal-head"><h3>'+esc(title)+'</h3>'+
    '<button class="modal-close">✕</button></div>'+
    '<div class="modal-body"></div>'+(footHTML?'<div class="modal-foot">'+footHTML+'</div>':'');
  mask.appendChild(m); root.appendChild(mask);
  m.querySelector(".modal-body").innerHTML=bodyHTML;
  m.querySelector(".modal-close").onclick=closeModal;
  mask.onclick=e=>{ if(e.target===mask&&!(opts&&opts.sticky)) closeModal(); };
  if(opts&&opts.onOpen) opts.onOpen(m);
  return m;
}
function closeModal(){ $("#modal-root").innerHTML=""; }
function toast(msg,cls){
  const t=$c("div","toast "+(cls||""),msg);
  $("#toast-root").appendChild(t);
  setTimeout(()=>{t.style.opacity="0";t.style.transition="opacity .4s";},1600);
  setTimeout(()=>t.remove(),2100);
}
function costHTML(cost){
  const icons={gold:"🪙",steel:"🔩",soulfire:"🔮",xp:"📜",mat:"🧱",gem:"💎"};
  return Object.entries(cost||{}).map(([k,v])=>{
    const have=(Game.state.res[k]||0)>=v;
    return '<span style="color:'+(have?"":"#e0533d")+'">'+(icons[k]||k)+" "+Game.fmt(v)+"</span>";
  }).join("　");
}

/* ---------- 建筑面板 ---------- */
function openBuilding(id){
  const b=D.BUILDINGS.find(x=>x.id===id), st=Game.state.bld[id];
  let body='<p style="font-size:12px;color:#b6a892;line-height:1.7">'+esc(b.desc)+'</p>';
  if(id==="manor"||id==="tower"){
    body+=workerEditor(id);
    body+='<div class="stat-row"><span>当前产出（工匠 '+st.w+'）</span><b>'+prodLine(id)+'</b></div>';
  }
  if(id==="manor"){
    body+='<div class="stat-row"><span>人口上限（升级+2）</span><b>'+Game.popCap()+'</b></div>';
  }
  if(id==="smith"){
    body+='<div class="stat-row"><span>锻造共享等级（全部装备+5%/级）</span><b>Lv.'+Game.state.forgeLv+'</b></div>';
    body+='<div class="stat-row"><span>打造高品质概率加成</span><b style="color:#8ee06a">+'+((st.lv-1)*6)+'%</b></div>';
  }
  if(id==="guild"){
    body+='<div class="stat-row"><span>英雄容量</span><b>'+Game.state.heroes.length+' / '+D.GUILD_CAP(st.lv)+'</b></div>';
  }
  const cost=Game.buildUpgradeCost(id);
  const can=Game.canCost(cost);
  let foot;
  if(id==="smith"){
    const fc=Game.forgeCost();
    foot='<button class="btn" data-act="forge">前往打造</button>'+
      '<button class="btn primary '+(Game.canCost(fc)?"":"")+'" data-act="upforgeb">升级锻造 Lv.'+(Game.state.forgeLv+1)+'<br><span style="font-size:10px">'+costHTML(fc)+'</span></button>';
  } else if(id==="guild"){
    foot='<button class="btn" data-act="guild">前往招募</button>'+
      '<button class="btn primary" data-act="up">升级至 Lv.'+(st.lv+1)+'<br><span style="font-size:10px">'+costHTML(cost)+'</span></button>';
  } else {
    foot='<button class="btn primary" data-act="up">升级至 Lv.'+(st.lv+1)+'<br><span style="font-size:10px">'+costHTML(cost)+'</span></button>';
  }
  const m=modal(b.ico+" "+b.name+"  Lv."+st.lv, body, foot);
  m.querySelectorAll("[data-act]").forEach(btn=>btn.onclick=()=>{
    const act=btn.dataset.act;
    if(act==="up"){ const r=Game.upgradeBld(id); r.ok?(toast("升级成功！","good"),closeModal(),renderAll()):toast(r.err,"bad"); }
    if(act==="upforgeb"){ const r=Game.upgradeForge(); r.ok?(toast("锻造等级提升！","good"),closeModal(),renderAll()):toast(r.err,"bad"); }
    if(act==="forge"){ closeModal(); openSmith(); }
    if(act==="guild"){ closeModal(); openGuild(); }
  });
}
function prodLine(id){
  const r=Game.prodRate();
  if(id==="manor") return "🪙"+r.gold.toFixed(2)+" 📜"+r.xp.toFixed(2)+" 🧱"+r.mat.toFixed(2)+" /s";
  return "🔮"+r.soulfire.toFixed(2)+" 💎"+r.gem.toFixed(3)+" /s";
}
function workerEditor(id){
  const st=Game.state.bld[id];
  const other=id==="manor"?Game.state.bld.tower.w:Game.state.bld.manor.w;
  const max=Game.popCap()-other;
  let h='<div class="worker-row"><span class="wname">👷 工匠</span><div class="wstepper">'+
    '<button data-w="-1">−</button><div class="wval">'+st.w+' / '+max+'</div><button data-w="1">＋</button></div></div>';
  setTimeout(()=>{
    const m=document.querySelector(".modal"); if(!m)return;
    m.querySelectorAll("[data-w]").forEach(bt=>bt.onclick=()=>{
      Game.setWorkers(id, st.w+ +bt.dataset.w); renderAll(); openBuilding(id);
    });
  },0);
  return h;
}

/* ---------- 冒险者公会：招募 ---------- */
function openGuild(){
  const st=Game.state.bld.guild;
  const cap=D.GUILD_CAP(st.lv), n=Game.state.heroes.length;
  let body='<div class="gacha-box">'+
    '<button class="btn primary" id="g1">单抽<br><span style="font-size:10px">🪙'+D.GACHA.cost+'</span></button>'+
    '<button class="btn good" id="g10">十连抽<br><span style="font-size:10px">🪙'+D.GACHA.cost10+'（9折）</span></button>'+
    '</div>'+
    '<div class="rates">英雄容量 '+n+' / '+cap+' · 所有英雄仅用金币抽取<br>'+
    '概率：普通60% / 稀有28% / 史诗10% / 传说1.9% / 神话0.1%（公会升级略提升）</div>'+
    '<div class="tabs"><div class="tab active" data-t="roster">英雄名册 ('+n+')</div>'+
    '<div class="tab" data-t="soul">灵魂等级 Lv.'+Game.state.soulLv+'</div></div>'+
    '<div id="g-tab"></div>';
  const m=modal("🍺 冒险者公会",body,'<button class="btn" data-c="1">关闭</button>');
  m.querySelector("[data-c]").onclick=closeModal;
  m.querySelector("#g1").onclick=()=>doGacha(1);
  m.querySelector("#g10").onclick=()=>doGacha(10);
  let cur="roster";
  const tabBox=m.querySelector("#g-tab");
  const showRoster=()=> tabBox.innerHTML=rosterHTML();
  const showTab=t=>{cur=t;m.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.t===t));
    if(t==="roster"){tabBox.innerHTML=rosterHTML();bindRoster(tabBox);}
    else tabBox.innerHTML=soulHTML();
  };
  m.querySelectorAll(".tab").forEach(t=>t.onclick=()=>showTab(t.dataset.t));
  showRoster();
}
function soulHTML(){
  const c=Game.soulCost();
  return '<div style="text-align:center;padding:8px">'+
    '<div style="font-size:44px">🌟</div>'+
    '<p style="font-size:12.5px;line-height:1.8;color:#b6a892">灵魂等级由<b style="color:#c9a45c">全部英雄共享</b>。<br>'+
    '提升后所有英雄的生命与攻击同步成长，无需重复练级。</p>'+
    '<div class="stat-row"><span>当前灵魂等级</span><b>Lv.'+Game.state.soulLv+'</b></div>'+
    '<div class="stat-row"><span>升级消耗</span><b>'+costHTML(c)+'</b></div>'+
    '<button class="btn primary" style="width:100%;margin-top:10px" id="soulup">提升灵魂等级</button></div>';
}
function rosterHTML(){
  const hs=Game.state.heroes.slice().sort((a,b)=>b.r-a.r||Game.heroPower(b)-Game.heroPower(a));
  if(!hs.length) return '<div class="empty-hint">暂无英雄，先去招募吧</div>';
  return hs.map(h=>{
    const c=Game.classDef(h.cid), s=Game.heroStats(h), inP=Game.state.party.includes(h.id);
    return '<div class="hero-card '+(inP?"in-party":"")+(h.alive?"":" dead")+'" data-h="'+h.id+'">'+
      '<div class="avatar r'+h.r+'">'+c[5]+'</div>'+
      '<div class="hc-info"><div class="hc-name"><span class="star" style="color:'+D.RARITY_COLOR[h.r]+'">'+D.RARITY_STARS[h.r]+'</span> '+
      esc(c[1])+(h.awaken?(" +"+h.awaken):"")+'</div>'+
      '<div class="hc-sub"><span class="r-'+c[3]+'">'+c[3]+'</span> · '+D.ARCH[c[2]].name+(inP?' · <b style="color:#c9a45c">编队中</b>':'')+' · 战力 '+Game.heroPower(h)+'</div>'+
      '<div class="hc-stats">❤'+Math.round(h.alive?s.hp*(h.hpPct):0)+'/'+Math.round(s.hp)+' ⚔'+Math.round(s.atk)+
      ' 暴击'+Math.round(s.crit*100)+'%'+(s.pen>0?" 物穿"+Math.round(s.pen*100)+"%":"")+(s.mpen>0?" 法穿"+Math.round(s.mpen*100)+"%":"")+'</div></div></div>';
  }).join("");
}
function bindRoster(box){
  box.querySelectorAll("[data-h]").forEach(el=>el.onclick=()=>openHero(el.dataset.h));
  const sup=document.getElementById("soulup");
  if(sup) sup.onclick=()=>{const r=Game.upgradeSoul();
    if(!r.ok){toast(r.err,"bad");} else {toast("灵魂等级提升至 Lv."+Game.state.soulLv,"good");openGuild();
      document.querySelectorAll(".tab").forEach(x=>{});
      const tabs=document.querySelectorAll(".modal .tab"); tabs[1]&&tabs[1].click();}
    renderAll();};
}
function doGacha(n){
  const r=Game.gacha(n);
  if(r.err){toast(r.err,"bad");return;}
  renderAll();
  revealGacha(r.got,()=>{ openGuild(); });
}
function revealGacha(list,cb){
  let i=0;
  const show=()=>{
    if(i>=list.length){closeModal();cb&&cb();return;}
    const h=list[i], c=Game.classDef(h.cid);
    const m=modal("招募结果",
      '<div class="reveal-card"><div class="avatar r'+h.r+'">'+c[5]+'</div>'+
      '<div style="color:'+D.RARITY_COLOR[h.r]+';font-size:16px;font-weight:bold">'+esc(c[1])+'</div>'+
      '<div class="hc-sub"><span class="r-'+c[3]+'">'+c[3]+'</span> · '+D.ARCH[c[2]].name+' · '+D.RARITY_NAME[h.r]+'</div>'+
      '<div style="margin-top:8px;font-size:11px;color:#8d7d68">'+D.SKILLS[c[6]].n+' · 战力 '+Game.heroPower(h)+'</div>'+
      '</div>',
      (i<list.length-1?'<button class="btn" id="skip">跳过</button>':'')+'<button class="btn primary" id="next">'+(i<list.length-1?"下一个":"收下")+'</button>');
    m.querySelector("#next").onclick=()=>{i++;show();};
    const sk=m.querySelector("#skip"); if(sk)sk.onclick=()=>{i=list.length;show();};
  };
  show();
}

/* ---------- 英雄详情：编队 / 装备 / 觉醒 / 遣散 ---------- */
function openHero(id){
  const h=Game.state.heroes.find(x=>x.id===id); if(!h)return;
  const c=Game.classDef(h.cid), s=Game.heroStats(h), sk=D.SKILLS[c[6]];
  const inP=Game.state.party.indexOf(h.id);
  let body='<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">'+
    '<div class="avatar r'+h.r+'" style="width:60px;height:60px;font-size:34px">'+c[5]+'</div>'+
    '<div><div style="font-size:16px;color:'+D.RARITY_COLOR[h.r]+'">'+D.RARITY_STARS[h.r]+' '+esc(c[1])+' +'+h.awaken+'</div>'+
    '<div class="hc-sub"><span class="r-'+c[3]+'">'+c[3]+'</span> · '+D.ARCH[c[2]].name+' · 共享等级 Lv.'+Game.state.soulLv+'</div>'+
    '<div class="hc-sub">战力 <b style="color:#c9a45c">'+Game.heroPower(h)+'</b></div></div></div>';
  if(!h.alive) body+='<div style="color:#e0533d;text-align:center;padding:4px">已倒下（招魂塔/休整可恢复）</div>';
  body+='<div class="stat-row"><span>生命</span><b>'+Math.round(s.hp)+'</b></div>'+
    '<div class="stat-row"><span>攻击</span><b>'+Math.round(s.atk)+'</b></div>'+
    '<div class="stat-row"><span>攻速</span><b>'+s.spd.toFixed(2)+'</b></div>'+
    '<div class="stat-row"><span>暴击 / 暴伤</span><b>'+Math.round(s.crit*100)+'% / '+Math.round(s.critdmg*100)+'%</b></div>'+
    '<div class="stat-row"><span>物穿 / 法穿</span><b>'+Math.round(s.pen*100)+'% / '+Math.round(s.mpen*100)+'%</b></div>'+
    '<div class="stat-row"><span>护甲 / 减伤 / 闪避</span><b>'+Math.round(s.def)+' / '+Math.round(s.reduce*100)+'% / '+Math.round(s.dodge*100)+'%</b></div>'+
    '<div class="stat-row"><span>技能</span><b>'+sk.ico+' '+sk.n+' (CD '+sk.cd+'s)</b></div>'+
    '<div style="font-size:10.5px;color:#8d7d68;line-height:1.6;margin:4px 0 8px">'+skillDesc(sk)+'</div>';
  body+='<h4 style="color:#c9a45c;font-size:12px;margin:6px 0">装备（锻造等级 Lv.'+Game.state.forgeLv+' 全局加成）</h4>';
  body+='<div class="slot-grid">';
  [1,2,3].forEach(slot=>{
    const it=h.equip[slot];
    if(it){
      body+='<div class="eq-slot filled"><b class="q'+it.q+'" style="color:'+["","#b8b8b8","#4a90d9","#9b59b6","#e8a33d","#e0533d","#ff5bd0"][it.q]+'">'+it.ico+' '+esc(Game.itemName(it))+'</b><br><span style="font-size:10px">'+affText(it)+'</span></div>';
    } else body+='<div class="eq-slot">'+D.ITEM_SLOTS[slot]+'<br>（未装备）</div>';
  });
  body+='</div>';
  const foot=(inP>=0
      ?'<button class="btn bad" id="leave">移出编队</button>'
      :'<button class="btn good" id="join">加入编队</button>')+
    '<button class="btn" id="bag">背包</button>'+
    '<button class="btn" id="awake">觉醒</button>'+
    '<button class="btn" id="fire">遣散</button>';
  const m=modal("英雄详情",body,foot);
  m.querySelector("#join")&&(m.querySelector("#join").onclick=()=>{
    const empty=Game.state.party.findIndex(x=>!x);
    if(empty<0){toast("编队已满（4人）","bad");return;}
    if(!h.alive){toast("倒下的英雄不能出战","bad");return;}
    Game.state.party[empty]=h.id; Game.save(); closeModal(); renderAll(); toast("已加入编队","good");
  });
  m.querySelector("#leave")&&(m.querySelector("#leave").onclick=()=>{
    Game.state.party[inP]=null; Game.save(); closeModal(); renderAll();
  });
  m.querySelector("#bag").onclick=()=>openBag(h);
  m.querySelector("#awake").onclick=()=>{
    const r=Game.awakenHero(h); if(r.err){toast(r.err,"bad");} else {closeModal();openHero(id);renderAll();toast("觉醒成功，全属性提升","good");}
  };
  m.querySelector("#fire").onclick=()=>{
    confirmBox("遣散 "+c[1]+"？", "将返还少量金币，装备自动回到背包。", ()=>{
      Game.dismissHero(h); closeModal(); renderAll(); toast("英雄已遣散");
    });
  };
}
function skillDesc(sk){
  const map={dmg:"造成 "+Math.round(sk.pow*100)+"% 攻击伤害",aoe:"对全体造成 "+Math.round(sk.pow*100)+"% 伤害",
    heal:"治疗最虚弱的友军",buff:"增益/防护技能"};
  let s=sk.ico+" "+sk.n+"："+(map[sk.type]||"特殊技能");
  if(sk.pen)s+="，穿透+"+Math.round(sk.pen*100)+"%";
  if(sk.hit)s+="，连击×"+sk.hit;
  return s+"。";
}
function affText(it){
  const mult=(D.QUALITY_MULT[it.q]||1)*(1+(Game.state.forgeLv-1)*0.05);
  return it.aff.map(a=>{
    const names={atk:"攻击",hp:"生命",pen:"物穿",mpen:"法穿",crit:"暴击",critdmg:"暴伤",def:"护甲",spd:"攻速",lifesteal:"吸血",dodge:"闪避",reduce:"减伤",heal:"治疗强化"};
    const v=a.v*mult*(a.main?1:.6);
    return (a.k==="atk"||a.k==="hp"||a.k==="def"?"+"+Math.round(v*100* (a.k==="def"?60:1) )+"%":"+"+Math.round(v*100)+"%")+names[a.k];
  }).join("，");
}
function confirmBox(t,d,yes){
  const m=modal(t,'<p style="font-size:12.5px;line-height:1.8;text-align:center;padding:10px">'+esc(d)+'</p>',
    '<button class="btn" id="no">取消</button><button class="btn bad" id="yes">确认</button>');
  m.querySelector("#no").onclick=closeModal;
  m.querySelector("#yes").onclick=()=>{closeModal();yes();};
}

/* ---------- 背包 / 装备操作 ---------- */
function openBag(forHero){
  let body='';
  if(forHero) body+='<div style="font-size:11px;color:#8d7d68;margin-bottom:6px">为 <b style="color:#c9a45c">'+Game.classDef(forHero.cid)[1]+'</b> 选择装备（点击穿戴）</div>';
  const inv=Game.state.inv.slice().sort((a,b)=>b.q-a.q||Game.itemPower(b)-Game.itemPower(a));
  if(!inv.length) body+='<div class="empty-hint">背包装备为空<br>去铁匠铺打造装备吧</div>';
  body+=inv.map(it=>{
    const qc=["","#b8b8b8","#4a90d9","#9b59b6","#e8a33d","#e0533d","#ff5bd0"][it.q];
    const locked=forHero&&it.slot!==undefined;
    let can=true;
    return '<div class="item-card" data-i="'+it.id+'">'+
      '<div class="it-ico q'+it.q+'" style="border-color:'+qc+'">'+it.ico+'</div>'+
      '<div class="hc-info"><div class="hc-name" style="color:'+qc+'">'+esc(Game.itemName(it))+'</div>'+
      '<div class="hc-sub">'+D.ITEM_SLOTS[it.slot]+' · 评分 '+Game.itemPower(it)+'</div>'+
      '<div class="hc-stats">'+affText(it)+'</div></div></div>';
  }).join("");
  const m=modal("🎒 装备背包（"+inv.length+"/200）",body,
    '<button class="btn" id="sort">按品质排序</button><button class="btn primary" data-c="1">关闭</button>');
  m.querySelector("[data-c]").onclick=()=>{closeModal();if(forHero)openHero(forHero.id);};
  m.querySelectorAll("[data-i]").forEach(el=>el.onclick=()=>{
    const it=Game.state.inv.find(x=>x.id===el.dataset.i);
    if(forHero){
      if(!forHero){return;}
      Game.equipItem(forHero,it); renderAll(); closeModal(); openBag(forHero); toast("已装备","good");
    } else openItem(it);
  });
}
function openItem(it){
  const qc=["","#b8b8b8","#4a90d9","#9b59b6","#e8a33d","#e0533d","#ff5bd0"][it.q];
  let wearers=Game.state.heroes.filter(h=>h.alive);
  let body='<div style="text-align:center;margin-bottom:8px"><div class="it-ico q'+it.q+'" style="width:64px;height:64px;font-size:34px;margin:0 auto;border-color:'+qc+'">'+it.ico+'</div>'+
    '<div style="color:'+qc+';font-size:15px;margin-top:6px">'+esc(Game.itemName(it))+'</div>'+
    '<div class="hc-sub">'+D.ITEM_SLOTS[it.slot]+' · 评分 '+Game.itemPower(it)+'</div></div>'+
    '<div style="font-size:11.5px;line-height:1.9">'+affText(it)+'</div>';
  if(it.q<6){
    const steel=Math.round(D.TEMPER_COST[it.q+1]*(it.slot===1?1:0.7));
    body+='<div class="stat-row" style="margin-top:8px"><span>回火升至 '+D.QUALITY[it.q+1]+'</span><b>🔩'+steel+' 🧱'+(5*it.q)+'</b></div>';
  } else body+='<div style="text-align:center;color:#ff5bd0;margin-top:8px">已回火至极限·黯蚀</div>';
  body+='<h4 style="color:#c9a45c;font-size:12px;margin:10px 0 4px">装备给</h4>';
  body+=wearers.map(h=>{const c=Game.classDef(h.cid);
    return '<div class="hero-card" data-w="'+h.id+'"><div class="avatar r'+h.r+'">'+c[5]+'</div>'+
      '<div class="hc-info"><div class="hc-name">'+esc(c[1])+'</div><div class="hc-sub">'+c[3]+' · 战力'+Game.heroPower(h)+'</div></div></div>';
  }).join("");
  const foot=(it.q<6?'<button class="btn good" id="temper">🔥 回火</button>':"")+
    '<button class="btn bad" id="sell">熔毁 +🔩'+Math.round(20*it.q)+'</button><button class="btn" data-c="1">关闭</button>';
  const m=modal("装备详情",body,foot);
  m.querySelector("[data-c]").onclick=closeModal;
  m.querySelectorAll("[data-w]").forEach(el=>el.onclick=()=>{
    const h=Game.state.heroes.find(x=>x.id===el.dataset.w);
    Game.equipItem(h,it); renderAll(); closeModal(); toast("已装备给 "+Game.classDef(h.cid)[1],"good");
  });
  const tb=m.querySelector("#temper");
  if(tb) tb.onclick=()=>{ const r=Game.temper(it); if(r.err){toast(r.err,"bad");} else {closeModal();renderAll();
    const n2=Game.state.inv.find(x=>x.id===it.id); if(n2)openItem(n2); toast("回火成功，品质提升！","good");} };
  m.querySelector("#sell").onclick=()=>{
    Game.state.inv=Game.state.inv.filter(x=>x.id!==it.id);
    Game.gain({steel:20*it.q}); Game.save(); closeModal(); renderAll(); toast("熔毁获得钢铁","good");
  };
}

/* ---------- 铁匠铺 ---------- */
function openSmith(){
  const lv=Game.state.bld.smith.lv;
  let body='<div class="stat-row"><span>铁匠铺等级</span><b>Lv.'+lv+'（极品率 +'+((lv-1)*6)+'%）</b></div>'+
    '<div class="stat-row"><span>锻造共享等级</span><b>Lv.'+Game.state.forgeLv+'（装备属性 +'+((Game.state.forgeLv-1)*5)+'%）</b></div>'+
    '<p style="font-size:11px;color:#8d7d68;line-height:1.7;margin:8px 0">武器必定携带 <b style="color:#8fd0ff">物穿</b> 或 <b style="color:#b18cff">法穿</b> 主词条，优先堆叠穿透可显著提升输出。</p>'+
    '<div class="tabs"><div class="tab active" data-t="craft">打造</div><div class="tab" data-t="inv">库存 ('+Game.state.inv.length+')</div></div>'+
    '<div id="s-tab"></div>';
  const m=modal("⚒️ 铁匠铺",body,'<button class="btn" data-c="1">关闭</button>');
  m.querySelector("[data-c]").onclick=closeModal;
  const tab=m.querySelector("#s-tab");
  const craftHTML=()=>{
    const probs=[.50,.28,.14,.065,.014,.001];
    const up=(lv-1)*D.CRAFT_QUP;
    return '<div class="gacha-box">'+
      '<button class="btn primary" id="c1">打造 1 件<br><span style="font-size:10px">🔩'+D.CRAFT_COST+'</span></button>'+
      '<button class="btn good" id="c10">打造 10 件<br><span style="font-size:10px">🔩'+(D.CRAFT_COST*10)+'</span></button></div>'+
      '<div class="rates">武器 55% / 护甲 27% / 饰品 18%<br>'+
      '回火可将低品质装备逐级提升为高品质</div>';
  };
  const invHTML=()=>{
    const inv=Game.state.inv.slice().sort((a,b)=>b.q-a.q||Game.itemPower(b)-Game.itemPower(a));
    if(!inv.length)return '<div class="empty-hint">还没有装备</div>';
    return inv.map(it=>'<div class="item-card" data-i="'+it.id+'">'+
      '<div class="it-ico q'+it.q+'">'+it.ico+'</div>'+
      '<div class="hc-info"><div class="hc-name q-'+["common","rare","rare","epic","legend","myth","ruin"][it.q-1]+'">'+esc(Game.itemName(it))+'</div>'+
      '<div class="hc-sub">'+D.ITEM_SLOTS[it.slot]+' · 评分 '+Game.itemPower(it)+'</div>'+
      '<div class="hc-stats">'+affText(it)+'</div></div></div>').join("");
  };
  const bind=()=>{
    tab.querySelectorAll("[data-i]").forEach(el=>el.onclick=()=>{
      const it=Game.state.inv.find(x=>x.id===el.dataset.i); closeModal(); openItem(it);
    });
    const c1=tab.querySelector("#c1"), c10=tab.querySelector("#c10");
    if(c1)c1.onclick=()=>{const r=Game.craft(1); if(r.err)toast(r.err,"bad"); else {renderAll();toast("打造完成："+Game.itemName(r.made[0]),"good");openSmith();m.querySelectorAll(".tab")[1].click();}};
    if(c10)c10.onclick=()=>{const r=Game.craft(10); if(r.err)toast(r.err,"bad"); else {renderAll();
      const best=r.made.slice().sort((a,b)=>b.q-a.q)[0];
      toast("打造完成，最佳："+Game.itemName(best),"good");openSmith();m.querySelectorAll(".tab")[1].click();}};
  };
  const switchT=t=>{m.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.t===t));
    tab.innerHTML=t==="craft"?craftHTML():invHTML();bind();};
  m.querySelectorAll(".tab").forEach(t=>t.onclick=()=>switchT(t.dataset.t));
  switchT("craft");
}

/* ---------- 冒险地图 ---------- */
const NODE_ICO={battle:"⚔️",elite:"👹",event:"❔",treasure:"🧰",rest:"🔥",boss:"💀"};
const NODE_TAG={battle:"战斗",elite:"精英",event:"事件",treasure:"宝藏",rest:"篝火",boss:"首领"};
function renderMap(){
  const map=Game.state.map, wrap=$("#map");
  if(!map){wrap.innerHTML='<div class="empty-hint">尚未开始探索</div>';return;}
  let html='';
  map.nodes.forEach((n,i)=>{
    let cls="node";
    if(n.done)cls+=" done";
    else if(i===map.layer)cls+=" current";
    else cls+=" locked";
    if(n.kind==="boss")cls+=" boss";
    if(n.shift<0)cls+=" shiftL"; if(n.shift>0)cls+=" shiftR";
    html+='<div class="'+cls+'" data-n="'+i+'">'+NODE_ICO[n.kind]+
      '<span class="node-tag">'+NODE_TAG[n.kind]+'</span></div>';
  });
  wrap.innerHTML=html+'<div style="height:30px"></div>';
  wrap.querySelectorAll("[data-n]").forEach(el=>{
    el.onclick=()=>{
      const idx=+el.dataset.n;
      if(idx!==map.layer){toast("需要沿路径逐步前进");return;}
      enterNode(map.nodes[idx]);
    };
  });
  setTimeout(()=>{const cur=wrap.querySelector(".node.current"); if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:"center"});},30);
}
function enterNode(node){
  if(Game.living().length===0){toast("没有可出战的英雄，先复活或编队","bad");return;}
  if(node.kind==="battle"||node.kind==="elite"||node.kind==="boss"){
    startMapBattle(node);
  }else if(node.kind==="event"){
    openEvent(node);
  }else if(node.kind==="treasure"){
    const r=Game.rewardTreasure(1.2);
    rewardModal("🧰 宝藏",r,node);
  }else if(node.kind==="rest"){
    Game.restNode();
    const boons=Object.keys(Game.state.boons).filter(k=>typeof Game.state.boons[k]==="number").length;
    simpleModal("🔥 篝火休整","队伍在篝火旁包扎喘息，恢复 <b style='color:#8ee06a'>35%</b> 生命，疲劳与诅咒消散。",()=>{
      Game.completeNode(); renderAll();
    });
  }
}
function startMapBattle(node){
  const foes=Game.realizeFoes(node);
  closeModal();
  Battle.start({foes,node,onEnd:res=>{
    renderAll();
    if(res.fled){ toast("你撤回了城堡"); return; }
    if(res.victory){
      battleResultModal(node,res.rewards);
    }else{
      defeatModal(node);
    }
  }});
}
function rewardLine(r){
  const ic={gold:"🪙",xp:"📜",steel:"🔩",mat:"🧱",soulfire:"🔮",gem:"💎"};
  return Object.entries(r).filter(([k])=>k!=="item").map(([k,v])=>ic[k]+" "+Game.fmt(v)).join("　");
}
function battleResultModal(node,r){
  let body='<div class="ev-art">🏆</div><div style="text-align:center;font-size:13px;margin-bottom:8px">'+
    (node.kind==="boss"?"首领被击溃，它的宝藏散落一地！":"胜利！战利品如下：")+'</div>'+
    '<div style="text-align:center;font-size:12.5px;line-height:2;color:#c9a45c">'+rewardLine(r)+'</div>';
  if(r.item){const it=r.item;
    body+='<div class="item-card" style="margin-top:10px"><div class="it-ico q'+it.q+'">'+it.ico+'</div>'+
      '<div class="hc-info"><div class="hc-name">'+esc(Game.itemName(it))+'</div>'+
      '<div class="hc-stats">'+affText(it)+'</div></div></div>';}
  const isBoss=node.kind==="boss";
  simpleModalRaw(isBoss?"首领讨伐成功":"战斗胜利",body,()=>{
    Game.completeNode();
    afterNode(isBoss);
  },"继续前进");
}
function afterNode(isBoss){
  renderAll();
  const map=Game.state.map;
  if(map.finished){
    regionClearModal(Game.state.region);
  }
}
function defeatModal(node){
  const canRev=Game.state.res.soulfire>=10;
  let body='<div class="ev-art">💀</div><p style="text-align:center;font-size:12.5px;line-height:1.8">队伍倒下了……<br>'+
    '英雄将以残血状态留在城堡，可使用 <b style="color:#b18cff">魂火</b> 立刻复活，或等待休整恢复。</p>'+
    '<div style="text-align:center;margin-top:8px"><button class="btn '+(canRev?"primary":"")+'" id="rev">🔮 消耗魂火复活全部（10/人）</button></div>';
  const m=modal("小队覆灭",body,'<button class="btn" id="back">返回城堡</button>');
  m.querySelector("#back").onclick=()=>{closeModal();Game.save();renderAll();};
  const rv=m.querySelector("#rev"); rv.onclick=()=>{const r=Game.reviveAll(); if(r.ok){toast("英雄已复活（50%生命）","good");closeModal();renderAll();}else toast(r.err,"bad");};
}

/* ---------- 随机事件 ---------- */
function openEvent(node){
  const ev=Game.eventDef(node.ev);
  let choices=ev.c.map((c,i)=>{
    let cost=c.cost?(' <span style="color:#8d7d68">['+costT(c.cost)+']</span>'):"";
    return '<button class="choice" data-i="'+i+'">'+esc(c.x)+cost+'</button>';
  }).join("");
  const m=modal("❔ "+ev.t,
    '<div class="ev-art">'+ev.art+'</div><div class="ev-desc">'+esc(ev.d)+'</div>'+
    '<div class="event-choices">'+choices+'</div>');
  m.querySelectorAll(".choice").forEach(bt=>bt.onclick=()=>{
    const ci=+bt.dataset.i;
    // 特殊：战斗
    if(ev.c[ci].a==="ambushFight"){
      const elite={kind:"elite",layer:node.layer,foes:Game.makeFoes(Game.state.region,"elite")};
      closeModal();
      Battle.start({foes:Game.realizeFoes(elite),node:elite,onEnd:res=>{
        renderAll();
        if(res.victory){
          // 劫匪战：展示奖励，确认后只推进一次事件节点
          let body='<div class="ev-art">🪙</div><div style="text-align:center;font-size:12.5px;line-height:2;color:#c9a45c">'+rewardLine(res.rewards)+'</div>';
          if(res.rewards.item){const it=res.rewards.item;body+='<div class="item-card"><div class="it-ico q'+it.q+'">'+it.ico+'</div><div class="hc-info"><div class="hc-name">'+esc(Game.itemName(it))+'</div><div class="hc-stats">'+affText(it)+'</div></div></div>';}
          simpleModalRaw("击退劫匪！",body,()=>{Game.completeNode();afterNode(false);renderAll();},"继续");
        } else defeatModal(elite);
      }});
      return;
    }
    const r=Game.applyEvent(ev.id,ci);
    if(r.err){toast(r.err,"bad");return;}
    closeModal();
    simpleModalRaw(ev.t,'<div class="ev-art">'+ev.art+'</div><div class="ev-desc">'+esc(r.log||"……")+'</div>',
      ()=>{ Game.completeNode(); afterNode(false); renderAll(); });
  });
}
function costT(c){
  const ic={gold:"🪙",steel:"🔩",soulfire:"🔮",gem:"💎",hp:"❤15%"};
  return Object.entries(c).map(([k,v])=>ic[k]?ic[k]+" "+(ic[k].indexOf("%")>0?"":v):k+v).join(" ");
}

/* ---------- 区域完成 / 大陆地图 ---------- */
function regionClearModal(idx){
  const r=D.REGIONS[idx];
  const next=D.REGIONS[idx+1];
  let body='<div class="ev-art">'+r.ico+'</div><p style="text-align:center;font-size:13px;line-height:1.8">'+
    '你征服了 <b style="color:#c9a45c">'+r.name+'</b>！<br>阴影退散，但大陆深处仍有低语传来……</p>';
  if(next){
    const need=D.REGION_REQ[idx+1];
    const locked=Game.state.bossKills<need;
    body+='<div style="text-align:center;margin-top:10px;font-size:12px">下一区域：<b>'+next.ico+' '+next.name+'</b>'+
      (locked?'<br><span style="color:#e0533d">需累计击败 '+need+' 名首领（当前 '+Game.state.bossKills+'）</span>':'<br><span style="color:#8ee06a">已解锁！</span>')+'</div>';
  } else body+='<div style="text-align:center;color:#ff5bd0;margin-top:10px">你已踏足当前大陆的尽头，深渊仍在凝视……（继续刷取更强装备吧）</div>';
  const m=modal("区域征服",body,'<button class="btn" id="map2">大陆地图</button><button class="btn primary" id="again">再次探索</button>');
  m.querySelector("#map2").onclick=()=>{closeModal();openRegions();};
  m.querySelector("#again").onclick=()=>{closeModal();Game.startRegion(idx);renderAll();};
}
function openRegions(){
  let body='<div class="region-grid">';
  D.REGIONS.forEach((r,i)=>{
    const locked=i>0&&Game.state.bossKills<D.REGION_REQ[i];
    const cur=Game.state.region===i;
    body+='<div class="region-card '+(locked?"locked":"")+(cur?" current":"")+'" data-r="'+i+'">'+
      '<div class="rg-ico">'+r.ico+'</div><div class="rg-name">'+r.name+'</div>'+
      '<div class="rg-pow">推荐战力 '+r.pow+(locked?'<br>🔒 击败首领 '+D.REGION_REQ[i]:"")+'</div></div>';
  });
  body+='</div><p style="text-align:center;font-size:10.5px;color:#8d7d68;margin-top:8px">累计首领击杀：'+Game.state.bossKills+'</p>';
  const m=modal("🗺️ 古老大陆",body,'<button class="btn" data-c="1">返回</button>');
  m.querySelector("[data-c]").onclick=closeModal;
  m.querySelectorAll("[data-r]").forEach(el=>el.onclick=()=>{
    const idx=+el.dataset.r;
    const r=Game.startRegion(idx);
    if(r.err){toast(r.err,"bad");return;}
    closeModal(); renderAll(); toast("进入 "+D.REGIONS[idx].name,"good");
  });
}

function simpleModal(t,d,ok,btn){
  simpleModalRaw(t,'<div class="ev-desc" style="text-align:center">'+d+'</div>',ok,btn||"知道了");
}
function simpleModalRaw(t,body,ok,btn){
  const m=modal(t,body,'<button class="btn primary" id="ok">'+(btn||"确认")+'</button>');
  m.querySelector("#ok").onclick=()=>{closeModal();ok&&ok();};
}
function rewardModal(t,r,node){
  let body='<div style="text-align:center;font-size:12.5px;line-height:2;color:#c9a45c">'+rewardLine(r)+'</div>';
  if(r.item){const it=r.item;body+='<div class="item-card"><div class="it-ico q'+it.q+'">'+it.ico+'</div>'+
    '<div class="hc-info"><div class="hc-name">'+esc(Game.itemName(it))+'</div><div class="hc-stats">'+affText(it)+'</div></div></div>';}
  simpleModalRaw(t,body,()=>{Game.completeNode();afterNode(false);renderAll();},"继续");
}

/* ---------- 队伍栏 ---------- */
function renderParty(){
  const box=$("#party-slots"); box.innerHTML="";
  const P=Game.state.party;
  for(let i=0;i<4;i++){
    const id=P[i];
    const slot=$c("div","slot"+(id?"":" empty"));
    if(!id){
      slot.innerHTML='<div class="portrait">＋</div><div class="pname">空位</div>';
      slot.onclick=()=>pickForParty(i);
    }else{
      const h=Game.state.heroes.find(x=>x.id===id);
      if(!h){P[i]=null;Game.save();box.appendChild(slot);continue;}
      const c=Game.classDef(h.cid), st=Game.heroStats(h);
      const pct=h.alive?Math.round(h.hpPct*100):0;
      slot.className="slot"+(h.alive?"":" dead");
      slot.innerHTML='<div class="portrait" style="border-color:'+D.RARITY_COLOR[h.r]+'">'+c[5]+
        '<span class="star" style="color:'+D.RARITY_COLOR[h.r]+'">'+D.RARITY_STARS[h.r]+'</span>'+
        '<span class="role-tag r-'+c[3]+'">'+c[3]+'</span></div>'+
        '<div class="hpbar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="pname">'+esc(c[1])+'</div>';
      slot.onclick=()=>openHero(h.id);
    }
    box.appendChild(slot);
  }
  // 战吼由第一名英雄决定
  const lead=P[0]&&Game.state.heroes.find(h=>h.id===P[0]);
  const ub=$("#btn-ult");
  if(lead){
    const arch=Game.classDef(lead.cid)[2];
    ub.title=D.ARCH[arch].ult.name+"："+D.ARCH[arch].ult.desc;
    ub.querySelector(".ult-label").textContent="战吼";
  }
}
function pickForParty(slotIdx){
  const avail=Game.state.heroes.filter(h=>h.alive&&!Game.state.party.includes(h.id))
    .sort((a,b)=>Game.heroPower(b)-Game.heroPower(a));
  if(!avail.length){toast("没有可用英雄，去公会招募","bad");return;}
  let body=avail.map(h=>{const c=Game.classDef(h.cid);
    return '<div class="hero-card" data-h="'+h.id+'"><div class="avatar r'+h.r+'">'+c[5]+'</div>'+
      '<div class="hc-info"><div class="hc-name">'+esc(c[1])+'</div>'+
      '<div class="hc-sub"><span class="r-'+c[3]+'">'+c[3]+'</span> · 战力 '+Game.heroPower(h)+'</div></div></div>';
  }).join("");
  const m=modal("选择出战英雄（"+(slotIdx+1)+"号位）",body,'<button class="btn" data-c="1">取消</button>');
  m.querySelector("[data-c]").onclick=closeModal;
  m.querySelectorAll("[data-h]").forEach(el=>el.onclick=()=>{
    Game.state.party[slotIdx]=el.dataset.h; Game.save(); closeModal(); renderAll();
  });
}

/* ---------- 离线/挂机收获 ---------- */
function showHarvest(got, seconds, offline){
  if(!got||Object.values(got).every(v=>v<0.01))return;
  const ic={gold:"ri-gold",xp:"ri-xp",mat:"ri-mat",soulfire:"ri-soul",gem:"ri-gem"};
  const nm={gold:"金币",xp:"经验",mat:"材料",soulfire:"魂火",gem:"钻石"};
  let items=Object.entries(got).map(([k,v])=>
    '<div class="hv-item"><span class="ri '+ic[k]+'"></span><b>'+Game.fmt(v)+'</b>'+nm[k]+'</div>').join("");
  const mins=Math.round(seconds/60);
  const pop=document.createElement("div");
  pop.className="harvest-pop";
  pop.innerHTML='<div class="harvest-box"><h2>'+(offline?"归来收获":"待收物资")+'</h2>'+
    '<div style="font-size:11px;color:#8d7d68">城堡工匠持续工作了 '+
    (mins>=60?Math.round(mins/60)+" 小时 "+(mins%60)+" 分":mins+" 分钟")+
    (seconds>=D.OFFLINE_CAP?"（已达12小时上限）":"")+'</div>'+
    '<div class="hv-grid">'+items+'</div>'+
    '<button class="btn primary" style="width:100%">收取</button></div>';
  pop.querySelector("button").onclick=()=>pop.remove();
  document.body.appendChild(pop);
}

/* ---------- 帮助 ---------- */
function openHelp(){
  simpleModalRaw("📖 暮影地牢 · 生存手册",
    '<div class="help-sec"><h4>🏰 城堡与挂机</h4>'+
    '在<b>庄园</b>、<b>招魂塔</b>分配工匠，持续产出金币/经验/材料与魂火/钻石。工匠共享人口，升级庄园可增加人口。下线也有最多 <b>12 小时</b> 离线收益。</div>'+
    '<div class="help-sec"><h4>🗺️ 箱庭冒险</h4>'+
    '沿节点路径探索：战斗、精英、随机事件、宝藏、篝火与首领。事件选择有风险也有回报，斥候能躲陷阱，护卫/先锋能吓退劫匪。</div>'+
    '<div class="help-sec"><h4>⚔️ 即时战斗</h4>'+
    '战斗实时进行，点击敌人可指定集火目标（先锋/护卫会被前排挡住）。底部手动释放技能；右侧<b>战吼</b>由队长职业决定，集满能量可极限翻盘。BOSS 45% 血进入<b>狂暴</b>，请预留嘲讽、护盾、减伤与治疗！</div>'+
    '<div class="help-sec"><h4>👥 英雄养成</h4>'+
    '52 种职业、6 大体系、5 档稀有度，全部可用金币抽取。<b>灵魂等级</b>所有英雄共享，新英雄立刻跟上等级，无需重复练级。</div>'+
    '<div class="help-sec"><h4>⚒️ 装备与锻造</h4>'+
    '铁匠铺打造装备，武器必带物穿/法穿，优先堆穿透。<b>锻造等级</b>对全部装备生效；低品质装备可通过<b>回火</b>逐级升品。</div>'+
    '<div class="help-sec"><h4>站位建议</h4>'+
    '先锋/护卫放前排吸引火力，异士/斥候/支援放后排；面对法伤堆法穿输出与减伤，物理 BOSS 则用高甲护卫嘲讽。</div>',
    null,"开始冒险");
}

/* ---------- 全量刷新 ---------- */
function renderAll(){ renderRes(); renderBuildings(); renderMap(); renderParty(); }

global.UI={renderAll,renderRes,renderBuildings,renderMap,renderParty,
  openBuilding,openGuild,openSmith,openRegions,openHelp,showHarvest,
  closeModal,toast,simpleModal,simpleModalRaw,confirmBox};
})(window);
