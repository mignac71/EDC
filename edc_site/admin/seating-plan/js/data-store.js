'use strict';
(function(exports){
 const key=()=>exports.SeatingTypes.storageKey;
 function loadPlans(){try{return JSON.parse(localStorage.getItem(key())||'[]')}catch{return []}}
 function savePlans(plans){localStorage.setItem(key(),JSON.stringify(plans))}
 function upsertPlan(plan){const plans=loadPlans();const i=plans.findIndex(p=>p.id===plan.id);if(i>=0)plans[i]=plan;else plans.push(plan);savePlans(plans);return plans}
 function deletePlan(id){savePlans(loadPlans().filter(p=>p.id!==id))}
 exports.SeatingStore={loadPlans,savePlans,upsertPlan,deletePlan};
})(window);
