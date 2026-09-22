
global.window={}; const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.document={addEventListener(){},querySelector(){return null;}};
await import("file://C:/Users/Administrator/Desktop/B7/js/data.js");
globalThis.D=window.D;
await import("file://C:/Users/Administrator/Desktop/B7/js/state.js");
const G=window.Game; G.fresh();
G.state.res.steel=1e9;
const counts=[0,0,0,0,0,0];
for(let i=0;i<10000;i++){const r=G.craft(1); if(r.made)counts[r.made[0].q-1]++; else { // 满了就熔毁
  G.state.inv=[]; const r2=G.craft(1); counts[r2.made[0].q-1]++; }}
console.log('qdist%', counts.map(c=>(c/100).toFixed(1)).join(','));
