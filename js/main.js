/* ========== 启动与主循环 main.js ========== */
(function(){
"use strict";
const $=s=>document.querySelector(s);

function boot(){
  const had=Game.load();
  if(!had){ Game.fresh(); }
  ensureMap();
  Game.save();
  UI.renderAll();
  bindUI();
  // 离线收益
  const now=Date.now(), dt=Math.max(0,(now-Game.state.ts)/1000);
  if(had && dt>60){
    const got=Game.accrue(dt);
    Game.state.ts=now; Game.save();
    setTimeout(()=>UI.showHarvest(got,dt,true),400);
  } else {
    Game.state.ts=now;
    if(!had) setTimeout(()=>UI.openHelp(),300);
  }
  startLoops();
}
function ensureMap(){
  if(!Game.state.map){ Game.state.map=Game.genMap(Game.state.region); }
}

let lastTick=Date.now(), lastSave=Date.now();
function startLoops(){
  setInterval(()=>{
    const now=Date.now(), dt=(now-lastTick)/1000; lastTick=now;
    // 在线产出
    const got=Game.accrue(dt);
    Game.townHeal(dt);
    // 顶部数字高频刷新
    UI.renderRes();
    UI.renderParty();
    if(now-lastSave>4000){ lastSave=now; Game.state.ts=now; Game.save(); }
  },1000);
  setInterval(()=>UI.renderBuildings(),2500);
  setInterval(()=>UI.renderMap(),1500);
  window.addEventListener("beforeunload",()=>{Game.state.ts=Date.now();Game.save();});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){Game.state.ts=Date.now();Game.save();}
  });
}

function bindUI(){
  $("#btn-region").onclick=()=>UI.openRegions();
  $("#btn-help").onclick=()=>UI.openHelp();
  $("#btn-reset").onclick=()=>{
    UI.confirmBox("重置存档？","所有英雄、装备与进度都将消失，且无法恢复。",()=>{
      Game.reset(); ensureMap(); UI.renderAll(); UI.toast("已开启新的轮回");
    });
  };
  $("#btn-heal").onclick=()=>{
    const dead=Game.state.heroes.filter(h=>!h.alive).length;
    if(dead){
      UI.confirmBox("复活倒下的英雄？","需要魂火 10/人，立刻以 50% 生命归队。",()=>{
        const r=Game.reviveAll(); if(r.ok){UI.toast("英雄已归队","good");UI.renderAll();} else UI.toast(r.err,"bad");
      });
    } else {
      // 立即休整：消耗少量金币全员回血
      const cost=Math.floor(100+Game.state.soulLv*30);
      if(Game.state.res.gold<cost){UI.toast("金币不足（休整需 "+cost+"）","bad");return;}
      if(Game.living().every(h=>h.hpPct>=0.999)){UI.toast("队伍状态良好");return;}
      Game.pay({gold:cost}); Game.healParty(0.6); Game.save();
      UI.toast("休整完毕，恢复 60% 生命","good"); UI.renderAll();
    }
  };
  $("#btn-ult").onclick=()=>{ UI.toast("战吼在战斗中点击右下角圆形按钮释放，效果由队长职业决定"); };
  $("#btn-mute").onclick=e=>{ Game.state.muted=!Game.state.muted;
    e.target.style.opacity=Game.state.muted?.35:1; Game.save();
    UI.toast(Game.state.muted?"音效关闭":"音效开启"); };
}

if(document.readyState!=="loading") boot();
else document.addEventListener("DOMContentLoaded",boot);
})();
