'use strict';
(function(exports){
 let _auth={username:'',password:''};
 let _cache=[];   // in-memory mirror so sync reads work for render()
 let _loaded=false;

 function setAuth(u,p){_auth={username:u||'',password:p||''};}

 function authBody(extra){
  const fd=new FormData();
  fd.set('username',_auth.username);
  fd.set('password',_auth.password);
  Object.keys(extra||{}).forEach(function(k){fd.set(k,extra[k]);});
  return fd;
 }

 // Fetch plan list (metadata) from server, then load full data for each
 async function loadPlans(){
  try{
   const r=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingList'})});
   if(!r.ok)throw new Error('HTTP '+r.status);
   const list=await r.json();
   // Load full JSON for each plan
   const plans=[];
   for(const item of list){
    try{
     const r2=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingLoad',plan_id:item.id})});
     if(r2.ok){const p=await r2.json();plans.push(p);}
    }catch(e){console.error('Failed to load plan '+item.id,e);}
   }
   _cache=plans;
   _loaded=true;
   return plans;
  }catch(e){
   console.error('loadPlans error:',e);
   return _cache;
  }
 }

 // Synchronous read from cache (for render calls)
 function getCache(){return _cache;}

 async function upsertPlan(plan){
  // Update local cache immediately
  const i=_cache.findIndex(function(p){return p.id===plan.id;});
  if(i>=0)_cache[i]=plan;else _cache.push(plan);
  // Persist to DB
  try{
   const r=await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingSave',plan_json:JSON.stringify(plan)})});
   if(!r.ok)throw new Error('HTTP '+r.status);
   return _cache;
  }catch(e){
   console.error('upsertPlan error:',e);
   throw e;
  }
 }

 async function deletePlan(id){
  _cache=_cache.filter(function(p){return p.id!==id;});
  try{
   await fetch('/api/cms-save.php',{method:'POST',body:authBody({action:'seatingDelete',plan_id:id})});
  }catch(e){
   console.error('deletePlan error:',e);
  }
 }

 function isLoaded(){return _loaded;}

 exports.SeatingStore={setAuth:setAuth,loadPlans:loadPlans,getCache:getCache,upsertPlan:upsertPlan,deletePlan:deletePlan,isLoaded:isLoaded};
})(window);
