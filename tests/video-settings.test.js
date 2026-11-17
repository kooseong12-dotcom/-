import test from 'node:test';
import assert from 'node:assert/strict';
import {containRect,validMask,enforceMuted} from '../src/video-settings.js';
test('masks align with contained source pixels rather than letterbox bars',()=>{assert.deepEqual(containRect(800,600,1600,900),{x:0,y:75,width:800,height:450});assert.deepEqual(containRect(800,450,450,800),{x:273.4375,y:0,width:253.125,height:450});});
test('invalid mask areas cannot be saved',()=>{assert.equal(validMask({x:75,y:0,width:25,height:12}),true);for(const mask of [{x:90,y:0,width:20,height:10},{x:0,y:0,width:0,height:10},{x:NaN,y:0,width:10,height:10}])assert.equal(validMask(mask),false);});
test('source audio is locked at mute and zero volume without native controls',()=>{const video={muted:false,volume:1,controls:true};enforceMuted(video);assert.equal(video.controls,false);assert.equal(video.muted,true);assert.equal(video.volume,0);video.muted=false;video.volume=1;video.onvolumechange();assert.equal(video.muted,true);assert.equal(video.volume,0);});
