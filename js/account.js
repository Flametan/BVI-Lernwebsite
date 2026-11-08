/* ── Account-Menü auf der Startseite: Profil, Sync-Status, Schnellzugriffe, Hell/Dunkel ── */
const ACCOUNT=(function(){
  const NAME='bvi_profile_name', AV='bvi_avatar';
  const g=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const s=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} };
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const svg=(d,w)=>'<svg viewBox="0 0 24 24" width="'+(w||22)+'" height="'+(w||22)+'" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const IC={
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    set:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    save:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    tour:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    cam:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
  };
  let box=null;
  const name=()=>g(NAME)||'';
  const initials=()=>{ const n=name().trim(); return n?n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase():''; };
  const dark=()=>document.documentElement.getAttribute('data-theme')!=='light';
  const syncState=()=>typeof SYNC!=='undefined'?SYNC.info():{state:'off',text:'Nicht verbunden'};
  function avatarHtml(big){
    const a=g(AV), cls='acc-av'+(big?' acc-av-big':'');
    return a&&/^data:image\/jpeg;base64,/.test(a)?'<span class="'+cls+'" style="background-image:url('+a+')"></span>':'<span class="'+cls+'">'+(initials()||svg(IC.user,big?30:22))+'</span>';
  }
  function btnHtml(){
    return '<button type="button" class="m-hsearch m-hacc" aria-label="Account-Menü" title="Account" aria-haspopup="dialog" onclick="ACCOUNT.toggle(this)">'
      +(g(AV)?avatarHtml(false):svg(IC.user))+'<i class="acc-dot" data-sync-dot hidden></i></button>';
  }
  function dot(){
    const st=syncState();
    document.querySelectorAll('[data-sync-dot]').forEach(d=>{ d.hidden=st.state==='off'; d.dataset.state=st.state; d.title=st.text; });
  }
  function build(){
    box=document.createElement('div'); box.id='acc-ov'; box.hidden=true;
    box.innerHTML='<div class="acc-card" role="dialog" aria-label="Account"></div>';
    box.addEventListener('click',e=>{ if(e.target===box) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!box.hidden) close(); });
    document.body.appendChild(box);
  }
  function stats(){
    let h='';
    try{
      if(typeof GAME!=='undefined'&&GAME.isOn()){
        const st=GAME._streak(), xp=GAME._state().xp, r=GAME._ranks.filter(x=>xp>=x.xp).pop();
        h+='<span>🔥 '+(st&&st.cur||0)+'</span>'+(r?'<span>'+esc(r.n.split(' ')[0])+'</span>':'');
      }
    }catch(e){}
    return h;
  }
  function render(){
    const card=box.querySelector('.acc-card'), st=syncState(), nm=name();
    card.innerHTML='<div class="acc-ban"><div class="acc-stat">'+stats()+'</div></div>'
      +'<div class="acc-who"><button type="button" class="acc-avb" onclick="ACCOUNT.pick()" aria-label="Profilbild ändern">'+avatarHtml(true)+'<span class="acc-cam">'+svg(IC.cam,13)+'</span></button>'
      +'<div class="acc-nm"><button type="button" class="acc-name" onclick="ACCOUNT.rename()" title="Namen ändern">'+esc(nm||'Dein Name')+'</button>'
      +'<span class="acc-chip" data-state="'+st.state+'"><i></i>'+esc(st.text)+'</span></div></div>'
      +(g(AV)?'<button type="button" class="acc-rm" onclick="ACCOUNT.removeAvatar()">Bild entfernen</button>':'')
      +'<div class="acc-grid">'
      +'<button type="button" class="acc-g pri" onclick="ACCOUNT.go(\'sync\')"><i>'+svg(IC.login)+'</i>Sync</button>'
      +'<button type="button" class="acc-g" onclick="ACCOUNT.go(\'set\')"><i>'+svg(IC.set)+'</i>Einstell.</button>'
      +'<button type="button" class="acc-g" onclick="ACCOUNT.go(\'save\')"><i>'+svg(IC.save)+'</i>Sicherung</button>'
      +'<button type="button" class="acc-g" onclick="ACCOUNT.go(\'share\')"><i>'+svg(IC.share)+'</i>Teilen</button></div>'
      +'<div class="acc-r acc-dr"><span class="acc-ri">'+svg(IC.moon,20)+'</span><span class="acc-rt">Design</span></div>'
      +'<div class="acc-seg" role="group" aria-label="Design">'+[['dark','Dunkel'],['light','Hell'],['beige','Beige'],['system','Auto']].map(m=>'<button type="button" data-m="'+m[0]+'" aria-pressed="'+(THEME.get()===m[0])+'" onclick="ACCOUNT.theme(\''+m[0]+'\')">'+m[1]+'</button>').join('')+'</div>'
      +'<button type="button" class="acc-r" onclick="ACCOUNT.go(\'tour\')"><span class="acc-ri">'+svg(IC.tour,20)+'</span><span class="acc-rt">App vorstellen</span></button>'
      +'<a class="acc-r" href="'+SPENDE_URL+'" target="_blank" rel="noopener noreferrer"><span class="acc-ri">'+svg(IC.heart,20)+'</span><span class="acc-rt">Spenden</span></a>';
  }
  function place(btn){
    const vis=[...document.querySelectorAll('.m-hacc')].find(b=>b.getClientRects().length);
    const r=(btn&&btn.getClientRects().length?btn:vis)?.getBoundingClientRect(); const card=box.querySelector('.acc-card');
    const top=r?Math.round(r.bottom+10):70; card.style.top=top+'px';
    card.style.right=Math.max(8,Math.round(innerWidth-(r?r.right:innerWidth-16)))+'px';   // rechte Kante bündig mit dem Account-Knopf
  }
  function open(btn){ if(!box) build(); render(); box.hidden=false; place(btn); box.querySelector('.acc-g')?.focus({preventScroll:true}); }
  function close(){ if(box) box.hidden=true; }
  function toggle(btn){ if(box&&!box.hidden) close(); else open(btn); }
  function go(a){
    close();
    if(a==='sync') SYNC.open();
    else if(a==='set') NAV.go('v-settings','Einstellungen');
    else if(a==='save') BACKUP.export();
    else if(a==='share') APPSHARE.open();
    else if(a==='tour'&&typeof TOUR!=='undefined') TOUR.start('home');
  }
  function theme(m){ THEME.set(m); box.querySelectorAll('.acc-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m)); }
  function rename(){
    const b=box.querySelector('.acc-name'); if(!b) return;
    const inp=document.createElement('input'); inp.className='acc-in'; inp.maxLength=30; inp.value=name(); inp.placeholder='Dein Name'; inp.setAttribute('aria-label','Name');
    b.replaceWith(inp); inp.focus();
    const done=()=>{ const v=inp.value.replace(/[<>]/g,'').trim().slice(0,30); s(NAME,v||null); render(); refresh(); };
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') done(); if(e.key==='Escape'){ render(); } });
    inp.addEventListener('blur',done);
  }
  function pick(){
    const f=document.createElement('input'); f.type='file'; f.accept='image/*';
    f.onchange=()=>{
      const file=f.files&&f.files[0]; if(!file) return;
      const img=new Image(), url=URL.createObjectURL(file);
      img.onload=()=>{
        const n=128, c=document.createElement('canvas'); c.width=c.height=n;
        const m=Math.min(img.width,img.height), x=(img.width-m)/2, y=(img.height-m)/2;
        const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,n,n); ctx.drawImage(img,x,y,m,m,0,0,n,n);
        URL.revokeObjectURL(url);
        s(AV,c.toDataURL('image/jpeg',.82)); render(); refresh();
      };
      img.onerror=()=>{ URL.revokeObjectURL(url); TOAST.show('Das Bild konnte nicht gelesen werden'); };
      img.src=url;
    };
    f.click();
  }
  function removeAvatar(){ s(AV,null); render(); refresh(); }
  function refresh(){
    document.querySelectorAll('.m-hacc').forEach(b=>{ const d=b.querySelector('.acc-dot'); b.innerHTML=(g(AV)?avatarHtml(false):svg(IC.user)); b.appendChild(d); });
    dot();
  }
  function mount(){
    if(document.getElementById('acc-fab')) return;
    const f=document.createElement('div'); f.id='acc-fab'; f.innerHTML=btnHtml(); document.body.appendChild(f);
    dot();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  addEventListener('resize',()=>{ if(box&&!box.hidden) place(); });
  return {btnHtml,toggle,open,close,go,theme,rename,pick,removeAvatar,dot,refresh,NAME,AV};
})();
