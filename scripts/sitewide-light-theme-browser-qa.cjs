#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const http = require('node:http');

const ROOT = process.cwd();
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      let filePath = path.resolve(ROOT, '.' + pathname);
      const relative = path.relative(ROOT, filePath);
      if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      let stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      const body = await fs.promises.readFile(filePath);
      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(body);
    } catch (error) {
      const status = error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500;
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(status === 404 ? 'Not Found' : 'Internal Server Error');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve({ server, base: 'http://127.0.0.1:' + server.address().port });
    });
  });
}
const routes = execFileSync('git', ['ls-files', '*.html'], { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean).filter(p => p !== '404.html')
  .map(p => p.endsWith('/index.html') ? '/' + p.slice(0, -'index.html'.length) : p === 'index.html' ? '/' : '/' + p);
const viewports = [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}];

function rgb(value) {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  return m ? [+m[1],+m[2],+m[3]] : null;
}
function luminance(c) {
  const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});
  return .2126*v[0]+.7152*v[1]+.0722*v[2];
}
function contrast(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

(async()=>{
  fs.mkdirSync('qa-artifacts/light-theme',{recursive:true});
  const {server,base}=await startStaticServer();
  let browser=null;
  const failures=[], summary=[];
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    for(const vp of viewports) {
      const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},reducedMotion:'reduce'});
      await context.addInitScript(()=>{try{localStorage.setItem('mha-theme','light')}catch(_){}});
      const page=await context.newPage();
      for(const route of routes) {
        const errors=[];
        const failed=[];
        const onError=e=>errors.push(e.message);
        const onFailed=r=>{if(r.url().startsWith(base+'/'))failed.push(r.url())};
        page.on('pageerror',onError);
        page.on('requestfailed',onFailed);
        let status=0, snapshot=null;
        try {
          const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:45000});
          status=response?.status()||0;
          await page.evaluate(async()=>{await document.fonts.ready;return true});
          snapshot=await page.evaluate(()=>{
            const root=document.documentElement, body=document.body;
            const toggle=document.querySelector('.theme-toggle');
            const sheets=Array.from(document.styleSheets).map(s=>s.href||'');
            const bg=getComputedStyle(root).backgroundColor;
            const fg=getComputedStyle(body).color;
            const rect=body.getBoundingClientRect();
            const badImages=Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src);
            const samples=['h1','h2','p','a','button','.card','.service-card','.article'];
            const visible=samples.map(sel=>{
              const el=document.querySelector(sel);
              if(!el)return null;
              const s=getComputedStyle(el), r=el.getBoundingClientRect();
              return {selector:sel,color:s.color,background:s.backgroundColor,visible:r.width>0&&r.height>0};
            }).filter(Boolean);
            return {lang:root.lang,dir:root.dir,theme:root.classList.contains('theme-light')&&root.dataset.theme==='light',
              hasBundle:sheets.some(h=>h.includes('/assets/site-bundle.css')),
              hasThemeScript:Array.from(document.scripts).some(s=>(s.src||'').includes('/assets/site-theme.js')),
              hasToggle:!!toggle,background:bg,foreground:fg,scrollWidth:Math.max(root.scrollWidth,body.scrollWidth),
              viewport:innerWidth,badImages,visible};
          });
          if(snapshot.hasToggle) {
            const themeToggle = page.locator('.theme-toggle').first();
            await themeToggle.click();
            const dark=await page.evaluate(()=>!document.documentElement.classList.contains('theme-light'));
            await themeToggle.click();
            const light=await page.evaluate(()=>document.documentElement.classList.contains('theme-light'));
            snapshot.toggleRoundTrip=dark&&light;
          } else snapshot.toggleRoundTrip=null;
          await page.screenshot({path:path.join('qa-artifacts/light-theme',vp.name+'-'+route.replace(/^\//,'root-').replace(/[^a-z0-9._-]+/gi,'_')+'.png'),animations:'disabled'});
          const bg=rgb(snapshot.background),fg=rgb(snapshot.foreground);
          const ratio=bg&&fg?contrast(bg,fg):0;
          const problems=[];
          if(status!==200)problems.push('HTTP '+status);
          if(!snapshot.theme)problems.push('light theme not applied');
          if(!snapshot.hasBundle)problems.push('shared CSS missing');
          if(!snapshot.hasThemeScript)problems.push('theme script missing');
          if(snapshot.toggleRoundTrip===false)problems.push('theme toggle round-trip failed');
          if(snapshot.scrollWidth>snapshot.viewport+1)problems.push('horizontal overflow '+snapshot.scrollWidth+'/'+snapshot.viewport);
          if(!bg||!fg||ratio<4.5)problems.push('body text contrast below 4.5:1 ('+ratio.toFixed(2)+')');
          if(snapshot.badImages.length)problems.push('broken images '+snapshot.badImages.length);
          if(errors.length)problems.push('page errors '+errors.join(' | '));
          if(failed.length)problems.push('failed local requests '+failed.join(' | '));
          const item={viewport:vp.name,route,status,contrast:ratio.toFixed(2),...snapshot,errors,failed};
          summary.push(item);
          if(problems.length)failures.push({viewport:vp.name,route,problems,item});
        } catch(e) {
          failures.push({viewport:vp.name,route,problems:[e.message],status});
        } finally {
          page.off('pageerror',onError);page.off('requestfailed',onFailed);
        }
      }
      await context.close();
    }
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
  fs.writeFileSync('qa-artifacts/light-theme/sitewide-report.json',JSON.stringify({base,totalRoutes:routes.length,viewports:viewports.length,checked:summary.length,failures},null,2));
  console.log(JSON.stringify({base,totalRoutes:routes.length,checked:summary.length,failed:failures.length,failures:failures.slice(0,100)},null,2));
  if(failures.length)process.exitCode=1;
})();
