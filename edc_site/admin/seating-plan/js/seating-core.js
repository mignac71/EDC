'use strict';
(function(exports){
 const uid=(p='id')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
 const clean=s=>(s||'').toString().trim().replace(/\s+/g,' ');
 function guestName(g){return clean(g.fullName)||clean(`${g.firstName||''} ${g.lastName||''}`)}
 function normalizeGuest(row){const full=clean(row.fullName||row['Full Name']||'');let first=clean(row.firstName||row['First Name']||''),last=clean(row.lastName||row['Last Name']||'');if(!first&&!last&&full){const parts=full.split(' ');first=parts.shift()||'';last=parts.join(' ')}return {id:row.id||uid('guest'),firstName:first,lastName:last,fullName:full||clean(`${first} ${last}`),country:clean(row.country||row.Country||''),company:clean(row.company||row.Company||''),position:clean(row.position||row.Position||''),group:clean(row.group||row.Group||''),language:clean(row.language||row.Language||''),vip:/^(true|yes|1|vip)$/i.test(String(row.vip||row.VIP||'')),notes:clean(row.notes||row.Notes||'')}}
 function createPlan(name='Untitled Seating Plan'){return {id:uid('plan'),name,version:1,updatedAt:new Date().toISOString(),event:{name,date:'',location:'',notes:'',defaultSeats:10},tables:[],guests:[],assignments:[],viewport:{scale:1,x:0,y:0}}}
 function createTable(number,seats=10,x=120,y=120){return {id:uid('table'),number,label:'',seats,x,y,notes:''}}
 function findAssignment(plan,guestId){return plan.assignments.find(a=>a.guestId===guestId)}
 function assignGuest(plan,guestId,tableId,seatNumber){const next=structuredClone(plan);next.assignments=next.assignments.filter(a=>a.guestId!==guestId&&!(a.tableId===tableId&&a.seatNumber===seatNumber));next.assignments.push({guestId,tableId,seatNumber});return touch(next)}
 function swapOrAssign(plan,guestId,tableId,seatNumber){const next=structuredClone(plan);const target=next.assignments.find(a=>a.tableId===tableId&&a.seatNumber===seatNumber);const current=next.assignments.find(a=>a.guestId===guestId);if(target&&current){target.tableId=current.tableId;target.seatNumber=current.seatNumber;current.tableId=tableId;current.seatNumber=seatNumber}else{return assignGuest(plan,guestId,tableId,seatNumber)}return touch(next)}
 function unassignGuest(plan,guestId){const next=structuredClone(plan);next.assignments=next.assignments.filter(a=>a.guestId!==guestId);return touch(next)}
 function availableSeats(plan){return plan.tables.reduce((s,t)=>s+t.seats,0)-plan.assignments.length}
 function stats(plan){const seats=plan.tables.reduce((s,t)=>s+t.seats,0),assigned=plan.assignments.length,total=plan.guests.length;return {total,assigned,unassigned:total-assigned,seats,available:seats-assigned,fill:seats?Math.round(assigned/seats*100):0}}
 function duplicateGuests(guests){const seen=new Map(),dups=[];guests.forEach(g=>{const k=guestName(g).toLowerCase();if(k){if(seen.has(k))dups.push(g);else seen.set(k,g.id)}});return dups}
 function validate(plan){const w=[];const s=stats(plan);if(s.total>s.seats)w.push('There are more guests than available seats.');if(duplicateGuests(plan.guests).length)w.push('Potential duplicate guests detected.');if(plan.tables.some(t=>t.seats===0))w.push('One or more tables have no seats.');if(plan.guests.some(g=>!g.firstName||!g.lastName))w.push('One or more guests are missing first or last name.');return w}
 function touch(plan){plan.updatedAt=new Date().toISOString();plan.version=(plan.version||0)+1;return plan}
 exports.SeatingCore={uid,clean,guestName,normalizeGuest,createPlan,createTable,assignGuest,swapOrAssign,unassignGuest,availableSeats,stats,duplicateGuests,validate,touch};
})(window);
if(typeof module!=='undefined') module.exports=global.window?window.SeatingCore:{};
