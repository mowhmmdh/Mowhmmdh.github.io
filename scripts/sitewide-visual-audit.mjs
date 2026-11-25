import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const base = process.env.SITE_BASE_URL || 'http://127.0.0.1:4173';
const allHtml = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) allHtml.push(full);
  }
}
walk(root);
const pages = allHtml.filter(p => !p.endsWith(path.sep+'404.html'));
const issues = [];
const screenshots = path.join(root, 'visual-audit-artifacts');
fs.mkdirSync(screenshots, {recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const consoleErrors = new Map();
const checkPage = async (file, theme, viewport, capture=false) => {
  const relative = path.relative(root,file).split(path.sep).join('/');
  const url = base + '/' + relative;
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: '+e.message));
  page.on('console', msg => { if(msg.type()==='error') errors.push('console: '+msg.text()); });
  page.on('response', response => {
    if(response.url().startsWith(base) && response.status()>=400) errors.push('HTTP '+response.status()+': '+response.url());
  });
  await page.addInitScript(value => localStorage.setItem('mha-theme', value), theme);
  try {
    const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForTimeout(120);
    if(!response || !response.ok()) issues.push({page:relative,theme,viewport:viewport.width,issue:'page response '+(response?.status()??'none')});
    const state = await page.evaluate(() => ({
      title:document.title,
      lang:document.documentElement.lang,
      dir:document.documentElement.dir,
      theme:document.documentElement.dataset.theme || (document.documentElement.classList.contains('theme-light')?'light':'dark'),
      toggle:!!document.querySelector('.theme-toggle'),
      width:document.documentElement.scrollWidth,
      viewport:window.innerWidth,
      h1:!!document.querySelector('h1'),
      main:!!document.querySelector('main')
    }));
    if(!state.title) issues.push({page:relative,theme,issue:'missing title'});
    if(!state.lang || !state.dir) issues.push({page:relative,theme,issue:'missing lang/dir'});
    if(state.width>state.viewport+2) issues.push({page:relative,theme,viewport:viewport.width,issue:'horizontal overflow '+state.width+'px'});
    if(state.theme!==theme) issues.push({page:relative,theme,issue:'theme mismatch: '+state.theme});
    if(!state.toggle) issues.push({page:relative,theme,issue:'missing theme toggle'});
    if(!state.h1 && !relative.endsWith('sitemap.html')) issues.push({page:relative,theme,issue:'missing h1'});
    if(!state.main && !relative.endsWith('404.html')) issues.push({page:relative,theme,issue:'missing main'});
    if(capture) await page.screenshot({path:path.join(screenshots,relative.replaceAll('/','_')+'-'+theme+'-'+viewport.width+'.png'),fullPage:true,animations:'disabled'});
    if(errors.length) issues.push({page:relative,theme,issue:'browser errors',details:errors.slice(0,8)});
  } catch(e) {
    issues.push({page:relative,theme,issue:'navigation/test exception',details:e.message});
  } finally { await page.close(); }
};
for (const file of pages) {
  await checkPage(file,'dark',{width:1440,height:1000},['index.html','en.html','profile.html','en-profile.html','vintech.html','en-vintech.html'].includes(path.relative(root,file)));
  await checkPage(file,'light',{width:1440,height:1000},['index.html','en.html','profile.html','en-profile.html','vintech.html','en-vintech.html'].includes(path.relative(root,file)));
}
const mobileTargets = ['index.html','en.html','about.html','en-about.html','profile.html','en-profile.html','projects.html','en-projects.html','services.html','en-services.html','blog/index.html','en-blog.html','vintech.html','en-vintech.html','case-studies/index.html'];
for (const rel of mobileTargets) {
  const file=path.join(root,rel);
  if(!fs.existsSync(file)) continue;
  await checkPage(file,'dark',{width:390,height:844},true);
  await checkPage(file,'light',{width:390,height:844},true);
}
await browser.close();
const report={pagesScanned:pages.length,themePasses:pages.length*2,mobilePasses:mobileTargets.length*2,issueCount:issues.length,issues};
fs.writeFileSync(path.join(screenshots,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(issues.length) process.exitCode=1;
