# ParityPulse: AI Process Discovery and PMS Integration

## Is this approach rational?

Yes, with one important boundary: AI should accelerate discovery, mapping, documentation, and investigation. It should not silently invent business rules or become the system of record for rates, inventory, reservations, or revenue decisions.

Parity monitoring is not only a scraping problem. Each hotel group has different ownership models, negotiated rules, rate plans, room mappings, taxes, promotions, distribution partners, and escalation paths. A successful implementation first learns that operating model, then connects approved systems and normalizes their data into a comparable rate observation.

## Target operating model

```text
PMS + CRS + RMS + channel manager + approved OTA/shop feeds
                         |
                         v
             Secure ingestion and validation
                         |
                         v
        Canonical property, room, rate, and stay model
                         |
                         v
       Parity rules + evidence + commercial impact engine
                         |
                         v
        Dashboard, alerts, case workflow, and audit trail
```

The PMS enriches the analysis with inventory, occupancy, reservations, realized rate, and property context. In many organizations, the CRS, RMS, or channel manager is the more direct source for sell rates and channel distribution. Production discovery must identify which platform owns each field instead of assuming the PMS owns everything.

## Phase 1: AI-assisted process discovery

1. Gather approved SOPs, rate-plan definitions, channel contracts, escalation matrices, revenue-meeting notes, system inventories, and data dictionaries.
2. Interview revenue management, distribution, property operations, finance, e-commerce, IT, and franchise or ownership stakeholders.
3. Use AI tooling to transcribe and summarize interviews, cluster recurring workflows, build a glossary, draft swimlanes, identify conflicting rules, and propose open questions.
4. Trace how a rate moves from strategy through RMS or CRS, channel distribution, public display, booking, reconciliation, and dispute resolution.
5. Have named business owners approve every process map, source-of-truth decision, threshold, and exception before configuration.

Useful AI outputs include a current-state process map, responsibility matrix, source-system catalog, canonical field crosswalk, exception taxonomy, test scenarios, and draft operating procedures. Every output should retain its source and approval status.

## Phase 2: Integration design

Use read-only, vendor-supported interfaces wherever possible. Depending on the hotel stack, that may include REST APIs, webhooks, scheduled files, HTNG or OTA messages, or an approved integration partner.

The minimum canonical observation should include:

- Property and brand identifiers
- Arrival, departure, stay length, occupancy, and currency
- Room type and mapped equivalent room class
- Rate plan, package inclusions, membership or device restrictions
- Base rate, taxes, mandatory fees, and total stay price
- Cancellation, deposit, and payment terms
- Direct or channel source, point of sale, market, and observed timestamp
- Evidence URL or contracted source identifier

AI can suggest field matches, room-type equivalence, likely duplicate rate plans, and anomaly explanations. Deterministic validation and approved mappings should control production comparisons.

## Phase 3: Onboarding an organization

1. **Discover:** Document the current workflow, system owners, contractual constraints, and business definitions of parity.
2. **Connect:** Establish sandbox or read-only credentials for the relevant PMS, CRS, RMS, channel manager, and approved rate feeds.
3. **Map:** Reconcile property, room, rate-plan, currency, tax, fee, cancellation, and promotion semantics.
4. **Shadow:** Run observations without alerts or automated actions and compare results with revenue-manager spot checks.
5. **Calibrate:** Measure false positives, tune comparability rules, and approve severity and escalation thresholds.
6. **Pilot:** Launch with a small property group and a named operating owner.
7. **Scale:** Add properties in waves, monitor data quality, and maintain mapping and integration ownership.

## Controls and responsible AI

- Minimize or exclude guest personally identifiable information; parity monitoring generally does not require it.
- Store credentials in a managed secret vault and enforce least-privilege, tenant-specific access.
- Log source, timestamp, transformation, rule version, AI suggestion, human decision, and downstream action.
- Require human approval for channel disputes, rate changes, and material revenue actions.
- Respect vendor contracts, rate-feed licenses, robots policies, and channel terms.
- Define retention, deletion, incident response, model evaluation, and mapping-change controls.
- Keep a non-AI fallback for ingesting, comparing, and auditing rate observations.

## Success measures

- Data freshness and successful observation rate
- Percentage of rooms and rate plans confidently mapped
- Comparable-offer match rate
- False-positive and disputed-alert rate
- Time from disparity detection to owner assignment and resolution
- Repeat channel or property incident rate
- Estimated and verified direct-revenue recovery
- Integration uptime and unresolved data-quality exceptions

## Portfolio prototype boundary

The current ParityPulse build demonstrates the workflow using timestamped public seller observations for selected Marriott Bonvoy properties. It is not a contracted enterprise rate feed, a Marriott internal system, or a production PMS integration. A real deployment would replace or supplement the public adapter with authorized provider feeds and organization-specific system connections, then validate the result in shadow mode before operational use.
