import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { authOrigin, safeAuthPath } from '../lib/auth-redirect.ts';
import { preserveAuthResponse } from '../lib/auth-response.ts';
import { fetchWorkspaceTable, readAllPages, workspaceKey } from '../lib/workspace-data.ts';
import { applyWorkspaceChange } from '../lib/workspace-realtime.ts';

const origin='https://plan.example.com';
test('auth destinations reject external, protocol-relative, backslash and control-character redirects',()=>{
  for(const value of [null,'https://evil.test','//evil.test','///evil.test','/\\evil.test','/\nevil.test','/\tevil.test','javascript:alert(1)']) assert.equal(safeAuthPath(value,origin),'/');
  assert.equal(safeAuthPath('/app/courses?sort=name#results',origin),'/app/courses?sort=name#results');
  assert.equal(authOrigin('http://localhost:3000/auth/callback','https://plan.example.com/'),origin);
  assert.throws(()=>authOrigin(origin,'javascript:alert(1)'));
});
test('replacement responses retain session cookie attributes and cache restrictions',()=>{
  const cookies=[{name:'session',value:'',maxAge:0,path:'/',httpOnly:true,sameSite:'lax',secure:true}];
  const source={headers:new Headers({'cache-control':'private, no-store',pragma:'no-cache',expires:'0'}),cookies:{getAll:()=>cookies}};
  const copied=[];const target={headers:new Headers(),cookies:{set:cookie=>copied.push(cookie)}};
  assert.equal(preserveAuthResponse(source,target),target);assert.deepEqual(copied,cookies);
  for(const name of ['cache-control','pragma','expires'])assert.equal(target.headers.get(name),source.headers.get(name));
});
test('pagination includes rows beyond the API page limit, including exact multiples',async()=>{
  const rows=Array.from({length:1000},(_,id)=>({id}));const requests=[];
  const result=await readAllPages(async(from,to)=>{requests.push([from,to]);return rows.slice(from,to+1)});
  assert.deepEqual(result,rows);assert.deepEqual(requests,[[0,499],[500,999],[1000,1499]]);
});
test('pagination failures do not return a misleading partial total',async()=>{
  await assert.rejects(readAllPages(async from=>{if(from)throw Error('offline');return [1,2]},2),/offline/);
});
test('workspace queries scope rows to the account and propagate cancellation',async()=>{
  const calls=[];const controller=new AbortController();
  const query={select:value=>{calls.push(['select',value]);return query},eq:(key,value)=>{calls.push(['eq',key,value]);return query},order:()=>query,range:()=>query,returns:()=>query,abortSignal:signal=>{assert.equal(signal,controller.signal);return query},then:resolve=>resolve({data:[],error:null})};
  const client={from:table=>{assert.equal(table,'courses');return query}};
  assert.deepEqual(await fetchWorkspaceTable(client,'owner-a','courses',controller.signal),[]);
  assert.ok(calls.some(call=>call[0]==='eq'&&call[1]==='user_id'&&call[2]==='owner-a'));
  assert.ok(!calls.find(call=>call[0]==='select')[1].includes('editor_state'));
});
test('realtime isolates accounts, ignores unknown deletes, strips notes and ignores older updates',()=>{
  const cached=[{id:'course-a',user_id:'owner-a',name:'Original',created_at:'2026-01-01',updated_at:'2026-10-15T12:00:00Z'}];
  const event=(row,eventType='UPDATE')=>({eventType,new:row,old:{}});
  assert.equal(applyWorkspaceChange('courses',cached,event({id:'foreign',user_id:'owner-b'}),'owner-a'),cached);
  assert.equal(applyWorkspaceChange('courses',cached,{eventType:'DELETE',new:{},old:{id:'foreign'}},'owner-a'),cached);
  assert.equal(applyWorkspaceChange('courses',cached,event({...cached[0],name:'Old',updated_at:'2026-10-14T12:00:00Z'}),'owner-a'),cached);
  const changed=applyWorkspaceChange('courses',cached,event({...cached[0],name:'New',editor_state:{private:'large document'}}),'owner-a');
  assert.equal(changed[0].name,'New');assert.ok(!('editor_state' in changed[0]));
  assert.deepEqual(applyWorkspaceChange('courses',changed,{eventType:'DELETE',new:{},old:{id:'course-a'}},'owner-a'),[]);
  assert.equal(applyWorkspaceChange('preferences',{id:'p',user_id:'owner-a'},{eventType:'DELETE',new:{},old:{id:'p'}},'owner-a'),null);
});
test('cache deduplicates concurrent reads and separates accounts',async()=>{
  const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});let calls=0;
  const query=()=>cache.fetchQuery({queryKey:workspaceKey('a','courses'),queryFn:async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return ['a']}});
  assert.deepEqual(await Promise.all([query(),query()]),[['a'],['a']]);assert.equal(calls,1);
  assert.equal(cache.getQueryData(workspaceKey('b','courses')),undefined);cache.clear();
});
test('clearing the account cache aborts in-flight requests and discards their results',async()=>{
  const cache=new QueryClient();let aborted=false;
  const pending=cache.fetchQuery({queryKey:workspaceKey('a','courses'),queryFn:({signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'))});})}).catch(()=>{});
  cache.clear();await pending;assert.equal(aborted,true);assert.equal(cache.getQueryData(workspaceKey('a','courses')),undefined);
});
