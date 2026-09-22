/* ================= 静态数据 ================= */
const DATA = {};

/* ---- 6大职业体系 · 50+职业 ---- */
DATA.classFamilies = {
  vanguard: { name:"先锋", desc:"近战物理输出，冲锋陷阵" },
  mystic:   { name:"异士", desc:"法术输出与诅咒" },
  support:  { name:"支援", desc:"治疗与增益" },
  guardian: { name:"护卫", desc:"坦克与护盾" },
  ranger:   { name:"游侠", desc:"远程物理与暴击" },
  warlock:  { name:"咒术", desc:"召唤与持续伤害" },
};
DATA.classes = [
  // 先锋 9
  {id:"zs01",family:"vanguard",name:"狂战士"},{id:"zs02",family:"vanguard",name:"剑圣"},
  {id:"zs03",family:"vanguard",name:"决斗家"},{id:"zs04",family:"vanguard",name:"蛮荒斗士"},
  {id:"zs05",family:"vanguard",name:"龙血武士"},{id:"zs06",family:"vanguard",name:"影袭者"},
  {id:"zs07",family:"vanguard",name:"战锤宗师"},{id:"zs08",family:"vanguard",name:"血怒屠夫"},
  {id:"zs09",family:"vanguard",name:"破阵先锋"},
  // 异士 9
  {id:"ys01",family:"mystic",name:"火焰法师"},{id:"ys02",family:"mystic",name:"冰霜女巫"},
  {id:"ys03",family:"mystic",name:"雷电贤者"},{id:"ys04",family:"mystic",name:"暗影术士"},
  {id:"ys05",family:"mystic",name:"奥术学者"},{id:"ys06",family:"mystic",name:"虚空行者"},
  {id:"ys07",family:"mystic",name:"占星师"},{id:"ys08",family:"mystic",name:"血魔法师"},
  {id:"ys09",family:"mystic",name:"梦境编织者"},
  // 支援 9
  {id:"zy01",family:"support",name:"圣光牧师"},{id:"zy02",family:"support",name:"自然德鲁伊"},
  {id:"zy03",family:"support",name:"吟游诗人"},{id:"zy04",family:"support",name:"炼金术士"},
  {id:"zy05",family:"support",name:"战地医师"},{id:"zy06",family:"support",name:"圣言修女"},
  {id:"zy07",family:"support",name:"图腾祭司"},{id:"zy08",family:"support",name:"时光守护者"},
  {id:"zy09",family:"support",name:"灵魂歌者"},
  // 护卫 9
  {id:"hw01",family:"guardian",name:"圣殿骑士"},{id:"hw02",family:"guardian",name:"铁壁卫士"},
  {id:"hw03",family:"guardian",name:"山岭巨人"},{id:"hw04",family:"guardian",name:"符文守卫"},
  {id:"hw05",family:"guardian",name:"不屈盾墙"},{id:"hw06",family:"guardian",name:"岩甲战士"},
  {id:"hw07",family:"guardian",name:"守誓者"},{id:"hw08",family:"guardian",name:"黑铁堡垒"},
  {id:"hw09",family:"guardian",name:"荆棘重甲"},
  // 游侠 9
  {id:"yx01",family:"ranger",name:"神射手"},{id:"yx02",family:"ranger",name:"赏金猎人"},
  {id:"yx03",family:"ranger",name:"丛林猎手"},{id:"yx04",family:"ranger",name:"弩炮专家"},
  {id:"yx05",family:"ranger",name:"疾风游侠"},{id:"yx06",family:"ranger",name:"毒矢刺客"},
  {id:"yx07",family:"ranger",name:"鹰眼斥候"},{id:"yx08",family:"ranger",name:"双枪游侠"},
  {id:"yx09",family:"ranger",name:"月影弓手"},
  // 咒术 8
  {id:"zsj1",family:"warlock",name:"死灵法师"},{id:"zsj2",family:"warlock",name:"瘟疫使者"},
  {id:"zsj3",family:"warlock",name:"恶魔契约者"},{id:"zsj4",family:"warlock",name:"骨傀儡师"},
  {id:"zsj5",family:"warlock",name:"灵魂收割者"},{id:"zsj6",family:"warlock",name:"腐化先知"},
  {id:"zsj7",family:"warlock",name:"虫群主宰"},{id:"zsj8",family:"warlock",name:"深渊低语者"},
];
DATA.classById = {}; DATA.classes.forEach(c=>DATA.classById[c.id]=c);

/* ---- 英雄池（金币抽取） ---- */
DATA.rarity = {
  N:  {name:"普通", weight:55, mult:1.00},
  R:  {name:"稀有", weight:30, mult:1.15},
  SR: {name:"史诗", weight:12, mult:1.35},
  SSR:{name:"传说", weight:3,  mult:1.65},
};
DATA.heroNames = "阿隆,布蕾妮,卡德加,黛西,埃德蒙,菲奥娜,加洛,海拉,伊凡,婕拉,凯尔,莉安德,莫格,妮维,奥丁,潘妮,昆汀,萝丝,萨穆,塔莉亚,乌尔,薇拉,沃里克,希瓦,耶梦,佐伊,巴尔,克洛伊,丹恩,艾露维,芬恩,格罗姆,赫敏,伊格尼,杰斯,卡莎,卢恩,米拉,诺斯,欧泊,皮普,琦拉,雷恩,丝黛拉,托尔,乌娜,维克,温蒂,肖恩,亚丝,泽德".split(",");
DATA.heroFaces = {
  vanguard:["🗡️","⚔️","🪓","🔨"], mystic:["🔮","🧙","✨","🌙"],
  support:["💚","🎵","🌿","⛪"], guardian:["🛡️","🪨","⛰️","🏰"],
  ranger:["🏹","🎯","🦅","🌙"], warlock:["💀","🕷️","🐍","🦂"],
};
DATA.roles = { vanguard:"输出", mystic:"输出", ranger:"输出", warlock:"输出",
               support:"辅助", guardian:"坦克" };

/* ---- 技能模板 ---- */
DATA.skillByFamily = {
  vanguard:{ name:"裂地斩",  cd:6,  type:"dmg",   mult:2.2, desc:"对单体造成220%攻击伤害" },
  mystic:  { name:"奥术冲击",cd:7,  type:"aoe",   mult:1.4, desc:"对全体敌人造成140%伤害" },
  support: { name:"治愈祷言",cd:8,  type:"heal",  mult:1.8, desc:"治疗最虚弱队友180%攻击" },
  guardian:{ name:"钢铁壁垒",cd:10, type:"shield",mult:2.0, desc:"为全队附加200%攻击的护盾" },
  ranger:  { name:"穿云箭",  cd:5,  type:"dmg",   mult:2.6, desc:"对单体造成260%伤害,30%暴击" },
  warlock: { name:"蚀骨诅咒",cd:8,  type:"dot",   mult:0.8, desc:"全体敌人中毒,每跳80%伤害x3" },
};

/* ---- 敌人 ---- */
DATA.enemies = [
  {id:"e1", name:"腐尸鼠",   face:"🐀", hp:60,  atk:8,  family:"beast"},
  {id:"e2", name:"骷髅兵",   face:"💀", hp:90,  atk:12, family:"undead"},
  {id:"e3", name:"暗影蝙蝠", face:"🦇", hp:70,  atk:14, family:"beast"},
  {id:"e4", name:"毒雾蛛",   face:"🕷️", hp:110, atk:13, family:"beast"},
  {id:"e5", name:"诅咒教徒", face:"🧟", hp:130, atk:16, family:"undead"},
  {id:"e6", name:"深渊魔像", face:"🗿", hp:220, atk:18, family:"construct"},
];
DATA.elites = [
  {id:"el1", name:"墓穴领主", face:"👺", hp:400, atk:24, family:"undead"},
  {id:"el2", name:"荆棘巨魔", face:"🧌", hp:460, atk:26, family:"beast"},
];
DATA.bosses = [
  {id:"bo1", name:"深渊之眼", face:"👁️", hp:900,  atk:30, family:"void",
   enrageAt:0.3, enrageMult:2.0, warn:"BOSS狂暴！伤害翻倍，注意预留免伤！"},
  {id:"bo2", name:"腐朽古树", face:"🌳", hp:1200, atk:34, family:"beast",
   enrageAt:0.3, enrageMult:2.0, warn:"古树狂暴！藤蔓横扫全场！"},
];

/* ---- 装备 ---- */
DATA.equipSlots = ["武器","护甲","饰品"];
DATA.equipQuality = [
  {name:"白", mult:1.0, weight:50}, {name:"绿", mult:1.3, weight:28},
  {name:"蓝", mult:1.7, weight:14}, {name:"紫", mult:2.2, weight:6},
  {name:"橙", mult:3.0, weight:2},
];
DATA.equipAttrs = ["物穿","法穿","攻击","生命","暴击","防御"];

/* ---- 地图 ---- */
DATA.floors = ["幽暗密林","腐化墓穴","哀嚎矿洞","深渊回廊","湮灭王座"];
DATA.nodeTypes = {
  battle:{icon:"⚔️", label:"战斗"}, elite:{icon:"👹", label:"精英"},
  chest:{icon:"🎁", label:"宝箱"}, event:{icon:"❓", label:"事件"},
  rest:{icon:"🔥", label:"休整"}, boss:{icon:"💀", label:"BOSS"},
};

/* ---- 随机事件 ---- */
DATA.events = [
  { id:"ev1", title:"神秘路人", text:"一位披着斗篷的旅人拦住去路，低声说：『献上金币，或献上鲜血。』",
    choices:[
      {t:"给予100金币", sub:"获得随机祝福", need:{gold:100}, effect:{buff:"atk", val:0.15}},
      {t:"拔剑相向", sub:"触发战斗，胜利得双倍奖励", effect:{fight:"elite"}},
      {t:"绕道而行", sub:"无事发生", effect:{}},
    ]},
  { id:"ev2", title:"诡谲陷阱", text:"地面忽然亮起符文——是古老的麻痹陷阱！",
    choices:[
      {t:"强行突破", sub:"全队损失15%生命", effect:{hurt:0.15}},
      {t:"小心拆除", sub:"50%概率获得钢铁", effect:{gamble:"iron"}},
      {t:"原路返回", sub:"消耗10金币", need:{gold:10}, effect:{}},
    ]},
  { id:"ev3", title:"古老祭坛", text:"祭坛上燃烧着幽蓝魂火，似乎可以献祭换取力量。",
    choices:[
      {t:"献祭50魂火", sub:"灵魂经验+200", need:{soul:50}, effect:{soulExp:200}},
      {t:"汲取魂火", sub:"魂火+80，但全队受伤10%", effect:{gainSoul:80, hurt:0.10}},
      {t:"离开", sub:"", effect:{}},
    ]},
  { id:"ev4", title:"流浪铁匠", text:"一位独臂铁匠在篝火旁打盹，他的工具箱半开着。",
    choices:[
      {t:"购买装备(200金)", sub:"随机获得1件装备", need:{gold:200}, effect:{equip:1}},
      {t:"偷取工具", sub:"60%概率得钢铁x50，失败则战斗", effect:{steal:50}},
      {t:"离开", sub:"", effect:{}},
    ]},
];