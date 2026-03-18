---
name: stripe-connect-saferent
description: Stripe Connect escrow patterns for SafeRent. Use when implementing payments, checkout flows, payouts, webhooks, or anything touching Stripe. Enforces the escrow model where funds are held until stay confirmation.
---

# Stripe Connect — SafeRent Escrow Model

## Architecture

SafeRent uses **Stripe Connect destination charges** (escrow model):

1. Tenant pays → funds land in the **SafeRent platform account**.
2. Funds are held until the landlord confirms the stay.
3. On confirmation → payout released to the landlord's connected account via transfer.

This means:
- The platform (`SafeRent`) is the **merchant of record** and accepts liability for negative balances.
- Use `destination charges` (not direct charges or separate charges & transfers).
- `on_behalf_of` is set to the landlord's connected account for statement descriptor and local card acceptance.

## Key Rules

### PaymentIntents
- Always create PaymentIntents **server-side** (`/api/...` routes), never from the browser.
- Set `transfer_data.destination` to the landlord's Stripe account ID.
- Set `transfer_data.amount` to the net amount after platform fee.
- Do **not** use `application_fee_amount` and `transfer_data` together — pick one model.

### Webhooks
- Validate every webhook with `stripe.webhooks.constructEvent(body, sig, secret)`.
- Use the raw request body (not parsed JSON) for signature validation.
- Handle `payment_intent.succeeded` to mark pago as `COMPLETED` in Supabase.
- Handle `payment_intent.payment_failed` to mark pago as `FAILED` and notify tenant.
- Handle `transfer.created` to record payout to landlord.
- All webhook state changes write to Supabase via server client (service role), never via context.

### Checkout
- Prefer `PaymentIntents` + Stripe Elements (Payment Element) over Checkout Sessions for this escrow model — gives finer control over fund holding.
- Never use the legacy Card Element — use the Payment Element.
- Pass `payment_method_types` only if needed; otherwise let Stripe choose dynamically.

### Connected Accounts (Landlords)
- Landlords must complete Stripe Connect onboarding before receiving payouts.
- Use Express accounts (controller properties: `losses.payments = 'stripe'`, dashboard access = express).
- Store `stripe_account_id` in the `usuarios` table (propietario only).
- Redirect landlords to `accountLinks.url` for onboarding; handle `account.updated` webhook to track verification status.

### Platform Fee
- Deduct the platform fee before setting `transfer_data.amount`.
- Record the fee in the `pagos` table for accounting.

## API Route Conventions

- All Stripe logic lives in `/app/api/pagos/` and `/app/api/stripe/` route handlers.
- Never expose the Stripe secret key — it goes in env vars **without** `NEXT_PUBLIC_`.
- Publishable key can be `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Security Checklist

- [ ] Webhook signature validated on every request.
- [ ] PaymentIntent amount server-computed from DB price, not from client input.
- [ ] idempotency keys on all PaymentIntent creates (`{solicitudId}-{intentType}`).
- [ ] Pago status updated only via webhook, not via client confirmation callback.

## SDK Version

Always use the latest Stripe Node.js SDK. TypeScript types are included — use them.
