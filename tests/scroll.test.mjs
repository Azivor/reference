import test from 'node:test';
import assert from 'node:assert/strict';
import {animateRow,cancelRow} from '../dist/scroll.mjs';

test('row paging animates, retargets, cancels, and supports reduced motion',()=>{
  const frames=new Map();let id=0;
  globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  const classes=new Set(),positions=[];
  const row={scrollLeft:0,scrollWidth:2000,clientWidth:500,isConnected:true,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
    scrollTo:({left,behavior})=>{assert.equal(behavior,'instant');row.scrollLeft=left;positions.push(left);}};
  const tick=time=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));};
  animateRow(row,500);tick(0);tick(100);
  assert.ok(row.scrollLeft>0&&row.scrollLeft<500,'intermediate movement instead of an instant jump');
  const current=row.scrollLeft;
  animateRow(row,1000);tick(110);assert.equal(row.scrollLeft,current,'rapid presses start from the current visual position');
  tick(610);assert.equal(row.scrollLeft,1000);assert.equal(classes.size,0);
  animateRow(row,1500);tick(620);tick(720);cancelRow(row);
  const stopped=row.scrollLeft;tick(1000);assert.equal(row.scrollLeft,stopped);assert.equal(frames.size,0);
  animateRow(row,5000,true);assert.equal(row.scrollLeft,1500);assert.equal(frames.size,0);
  animateRow(row,0);row.isConnected=false;tick(1100);assert.equal(classes.size,0);assert.equal(frames.size,0);
});
