// Own the button animation so browser smooth-scroll settings cannot skip it.
const active=new WeakMap();
export function cancelRow(el){
  const state=active.get(el);if(!state)return;
  cancelAnimationFrame(state.frame);active.delete(el);el.classList.remove('is-scrolling');
}
export function animateRow(el,target,reduced=false){
  cancelRow(el);
  const destination=Math.max(0,Math.min(el.scrollWidth-el.clientWidth,target));
  if(reduced||Math.abs(destination-el.scrollLeft)<1){el.scrollTo({left:destination,behavior:'instant'});return;}
  const start=el.scrollLeft,delta=destination-start,state={frame:0},duration=Math.min(480,280+Math.abs(delta)*.12);
  let started;
  el.classList.add('is-scrolling');active.set(el,state);
  const tick=time=>{
    if(!el.isConnected){cancelRow(el);return;}
    started??=time;
    const progress=Math.min(1,(time-started)/duration),eased=1-(1-progress)**3;
    el.scrollTo({left:start+delta*eased,behavior:'instant'});
    if(progress<1)state.frame=requestAnimationFrame(tick);
    else{active.delete(el);el.classList.remove('is-scrolling');}
  };
  state.frame=requestAnimationFrame(tick);
}
