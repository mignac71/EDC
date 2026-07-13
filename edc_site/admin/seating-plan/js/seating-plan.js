'use strict';
(function(){
 const C=window.SeatingCore,S=window.SeatingStore,IE=window.SeatingImportExport;
 let plan,history=[],future=[],dirty=false,importGuests=[],selectedGuestId='';
 const $=s=>document.querySelector(s);

 function isMobile(){return window.innerWidth<=1050}
 function switchTab(name){document.body.dataset.tab=name;document.querySelectorAll('.mobile-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name))}
 function updateAssignBar(){const bar=$('#assignBar');if(!bar)return;if(selectedGuestId){const g=plan.guests.find(x=>x.id===selectedGuestId);if(g){$('#assignBarText').textContent='Assigning: '+C.guestName(g)+' \u2014 Tap a chair';bar.classList.remove('hidden');document.body.classList.add('assigning');return}}bar.classList.add('hidden');document.body.classList.remove('assigning')}

 function push(next){history.push(structuredClone(plan)); if(history.length>20)history.shift(); future=[]; plan=next; dirty=true; render(); scheduleSave()}
 let timer;
 function scheduleSave(){clearTimeout(timer); var ss=$('#saveStatus');if(ss)ss.textContent='Unsaved changes'; timer=setTimeout(save,700)}

 async function save(){
  commitEventForm();
  var ss=$('#saveStatus');
  try{
   await S.upsertPlan(plan);
   dirty=false;
   if(ss)ss.textContent='Saved '+new Date().toLocaleTimeString();
  }catch(err){
   if(ss)ss.textContent='Save failed: '+err.message;
  }
  renderPlans();
  renderWarnings();
 }

 function renderPlans(){var plans=S.getCache(); var ps=$('#planSelect');if(!ps)return; ps.innerHTML=plans.map(function(p){return '<option value="'+p.id+'" '+(plan&&p.id===plan.id?'selected':'')+'>'+p.name+'</option>';}).join('')}
 function render(){renderPlans(); renderStats(); renderWarnings(); renderGuests(); renderCanvas(); renderEvent(); updateAssignBar(); var ub=$('#undoBtn');if(ub)ub.disabled=!history.length; var rb=$('#redoBtn');if(rb)rb.disabled=!future.length}
 function renderStats(){var st=$('#stats');if(!st||!plan)return;var s=C.stats(plan); st.innerHTML=[['All Guests',s.total],['Assigned Guests',s.assigned],['Unassigned Guests',s.unassigned],['All Seats',s.seats],['Available Seats',s.available],['Filled',s.fill+'%']].map(function(x){return '<article><strong>'+x[1]+'</strong><span>'+x[0]+'</span></article>';}).join('')}
 function renderWarnings(){var wl=$('#warnings');if(!wl||!plan)return;var w=C.validate(plan); if(dirty)w.push('There are unsaved changes.'); wl.innerHTML=w.map(function(x){return '<p>\u26a0 '+x+'</p>';}).join('')}
 function assignedIds(){return new Set(plan.assignments.map(function(a){return a.guestId}))}
 function unassignedGuests(){var ids=assignedIds();return plan.guests.filter(function(g){return !ids.has(g.id)}).sort(function(a,b){return C.guestName(a).localeCompare(C.guestName(b))})}
 function optionHtml(items,valueFn,labelFn,empty){empty=empty||'Choose\u2026';return '<option value="">'+empty+'</option>'+items.map(function(item){return '<option value="'+valueFn(item)+'">'+labelFn(item)+'</option>';}).join('')}
 function emptySeatOptions(except){var seats=[];plan.tables.forEach(function(t){for(var i=1;i<=t.seats;i++){if(except&&except.tableId===t.id&&except.seatNumber===i)continue;if(!plan.assignments.some(function(a){return a.tableId===t.id&&a.seatNumber===i}))seats.push({tableId:t.id,seatNumber:i,label:(t.label||'Table '+t.number)+' \u00b7 Seat '+i})}});return seats}
 function renderGuests(){var gs=$('#guestSearch');if(!gs||!plan)return;var q=gs.value.toLowerCase(); var cf=$('#countryFilter').value,co=$('#companyFilter').value,gf=$('#groupFilter').value,vip=$('#vipFilter').checked; var guests=unassignedGuests().filter(function(g){return C.guestName(g).toLowerCase().includes(q)}).filter(function(g){return (!cf||g.country===cf)&&(!co||g.company===co)&&(!gf||g.group===gf)&&(!vip||g.vip)}).sort(function(a,b){return C.guestName(a).localeCompare(C.guestName(b))}); if(selectedGuestId&&!guests.some(function(g){return g.id===selectedGuestId}))selectedGuestId=''; $('#guestList').innerHTML=guests.map(function(g){return '<li draggable="true" data-guest="'+g.id+'" class="'+(g.id===selectedGuestId?'selected':'')+'"><strong>'+C.guestName(g)+'</strong><span>'+[g.company,g.country,g.vip?'VIP':''].filter(Boolean).join(' \u00b7 ')+'</span><small class="tap-hint">Tap, then tap a chair</small><button data-edit-guest="'+g.id+'">Edit</button><button data-remove-guest="'+g.id+'">\u00d7</button></li>';}).join(''); ['country','company','group'].forEach(function(f){var el=$('#'+f+'Filter'),cur=el.value; var vals=[...new Set(plan.guests.map(function(g){return g[f]}).filter(Boolean))].sort(); el.innerHTML='<option value="">All '+f+'s</option>'+vals.map(function(v){return '<option '+(v===cur?'selected':'')+'>'+v+'</option>';}).join('')})}
 function renderCanvas(){var canvas=$('#canvas');if(!canvas||!plan)return; canvas.style.transform='translate('+plan.viewport.x+'px,'+plan.viewport.y+'px) scale('+plan.viewport.scale+')'; canvas.innerHTML=plan.tables.map(function(t){return tableHtml(t)}).join('')}
 function tableHtml(t){var chairs=''; for(var i=1;i<=t.seats;i++){var a=plan.assignments.find(function(x){return x.tableId===t.id&&x.seatNumber===i}),g=a&&plan.guests.find(function(x){return x.id===a.guestId}); var ang=(i-1)/Math.max(t.seats,1)*Math.PI*2-Math.PI/2,x=90+Math.cos(ang)*78,y=90+Math.sin(ang)*78; chairs+='<button class="chair '+(g?'occupied':'')+'" style="left:'+x+'px;top:'+y+'px" data-table="'+t.id+'" data-seat="'+i+'" draggable="'+(!!g)+'" '+(g?'data-guest="'+g.id+'"':'')+' title="Seat '+i+'">'+i+'<small>'+(g?C.guestName(g):'')+'</small></button>'} return '<div class="table" data-table-box="'+t.id+'" style="left:'+t.x+'px;top:'+t.y+'px"><div class="table-core" data-table-details="'+t.id+'"><strong>'+(t.label||'Table '+t.number)+'</strong><span>'+plan.assignments.filter(function(a){return a.tableId===t.id}).length+'/'+t.seats+'</span></div>'+chairs+'</div>'}
 function renderEvent(){var f=$('#eventForm');if(!f||!plan)return; if(document.activeElement&&f.contains(document.activeElement))return; f.name.value=plan.event.name; f.date.value=plan.event.date; f.location.value=plan.event.location; f.tableCount.value=plan.tables.length; f.defaultSeats.value=plan.event.defaultSeats; f.notes.value=plan.event.notes}
 function details(html){var dp=$('#detailsPanel');if(dp)dp.innerHTML='<h2>Details</h2>'+html}
 function eventPlanFromForm(){var p=structuredClone(plan),f=$('#eventForm');p.event={name:f.name.value,date:f.date.value,location:f.location.value,notes:f.notes.value,defaultSeats:+f.defaultSeats.value||0}; var count=+f.tableCount.value||0; while(p.tables.length<count)p.tables.push(C.createTable(p.tables.length+1,p.event.defaultSeats,100,100)); if(p.tables.length>count){var removed=new Set(p.tables.slice(count).map(function(t){return t.id}));p.tables=p.tables.slice(0,count);p.assignments=p.assignments.filter(function(a){return !removed.has(a.tableId)})} return C.touch(p)}
 function commitEventForm(){if(!$('#eventForm'))return; plan=eventPlanFromForm()}

 /* ── App init: called after login, loads plans from DB ── */
 var _initDone=false;
 window.SeatingAppInit=async function(){
  if(_initDone)return;
  _initDone=true;
  var ss=$('#saveStatus');
  if(ss)ss.textContent='Loading plans from database\u2026';
  try{
   var plans=await S.loadPlans();
   if(plans.length){
    plan=plans[0];
   }else{
    plan=C.createPlan('EDC Seating Plan');
    await S.upsertPlan(plan);
   }
   bindApp();
   render();
   if(ss)ss.textContent='Loaded from database ('+S.getCache().length+' plans)';
  }catch(err){
   console.error('Init error:',err);
   if(ss)ss.textContent='DB error: '+err.message;
   plan=C.createPlan('EDC Seating Plan');
   bindApp();
   render();
  }
 };

 /* Auto-start if auth already happened before defer scripts loaded */
 if(window._seatingAuth){
  S.setAuth(window._seatingAuth.user,window._seatingAuth.pass);
  window.SeatingAppInit();
 }

 function bindApp(){
 ['guestSearch','countryFilter','companyFilter','groupFilter','vipFilter'].forEach(function(id){var el=$('#'+id);if(el)el.addEventListener('input',renderGuests)});
 var sb=$('#saveBtn');if(sb)sb.onclick=save;
 var np=$('#newPlan');if(np)np.onclick=async function(){var n=prompt('Plan name','New Seating Plan');if(!n)return;var p=C.createPlan(n);try{await S.upsertPlan(p);}catch(e){}plan=p;history=[];future=[];render()};
 var cp=$('#copyPlan');if(cp)cp.onclick=async function(){var p=structuredClone(plan);p.id=C.uid('plan');p.name+=' Copy';try{await S.upsertPlan(p);}catch(e){}plan=p;history=[];future=[];render()};
 var rp=$('#renamePlan');if(rp)rp.onclick=function(){var n=prompt('Plan name',plan.name); if(n){var p=structuredClone(plan);p.name=n;push(C.touch(p))}};
 var dp=$('#deletePlan');if(dp)dp.onclick=async function(){if(!confirm('Delete this plan?'))return;await S.deletePlan(plan.id);var plans=S.getCache();plan=plans[0]||C.createPlan('EDC Seating Plan');if(!plans.length)try{await S.upsertPlan(plan);}catch(e){}history=[];future=[];dirty=false;render()};
 var ps=$('#planSelect');if(ps)ps.onchange=async function(e){var plans=S.getCache();var found=plans.find(function(p){return p.id===e.target.value});if(found){plan=found;history=[];future=[];render()}};
 var ub=$('#undoBtn');if(ub)ub.onclick=function(){if(history.length){future.push(structuredClone(plan));plan=history.pop();dirty=true;render();scheduleSave()}};
 var rb=$('#redoBtn');if(rb)rb.onclick=function(){if(future.length){history.push(structuredClone(plan));plan=future.pop();dirty=true;render();scheduleSave()}};
 var at=$('#addTable');if(at)at.onclick=function(){var p=structuredClone(plan);p.tables.push(C.createTable(p.tables.length+1,p.event.defaultSeats,120+p.tables.length*40,140));push(C.touch(p))};
 var gt=$('#gridTables');if(gt)gt.onclick=function(){var p=structuredClone(plan);p.tables.forEach(function(t,i){t.x=80+(i%4)*240;t.y=80+Math.floor(i/4)*240});push(C.touch(p))};
 var rl=$('#resetLayout');if(rl&&gt)rl.onclick=gt.onclick;
 var zi=$('#zoomIn');if(zi)zi.onclick=function(){var p=structuredClone(plan);p.viewport.scale=Math.min(2,p.viewport.scale+.1);push(C.touch(p))};
 var zo=$('#zoomOut');if(zo)zo.onclick=function(){var p=structuredClone(plan);p.viewport.scale=Math.max(.45,p.viewport.scale-.1);push(C.touch(p))};
 var fv=$('#fitView');if(fv)fv.onclick=function(){var p=structuredClone(plan);p.viewport={scale:.8,x:0,y:0};push(C.touch(p))};
 var ef=$('#eventForm');if(ef)ef.addEventListener('change',function(){push(eventPlanFromForm())});
 var ag=$('#addGuest');if(ag)ag.onclick=function(){var n=prompt('Full Name'); if(n){var p=structuredClone(plan);p.guests.push(C.normalizeGuest({fullName:n}));push(C.touch(p))}};
 document.body.addEventListener('dragstart',function(e){var g=e.target.closest('[data-guest]'); if(g)e.dataTransfer.setData('text/plain',g.dataset.guest)});
 document.body.addEventListener('dragover',function(e){if(e.target.closest('.chair,#guestList'))e.preventDefault()});
 document.body.addEventListener('drop',function(e){e.preventDefault();var id=e.dataTransfer.getData('text/plain'),ch=e.target.closest('.chair'); if(ch&&id){selectedGuestId='';push(C.swapOrAssign(plan,id,ch.dataset.table,+ch.dataset.seat))} else if(e.target.closest('#guestList')&&id){selectedGuestId='';push(C.unassignGuest(plan,id))}});
 document.body.addEventListener('click',function(e){var guestItem=e.target.closest('#guestList [data-guest]'); if(guestItem&&!e.target.closest('button')){selectedGuestId=selectedGuestId===guestItem.dataset.guest?'':guestItem.dataset.guest;renderGuests();updateAssignBar();if(selectedGuestId&&isMobile())switchTab('plan');return} var _eb=e.target.closest('[data-edit-guest]');if(_eb){var g=plan.guests.find(function(x){return x.id===_eb.dataset.editGuest});if(g){var n=prompt('Edit name',C.guestName(g));if(n!==null&&C.clean(n)){var p=structuredClone(plan),ng=p.guests.find(function(x){return x.id===g.id}),_n=C.normalizeGuest({fullName:n});ng.firstName=_n.firstName;ng.lastName=_n.lastName;ng.fullName=_n.fullName;push(C.touch(p))}}return} var _rb=e.target.closest('[data-remove-guest]');if(_rb){if(confirm('Remove this guest?')){var p2=structuredClone(plan);p2.guests=p2.guests.filter(function(x){return x.id!==_rb.dataset.removeGuest});p2.assignments=p2.assignments.filter(function(a){return a.guestId!==_rb.dataset.removeGuest});push(C.touch(p2))}return} var t=e.target.closest('[data-table-details]'); if(t){var table=plan.tables.find(function(x){return x.id===t.dataset.tableDetails}); details('<label>Table Number<input id="dNum" type="number" value="'+table.number+'"></label><label>Name<input id="dLabel" value="'+(table.label||'')+'"></label><label>Seats<input id="dSeats" type="number" value="'+table.seats+'"></label><label>Notes<textarea id="dNotes">'+(table.notes||'')+'</textarea></label><p>Occupied seats: '+plan.assignments.filter(function(a){return a.tableId===table.id}).length+'</p><button id="applyTable">Apply</button><button id="removeTable" class="danger">Remove Table</button>'); $('#applyTable').onclick=function(){var p3=structuredClone(plan),nt=p3.tables.find(function(x){return x.id===table.id}),newSeats=+$('#dSeats').value||0;if(plan.assignments.some(function(a){return a.tableId===table.id&&a.seatNumber>newSeats})){alert('Move assigned guests before reducing seats.');return} nt.number=+$('#dNum').value;nt.label=$('#dLabel').value;nt.seats=newSeats;nt.notes=$('#dNotes').value;push(C.touch(p3))}; $('#removeTable').onclick=function(){if(confirm('Remove table and assignments?')){var p4=structuredClone(plan);p4.tables=p4.tables.filter(function(x){return x.id!==table.id});p4.assignments=p4.assignments.filter(function(a){return a.tableId!==table.id});push(C.touch(p4))}} if(isMobile())switchTab('settings')} var ch=e.target.closest('.chair'); if(ch){if(selectedGuestId){var id=selectedGuestId;selectedGuestId='';push(C.swapOrAssign(plan,id,ch.dataset.table,+ch.dataset.seat));if(isMobile()&&unassignedGuests().length)setTimeout(function(){switchTab('guests')},350);return} if(isMobile())switchTab('settings');showSeatDetails(ch)} });
 document.body.addEventListener('pointerdown',function(e){var box=e.target.closest('[data-table-box]'); if(!box||e.target.closest('.chair'))return; var id=box.dataset.tableBox,startX=e.clientX,startY=e.clientY,t=plan.tables.find(function(x){return x.id===id}),ox=t.x,oy=t.y; box.setPointerCapture(e.pointerId); box.onpointermove=function(ev){box.style.left=ox+(ev.clientX-startX)/plan.viewport.scale+'px';box.style.top=oy+(ev.clientY-startY)/plan.viewport.scale+'px'}; box.onpointerup=function(ev){var p=structuredClone(plan),nt=p.tables.find(function(x){return x.id===id});nt.x=ox+(ev.clientX-startX)/plan.viewport.scale;nt.y=oy+(ev.clientY-startY)/plan.viewport.scale;box.onpointermove=null;push(C.touch(p))}});
 var imf=$('#importFile');if(imf)imf.onchange=async function(e){var file=e.target.files[0]; if(!file)return; $('#confirmImport').disabled=true; $('#importPreview').textContent='Reading '+file.name+'\u2026'; try{var parsed;if(/\.txt$/i.test(file.name))parsed=IE.parseTxt(await file.text());else if(/\.csv$/i.test(file.name))parsed=IE.parseDelimited(await file.text());else if(/\.xlsx?$/i.test(file.name)){if(!window.XLSX)throw new Error('Excel parser is still loading. Please try again in a moment.');var data=await file.arrayBuffer();var wb=XLSX.read(data,{type:'array'});var sheet=wb.Sheets[wb.SheetNames[0]];var rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});parsed={headers:Object.keys(rows[0]||{}).map(IE.normalizeHeader),rows}}else throw new Error('Unsupported file type. Use XLS, XLSX, CSV or TXT.'); var a=IE.analyzeRows(parsed.rows,plan.guests); importGuests=a.guests; $('#importPreview').innerHTML='<p>'+a.guests.length+' records \u00b7 Columns: '+(parsed.headers.join(', ')||'none')+'</p><p>'+a.invalid.length+' invalid \u00b7 '+a.duplicates.length+' duplicates</p>'; $('#confirmImport').disabled=!a.guests.length}catch(err){importGuests=[];$('#importPreview').textContent=err.message||'Could not import this file.'}};
 var ci=$('#confirmImport');if(ci)ci.onclick=function(){var p=structuredClone(plan);var existing=new Set(p.guests.map(function(g){return C.guestName(g).toLowerCase()}).filter(Boolean));var unique=[];importGuests.forEach(function(g){var name=C.guestName(g).toLowerCase();if(name&&!existing.has(name)){existing.add(name);unique.push(g)}});p.guests.push.apply(p.guests,unique);importGuests=[];$('#confirmImport').disabled=true;$('#importFile').value='';$('#importPreview').textContent=unique.length+' guests imported.';push(C.touch(p))};
 var ec=$('#exportCsv');if(ec)ec.onclick=function(){download('seating-plan.csv',IE.toCsv(plan),'text/csv')};
 var ex=$('#exportXlsx');if(ex)ex.onclick=function(){var ws=XLSX.utils.aoa_to_sheet(IE.toCsv(plan).split('\n').map(function(r){return r.split(',')}));var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Guests');XLSX.writeFile(wb,'seating-plan.xlsx')};
 var ep=$('#exportPdf');if(ep)ep.onclick=function(){window.print()};
 var mt=$('.mobile-tabs');if(mt)mt.onclick=function(e){if(!e.target.dataset.tab)return;switchTab(e.target.dataset.tab)};
 var _acb=$('#assignBarCancel');if(_acb)_acb.onclick=function(){selectedGuestId='';updateAssignBar();renderGuests()};
 }

 function showSeatDetails(ch){
  var seat={tableId:ch.dataset.table,seatNumber:+ch.dataset.seat};
  var table=plan.tables.find(function(t){return t.id===seat.tableId}),assignment=plan.assignments.find(function(x){return x.tableId===seat.tableId&&x.seatNumber===seat.seatNumber}),guest=assignment&&plan.guests.find(function(x){return x.id===assignment.guestId});
  var unassigned=unassignedGuests();
  if(!guest){
   details('<p><strong>'+(table?table.label||'Table '+table.number:'')+'</strong></p><p>Seat Number: '+seat.seatNumber+'</p><p>Available seat</p><label>Assign unassigned guest<select id="assignGuestSelect">'+optionHtml(unassigned,function(g){return g.id},function(g){return C.guestName(g)},unassigned.length?'Choose guest\u2026':'No unassigned guests')+'</select></label><button id="assignGuestBtn" class="primary" '+(unassigned.length?'':'disabled')+'>Assign to this seat</button>');
   $('#assignGuestBtn').onclick=function(){var id=$('#assignGuestSelect').value;if(id)push(C.assignGuest(plan,id,seat.tableId,seat.seatNumber))};
   return;
  }
  var emptySeats=emptySeatOptions(seat);
  details('<p><strong>'+(table?table.label||'Table '+table.number:'')+'</strong></p><p>Seat Number: '+seat.seatNumber+'</p><p>Assigned guest: <strong>'+C.guestName(guest)+'</strong></p><label>Change seat<select id="moveSeatSelect">'+optionHtml(emptySeats,function(s){return s.tableId+'|'+s.seatNumber},function(s){return s.label},emptySeats.length?'Choose empty seat\u2026':'No empty seats')+'</select></label><button id="moveGuestBtn" '+(emptySeats.length?'':'disabled')+'>Move guest</button><label>Reseat with unassigned guest<select id="replaceGuestSelect">'+optionHtml(unassigned,function(g){return g.id},function(g){return C.guestName(g)},unassigned.length?'Choose guest\u2026':'No unassigned guests')+'</select></label><button id="replaceGuestBtn" '+(unassigned.length?'':'disabled')+'>Seat selected guest here</button><button id="unassign" class="danger">Remove guest from chair</button>');
  $('#moveGuestBtn').onclick=function(){var value=$('#moveSeatSelect').value;if(!value)return;var parts=value.split('|');push(C.assignGuest(plan,guest.id,parts[0],+parts[1]))};
  $('#replaceGuestBtn').onclick=function(){var id=$('#replaceGuestSelect').value;if(id)push(C.assignGuest(plan,id,seat.tableId,seat.seatNumber))};
  $('#unassign').onclick=function(){push(C.unassignGuest(plan,guest.id))};
 }

 function download(name,content,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
})();
