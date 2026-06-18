# Product Goal

## Goal

Build a local-first Ares Sigorta desktop workflow that turns inbound WhatsApp and website lead-form traffic quote requests into local quote jobs, runs or prepares Doganium automation, stores quote/PDF results, and generates WhatsApp-ready customer response messages.

The normal user should monitor inbound requests and start/continue automation. The normal user should not manually type customer data as the main workflow.

## Non-Goals

- This project must not become a manual quote-entry CRM.
- Manual customer entry is not the canonical intake path.
- Manual quote entry is not the canonical result path.
- Doganium MFA bypass is not a goal.
- Automatic WhatsApp sending is not Phase 1.
- Cloud production deployment is not required for the local MVP unless needed for webhook relay validation.

If future changes make manual entry the primary workflow, reject that change.

## Phase 1 Scope

- Inbound request queue.
- WhatsApp/web form intake contract.
- Parser/normalizer for customer traffic data.
- Local job/result storage.
- Operation dashboard for inbound request monitoring.
- Manual/test fallback only for local smoke testing and operator override.
- Doganium MFA-safe preparation and technical setup/debug.
- WhatsApp-ready response message generation without automatic sending.

## Phase 1.5 Scope

- Doganium target inspection.
- Post-MFA continuation.
- Traffic portal selector mapping.
- Safer automation checkpoints around Doganium screens.

## Phase 2 Scope

- Full Doganium traffic/PDF automation.
- Automatic quote/PDF result extraction.
- Automatic WhatsApp sending.
- Production relay/webhook deployment if needed.
- Hardened audit logs, retries, and operator recovery flows.
