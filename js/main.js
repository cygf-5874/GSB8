/* ================= 主入口 ================= */
function init(){
  const hasSave = loadGame();
  if(!State.map) State.map = genMap(State.floor);
  // 新手引导：送2名英雄
  if(!hasSave || State.heroes.length===0){
    const h1 = makeHero(), h2 = makeHero();
    State.heroes.push(h1, h2);
    State.party[0] = h1; State.party[1] = h2;
  }
  UI.renderRes(); UI.renderCastle(); UI.renderParty(); UI.renderMap();
  offlineSettle();

  // 建筑点击
  document.querySelectorAll(".building").forEach(b=>{
    b.onclick = ()=>UI.openBuilding(b.dataset.building);
  });
  // 下一层
  document.querySelector("#btn-next-floor").onclick = ()=>GameMap.nextFloor();
  // 战吼
  document.querySelector("#btn-war-cry").onclick = ()=>Combat.warCry();
  // 点击遮罩空白关闭弹窗
  document.querySelector("#modal-mask").addEventListener("click", e=>{
    if(e.target.id==="modal-mask" && !Combat.active) UI.closeModal();
  });

  // 主循环：挂机产出
  setInterval(()=>{
    const now = Date.now();
    const dt = (now - State.lastTick)/1000;
    State.lastTick = now;
    settleIdle(dt);
    UI.renderRes();
    // 非战斗时缓慢回血
    if(!Combat.active){
      let changed = false;
      State.party.forEach(h=>{
        if(h && (h._hpRatio??1) < 1){ h._hpRatio = Math.min(1,(h._hpRatio??1)+0.005); changed=true; }
      });
      if(changed) UI.renderParty();
    }
  }, CFG.tickMs);

  // 定期存档 + 页面关闭存档
  setInterval(saveGame, CFG.saveEvery);
  window.addEventListener("beforeunload", saveGame);
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) saveGame(); });
}
document.addEventListener("DOMContentLoaded", init);