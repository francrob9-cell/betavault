# Local API and simulated integration contract

`npm start` serves the UI and a loopback HTTP API at `http://127.0.0.1:4178`.

The UI executes browser-local rules; this API is separately callable and uses independent in-memory state. Both use `engine.mjs`. No Oracle, Workday or supplier SaaS API is contacted.

## GET /api/state

Returns the current synthetic orders, inventory, supplier mappings, events, processed-event identities, readiness flags and action history. HTTP 200; JSON; no cache.

## POST /api/actions

Requires `Content-Type: application/json`. Maximum payload: 16 KB. The caller supplies a demonstration role, which is **not authentication**. Cross-origin browser writes are rejected. Do not expose this local tool as a public API.

```json
{
  "role": "Buyer",
  "action": {
    "type": "map",
    "external": "SUMMIT-LABS",
    "canonical": "Summit Scientific"
  }
}
```

Successful response: `{ "state": { ... }, "message": "..." }` (200).

| Action | Role | Fields | Control |
|---|---|---|---|
| approve | Buyer | id | Requested order only; on-order stock increases once. |
| receive | Receiver | id, qty | Approved/open order; positive whole units; no over-receipt. |
| invoice | Accounts payable | id, qty, unitCents | Positive integer cents and whole units; open order. |
| match | Accounts payable | id | Price, received quantity and full-order invoice quantity agree. |
| map | Buyer | external, canonical | Fixed validated supplier pair for this scenario. |
| retry | Receiver | id | Valid supplier mapping and PO; reject successful replay. |
| readiness | Buyer | index, checked | Five evidence-review flags, indexes 0–4. |

Status codes: 400 malformed input; 403 cross-origin write; 404 unknown route; 405 unsupported static method; 413 oversized body; 415 incorrect content type; 422 domain validation failure.

### Recovery sequence

1. Post the mapping above as Buyer.
2. Post `{"role":"Receiver","action":{"type":"retry","id":"EVT-7001"}}`.
3. Confirm PO-1041 received = 20, LAB-100 onHand = 16, onOrder = 0.
4. Repeat step 2: expect 422 and no further stock change.
5. Post `{"role":"Accounts payable","action":{"type":"match","id":"PO-1041"}}`.

### Canonical event mapping

| Synthetic source | Canonical representation | Validation |
|---|---|---|
| eventId | idempotencyKey | Unique successful delivery in the dataset. |
| sourceSupplierId | supplier.name | Mapping must agree with purchase-order supplier. |
| purchaseOrderId | order.id | Existing approved/open order. |
| receivedQuantity | receipt.quantity | Positive integer no larger than remaining order quantity. |

The Oracle EBS receipt target and Workday acknowledgement target are **conceptual adapters**. Actual customer integrations require approved endpoint/schema discovery, authentication, authorization, source-to-target reconciliation, integration monitoring and durable transactional delivery. Event IDs here are not a claim of production exactly-once delivery.
