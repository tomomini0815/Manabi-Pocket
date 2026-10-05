import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("dist");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. .nojekyll を配置（_build や assets が Jekyll によって除外されるのを防止）
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

const indexPath = path.join(outDir, "index.html");
const fallback404Path = path.join(outDir, "404.html");

// 2. 404.html を index.html からコピー（SPA ルーティング対応）
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallback404Path);
}

console.log("GitHub Pages preparation completed successfully for dist/.");
