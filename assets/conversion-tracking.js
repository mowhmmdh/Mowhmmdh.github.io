/* Site conversion tracking — GA4-ready, no ID is hard-coded until the owner provides the real measurement ID. */
(function(){
  const send=(name,params)=>{try{if(typeof gtag==='function')gtag('event',name,params||{});}catch(e){}};
  document.addEventListener('click',function(e){
    const a=e.target.closest('a'); if(!a)return;
    const href=a.href||''; const text=(a.textContent||'').trim().slice(0,80);
    let type='internal';
    if(/linkedin\.com/i.test(href)) type='linkedin';
    else if(/github\.com/i.test(href)) type='github';
    else if(/instagram\.com/i.test(href)) type='instagram';
    else if(/^mailto:/i.test(href)) type='email';
    else if(/^tel:/i.test(href)) type='phone';
    else if(a.pathname && a.pathname.includes('request')) type='service_request';
    send('outbound_or_cta_click',{link_type:type,link_text:text,link_url:href});
  });
  const forms=document.querySelectorAll('form'); forms.forEach(f=>f.addEventListener('submit',()=>send('lead_form_submit',{form_id:f.id||'unknown'})));
})();
