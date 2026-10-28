// Separate deliberate horizontal browsing from small or vertical gestures.
export function swipeDirection({dx,dy,width,velocity=0,canPrevious=true,canNext=true}){
  const distance=Math.abs(dx);
  if(distance<24||distance<Math.abs(dy)*1.2)return 0;
  const threshold=Math.min(96,Math.max(48,width*.2));
  if(distance<threshold&&(Math.abs(velocity)<.45||velocity*dx<=0))return 0;
  const direction=dx<0?1:-1;
  return (direction===1?canNext:canPrevious)?direction:0;
}
