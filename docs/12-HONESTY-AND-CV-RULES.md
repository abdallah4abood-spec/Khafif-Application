# 12 — Honesty and CV Rules (for the owner)

This project is built with an AI coding agent. That is legitimate if described accurately. These rules protect you in interviews.

## How to describe it (after it exists)
Allowed once the matching evidence exists:
- "Built a React Native (Expo) mobile storefront connected to a Medusa v2 backend, with an offline-first cart and Arabic/English RTL support." — needs: repo + working demo/video.
- "Wrote Jest/React Native Testing Library tests and CI." — needs: passing CI run.
- "Extended Medusa with a custom wishlist module and Store API route." — needs: M7 done and tested.
- "Built with AI coding assistance; I reviewed, tested and can explain the architecture." — only if true (see below).

Not allowed: "production", "real customers", "payment integration" (test provider only), performance numbers you did not measure, "experienced with Medusa" beyond what the project shows.
Always label it a portfolio project with test data.

## Understanding checklist (you must be able to answer without the agent)
1. Why is the cart local-first and why is there no offline order queue?
2. How does the app talk to Medusa (publishable key, region, JS SDK)? What does the publishable key protect?
3. Walk through the checkout sequence and what each call does.
4. How does TanStack Query caching/persistence work here, and what is persisted?
5. Why Zustand for the cart but TanStack Query for products?
6. How does RTL work in React Native, and why does switching language need a reload?
7. Where is the auth token stored and why?
8. What does a Medusa module do, and why can't modules use cross-module foreign keys?
9. How did you verify offline behavior?
10. What are the known limits and what would you do for production?
If you cannot answer one, ask the agent to teach it, then explain it back in your own words.

## Evidence to publish
GitHub repo, README with an honest status table, a 60–90 second screen recording (phone), screenshots, CI badge (only when green), `docs/PERFORMANCE.md` (measured numbers or "not measured"), short architecture write-up.

## CV line template (fill only with true statements)
`Khafif (portfolio project) | React Native (Expo), TypeScript, Medusa v2, PostgreSQL | <repo link>` plus 2–3 bullets limited to what the evidence above supports. Update `Master_Profile.md` and `Project_Portfolio.md` first, then draft the tailored CV.
