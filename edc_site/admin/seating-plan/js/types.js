'use strict';
/** @typedef {{id:string,firstName:string,lastName:string,fullName:string,country?:string,company?:string,position?:string,group?:string,language?:string,vip?:boolean,notes?:string}} SeatingGuest */
/** @typedef {{id:string,number:number,label?:string,seats:number,x:number,y:number,notes?:string}} SeatingTable */
/** @typedef {{guestId:string,tableId:string,seatNumber:number}} SeatingAssignment */
/** @typedef {{id:string,name:string,version:number,updatedAt:string,event:{name:string,date:string,location:string,notes:string,defaultSeats:number},tables:SeatingTable[],guests:SeatingGuest[],assignments:SeatingAssignment[],viewport:{scale:number,x:number,y:number,seatScale?:number}}} SeatingPlan */
window.SeatingTypes = { storageKey: 'edc.seatingPlans.v1' };
