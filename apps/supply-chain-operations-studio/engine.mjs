// Shared browser/server domain model. Integer cents avoid currency rounding drift.
export const roles = ['Buyer', 'Receiver', 'Accounts payable'];
export const seed = () => ({
  revision: 1,
  orders: [
    {id:'PO-1041',department:'Science labs',supplier:'Summit Scientific',item:'Nitrile gloves · case',sku:'LAB-100',qty:20,unitCents:4800,received:12,invoiceQty:20,invoiceUnitCents:4800,status:'Receiving',need:'Teaching labs cannot wait for a complete shipment.'},
    {id:'PO-1042',department:'Campus IT',supplier:'Front Range Devices',item:'USB-C docks',sku:'IT-240',qty:15,unitCents:12500,received:0,invoiceQty:15,invoiceUnitCents:12500,status:'Requested',need:'New staff need a predictable equipment handoff.'},
    {id:'PO-1043',department:'Facilities',supplier:'Alpine Maintenance',item:'Air filters · box',sku:'FAC-310',qty:10,unitCents:7200,received:10,invoiceQty:10,invoiceUnitCents:7900,status:'Receiving',need:'The invoice price exceeds the agreed purchase price.'}
  ],
  inventory: [
    {sku:'LAB-100',item:'Nitrile gloves · case',location:'Science storeroom',onHand:8,dailyDemand:3,leadDays:5,safety:6,onOrder:8},
    {sku:'IT-240',item:'USB-C docks',location:'IT service desk',onHand:4,dailyDemand:1,leadDays:7,safety:3,onOrder:0},
    {sku:'FAC-310',item:'Air filters · box',location:'Facilities warehouse',onHand:24,dailyDemand:2,leadDays:4,safety:4,onOrder:0}
  ],
  events:[
    {id:'EVT-7001',source:'Supplier SaaS',target:'Oracle EBS adapter (simulated)',type:'Shipment receipt',externalSupplier:'SUMMIT-LABS',qty:8,orderId:'PO-1041',state:'Failed',error:'Supplier SUMMIT-LABS has no canonical mapping.',attempts:1},
    {id:'EVT-7002',source:'Procurement SaaS',target:'Workday adapter (simulated)',type:'Purchase order acknowledgement',externalSupplier:'FR-DEVICES',orderId:'PO-1042',state:'Delivered',attempts:1}
  ],
  mappings:{'FR-DEVICES':'Front Range Devices'},
  processed:['EVT-7002'],
  readiness:[false,false,false,false,false],
  audit:[]
});
export function replenishment(item) {
  const reorderPoint=Math.ceil(item.dailyDemand*item.leadDays+item.safety);
  const position=item.onHand+item.onOrder;
  return {reorderPoint,position,recommended:Math.max(0,reorderPoint-position),daysCover:item.dailyDemand?item.onHand/item.dailyDemand:null};
}
export function matchInvoice(order) {
  const quantityOk=order.received>=order.invoiceQty;
  const priceOk=order.invoiceUnitCents===order.unitCents;
  const completeInvoice=order.invoiceQty===order.qty;
  return {quantityOk,priceOk,completeInvoice,ready:quantityOk&&priceOk&&completeInvoice,
    reasons:[...(!quantityOk?[`Invoice quantity ${order.invoiceQty} exceeds received quantity ${order.received}.`]:[]),...(!priceOk?['Invoice unit price differs from the purchase order.']:[]),...(!completeInvoice?['This single-invoice demonstration requires invoice quantity to equal ordered quantity before closing the order.']:[])]};
}
export function metrics(s) {
  return {commitment:s.orders.filter(o=>o.status!=='Requested').reduce((a,o)=>a+o.qty*o.unitCents,0),
    holds:s.orders.filter(o=>o.status!=='Requested'&&o.status!=='Matched'&&!matchInvoice(o).ready).length,
    shortages:s.inventory.filter(i=>replenishment(i).recommended>0).length,
    failures:s.events.filter(e=>e.state==='Failed').length};
}
function integer(value,min,max,label) {if(!Number.isInteger(value)||value<min||value>max) throw Error(`${label} must be a whole number from ${min} to ${max}.`);}
export function applyAction(current,action,role='Buyer') {
  if(!roles.includes(role)) throw Error('Choose a valid demonstration role.');
  const s=structuredClone(current);let message='';
  const requireRole=expected=>{if(role!==expected)throw Error(`${expected} role is required for this action.`);};
  const order=s.orders.find(o=>o.id===action.id);
  if(['approve','receive','invoice','match'].includes(action.type)&&!order)throw Error('Purchase order not found.');
  if(action.type==='approve') {
    requireRole('Buyer');if(order.status!=='Requested')throw Error('Only a requested order can be approved.');
    order.status='Approved';s.inventory.find(i=>i.sku===order.sku).onOrder+=order.qty;message=`${order.id} approved; commitment recorded.`;
  } else if(action.type==='receive') {
    requireRole('Receiver');if(!['Approved','Receiving'].includes(order.status))throw Error('Order must be approved and not closed.');
    integer(action.qty,1,order.qty-order.received,'Receipt quantity');
    order.received+=action.qty;order.status='Receiving';const item=s.inventory.find(i=>i.sku===order.sku);
    item.onHand+=action.qty;item.onOrder=Math.max(0,item.onOrder-action.qty);message=`${action.qty} units received against ${order.id}.`;
  } else if(action.type==='invoice') {
    requireRole('Accounts payable');if(!['Approved','Receiving'].includes(order.status))throw Error('Invoice requires an approved, open order.');
    integer(action.qty,1,order.qty,'Invoice quantity');integer(action.unitCents,1,100000000,'Invoice unit price in cents');
    order.invoiceQty=action.qty;order.invoiceUnitCents=action.unitCents;message=`${order.id} invoice updated; match controls still apply.`;
  } else if(action.type==='match') {
    requireRole('Accounts payable');if(!['Approved','Receiving'].includes(order.status))throw Error('Order must be approved and open.');
    const match=matchInvoice(order);if(!match.ready)throw Error(match.reasons.join(' '));
    order.status='Matched';message=`${order.id} passed quantity and price matching. No payment was sent.`;
  } else if(action.type==='map') {
    requireRole('Buyer');if(action.external!=='SUMMIT-LABS'||action.canonical!=='Summit Scientific')throw Error('Use the verified Summit supplier mapping in this scenario.');
    s.mappings[action.external]=action.canonical;message='Supplier mapping validated and saved.';
  } else if(action.type==='retry') {
    requireRole('Receiver');const e=s.events.find(e=>e.id===action.id);if(!e)throw Error('Integration event not found.');
    if(s.processed.includes(e.id))throw Error('Event already delivered; duplicate processing prevented.');
    e.attempts++;
    if(!s.mappings[e.externalSupplier]){e.state='Failed';message='Retry failed: correct the supplier mapping first.';}
    else {
      const o=s.orders.find(o=>o.id===e.orderId);
      if(s.mappings[e.externalSupplier]!==o.supplier)throw Error('Mapped supplier does not match the purchase order.');
      if(!['Approved','Receiving'].includes(o.status))throw Error('Target order is not open for receipt.');
      integer(e.qty,1,o.qty-o.received,'Receipt event quantity');
      o.received+=e.qty;o.status='Receiving';const i=s.inventory.find(i=>i.sku===o.sku);i.onHand+=e.qty;i.onOrder=Math.max(0,i.onOrder-e.qty);
      e.state='Delivered';e.error='';s.processed.push(e.id);message=`${e.id} delivered once; receipt and inventory updated together.`;
    }
  } else if(action.type==='readiness') {
    requireRole('Buyer');integer(action.index,0,s.readiness.length-1,'Readiness index');
    s.readiness[action.index]=!!action.checked;message='Readiness evidence updated.';
  } else throw Error('Unknown action.');
  s.revision++;s.audit.unshift({at:new Date().toISOString(),role,action:action.type,entity:action.id||action.external||'Readiness',message});
  return {state:s,message};
}
