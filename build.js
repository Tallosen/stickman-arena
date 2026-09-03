/* Сборка одного файла для публикации.
   Playables любит самодостаточный бандл — этот скрипт склеивает модули обратно.
   Запуск:  node build.js        Результат: dist/index.html                     */
const fs = require("fs");
const ORDER = ["core.js","config.js","pets.js","draw-pets.js","state.js","world.js",
               "update.js","cards.js","draw-hero.js","draw-foe.js","render.js","ui.js"];
const html = fs.readFileSync("index.html","utf8");
const code = ORDER.map(f =>
  `/* ===== ${f} ===== */\n` +
  fs.readFileSync("src/"+f,"utf8").replace(/^"use strict";\n/, "")
).join("\n");
const out = html.replace(/ *<script src="src\/[^"]+"><\/script>\n?/g, "")
                .replace("</body>", `  <script>\n"use strict";\n${code}\n  </script>\n</body>`);
fs.mkdirSync("dist",{recursive:true});
fs.writeFileSync("dist/index.html", out);
console.log("dist/index.html —", (out.length/1024).toFixed(1), "КБ");
