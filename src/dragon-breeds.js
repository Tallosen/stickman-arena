"use strict";
/* 34 explicit anatomical plans. Stable inventory IDs: 33 plans × 3 variants + 1.
   Plans differ in major anatomy, not just scale, a hue shift or an extra horn. */
const DRAGON_BREEDS=[
 {name:"Виверн",body:[1.15,.56,.44],wings:1,legs:2,tail:2.3,horns:2,feature:"wyvern",wingForm:"bat"},
 {name:"Небесный змей",body:[1.9,.31,.31],wings:0,legs:0,tail:3,horns:2,feature:"serpent",tailForm:"curl",neck:.35},
 {name:"Панцирный титан",body:[1.25,.65,.83],wings:0,legs:4,tail:1.2,horns:2,feature:"shell",height:1.05,neck:.35},
 {name:"Серафим",body:[.95,.45,.4],wings:3,legs:2,tail:2,horns:2,feature:"seraph",wingForm:"feather"},
 {name:"Гидра",body:[1.2,.57,.66],wings:0,legs:4,tail:2,horns:2,heads:3,feature:"hydra",neck:.95},
 {name:"Кристалликс",body:[.95,.6,.5],wings:2,legs:4,tail:2,horns:4,feature:"crystal",wingForm:"shard"},
 {name:"Левиафан",body:[1.7,.48,.6],wings:0,legs:0,tail:3,horns:1,feature:"flippers",tailForm:"paddle",neck:.25},
 {name:"Огненная птица",body:[.85,.6,.43],wings:1,legs:2,tail:2.3,horns:3,feature:"phoenix",wingForm:"feather",tailForm:"plumes"},
 {name:"Клинкокрыл",body:[1.1,.45,.36],wings:0,legs:4,tail:1.9,horns:2,feature:"mantis",neck:.9},
 {name:"Астральный страж",body:[.75,.62,.58],wings:1,legs:0,tail:1.5,horns:3,feature:"orbit",wingForm:"ring"},
 {name:"Гребнеспин",body:[1.45,.55,.5],wings:0,legs:4,tail:2.2,horns:0,feature:"sail",neck:.3},
 {name:"Молотоглав",body:[1.2,.5,.66],wings:1,legs:2,tail:1.8,horns:0,feature:"hammer",wingForm:"delta",headWidth:2.3,neck:.4},
 {name:"Шелкокрыл",body:[.8,.55,.58],wings:1,legs:4,tail:1.2,horns:0,feature:"moth",wingForm:"round",span:2.7},
 {name:"Небесный скат",body:[1.1,.23,.8],wings:1,legs:0,tail:3.1,horns:0,feature:"manta",wingForm:"delta",span:3.1,neck:.1},
 {name:"Тысячелап",body:[1.9,.37,.37],wings:0,legs:10,tail:1.9,horns:2,feature:"segments",height:1,neck:.45},
 {name:"Морской конёк",body:[.56,.9,.4],wings:0,legs:0,tail:2.1,horns:1,feature:"seahorse",tailForm:"coil",neck:1.1,headLength:.7},
 {name:"Громорог",body:[1.2,.72,.72],wings:0,legs:4,tail:1.4,horns:0,feature:"ram",headWidth:1.25,neck:.4},
 {name:"Лесной венценосец",body:[1.12,.43,.42],wings:0,legs:4,tail:1.6,horns:0,feature:"antlers",height:1.65,neck:.9},
 {name:"Королевская кобра",body:[1.55,.32,.3],wings:0,legs:0,tail:2.4,horns:0,feature:"cobra",tailForm:"curl",neck:1.1},
 {name:"Булавахвост",body:[1.2,.66,.72],wings:0,legs:4,tail:2.1,horns:2,feature:"club",height:1.05,neck:.3},
 {name:"Скорпион",body:[1.3,.4,.65],wings:0,legs:6,tail:2.4,horns:1,feature:"scorpion",tailForm:"scorpion",height:1.05,neck:.35},
 {name:"Костяной призрак",body:[1.3,.43,.43],wings:1,legs:4,tail:2.5,horns:2,feature:"skeleton",wingForm:"torn",headLength:1.2},
 {name:"Длинноух",body:[.8,.68,.53],wings:0,legs:2,tail:1,horns:0,feature:"ears",headWidth:1.2,neck:.4},
 {name:"Жук-носорог",body:[1,.7,.78],wings:1,legs:6,tail:.75,horns:0,feature:"beetle",wingForm:"narrow",height:1.1,neck:.3},
 {name:"Осьминог бездны",body:[.72,.72,.63],wings:0,legs:0,tail:.65,horns:0,feature:"tentacles",neck:.5},
 {name:"Аксолотль",body:[1.3,.36,.52],wings:0,legs:4,tail:2.4,horns:0,feature:"gills",tailForm:"paddle",height:1.1,neck:.3,headWidth:1.35},
 {name:"Трирог",body:[1.2,.66,.72],wings:0,legs:4,tail:1.5,horns:0,feature:"frill",neck:.35,headWidth:1.25},
 {name:"Мечерыл",body:[1.7,.35,.5],wings:0,legs:0,tail:2.3,horns:0,feature:"sword",tailForm:"paddle",neck:.15},
 {name:"Ушастый нетопырь",body:[.66,.56,.44],wings:1,legs:2,tail:1.15,horns:0,feature:"batEars",wingForm:"bat",span:3},
 {name:"Грибной хранитель",body:[1,.68,.65],wings:0,legs:4,tail:1.5,horns:0,feature:"mushroom",height:1.05,neck:.55},
 {name:"Двуликий",body:[1.2,.56,.62],wings:1,legs:4,tail:2,horns:2,heads:2,feature:"twins",tailForm:"fork",wingForm:"bat"},
 {name:"Стрекозавр",body:[1.7,.27,.28],wings:2,legs:6,tail:2.2,horns:0,feature:"dragonfly",wingForm:"narrow",span:2.7,neck:.25},
 {name:"Павлин",body:[.8,.58,.48],wings:1,legs:2,tail:1.2,horns:0,feature:"peacock",wingForm:"feather",span:1.6,neck:.8},
 {name:"Первозданный император",body:[1.15,.73,.65],wings:3,legs:4,tail:2.6,horns:0,feature:"emperor",wingForm:"shard",span:2.8,neck:1}
];
// Three coordinated colour regions: body / membranes & markings / horns & tips.
const DRAGON_PALETTES=[
 ["#397c68","#efdba6","#c56835"],["#385376","#b5d6d4","#d99755"],["#a86743","#728451","#eedcb4"],
 ["#dfcfb9","#808fb9","#b45775"],["#754477","#d7a08c","#b7cc83"],["#568da1","#cfc4e7","#e3b65d"],
 ["#263f5c","#5bafa8","#e1a586"],["#b64a35","#edb956","#563a68"],["#697635","#d6c975","#82414a"],
 ["#524976","#dbb484","#98bfb9"],["#88754e","#b8553b","#c9d3a2"],["#477a87","#dfb293","#523a58"],
 ["#ac7283","#e4d9b9","#586c48"],["#476883","#d4ceae","#c85b73"],["#976345","#cfb284","#507b67"],
 ["#e1b185","#83a5ad","#805474"],["#5a5262","#d7bd98","#b1643e"],["#4a7053","#c2a270","#d0c4dd"],
 ["#c59348","#393e62","#dbbeac"],["#767e69","#cb9a70","#775363"],["#733c4a","#d7a36e","#77aab1"],
 ["#d8cfb1","#63677e","#ac7055"],["#c6a0a1","#6d7f9b","#e2c175"],["#365e57","#b787a0","#d8bd62"],
 ["#796598","#c99777","#8fc7b3"],["#dea89f","#967bb0","#c4d38b"],["#9d754b","#5b8994","#ead1b2"],
 ["#527c9c","#c5cbbb","#b75446"],["#574d62","#ac7296","#d4ac74"],["#9b6a57","#b6c28e","#dcb899"],
 ["#59638f","#c39459","#a0c4ad"],["#3f9295","#d9c393","#965870"],["#477255","#566eaa","#d4ae60"],
 ["#303947","#d2a653","#dfcebc"]
];
