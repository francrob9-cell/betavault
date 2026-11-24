# Supply Chain Operations Studio

**Robert Franc-Klein | Business process improvement, integration development and change delivery**

[Open the demo](https://storage.googleapis.com/raf-business-app-portfolio-757561763135/scm-studio/index.html) · [Download PDF](../apps/supply-chain-operations-studio/SCM_Case_Study.pdf) · [Source and walkthrough](../apps/supply-chain-operations-studio/README.md)

## Scenario and boundaries

Northstar University is fictional. A delayed receipt and inconsistent supplier identifiers create invoice holds, unreliable inventory and repeated staff follow-up. This purpose-built work sample demonstrates how to diagnose and redesign that operating process, build the software controls, and support the people affected. No organization or result is presented as a real client engagement. Oracle EBS and Workday interfaces are simulated.

## Diagnose the work

Interview the buyer, storeroom receiver, AP specialist and supplier contact. Observe a partial delivery and an invoice exception. The current-state handoff is email → rekeying → receipt spreadsheet → AP chase. The underlying problem combines reference data, visibility, ownership and user confidence.

## Translate needs into acceptance criteria

| User need | Designed response | Acceptance evidence |
|---|---|---|
| Lab staff need deliveries before the whole order arrives. | Partial receiving; inventory updated on receipt. | 12 of 20 received; invoice for 20 held. |
| AP needs evidence without repeatedly contacting staff. | Shared order, receipt and invoice state; quantity/price matching. | Wrong price held; valid correction passes. |
| Integration support needs safe recovery. | Canonical supplier mapping, event identity and replay guard. | Correct mapping; post eight units once; repeated replay rejected. |
| Storerooms need actionable replenishment. | Demand × lead time + safety stock, minus inventory position. | Baseline five units; doubled lead time suggests twenty. |
| Staff need a usable process. | Role-based practice, explicit ownership and hands-on support. | Scenario completion and evidence-based launch review. |

## Build and integration design

The HTML/CSS/ES-module UI uses a shared domain engine. A separate, local Node HTTP API exercises the same rules with its own in-memory state. The static website works without a server API. Data includes three purchase orders, three stock items, two integration events and five launch gates.

The receipt event uses a supplier key not present in the master mapping. The Buyer validates the mapping, Receiver replays the event, and the engine updates receipt and stock together. A processed event identity prevents replay from posting twice. The AP role can match the invoice after receipt evidence agrees. Money uses integer cents.

## Improve the process and measure responsibly

The future state is structured request → Buyer approval → Receiver confirmation → integration validation → AP reconciliation. The process owner retains responsibility for exceptions; the application does not decide away operational judgment.

A separate fixed simulation uses elapsed business-day traces: current `[6,8,7,9,5]`, proposed `[4,5,5,6,3]`. Means are 7.0 and 4.6 days: a 34.3% illustrative reduction. These inputs are not measured customer results, a guaranteed benefit or output from the three interactive purchase orders. A real pilot would baseline cycle time, first-pass match rate, exception age, stockouts and user task completion.

## Deliver with people

Form a working group with buying, receiving, AP, IT and supplier representation. Teach each role its actual tasks. Surface concerns about additional work, loss of control and job security. Explain the purpose of controls, practice exceptions and incorporate feedback. Avoid promising outcomes outside the project team's authority.

Require evidence for process-owner acceptance, user testing, training, cutover/rollback rehearsal and support ownership. During hypercare, offer office hours and hands-on assistance, assign clear incident owners, communicate progress and confirm resolution with the affected user. Continue optimization after hypercare through a prioritized improvement backlog.

## Validation and limits

Automated tests cover partial receipts, quantity/price holds, role checks, wrong supplier mapping, failed retry behavior, duplicate delivery, replenishment calculations and the HTTP API. Browser checks exercise the recovery and reconciliation journey, planning sandbox and readiness controls.

The demo ends before payment and supports one full-order invoice per purchase order. Roles are educational, not authentication. Production requires transactional persistence, real authorization, durable idempotency, immutable audit records, actual vendor adapters and expanded accounting rules. These limits are explicit in both the UI and source documentation.
