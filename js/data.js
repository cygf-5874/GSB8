/* ========== 游戏静态数据 data.js ========== */
(function(global){
"use strict";
const D = {};

/* 职业体系 arch：war战士 mys秘术 rng游侠 cle牧师 nat自然 mon异种
   定位 role：先锋/护卫/异士/支援/斥候
   稀有度 r：1普通 2稀有 3史诗 4传说 5神话
   元组：[id,名称,体系,定位,图标,稀有度,技能id,生命系数,攻击系数,速度系数] */
D.CLASS_LIST = [
// —— 战士之道（10）——
["w1","战士","war","先锋","🗡️",1,"sk_slash",1.0,1.0,1.0],
["w2","剑士","war","先锋","⚔️",1,"sk_bleed",0.95,1.08,1.08],
["w3","骑士","war","护卫","🛡️",2,"sk_taunt",1.25,.9,.92],
["w4","狂战士","war","先锋","🪓",3,"sk_rage",1.15,1.2,.95],
["w5","圣武士","war","护卫","✨",3,"sk_holy",1.2,.95,.95],
["w6","角斗士","war","先锋","🔱",2,"sk_chain",1.05,1.1,1.05],
["w7","督军","war","先锋","🏴",4,"sk_roar",1.3,1.05,.9],
["w8","武僧","war","先锋","👊",2,"sk_palm",.95,1.12,1.15],
["w9","符文守卫","war","护卫","🔰",4,"sk_rune",1.35,.85,.9],
["w10","黑暗骑士","war","先锋","🐴‍♀️",5,"sk_voidslash",1.25,1.25,.95],
// —— 秘术之道（8）——
["m1","魔法师","mys","异士","🔮",1,"sk_fireball",.8,1.15,1.0],
["m2","火法师","mys","异士","🔥",2,"sk_fireball",.78,1.22,1.02],
["m3","冰霜女巫","mys","异士","❄️",2,"sk_frost",.8,1.15,1.0],
["m4","雷霆术士","mys","异士","⚡",3,"sk_chain",.82,1.2,1.05],
["m5","死灵法师","mys","异士","💀",3,"sk_drain",.85,1.18,.95],
["m6","秘术师","mys","异士","📖",2,"sk_curse",.82,1.12,1.0],
["m7","虚空行者","mys","异士","🌀",4,"sk_void",.88,1.28,1.0],
["m8","血法师","mys","异士","🩸",5,"sk_blood",.9,1.4,.95],
// —— 游侠之道（8）——
["g1","游侠","rng","斥候","🏹",1,"sk_aim",.9,1.08,1.1],
["g2","神射手","rng","斥候","🎯",2,"sk_snipe",.85,1.15,1.12],
["g3","赏金猎人","rng","斥候","💰",2,"sk_trap",.92,1.1,1.08],
["g4","刺客","rng","斥候","🗡️",3,"sk_backstab",.82,1.22,1.2],
["g5","巡林客","rng","斥候","🌿",2,"sk_poisonarrow",.9,1.1,1.1],
["g6","火枪手","rng","斥候","🔫",3,"sk_shotshell",.88,1.18,1.05],
["g7","影舞者","rng","斥候","🌑",4,"sk_shadowdance",.85,1.25,1.25],
["g8","风暴游侠","rng","斥候","🌩️",5,"sk_stormarrow",.9,1.3,1.15],
// —— 牧师之道（8）——
["c1","牧师","cle","支援","⛪",1,"sk_heal",.9,.95,.98],
["c2","神官","cle","支援","🙏",2,"sk_heal",.95,.98,1.0],
["c3","萨满","cle","支援","🪘",3,"sk_mend",1.0,1.0,.95],
["c4","圣歌者","cle","支援","🎵",2,"sk_hymn",.92,.95,1.0],
["c5","苦行僧","cle","先锋","📿",2,"sk_smite",1.05,1.05,1.0],
["c6","战牧","cle","先锋","🔨",3,"sk_smite",1.1,1.12,1.0],
["c7","先知","cle","支援","👁️",4,"sk_fate",.95,1.05,1.0],
["c8","暮光修女","cle","支援","🕯️",5,"sk_twilight",1.0,1.15,1.02],
// —— 自然之道（8）——
["n1","德鲁伊","nat","支援","🦌",2,"sk_regrowth",.95,1.02,.98],
["n2","驯兽师","nat","先锋","🐺",2,"sk_beast",1.05,1.05,1.0],
["n3","毒药师","nat","异士","⚗️",2,"sk_poison",.85,1.1,1.0],
["n4","风语者","nat","支援","🍃",3,"sk_wind",.9,1.05,1.1],
["n5","石肤者","nat","护卫","🗿",3,"sk_stoneskin",1.3,.85,.85],
["n6","荆棘女巫","nat","异士","🌹",3,"sk_thorn",.88,1.12,1.0],
["n7","月之守护","nat","护卫","🌙",4,"sk_moon",1.35,.9,.9],
["n8","远古树灵","nat","护卫","🌳",5,"sk_ancient",1.45,.9,.8],
// —— 异种之道（10）——
["x1","哥布林","mon","斥候","👺",1,"sk_backstab",.82,1.05,1.12],
["x2","骷髅兵","mon","先锋","💀",1,"sk_slash",1.0,1.0,1.0],
["x3","兽人","mon","先锋","👹",2,"sk_rage",1.15,1.12,.92],
["x4","狼化人","mon","斥候","🐺",3,"sk_hunt",.9,1.2,1.18],
["x5","半魔人","mon","先锋","😈",4,"sk_voidslash",1.05,1.28,1.0],
["x6","吸血贵族","mon","异士","🧛",4,"sk_drain",.9,1.28,1.0],
["x7","石像鬼","mon","护卫","🦇",4,"sk_guard",1.4,.85,.8],
["x8","骨龙祭司","mon","异士","🐲",5,"sk_breath",.95,1.35,.9],
["x9","深渊魔裔","mon","先锋","👾",5,"sk_void",1.2,1.4,.92],
["x10","无面古神","mon","异士","🕳️",5,"sk_fate",1.0,1.5,1.0]
];

D.ARCH = {
  war:{name:"战士之道",color:"#e07a5f",ult:{name:"千军战吼",icon:"📯",
    desc:"对全体敌人造成 260% 攻击伤害，并使我方先锋/护卫获得 25% 减伤 6 秒",type:"war"}},
  mys:{name:"秘术之道",color:"#b18cff",ult:{name:"奥术风暴",icon:"🌌",
    desc:"召唤风暴对随机敌人造成 5 次 90% 法术伤害，每层灼烧额外引爆",type:"mys"}},
  rng:{name:"游侠之道",color:"#8fd0ff",ult:{name:"死亡齐射",icon:"🏹",
    desc:"对生命值最低的敌人造成 420% 穿透一击，击杀后再次施放(最多2次)",type:"rng"}},
  cle:{name:"牧师之道",color:"#f2cc8f",ult:{name:"神圣庇护",icon:"🌟",
    desc:"全队恢复 35% 最大生命，获得 3 秒免伤护盾与净化",type:"cle"}},
  nat:{name:"自然之道",color:"#9ccc65",ult:{name:"万物复苏",icon:"🌳",
    desc:"全队恢复 28% 最大生命并获得 30% 攻击、20% 攻速 8 秒",type:"nat"}},
  mon:{name:"异种之道",color:"#e0533d",ult:{name:"深渊吞噬",icon:"🩸",
    desc:"对全体造成 200% 伤害并汲取 50% 伤害为生命，附带虚弱",type:"mon"}}
};
D.RARITY_COLOR = ["", "#b8b8b8","#4a90d9","#9b59b6","#e8a33d","#e0533d"];
D.RARITY_NAME = ["", "普通","稀有","史诗","传说","神话"];
D.RARITY_STARS = ["", "★","★★","★★★","★★★★","★★★★★"];

/* 技能池。type: dmg单体伤害 aoe群体 heal护援 buff/debuff
   pow: 系数(基于攻击力), cd:秒, pen:穿透, hit:打击次数, extra附加效果 */
D.SKILLS = {
sk_slash:{n:"裂空斩",ico:"🗡️",type:"dmg",pow:1.5,cd:5,pen:0.15},
sk_bleed:{n:"割喉",ico:"🔪",type:"dmg",pow:1.3,cd:5,pen:0.1,extra:{bleed:[0.18,4]}},
sk_taunt:{n:"盾墙嘲讽",ico:"🛡️",type:"buff",cd:8,extra:{taunt:5,shield:.18}},
sk_rage:{n:"嗜血狂暴",ico:"💢",type:"buff",cd:9,extra:{atk:.4,spd:.25,dur:6}},
sk_holy:{n:"圣光审判",ico:"✨",type:"dmg",pow:1.6,cd:6,pen:0.2,extra:{healself:.12}},
sk_chain:{n:"连锁打击",ico:"⚡",type:"dmg",pow:.8,hit:3,cd:7,pen:.08},
sk_roar:{n:"威慑战吼",ico:"📢",type:"aoe",pow:1.0,cd:7,extra:{atkdown:.2,dur:5}},
sk_palm:{n:"震地掌",ico:"👊",type:"aoe",pow:.9,cd:6,extra:{stun:1}},
sk_rune:{n:"符文壁垒",ico:"🔰",type:"buff",cd:9,extra:{shield:.35,taunt:5}},
sk_voidslash:{n:"虚空斩",ico:"🌑",type:"dmg",pow:2.1,cd:6,pen:.4,extra:{defdown:.2,dur:5}},
sk_fireball:{n:"火球术",ico:"🔥",type:"aoe",pow:1.3,cd:6,extra:{burn:[.12,4]}},
sk_frost:{n:"冰封",ico:"❄️",type:"dmg",pow:1.4,cd:6,extra:{slow:[.3,3]}},
sk_drain:{n:"死亡汲取",ico:"💀",type:"dmg",pow:1.6,cd:7,extra:{lifesteal:1}},
sk_curse:{n:"虚弱诅咒",ico:"🌀",type:"aoe",pow:.7,cd:7,extra:{atkdown:.25,dur:5}},
sk_void:{n:"虚空裂隙",ico:"🕳️",type:"aoe",pow:1.5,cd:7,pen:.2,extra:{defdown:.15,dur:4}},
sk_blood:{n:"血潮",ico:"🩸",type:"aoe",pow:1.7,cd:8,extra:{lifesteal:.8,burn:[.1,3]}},
sk_aim:{n:"精准射击",ico:"🎯",type:"dmg",pow:1.6,cd:5,pen:.25},
sk_snipe:{n:"致命狙击",ico:"🌀",type:"dmg",pow:2.4,cd:8,pen:.5},
sk_trap:{n:"陷阱",ico:"🪤",type:"dmg",pow:1.2,cd:6,extra:{stun:1.5,bleed:[.12,3]}},
sk_backstab:{n:"背刺",ico:"🗡️",type:"dmg",pow:2.0,cd:6,pen:.35},
sk_poisonarrow:{n:"毒箭",ico:"🏹",type:"dmg",pow:1.1,cd:5,extra:{poison:[.22,5]}},
sk_shotshell:{n:"霰射",ico:"💥",type:"aoe",pow:1.0,hit:2,cd:7,pen:.1},
sk_shadowdance:{n:"影袭乱舞",ico:"🌑",type:"dmg",pow:.7,hit:4,cd:8,pen:.3},
sk_stormarrow:{n:"风暴箭",ico:"🌩️",type:"dmg",pow:1.4,hit:3,cd:8,pen:.4,extra:{stun:1}},
sk_heal:{n:"治疗术",ico:"💚",type:"heal",pow:1.8,cd:5},
sk_mend:{n:"治疗链",ico:"🔗",type:"heal",pow:1.2,hit:2,cd:6},
sk_hymn:{n:"勇气圣歌",ico:"🎵",type:"buff",cd:9,extra:{atk:.25,dur:8,hot:[.1,5]}},
sk_smite:{n:"惩戒",ico:"🔨",type:"dmg",pow:1.5,cd:5,pen:.15,extra:{healself:.1}},
sk_fate:{n:"命运预言",ico:"👁️",type:"buff",cd:10,extra:{crit:.35,dur:8,shield:.2}},
sk_twilight:{n:"暮光救赎",ico:"🕯️",type:"heal",pow:2.4,cd:7,extra:{cleanse:1,shield:.15}},
sk_regrowth:{n:"再生",ico:"🌱",type:"heal",pow:1.4,cd:6,extra:{hot:[.12,5]}},
sk_beast:{n:"兽性猛扑",ico:"🐾",type:"dmg",pow:1.8,cd:6,pen:.15,extra:{bleed:[.15,3]}},
sk_poison:{n:"剧毒云雾",ico:"☠️",type:"aoe",pow:.8,cd:7,extra:{poison:[.18,4]}},
sk_wind:{n:"疾风祝福",ico:"🍃",type:"buff",cd:9,extra:{spd:.35,dur:8,hot:[.08,4]}},
sk_stoneskin:{n:"石化肌肤",ico:"🗿",type:"buff",cd:9,extra:{shield:.4,taunt:5}},
sk_thorn:{n:"荆棘缠绕",ico:"🌹",type:"aoe",pow:1.0,cd:7,extra:{slow:[.3,3],poison:[.12,4]}},
sk_moon:{n:"月华屏障",ico:"🌙",type:"buff",cd:9,extra:{shield:.3,dmgup:.3,dur:7}},
sk_ancient:{n:"远古怒嚎",ico:"🌳",type:"aoe",pow:1.3,cd:8,extra:{stun:1.5,shield:.2}},
sk_hunt:{n:"猎杀本能",ico:"🐺",type:"dmg",pow:1.7,cd:6,pen:.3},
sk_guard:{n:"岩石护卫",ico:"🦇",type:"buff",cd:8,extra:{taunt:6,shield:.4}},
sk_breath:{n:"龙息",ico:"🐉",type:"aoe",pow:1.6,cd:7,extra:{burn:[.15,4],defdown:.15,dur:4}}
};

/* ===== 装备 =====
   部位 1武器 2护甲 3饰品；品质 1..6 */
D.QUALITY = ["", "粗制","精良","稀有","史诗","传说","神话·黯蚀"];
D.ITEM_SLOTS = {1:"武器",2:"护甲",3:"饰品"};
D.ITEM_ICONS = {
 1:["🗡️","🪓","⚔️","🔨","🏹","🔮","🪄"],
 2:["🛡️","🥋","👕","🧥","⛓️"],
 3:["💍","📿","🪬","🔮","👑"]
};
D.ITEM_NAMES = {
 1:["守墓人短刃","锈蚀巨剑","黑曜战斧","符文战锤","绞刑弓弦","亡者法杖","暮影匕首"],
 2:["铁皮胸甲","缝合皮甲","锁链甲","修院长袍","龙骨护甲"],
 3:["骸骨之戒","魂火项链","受难圣徽","月泪护符","荆棘王冠"]
};
/* 词缀池：key字段名 / 名称 / 部位 / 基础值(乘装备系数) / 是否主属性 */
D.AFFIXES = [
 {k:"atk",n:"攻击",slots:[1,3],v:.18,main:true},
 {k:"hp",n:"生命",slots:[2,3],v:.22,main:true},
 {k:"pen",n:"物穿",slots:[1],v:.10,main:true,weapon:true,phys:true},
 {k:"mpen",n:"法穿",slots:[1],v:.10,main:true,weapon:true,mag:true},
 {k:"crit",n:"暴击",slots:[1,3],v:.08},
 {k:"critdmg",n:"暴伤",slots:[1,3],v:.18},
 {k:"def",n:"护甲",slots:[2],v:.20,main:true},
 {k:"spd",n:"攻速",slots:[1,2,3],v:.06},
 {k:"lifesteal",n:"吸血",slots:[1,3],v:.06},
 {k:"dodge",n:"闪避",slots:[2,3],v:.05},
 {k:"reduce",n:"减伤",slots:[2],v:.07},
 {k:"heal",n:"治疗强化",slots:[3],v:.10}
];
/* 品质：词条数 / 主词条概率 / 回火成长 */
D.QUALITY_AFFIX = [null,1,2,3,4,5,6];
D.QUALITY_MULT = [null,.9,1.1,1.4,1.8,2.4,3.2];   // 属性倍率
D.TEMPER_COST = [null,0,120,300,650,1300];        // 升到下一品质的钢铁
D.CRAFT_COST = 90;                                // 单件钢铁
D.CRAFT_QUP = 0.06;                               // 铁匠每级极品率提升

/* ===== 建筑 ===== */
D.BUILDINGS = [
 {id:"manor",ico:"🏰",name:"庄园",desc:"产出金币、经验、材料。分配的工匠越多，产出越快。"},
 {id:"tower",ico:"🗼",name:"招魂塔",ico2:"",desc:"产出魂火与钻石，并缓慢凝聚金币。升级解锁更高产出。"},
 {id:"smith",ico:"⚒️",name:"铁匠铺",desc:"消耗钢铁打造装备。升级提升高品质装备出现概率，可回火升品。"},
 {id:"guild",ico:"🍺",name:"冒险者公会",desc:"用金币招募各路英雄。升级小幅提升高稀有度出现率并扩大英雄容量。"}
];
D.MANOR_PROD = {gold:[1.2,1.15],xp:[0.8,1.12],mat:[0.06,1.1]};      // 基础/每工匠, 每级倍率
D.TOWER_PROD = {soulfire:[0.15,1.2],gem:[0.012,1.15],gold:[0.5,1.1]};
D.BUILD_COST = {gold:[400,1.6],mat:[30,1.55],steel:[0,0]};

/* ===== 大陆区域与敌人 =====
   pow: 推荐战力基准；敌人 [名称,图标,定位,生命倍率,攻击倍率,速度,技能id?] */
D.REGIONS = [
{id:"graveyard",name:"腐朽墓园",ico:"🪦",pow:120,
 foes:[
  ["蹒跚骷髅","💀","先锋",1,.9,.9,"sk_slash"],
  ["腐尸","🧟","先锋",1.3,.75,.7,null],
  ["墓穴蝙蝠","🦇","斥候",.6,1.0,1.25,null],
  ["怨灵","👻","异士",.75,1.1,1.05,"sk_curse"],
  ["食尸鬼","🐺‍⬛","斥候",.9,1.1,1.1,"sk_hunt"],
  ["骷髅弓手","🏹","斥候",.7,1.05,1.1,"sk_aim"]
 ],
 boss:["骸棺领主","⚰️",1.8,1.2,.85,"sk_roar","亡者从棺中苏醒……它抬起骨剑，发出空洞的战吼。"]},
{id:"mine",name:"燃烬矿坑",ico:"⛏️",pow:420,
 foes:[
  ["旷工哥布林","👺","斥候",.85,1.05,1.1,"sk_trap"],
  ["熔岩蝾螈","🦎","异士",.8,1.15,1.0,"sk_fireball"],
  ["矿洞巨鼠","🐀","斥候",.6,1.0,1.25,"sk_bleed"],
  ["碎岩傀儡","🗿","护卫",1.5,.8,.7,"sk_guard"],
  ["黑铁兽人","🐗","先锋",1.2,1.1,.85,"sk_rage"],
  ["火焰小鬼","😈","异士",.75,1.2,1.1,"sk_fireball"]
 ],
 boss:["熔炉巨像","🔥",2.1,1.25,.8,"sk_breath","熔炉温度急剧攀升！巨像即将喷吐烈焰——备好减伤与护盾！"]},
{id:"abbey",name:"血色修道院",ico:"⛪",pow:1000,
 foes:[
  ["苦修信徒","🧝","先锋",1,.95,.95,"sk_smite"],
  ["嗜血修女","🕯️","支援",.8,1.05,1.0,"sk_drain"],
  ["堕落审判官","🎭","异士",.9,1.2,1.0,"sk_curse"],
  ["石像鬼","🦇","护卫",1.4,.9,.75,"sk_guard"],
  ["狂信徒","👤","先锋",1.05,1.15,1.0,"sk_rage"],
  ["告解室恶灵","🗣️","异士",.8,1.15,1.1,"sk_void"]
 ],
 boss:["堕落大主教","🙈",2.0,1.35,.9,"sk_voidslash","大主教诵念禁忌祷文，暗影凝成锋刃，并将削弱你们的护甲！"]},
{id:"frost",name:"霜寂王座",ico:"❄️",pow:2200,
 foes:[
  ["霜寒尸鬼","🧊","先锋",1.2,1.05,.85,"sk_bleed"],
  ["冰原狼","🐺","斥候",.8,1.2,1.2,"sk_hunt"],
  ["哀嚎女妖","😱","异士",.85,1.2,1.05,"sk_frost"],
  ["霜冻骑士","🤺","护卫",1.5,1.0,.8,"sk_holy"],
  ["冰晶女巫","🧙‍♀️","异士",.85,1.25,1.0,"sk_frost"],
  ["冻骨巨像","🗻","护卫",1.6,.9,.65,"sk_rune"]
 ],
 boss:["霜寂女王","👸",2.3,1.4,.9,"sk_frost","女王展开冰封领域！攻击将冻结并减速全队，需要速战速决或驱散。"]},
{id:"abyss",name:"深渊裂隙",ico:"🕳️",pow:4500,
 foes:[
  ["深渊小恶魔","👾","斥候",.85,1.2,1.15,"sk_backstab"],
  ["虚空爬行者","🦂","异士",.9,1.25,1.0,"sk_poison"],
  ["深渊吞噬者","🪱","先锋",1.3,1.15,.85,"sk_voidslash"],
  ["旧日眷族","🐙","异士",.9,1.3,.95,"sk_void"],
  ["猩红贵族","🧛","异士",.9,1.3,1.05,"sk_drain"],
  ["裂隙守卫","🛡️","护卫",1.7,1.0,.7,"sk_rune"]
 ],
 boss:["无面古神化身","👁️",2.6,1.5,.85,"sk_fate","理智在凝视中崩塌——古神的命运审判将极大提升暴击，速杀或免伤！"]}
];

/* ===== 随机事件（神秘路人/陷阱/宝藏）=====
   选项执行在 state.applyEvent(ev, idx, ctx) */
D.EVENTS = [
{id:"merchant",art:"🧙‍♂️",t:"流浪商人",d:"兜帽下传来沙哑的声音：「旅人，用魂火换些趁手的家伙？还是想听听我的情报？」",
 c:[{x:"用 15 魂火购买神秘装备箱",a:"buybox",cost:{soulfire:15}},
    {x:"用 200 金币购买补给(全队回复30%)",a:"supply",cost:{gold:200}},
    {x:"离开",a:"none"}]},
{id:"altar",art:"⛩️",t:"古旧祭坛",d:"祭坛上萦绕着幽蓝火光，似乎能以血为祭，换取短暂的力量。",
 c:[{x:"献祭15%当前生命，获得全队+20%攻击祝福(本次冒险)",a:"boonAtk",cost:{hp:.15}},
    {x:"注入50金币祈祷(随机资源回报)",a:"pray",cost:{gold:50}},
    {x:"不碰为妙",a:"none"}]},
{id:"trap_spike",art:"🗡️",t:"尖刺陷阱",d:"地面的石板微微下沉——",
 c:[{x:"敏捷翻滚躲避(斥候在队必定成功)",a:"trapDodge"},
    {x:"硬扛：当前英雄各受8%最大生命伤害",a:"trapHurt"},
    {x:"小心拆解，获得材料",a:"trapMat"}]},
{id:"trap_gas",art:"☠️",t:"毒雾机关",d:"墙缝中渗出暗绿色的毒雾！",
 c:[{x:"用湿衣物捂住口鼻(受少量伤害，得魂火)",a:"gasHold"},
    {x:"点火驱散(消耗30钢铁，无伤通过)",a:"gasBurn",cost:{steel:30}}]},
{id:"wanderer",art:"🧝",t:"神秘路人",d:"一名披着乌鸦羽毛的旅人坐在篝火旁：「要占卜吗？命运这种东西，有时很值钱。」",
 c:[{x:"花100金币占卜(随机增益或损失)",a:"divine",cost:{gold:100}},
    {x:"分享食物(-50金币，获得其信物=材料)",a:"share",cost:{gold:50}},
    {x:"默默绕开",a:"none"}]},
{id:"chest",art:"🧰",t:"雕花宝箱",d:"箱子没有上锁，但锁孔周围刻着黑色符文。",
 c:[{x:"直接打开(70%安全/30%爆炸受伤)",a:"chestOpen"},
    {x:"用工具拆除符文(消耗20钢铁，必得钻石)",a:"chestSafe",cost:{steel:20}}]},
{id:"soulwell",art:"🪣",t:"灵魂井",d:"井底传来低语，井口漂浮着魂火。",
 c:[{x:"汲取魂火(+魂火，随机一名英雄虚弱)",a:"wellTake"},
    {x:"投入100金币净化(+更多魂火)",a:"wellPurify",cost:{gold:100}}]},
{id:"graves",art:"🪦",t:"无名坟墓",d:"墓碑前放着一把尚新的武器。",
 c:[{x:"拿走武器(随机装备)",a:"graveLoot"},
    {x:"入土为安(回复15%生命并得少量经验)",a:"graveRest"}]},
{id:"shrine",art:"🕯️",t:"破败神龛",d:"神像的手已经残缺，烛火却仍未熄灭。",
 c:[{x:"虔诚祈祷(回复25%生命，下次战斗开局护盾)",a:"shrinePray"},
    {x:"取走神龛上的金器(+金币，受诅咒-防御)",a:"shrineSteal"}]},
{id:"ambush",art:"👥",t:"拦路劫匪",d:"「此路是我开！」",
 c:[{x:"开战(强制一场精英战，胜利额外奖励)",a:"ambushFight"},
    {x:"花钱消灾(-150金币)",a:"ambushPay",cost:{gold:150}},
    {x:"用气势吓退(护卫/先锋总星级≥6成功)",a:"ambushScare"}]},
{id:"forge_old",art:"⚒️",t:"废弃锻炉",d:"炉火早已熄灭，但风箱里似乎还藏着余烬。",
 c:[{x:"投入60钢铁重燃锻炉(必得精良+装备)",a:"oldForge",cost:{steel:60}},
    {x:"拆走零件(+材料)",a:"forgeParts"}]},
{id:"mushroom",art:"🍄",t:"荧光蘑菇",d:"洞穴角落长着一丛会呼吸的蘑菇，散发着甜香。",
 c:[{x:"吃下蘑菇(随机：+攻速祝福 或 中毒)",a:"shroomEat"},
    {x:"采集孢子(+材料)",a:"shroomPick"}]},
{id:"cage",art:"🪤",t:"囚笼",d:"笼子里关着一只会说话的渡鸦：「放我出去，我给你叼个亮闪闪的东西。」",
 c:[{x:"放走渡鸦(随机钻石或空欢喜)",a:"cageFree"},
    {x:"无视",a:"none"}]},
{id:"monolith",art:"🗿",t:"黑色方尖碑",d:"石碑表面不断流过无法理解的文字，注视它令人头晕。",
 c:[{x:"触摸石碑(灵魂经验+大量，受10%伤害)",a:"monoTouch"},
    {x:"摧毁石碑(+魂火与材料)",a:"monoBreak"}]}
];

/* 关卡配置 */
D.LAYERS = 9;                    // 每区域节点层数
D.NODE_KINDS = ["battle","battle","battle","elite","event","treasure","rest","battle","boss"]; // 对应层
D.OFFLINE_CAP = 12 * 3600;       // 挂机收益上限秒
D.GACHA = {cost:800,cost10:7200,rates:[.60,.28,.10,.019,.001],dupe:{1:5,2:15,3:40,4:120,5:400}};
D.PARTY_MAX = 4;
D.HERO_CAP_BASE = 12;
D.START_HEROES = ["w1","c1","g1","m1"];
D.SOUL_COST = lv => ({xp: 60 + lv*lv*14, gold: 30 + lv*lv*6});
D.FORGE_COST = lv => ({steel: 80 + lv*lv*30, mat: 10 + lv*lv*5, gold: 50 + lv*lv*10});
D.GUILD_CAP = lv => D.HERO_CAP_BASE + (lv-1)*3;
D.REGION_REQ = [0,0,4,9,14]; // 解锁需要击败前一区域BOSS次数(累计boss击杀)
D.REGION_BOSS_KILLS = [0,1,3,6,10]; // 解锁下一区累计击杀数

global.D = D;
})(window);
