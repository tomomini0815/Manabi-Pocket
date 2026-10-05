import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(".output/public");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. .nojekyll を配置（_build や assets が Jekyll によって除外されるのを防止）
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

const indexPath = path.join(outDir, "index.html");
const fallback404Path = path.join(outDir, "404.html");

// 2. index.html がない場合、assets から JS/CSS を検出して SPA 用 index.html を生成
if (!fs.existsSync(indexPath)) {
  const assetsDir = path.join(outDir, "assets");
  let jsFile = "";
  let cssFile = "";

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const mainJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
    const mainCss = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
    if (mainJs) jsFile = `./assets/${mainJs}`;
    if (mainCss) cssFile = `./assets/${mainCss}`;
  }

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>まなびポケット</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" />
  ${cssFile ? `<link rel="stylesheet" href="${cssFile}" />` : ""}
</head>
<body>
  <div id="root"></div>
  ${jsFile ? `<script type="module" src="${jsFile}"></script>` : ""}
</body>
</html>`;

  fs.writeFileSync(indexPath, html, "utf-8");
}

// 3. 404.html を index.html からコピー（SPA ルーティング対応）
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallback404Path);
}

console.log("GitHub Pages preparation completed successfully.");
