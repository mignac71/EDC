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
 function scheduleSave(){clearTimeout(timer); const ss=$('#saveStatus');if(ss)ss.textContent='Unsaved changes'; timer=setTimeout(save,700)}

 async function save(){
  commitEventForm();
  const ss=$('#saveStatus');
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

 function renderPlans(){const plans=S.getCache(); const ps=$('#planSelect');if(!ps)return; ps.innerHTML=plans.map(p=>`<option value="${p.id}" ${plan&&p.id===plan.id?'selected':''}>${p.name}</option>`).join('')}
 function render(){renderPlans(); renderStats(); renderWarnings(); renderGuests(); renderCanvas(); renderEvent(); updateAssignBar(); const ub=$('#undoBtn');if(ub)ub.disabled=!history.length; const rb=$('#redoBtn');if(rb)rb.disabled=!future.length}
 function renderStats(){const st=$('#stats');if(!st||!plan)return;const s=C.stats(plan); st.innerHTML=[['All Guests',s.total],['Assigned Guests',s.assigned],['Unassigned Guests',s.unassigned],['All Seats',s.seats],['Available Seats',s.available],['Filled',s.fill+'%']].map(x=>`<article><strong>${x[1]}</strong><span>${x[0]}</span></article>`).join('')}
 function renderWarnings(){const wl=$('#warnings');if(!wl||!plan)return;const w=C.validate(plan); if(dirty)w.push('There are unsaved changes.'); wl.innerHTML=w.map(x=>`<p>⚠ ${x}</p>`).join('')}
 function assignedIds(){return new Set(plan.assignments.map(a=>a.guestId))}
 function unassignedGuests(){const ids=assignedIds();return plan.guests.filter(g=>!ids.has(g.id)).sort((a,b)=>C.guestName(a).localeCompare(C.guestName(b)))}
 function optionHtml(items,valueFn,labelFn,empty='Choose…'){return `<option value="">${empty}</option>`+items.map(item=>`<option value="${valueFn(item)}">${labelFn(item)}</option>`).join('')}
 function emptySeatOptions(except){const seats=[];plan.tables.forEach(t=>{for(let i=1;i<=t.seats;i++){if(except&&except.tableId===t.id&&except.seatNumber===i)continue;if(!plan.assignments.some(a=>a.tableId===t.id&&a.seatNumber===i))seats.push({tableId:t.id,seatNumber:i,label:`${t.label||'Table '+t.number} · Seat ${i}`})}});return seats}
 function renderGuests(){const gs=$('#guestSearch');if(!gs||!plan)return;const q=gs.value.toLowerCase(); const cf=$('#countryFilter').value,co=$('#companyFilter').value,gf=$('#groupFilter').value,vip=$('#vipFilter').checked; let guests=unassignedGuests().filter(g=>C.guestName(g).toLowerCase().includes(q)).filter(g=>(!cf||g.country===cf)&&(!co||g.company===co)&&(!gf||g.group===gf)&&(!vip||g.vip)).sort((a,b)=>C.guestName(a).localeCompare(C.guestName(b))); if(selectedGuestId&&!guests.some(g=>g.id===selectedGuestId))selectedGuestId=''; $('#guestList').innerHTML=guests.map(g=>`<li draggable="true" data-guest="${g.id}" class="${g.id===selectedGuestId?'selected':''}"><strong>${C.guestName(g)}</strong><span>${[g.company,g.country,g.vip?'VIP':''].filter(Boolean).join(' · ')}</span><small class="tap-hint">Tap, then tap a chair</small><button data-edit-guest="${g.id}">Edit</button><button data-remove-guest="${g.id}">×</button></li>`).join(''); ['country','company','group'].forEach(f=>{const el=$(`#${f}Filter`),cur=el.value; const vals=[...new Set(plan.guests.map(g=>g[f]).filter(Boolean))].sort(); el.innerHTML='<option value="">All '+f+'s</option>'+vals.map(v=>`<option ${v===cur?'selected':''}>${v}</option>`).join('')})}
 function renderCanvas(){const canvas=$('#canvas');if(!canvas||!plan)return; canvas.style.transform=`translate(${plan.viewport.x}px,${plan.viewport.y}px) scale(${plan.viewport.scale})`; canvas.innerHTML=plan.tables.map(t=>tableHtml(t)).join('')}
 function tableHtml(t){let chairs=''; for(let i=1;i<=t.seats;i++){const a=plan.assignments.find(x=>x.tableId===t.id&&x.seatNumber===i),g=a&&plan.guests.find(x=>x.id===a.guestId); const ang=(i-1)/Math.max(t.seats,1)*Math.PI*2-Math.PI/2,x=90+Math.cos(ang)*78,y=90+Math.sin(ang)*78; chairs+=`<button class="chair ${g?'occupied':''}" style="left:${x}px;top:${y}px" data-table="${t.id}" data-seat="${i}" draggable="${!!g}" ${g?`data-guest="${g.id}"`:''} title="Seat ${i}">${i}<small>${g?C.guestName(g):''}</small></button>`} return `<div class="table" data-table-box="${t.id}" style="left:${t.x}px;top:${t.y}px"><div class="table-core" data-table-details="${t.id}"><strong>${t.label||'Table '+t.number}</strong><span>${plan.assignments.filter(a=>a.tableId===t.id).length}/${t.seats}</span></div>${chairs}</div>`}
 function renderEvent(){const f=$('#eventForm');if(!f||!plan)return; if(document.activeElement&&f.contains(document.activeElement))return; f.name.value=plan.event.name; f.date.value=plan.event.date; f.location.value=plan.event.location; f.tableCount.value=plan.tables.length; f.defaultSeats.value=plan.event.defaultSeats; f.notes.value=plan.event.notes}
 function details(html){const dp=$('#detailsPanel');if(dp)dp.innerHTML='<h2>Details</h2>'+html}
 function eventPlanFromForm(){const p=structuredClone(plan),f=$('#eventForm');p.event={name:f.name.value,date:f.date.value,location:f.location.value,notes:f.notes.value,defaultSeats:+f.defaultSeats.value||0}; const count=+f.tableCount.value||0; while(p.tables.length<count)p.tables.push(C.createTable(p.tables.length+1,p.event.defaultSeats,100,100)); if(p.tables.length>count){const removed=new Set(p.tables.slice(count).map(t=>t.id));p.tables=p.tables.slice(0,count);p.assignments=p.assignments.filter(a=>!removed.has(a.tableId))} return C.touch(p)}
 function commitEventForm(){if(!$('#eventForm'))return; plan=eventPlanFromForm()}

 /* ── App init: called after login, loads plans from DB ── */
 window.SeatingAppInit=async function(){
  const ss=$('#saveStatus');
  if(ss)ss.textContent='Loading plans from database…';
  try{
   const plans=await S.loadPlans();
   if(plans.length){
    plan=plans[0];
   }else{
    plan=C.createPlan('EDC Seating Plan');
    await S.upsertPlan(plan);
   }
   bindApp();
   render();
   if(ss)ss.textContent='Loaded from database';
  }catch(err){
   console.error('Init error:',err);
   plan=C.createPlan('EDC Seating Plan');
   bindApp();
   render();
   if(ss)ss.textContent='DB unavailable – working offline';
  }
 };

 function bindApp(){
 ['guestSearch','countryFilter','companyFilter','groupFilter','vipFilter'].forEach(id=>{const el=$(`#${id}`);if(el)el.addEventListener('input',renderGuests)});
 const sb=$('#saveBtn');if(sb)sb.onclick=save;
 const np=$('#newPlan');if(np)np.onclick=async()=>{const n=prompt('Plan name','New Seating Plan');if(!n)return;const p=C.createPlan(n);try{await S.upsertPlan(p);}catch(e){}plan=p;history=[];future=[];render()};
 const cp=$('#copyPlan');if(cp)cp.onclick=async()=>{const p=structuredClone(plan);p.id=C.uid('plan');p.name+=' Copy';try{await S.upsertPlan(p);}catch(e){}plan=p;history=[];future=[];render()};
 const rp=$('#renamePlan');if(rp)rp.onclick=()=>{const n=prompt('Plan name',plan.name); if(n){const p=structuredClone(plan);p.name=n;push(C.touch(p))}};
 const dp=$('#deletePlan');if(dp)dp.onclick=async()=>{if(!confirm('Delete this plan?'))return;await S.deletePlan(plan.id);const plans=S.getCache();plan=plans[0]||C.createPlan('EDC Seating Plan');if(!plans.length)try{await S.upsertPlan(plan);}catch(e){}history=[];future=[];dirty=false;render()};
 const ps=$('#planSelect');if(ps)ps.onchange=async e=>{const plans=S.getCache();const found=plans.find(p=>p.id===e.target.value);if(found){plan=found;history=[];future=[];render()}else{try{const loaded=await S.loadPlans();const f2=loaded.find(p=>p.id===e.target.value);if(f2){plan=f2;history=[];future=[];render()}}catch(err){}}};
 const ub=$('#undoBtn');if(ub)ub.onclick=()=>{if(history.length){future.push(structuredClone(plan));plan=history.pop();dirty=true;render();scheduleSave()}};
 const rb=$('#redoBtn');if(rb)rb.onclick=()=>{if(future.length){history.push(structuredClone(plan));plan=future.pop();dirty=true;render();scheduleSave()}};
 const at=$('#addTable');if(at)at.onclick=()=>{const p=structuredClone(plan);p.tables.push(C.createTable(p.tables.length+1,p.event.defaultSeats,120+p.tables.length*40,140));push(C.touch(p))};
 const gt=$('#gridTables');if(gt)gt.onclick=()=>{const p=structuredClone(plan);p.tables.forEach((t,i)=>{t.x=80+(i%4)*240;t.y=80+Math.floor(i/4)*240});push(C.touch(p))};
 const rl=$('#resetLayout');if(rl)rl.onclick=gt?.onclick;
 const zi=$('#zoomIn');if(zi)zi.onclick=()=>{const p=structuredClone(plan);p.viewport.scale=Math.min(2,p.viewport.scale+.1);push(C.touch(p))};
 const zo=$('#zoomOut');if(zo)zo.onclick=()=>{const p=structuredClone(plan);p.viewport.scale=Math.max(.45,p.viewport.scale-.1);push(C.touch(p))};
 const fv=$('#fitView');if(fv)fv.onclick=()=>{const p=structuredClone(plan);p.viewport={scale:.8,x:0,y:0};push(C.touch(p))};
 const ef=$('#eventForm');if(ef)ef.addEventListener('change',()=>push(eventPlanFromForm()));
 const ag=$('#addGuest');if(ag)ag.onclick=()=>{const n=prompt('Full Name'); if(n){const p=structuredClone(plan);p.guests.push(C.normalizeGuest({fullName:n}));push(C.touch(p))}};
 document.body.addEventListener('dragstart',e=>{const g=e.target.closest('[data-guest]'); if(g)e.dataTransfer.setData('text/plain',g.dataset.guest)});
 document.body.addEventListener('dragover',e=>{if(e.target.closest('.chair,#guestList'))e.preventDefault()});
 document.body.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain'),ch=e.target.closest('.chair'); if(ch&&id){selectedGuestId='';push(C.swapOrAssign(plan,id,ch.dataset.table,+ch.dataset.seat))} else if(e.target.closest('#guestList')&&id){selectedGuestId='';push(C.unassignGuest(plan,id))}});
 document.body.addEventListener('click',e=>{const guestItem=e.target.closest('#guestList [data-guest]'); if(guestItem&&!e.target.closest('button')){selectedGuestId=selectedGuestId===guestItem.dataset.guest?'':guestItem.dataset.guest;renderGuests();updateAssignBar();if(selectedGuestId&&isMobile())switchTab('plan');return} const _eb=e.target.closest('[data-edit-guest]');if(_eb){const g=plan.guests.find(x=>x.id===_eb.dataset.editGuest);if(g){const n=prompt('Edit name',C.guestName(g));if(n!==null&&C.clean(n)){const p=structuredClone(plan),ng=p.guests.find(x=>x.id===g.id),_n=C.normalizeGuest({fullName:n});ng.firstName=_n.firstName;ng.lastName=_n.lastName;ng.fullName=_n.fullName;push(C.touch(p))}}return} const _rb=e.target.closest('[data-remove-guest]');if(_rb){if(confirm('Remove this guest?')){const p=structuredClone(plan);p.guests=p.guests.filter(x=>x.id!==_rb.dataset.removeGuest);p.assignments=p.assignments.filter(a=>a.guestId!==_rb.dataset.removeGuest);push(C.touch(p))}return} const t=e.target.closest('[data-table-details]'); if(t){const table=plan.tables.find(x=>x.id===t.dataset.tableDetails); details(`<label>Table Number<input id="dNum" type="number" value="${table.number}"></label><label>Name<input id="dLabel" value="${table.label||''}"></label><label>Seats<input id="dSeats" type="number" value="${table.seats}"></label><label>Notes<textarea id="dNotes">${table.notes||''}</textarea></label><p>Occupied seats: ${plan.assignments.filter(a=>a.tableId===table.id).length}</p><button id="applyTable">Apply</button><button id="removeTable" class="danger">Remove Table</button>`); $('#applyTable').onclick=()=>{const p=structuredClone(plan),nt=p.tables.find(x=>x.id===table.id),newSeats=+$('#dSeats').value||0;if(plan.assignments.some(a=>a.tableId===table.id&&a.seatNumber>newSeats)){alert('Move assigned guests before reducing seats.');return} nt.number=+$('#dNum').value;nt.label=$('#dLabel').value;nt.seats=newSeats;nt.notes=$('#dNotes').value;push(C.touch(p))}; $('#removeTable').onclick=()=>{if(confirm('Remove table and assignments?')){const p=structuredClone(plan);p.tables=p.tables.filter(x=>x.id!==table.id);p.assignments=p.assignments.filter(a=>a.tableId!==table.id);push(C.touch(p))}} if(isMobile())switchTab('settings')} const ch=e.target.closest('.chair'); if(ch){if(selectedGuestId){const id=selectedGuestId;selectedGuestId='';push(C.swapOrAssign(plan,id,ch.dataset.table,+ch.dataset.seat));if(isMobile()&&unassignedGuests().length)setTimeout(()=>switchTab('guests'),350);return} if(isMobile())switchTab('settings');showSeatDetails(ch)} });
 document.body.addEventListener('pointerdown',e=>{const box=e.target.closest('[data-table-box]'); if(!box||e.target.closest('.chair'))return; const id=box.dataset.tableBox,startX=e.clientX,startY=e.clientY,t=plan.tables.find(x=>x.id===id),ox=t.x,oy=t.y; box.setPointerCapture(e.pointerId); box.onpointermove=ev=>{box.style.left=ox+(ev.clientX-startX)/plan.viewport.scale+'px';box.style.top=oy+(ev.clientY-startY)/plan.viewport.scale+'px'}; box.onpointerup=ev=>{const p=structuredClone(plan),nt=p.tables.find(x=>x.id===id);nt.x=ox+(ev.clientX-startX)/plan.viewport.scale;nt.y=oy+(ev.clientY-startY)/plan.viewport.scale;box.onpointermove=null;push(C.touch(p))}});
 const imf=$('#importFile');if(imf)imf.onchange=async e=>{const file=e.target.files[0]; if(!file)return; $('#confirmImport').disabled=true; $('#importPreview').textContent='Reading '+file.name+'…'; try{let parsed;if(/\.txt$/i.test(file.name))parsed=IE.parseTxt(await file.text());else if(/\.csv$/i.test(file.name))parsed=IE.parseDelimited(await file.text());else if(/\.xlsx?$/i.test(file.name)){if(!window.XLSX)throw new Error('Excel parser is still loading. Please try again in a moment.');const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:'array'});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});parsed={headers:Object.keys(rows[0]||{}).map(IE.normalizeHeader),rows}}else throw new Error('Unsupported file type. Use XLS, XLSX, CSV or TXT.'); const a=IE.analyzeRows(parsed.rows,plan.guests); importGuests=a.guests; $('#importPreview').innerHTML=`<p>${a.guests.length} records · Columns: ${parsed.headers.join(', ')||'none'}</p><p>${a.invalid.length} invalid · ${a.duplicates.length} duplicates</p>`; $('#confirmImport').disabled=!a.guests.length}catch(err){importGuests=[];$('#importPreview').textContent=err.message||'Could not import this file.'}};
 const ci=$('#confirmImport');if(ci)ci.onclick=()=>{const p=structuredClone(plan);const existing=new Set(p.guests.map(g=>C.guestName(g).toLowerCase()).filter(Boolean));const unique=[];importGuests.forEach(g=>{const name=C.guestName(g).toLowerCase();if(name&&!existing.has(name)){existing.add(name);unique.push(g)}});p.guests.push(...unique);importGuests=[];$('#confirmImport').disabled=true;$('#importFile').value='';$('#importPreview').textContent=unique.length+' guests imported.';push(C.touch(p))};
 const ec=$('#exportCsv');if(ec)ec.onclick=()=>download('seating-plan.csv',IE.toCsv(plan),'text/csv');
 const ex=$('#exportXlsx');if(ex)ex.onclick=()=>{const ws=XLSX.utils.aoa_to_sheet(IE.toCsv(plan).split('\n').map(r=>r.split(',')));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Guests');XLSX.writeFile(wb,'seating-plan.xlsx')};
 const ep=$('#exportPdf');if(ep)ep.onclick=()=>window.print();
 const mt=$('.mobile-tabs');if(mt)mt.onclick=e=>{if(!e.target.dataset.tab)return;switchTab(e.target.dataset.tab)};
 const _acb=$('#assignBarCancel');if(_acb)_acb.onclick=()=>{selectedGuestId='';updateAssignBar();renderGuests()};
 }

 function showSeatDetails(ch){
  const seat={tableId:ch.dataset.table,seatNumber:+ch.dataset.seat};
  const table=plan.tables.find(t=>t.id===seat.tableId),assignment=plan.assignments.find(x=>x.tableId===seat.tableId&&x.seatNumber===seat.seatNumber),guest=assignment&&plan.guests.find(x=>x.id===assignment.guestId);
  const unassigned=unassignedGuests();
  if(!guest){
   details(`<p><strong>${table?.label||'Table '+(table?.number||'')}</strong></p><p>Seat Number: ${seat.seatNumber}</p><p>Available seat</p><label>Assign unassigned guest<select id="assignGuestSelect">${optionHtml(unassigned,g=>g.id,g=>C.guestName(g),unassigned.length?'Choose guest…':'No unassigned guests')}</select></label><button id="assignGuestBtn" class="primary" ${unassigned.length?'':'disabled'}>Assign to this seat</button>`);
   $('#assignGuestBtn').onclick=()=>{const id=$('#assignGuestSelect').value;if(id)push(C.assignGuest(plan,id,seat.tableId,seat.seatNumber))};
   return;
  }
  const emptySeats=emptySeatOptions(seat);
  details(`<p><strong>${table?.label||'Table '+(table?.number||'')}</strong></p><p>Seat Number: ${seat.seatNumber}</p><p>Assigned guest: <strong>${C.guestName(guest)}</strong></p><label>Change seat<select id="moveSeatSelect">${optionHtml(emptySeats,s=>`${s.tableId}|${s.seatNumber}`,s=>s.label,emptySeats.length?'Choose empty seat…':'No empty seats')}</select></label><button id="moveGuestBtn" ${emptySeats.length?'':'disabled'}>Move guest</button><label>Reseat with unassigned guest<select id="replaceGuestSelect">${optionHtml(unassigned,g=>g.id,g=>C.guestName(g),unassigned.length?'Choose guest…':'No unassigned guests')}</select></label><button id="replaceGuestBtn" ${unassigned.length?'':'disabled'}>Seat selected guest here</button><button id="unassign" class="danger">Remove guest from chair</button>`);
  $('#moveGuestBtn').onclick=()=>{const value=$('#moveSeatSelect').value;if(!value)return;const [tableId,seatNumber]=value.split('|');push(C.assignGuest(plan,guest.id,tableId,+seatNumber))};
  $('#replaceGuestBtn').onclick=()=>{const id=$('#replaceGuestSelect').value;if(id)push(C.assignGuest(plan,id,seat.tableId,seat.seatNumber))};
  $('#unassign').onclick=()=>push(C.unassignGuest(plan,guest.id));
 }

 function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
})();
