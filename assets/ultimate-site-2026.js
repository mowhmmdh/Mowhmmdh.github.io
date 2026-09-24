/* Ultimate Site UX 2026 — local-only enhancements, accessible and dependency-free. */
(()=>{"use strict";
const d=document,html=d.documentElement,body=d.body;
const path=location.pathname;
const isFa=(html.lang||"fa").toLowerCase().startsWith("fa");
const labels=isFa?{home:"خانه",back:"بازگشت",theme:"تغییر پوسته",menu:"منو",crumb:"مسیر"}:{home:"Home",back:"Back",theme:"Toggle theme",menu:"Menu",crumb:"Breadcrumb"};
const root=d.createElement("div");root.className="ultimate-tools";root.innerHTML='<button type="button" id="u-theme" aria-label="'+labels.theme+'" title="'+labels.theme+'">◐</button>';
d.body.appendChild(root);
const saved=localStorage.getItem("ultimate-theme");
const preferred=matchMedia("(prefers-color-scheme:light)").matches?"light":"dark";
const setTheme=t=>{html.dataset.theme=t;localStorage.setItem("ultimate-theme",t);d.getElementById("u-theme").textContent=t==="light"?"☾":"☀"};
setTheme(saved||preferred);
d.getElementById("u-theme").addEventListener("click",()=>setTheme(html.dataset.theme==="light"?"dark":"light"));
/* Progress indicator */
const prog=d.createElement("div");prog.className="ultimate-progress";d.body.appendChild(prog);
const update=()=>{const max=d.documentElement.scrollHeight-innerHeight;prog.style.transform="scaleX("+(max>0?scrollY/max:0)+")"};addEventListener("scroll",update,{passive:true});addEventListener("resize",update);update();
/* Breadcrumb: only when it adds useful hierarchy; homepage gets none. */
if(path!=="/"&&!/\/404\.html$/.test(path)){
 const bc=d.createElement("nav");bc.className="ultimate-breadcrumb";bc.setAttribute("aria-label",labels.crumb);
 const parts=path.split("/").filter(Boolean), frag=d.createDocumentFragment();
 const home=d.createElement("a");home.href="/";home.textContent=labels.home;frag.appendChild(home);
 let acc="";
 parts.forEach((p,i)=>{const sep=d.createElement("span");sep.textContent="›";frag.appendChild(sep);acc+="/"+p;const a=d.createElement("a");a.href=acc;a.textContent=decodeURIComponent(p.replace(/\.html$/,"").replace(/[-_]+/g," "));if(i===parts.length-1)a.setAttribute("aria-current","page");frag.appendChild(a)});
 const main=d.querySelector("main");if(main)main.before(bc);
}
/* Back affordance on deeper pages */
if(path!=="/"&&!/404/.test(path)&&history.length>1){const b=d.createElement("button");b.className="ultimate-back";b.type="button";b.textContent="← "+labels.back;b.addEventListener("click",()=>history.back());d.body.appendChild(b)}
/* Improve external-link safety */
d.querySelectorAll('a[target="_blank"]').forEach(a=>{const r=(a.getAttribute("rel")||"").split(/\s+/).filter(Boolean);if(!r.includes("noopener"))r.push("noopener");if(!r.includes("noreferrer"))r.push("noreferrer");a.setAttribute("rel",[...new Set(r)].join(" "))});
/* Mark current navigation item */
d.querySelectorAll("nav a").forEach(a=>{try{const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname===location.pathname)a.setAttribute("aria-current","page")}catch{}});
/* Prevent accidental double-submit while preserving native forms. */
d.querySelectorAll("form").forEach(f=>f.addEventListener("submit",()=>{const b=f.querySelector('button[type="submit"],input[type="submit"]');if(b){b.dataset.original=b.textContent;b.disabled=true;setTimeout(()=>{b.disabled=false},8000)}}));
})();