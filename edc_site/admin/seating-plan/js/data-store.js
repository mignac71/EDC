'use strict';
(function(exports){
 var _auth={username:'',password:''};
 var _cache=[];
 var _loaded=false;

 function setAuth(u,p){_auth={username:u||'',password:p||''};}

 function authBody(extra){
  var fd=new FormData();
  fd.set('username',_auth.username);
  fd.set('password',_auth.password);
  if(extra){Object.keys(extra).forEach(function(k){fd.set(k,extra[k]);});}
  return fd;
 }

 async function loadPlans(){
  var r=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingList'})});
  if(!r.ok){var t=await r.text().catch(function(){return ''});throw new Error('seatingList HTTP '+r.status+': '+t);}
  var list=await r.json();
  var plans=[];
  for(var i=0;i<list.length;i++){
   try{
    var r2=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingLoad',plan_id:list[i].id})});
    if(r2.ok){var p=await r2.json();plans.push(p);}
   }catch(e2){console.error('Failed to load plan '+list[i].id,e2);}
  }
  _cache=plans;
  _loaded=true;
  return plans;
 }

 function getCache(){return _cache;}

 async function upsertPlan(plan){
  var idx=_cache.findIndex(function(p){return p.id===plan.id;});
  if(idx>=0)_cache[idx]=plan;else _cache.push(plan);
  var r=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingSave',plan_json:JSON.stringify(plan)})});
  if(!r.ok){var t=await r.text().catch(function(){return ''});throw new Error('seatingSave HTTP '+r.status+': '+t);}
  return _cache;
 }

 async function deletePlan(id){
  _cache=_cache.filter(function(p){return p.id!==id;});
  var r=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingDelete',plan_id:id})});
  if(!r.ok){var t=await r.text().catch(function(){return ''});console.error('deletePlan error: HTTP '+r.status+': '+t);}
 }

 function isLoaded(){return _loaded;}

 exports.SeatingStore={setAuth:setAuth,loadPlans:loadPlans,getCache:getCache,upsertPlan:upsertPlan,deletePlan:deletePlan,isLoaded:isLoaded};
})(window);
