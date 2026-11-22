# Board Brief — Tovia

## The idea

Tovia is a B2B SaaS platform for managing events in churches and communities in Brazil. It handles registrations, payments, QR code check-in and event finances in one place — replacing the WhatsApp + spreadsheet workflow that most small organizers use today.

## Target customer

Church and community event organizers in Brazil: pastors, youth leaders, retreat coordinators, church secretaries. They organize retiros (retreats), conferências (conferences), workshops and gatherings. They are non-technical, manage everything through WhatsApp groups and Google Sheets/Excel, and collect payments via Pix (Brazil's instant payment system) with manual receipt verification.

## Pricing

- **Chinám** (free): functional plan, limited features
- **Pétach**: R$119/month or R$1,190/year (~US$22/month)
- **Chalém**: R$299/month or R$2,990/year (~US$55/month)

## The BYOG model

BYOG = Bring Your Own Gateway. The organizer connects their own payment gateway (Mercado Pago, Stripe, etc.). Tovia never intermediates money — event payments go straight to the church/organizer's bank account. This matters because churches in Brazil are extremely sensitive about financial transparency — any platform that "holds" their money creates distrust.

## Current state

- MVP complete and functional (July 2026)
- Zero paying customers — entering customer acquisition phase
- Solo founder, self-taught developer, no business management background
- Infrastructure costs ~R$140/month (Claude AI R$100, domain R$3, rest free tier: Supabase, Vercel, Sentry, Zoho Mail)
- Cost to serve one customer estimated at R$4–10/month
- Break-even: 5–8 Pétach customers
- No CNPJ yet (Brazilian company registration — needed for invoicing and formal contracts)
- Goal: R$5k MRR (Monthly Recurring Revenue)

## What exists in the market

Brazil has event platforms (Sympla, Eventbrite Brazil, Even3) but they are built for large public events, charge per ticket, and intermediate payments. None are built specifically for the church/community niche. The closest competitors are generic tools (Google Forms + spreadsheets + manual Pix) or expensive enterprise church management systems.

## Strengths the founder sees

1. BYOG — full financial transparency, a trust play
2. Built specifically for Brazilian religious/community organizers
3. Free plan that actually works (not a cripple-ware trial)
4. Simple interface, no technical jargon
5. Very low operational cost (serverless infrastructure)
