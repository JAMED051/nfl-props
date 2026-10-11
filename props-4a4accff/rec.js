
(function(){
  var KEY='nflpropsRec', LOG='nflpropsRecLog';
  function g(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function s(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
  function toast(msg,bad){
    var d=document.createElement('div');d.textContent=msg;d.setAttribute('role','status');
    d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:'+(bad?'#9A2B22':'#1E6B40')+
      ';color:#fff;padding:12px 16px;border-radius:10px;font:15px/1.4 system-ui,sans-serif;z-index:99;max-width:90vw;'+
      'box-shadow:0 4px 16px rgba(0,0,0,.3)';
    document.body.appendChild(d);setTimeout(function(){d.remove();},5500);
  }
  var m=location.hash.match(/rec=([A-Za-z0-9]{16,64})/);
  if(m){
    var ok=s(KEY,m[1]);
    history.replaceState(null,'',location.pathname+location.search);
    toast(ok?'Record bet is on for this phone.':'Could not save. Turn off Private Browsing in Safari and open the link again.',!ok);
  }
  if(location.hash==='#rec-off'){
    try{localStorage.removeItem(KEY);}catch(e){}
    history.replaceState(null,'',location.pathname+location.search);
    toast('Record bet is off for this phone.');
  }
  var topic=g(KEY); if(!topic) return;

  var st=document.createElement('style');
  st.textContent='.rec{padding:0 18px 16px}.slip .rec{padding:12px 0 0}'+
    '.rec .recbtn{font:inherit;font-size:15px;font-weight:600;width:100%;padding:10px;border-radius:8px;border:2px solid var(--over,#1E6B40);'+
    'background:transparent;color:var(--over,#1E6B40);cursor:pointer}'+
    '.rec .recform{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
    '.rec label{font-size:13px;color:var(--muted,#5E6B66);display:flex;flex-direction:column;gap:4px}'+
    '.rec input{font:inherit;font-size:17px;padding:8px;border-radius:8px;border:1px solid var(--rule,#D6DDD9);'+
    'background:var(--surface,#fff);color:var(--ink,#16202A);width:100%;box-sizing:border-box}'+
    '.rec .row2{grid-column:1/-1;display:flex;gap:8px}'+
    '.rec .save{flex:1;font:inherit;font-weight:600;padding:10px;border:0;border-radius:8px;background:var(--over,#1E6B40);color:var(--bg,#fff);cursor:pointer}'+
    '.rec .cancel{font:inherit;padding:10px 14px;border-radius:8px;border:1px solid var(--rule,#D6DDD9);background:transparent;color:var(--ink,#16202A);cursor:pointer}'+
    '.rec .done{font-size:14px;color:var(--over,#1E6B40);font-weight:600}'+
    '.rec .again{font:inherit;font-size:13px;background:none;border:0;color:var(--muted,#5E6B66);text-decoration:underline;cursor:pointer;padding:0;margin-left:6px}';
  document.head.appendChild(st);

  var log={}; try{log=JSON.parse(g(LOG)||'{}');}catch(e){}
  function rid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
  function payout(el){var t=(el&&el.textContent)||'';var x=t.match(/pays about ([+-]\d+)/);return x?x[1]:'';}
  function fo(o){o=+o;return o>0?'+'+o:''+o;}

  function send(payload,cb){
    fetch('https://ntfy.sh/'+topic,{method:'POST',body:JSON.stringify(payload)})
      .then(function(r){cb(r.ok);}).catch(function(){cb(false);});
  }

  function widget(host,opts){
    var box=document.createElement('div');box.className='rec';host.appendChild(box);
    function idle(){
      var prev=opts.key&&log[opts.key];
      if(prev){
        box.innerHTML='<span class="done">Recorded $'+prev.st+(prev.od?' at '+fo(prev.od):'')+'</span>'+
          '<button type="button" class="again">Change</button>';
        box.querySelector('.again').onclick=open;
      } else {
        box.innerHTML='<button type="button" class="recbtn">Record bet</button>';
        box.querySelector('.recbtn').onclick=open;
      }
    }
    function open(){
      var od=opts.odds();
      box.innerHTML='<div class="recform">'+
        '<label>Stake ($)<input type="number" inputmode="decimal" min="0" step="0.01" class="st" placeholder="5"></label>'+
        '<label>FanDuel odds<input type="text" inputmode="numbers-and-punctuation" class="od" value="'+(od||'')+'" placeholder="+550"></label>'+
        '<div class="row2"><button type="button" class="save">Save bet</button><button type="button" class="cancel">Cancel</button></div></div>';
      var stI=box.querySelector('.st'), odI=box.querySelector('.od');
      stI.focus();
      box.querySelector('.cancel').onclick=idle;
      box.querySelector('.save').onclick=function(){
        var stv=parseFloat(stI.value), odt=(odI.value||'').replace(/\s/g,'');
        if(!(stv>0)){toast('Enter how much you bet.',true);return;}
        if(odt&&!/^[+-]?\d{3,6}$/.test(odt)){toast('Odds look like +550 or -110.',true);return;}
        var odv=odt?parseInt(odt,10):'';
        if(odv!==''&&Math.abs(odv)<100){toast('Odds look like +550 or -110.',true);return;}
        var payload=opts.payload(); if(!payload){toast('Add legs to your slip first.',true);return;}
        payload.v=1;payload.st=stv;payload.od=odv;payload.r=rid();
        var btn=box.querySelector('.save');btn.disabled=true;btn.textContent='Saving...';
        send(payload,function(ok){
          if(!ok){btn.disabled=false;btn.textContent='Save bet';toast('Not sent. Check your signal and try again.',true);return;}
          if(opts.key){log[opts.key]={st:stv,od:odv};s(LOG,JSON.stringify(log));}
          toast('Recorded. Your laptop logs it within 2 hours.');
          if(opts.key) idle(); else box.innerHTML='<span class="done">Recorded $'+stv+(odv?' at '+fo(odv):'')+'</span>';
        });
      };
    }
    idle();
  }

  // the model's parlays
  document.querySelectorAll('.ticket').forEach(function(t){
    var idEl=t.querySelector('.id'); var x=idEl&&idEl.textContent.match(/(\d{8}-\d+L(?:-\d+)?)/);
    if(!x) return;
    var bid=x[1];
    widget(t,{key:bid,odds:function(){return payout(t.querySelector('.fdpay'));},
      payload:function(){return {k:'m',id:bid};}});
  });

  // the build-your-own slip
  var slipBody=document.getElementById('slipbody');
  if(slipBody){
    function codeNow(){
      if(typeof window.slipCode==='function') return window.slipCode();
      var b=document.getElementById('trackslip'); if(!b) return null;
      b.click(); var ta=document.getElementById('trackcode'); return ta&&ta.value?ta.value:null;
    }
    function attach(){
      var foot=slipBody.querySelector('.foot');
      if(!foot||foot.querySelector('.rec')) return;
      widget(foot,{key:null,odds:function(){return payout(slipBody.querySelector('.fdline'));},
        payload:function(){var c=codeNow();return c?{k:'c',c:c}:null;}});
    }
    new MutationObserver(attach).observe(slipBody,{childList:true,subtree:true});
    attach();
  }
})();
