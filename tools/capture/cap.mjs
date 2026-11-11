import { chromium } from "playwright-core";
import fs from "node:fs";
const [,, startS, endS, outDir] = process.argv; const FPS = 30;
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required","--mute-audio"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on("pageerror", e => console.log("pageerror:", e.message));
await p.addInitScript(() => {
  window.__vt = 0;
  const P = AudioContext.prototype, B = BaseAudioContext.prototype;
  Object.defineProperty(B, "currentTime", { get() { return window.__vt; }, configurable: true });
  Object.defineProperty(P, "outputLatency", { get() { return 0; }, configurable: true });
  Object.defineProperty(P, "baseLatency", { get() { return 0; }, configurable: true });
  P.getOutputTimestamp = function () { return { contextTime: window.__vt, performanceTime: window.__vt * 1000 }; };
  performance.now = () => window.__vt * 1000;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf(() => cb(window.__vt * 1000));
});
await p.goto(process.env.URL);
await p.waitForFunction(() => { const b = document.querySelector("button.primary"); return b && !b.disabled; }, null, { timeout: 60000 });
await p.waitForTimeout(1500);
await p.click("button.primary");
const nextFrames = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
const s = Number(startS), e = Number(endS);
const t0 = Date.now();
for (let i = s; i < e; i++) {
  await p.evaluate(v => { window.__vt = v; }, i / FPS);
  await nextFrames();
  await p.screenshot({ path: `${outDir}/f${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
}
console.log("frames", e - s, "secs", (Date.now() - t0) / 1000);
await b.close();
