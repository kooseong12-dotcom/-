import test from 'node:test';
import assert from 'node:assert/strict';
import {assignCandidates} from '../src/workspace/auto-fuzzy.ts';
const step=(id,startTime,endTime,part)=>({id,title:id,description:'설명',startTime,endTime,partIds:[part]});
test('automatic candidates split at process boundaries and retain BOM mappings',()=>{const r=assignCandidates([step('a',0,5,'P1'),step('b',5,10,'P2')],[{start:3,end:7,confidence:'high'},{start:12,end:14}]);assert.equal(r.assignments.a[0].sourceStart,3);assert.equal(r.assignments.a[0].sourceEnd,5);assert.equal(r.assignments.b[0].sourceStart,0);assert.equal(r.assignments.b[0].sourceEnd,2);assert.equal(r.assignments.a[0].confidence,'review');assert.deepEqual(r.assignments.b[0].partIds,['P2']);assert.equal(r.unassigned.length,1);});
