import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,applyAction,matchInvoice,replenishment} from '../engine.mjs';
import {createServer} from '../server.mjs';
test('partial receipts and price mismatches hold invoices',()=>{
 const s=seed();assert.equal(matchInvoice(s.orders[0]).quantityOk,false);assert.equal(matchInvoice(s.orders[2]).priceOk,false);
 assert.throws(()=>applyAction(s,{type:'match',id:'PO-1041'},'Accounts payable'),/exceeds received/);
 assert.throws(()=>applyAction(s,{type:'match',id:'PO-1043'},'Accounts payable'),/unit price/);
});
test('receipt recovery updates order and inventory once, then prevents replay',()=>{
 let s=seed();s=applyAction(s,{type:'map',external:'SUMMIT-LABS',canonical:'Summit Scientific'},'Buyer').state;
 s=applyAction(s,{type:'retry',id:'EVT-7001'},'Receiver').state;
 assert.equal(s.orders[0].received,20);assert.equal(s.inventory[0].onHand,16);assert.equal(s.inventory[0].onOrder,0);
 assert.equal(s.events[0].state,'Delivered');assert.throws(()=>applyAction(s,{type:'retry',id:'EVT-7001'},'Receiver'),/duplicate/);
 s=applyAction(s,{type:'match',id:'PO-1041'},'Accounts payable').state;assert.equal(s.orders[0].status,'Matched');
});
test('failed retry preserves inventory and records attempt',()=>{
 const original=seed();const s=applyAction(original,{type:'retry',id:'EVT-7001'},'Receiver').state;
 assert.deepEqual(s.inventory,original.inventory);assert.equal(s.events[0].attempts,2);assert.equal(s.events[0].state,'Failed');
});
test('wrong supplier mapping cannot post a receipt',()=>{
 const s=seed();s.mappings['SUMMIT-LABS']='Front Range Devices';
 assert.throws(()=>applyAction(s,{type:'retry',id:'EVT-7001'},'Receiver'),/does not match/);
});
test('role separation, quantities and approval prerequisites enforced',()=>{
 const s=seed();assert.throws(()=>applyAction(s,{type:'receive',id:'PO-1041',qty:1},'Buyer'),/Receiver role/);
 assert.throws(()=>applyAction(s,{type:'receive',id:'PO-1042',qty:1},'Receiver'),/approved/);
 for(const qty of [0,-1,1.5,9])assert.throws(()=>applyAction(s,{type:'receive',id:'PO-1041',qty},'Receiver'),/whole number/);
});
test('approved commitment affects on-order balance; partial invoice cannot close an outstanding order',()=>{
 let s=applyAction(seed(),{type:'approve',id:'PO-1042'},'Buyer').state;assert.equal(s.inventory[1].onOrder,15);
 s=applyAction(s,{type:'receive',id:'PO-1042',qty:5},'Receiver').state;assert.equal(s.inventory[1].onOrder,10);
 s=applyAction(s,{type:'invoice',id:'PO-1042',qty:5,unitCents:12500},'Accounts payable').state;
 assert.equal(matchInvoice(s.orders[1]).ready,false);
 assert.throws(()=>applyAction(s,{type:'match',id:'PO-1042'},'Accounts payable'),/single-invoice/);
});
test('replenishment counts open purchase orders and never proposes negative stock',()=>{
 assert.equal(replenishment(seed().inventory[0]).recommended,5);
 assert.equal(replenishment(seed().inventory[2]).recommended,0);
 assert.equal(replenishment({...seed().inventory[0],leadDays:10}).recommended,20);
});
test('API validates input, rejects duplicate posting and matches shared domain behavior',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=(action,role)=>fetch(base+'/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,role})});
 try{
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/api/state')).status,200);
  assert.equal((await post({type:'approve',id:'PO-1042'},'Receiver')).status,422);
  assert.equal((await post({type:'map',external:'SUMMIT-LABS',canonical:'Summit Scientific'},'Buyer')).status,200);
  const result=await (await post({type:'retry',id:'EVT-7001'},'Receiver')).json();assert.equal(result.state.orders[0].received,20);
  assert.equal((await post({type:'retry',id:'EVT-7001'},'Receiver')).status,422);
  assert.equal((await fetch(base+'/api/actions',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.invalid'},body:'{}'})).status,403);
 }finally{await new Promise(r=>server.close(r));}
});
