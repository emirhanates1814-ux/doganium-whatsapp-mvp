# Workflow Lock

This document locks the product workflow for Doganium WhatsApp MVP. Future changes must preserve this direction.

## Locked Product Workflow

1. Customer sends traffic quote information via WhatsApp or the Ares Sigorta website/lead form.
2. The system parses or receives customer data automatically.
3. The system creates a local traffic quote job.
4. The operator sees the inbound request queue in Operasyon Paneli.
5. The operator clicks `Otomasyonu Başlat`, or the system starts it automatically in a later phase.
6. The Doganium automation worker starts or uses Doganium.
7. If MFA is required, the operator only completes the MFA/security checkpoint.
8. Automation continues after MFA.
9. Traffic quote/PDF results are saved.
10. A WhatsApp-ready response message is generated. Automatic sending is a later phase.

## Canonical Input Sources

- WhatsApp messages are a canonical input source.
- Ares Sigorta website form / lead form submissions are a canonical input source.
- Normal usage does not include manual customer entry.

## Manual Fallback

Manual customer entry and manual quote entry are fallback/test/operator override only. They are useful for local smoke tests, correcting exceptional cases, and demoing the result store, but they are not the primary product workflow.

If future changes make manual entry the primary workflow, reject that change.

## Screen Roles

- Operasyon Paneli is the main daily screen.
- Doganium Teknik Paneli is setup/debug only.
- Manual/test forms must be visually secondary and labeled as fallback/test tools.

## Doganium Direction

Doganium MFA is a manual security checkpoint, not a product direction change. MFA does not turn the product into a manual quote-entry CRM.

Full Doganium traffic/PDF automation remains the target. MFA-safe continuation, portal navigation, quote/PDF extraction, and result saving must continue toward automation phases.
