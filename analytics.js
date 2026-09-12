/* Central analytics event layer. Set GA_MEASUREMENT_ID to the real GA4 Web stream ID before enabling. */
window.MOW_ANALYTICS = window.MOW_ANALYTICS || {};
window.MOW_ANALYTICS.track = function(name, params){
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
};
document.addEventListener('click', function(e){
  var a=e.target.closest && e.target.closest('a'); if(!a) return;
  var href=a.href||'';
  var eventName=null;
  if(href.indexOf('linkedin.com')>-1) eventName='linkedin_click';
  else if(href.indexOf('github.com')>-1) eventName='github_click';
  else if(href.indexOf('instagram.com')>-1) eventName='instagram_click';
  else if(href.indexOf('mailto:')===0) eventName='email_click';
  else if(href.indexOf('tel:')===0) eventName='phone_click';
  else if(a.matches('.cta, .btn, [data-conversion]')) eventName='cta_click';
  if(eventName) window.MOW_ANALYTICS.track(eventName,{link_url:href,link_text:(a.textContent||'').trim().slice(0,100)});
});
