(function(){
  if(!/[?&]embed=1/.test(location.search))return;
  const de=document.documentElement,pd=()=>{try{return parent.document.documentElement}catch(e){return null}};
  de.classList.add('emb');
  const MAP={'--bg':'--m-bg','--card':'--m-card','--soft':'--m-raised','--line':'--m-line','--ink':'--m-fg','--mute':'--m-muted','--or':'--m-accent','--ord':'--m-accent-fg','--onor':'--m-on-accent'};
  const sync=()=>{const p=pd();if(!p)return;de.setAttribute('data-theme',p.getAttribute('data-theme')==='light'?'light':'dark');
    try{const cs=parent.getComputedStyle(p);for(const k in MAP){const v=cs.getPropertyValue(MAP[k]).trim();if(v)de.style.setProperty(k,v);}
      const ac=cs.getPropertyValue('--m-accent').trim();if(ac)de.style.setProperty('--orsoft','color-mix(in srgb,'+ac+' 16%,'+cs.getPropertyValue('--m-card').trim()+')');
      const ff=parent.getComputedStyle(parent.document.body).fontFamily;if(ff)de.style.setProperty('--ff',ff);}catch(e){}};
  sync();const p=pd();if(p)new MutationObserver(sync).observe(p,{attributes:true,attributeFilter:['data-theme','data-tone','style']});
})();
