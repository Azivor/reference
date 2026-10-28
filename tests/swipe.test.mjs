import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeDirection} from '../dist/swipe.mjs';
const gesture={dx:-85,dy:3,width:320,velocity:0};
test('a deliberate left drag advances one image',()=>assert.equal(swipeDirection(gesture),1));
test('a deliberate right drag goes back one image',()=>assert.equal(swipeDirection({...gesture,dx:85}),-1));
test('short drags settle back but a clear short flick advances',()=>{
  assert.equal(swipeDirection({...gesture,dx:-30}),0);
  assert.equal(swipeDirection({...gesture,dx:-30,velocity:-.7}),1);
  assert.equal(swipeDirection({...gesture,dx:-30,velocity:.7}),0);
});
test('vertical scrolling and tiny movements do not change images',()=>{
  assert.equal(swipeDirection({...gesture,dy:130}),0);
  assert.equal(swipeDirection({...gesture,dx:-8,velocity:-2}),0);
});
test('the first and last image do not wrap',()=>{
  assert.equal(swipeDirection({...gesture,dx:100,canPrevious:false}),0);
  assert.equal(swipeDirection({...gesture,canNext:false}),0);
});
test('large screens require a deliberate drag while narrow screens remain usable',()=>{
  assert.equal(swipeDirection({...gesture,dx:-60,width:1000}),0);
  assert.equal(swipeDirection({...gesture,dx:-60,width:232}),1);
});
