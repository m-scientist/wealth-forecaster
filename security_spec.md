# Security Specification: Global Wealth Forecaster

This document establishes the data invariants, threat model, and "Dirty Dozen" malicious test payloads to harden security rules.

## 1. Data Invariants

1. **User Identity Isolation**: A user's financial configuration and scenario configurations MUST only be readable and writable by the authenticated user whose `uid` matches the document parent path variable `userId`.
2. **Account Integrity**: Users cannot change their `uid` or `email` to another user's after creation.
3. **Data Completeness**: Budget items (incomes, expenses, and events) must conform to structural size boundaries.
4. **Temporal Integrity**: Every write must use server time for `createdAt` and `updatedAt`.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads attempting to break Identity, Integrity, and State boundaries.

### ID Isolation & Ownership Spoofing
1. **Payload 1**: Attacker attempts to read `/users/alice_uid` while logged in as `bob_uid`.
   - *Result*: `PERMISSION_DENIED`
2. **Payload 2**: Attacker attempts to write a Scenario to `/users/alice_uid/scenarios/scen_1` while logged in as `bob_uid`.
   - *Result*: `PERMISSION_DENIED`
3. **Payload 3**: Attacker logged in as `bob_uid` tries to create `/users/bob_uid` with `uid` set to `alice_uid`.
   - *Result*: `PERMISSION_DENIED`

### PII Protection & Privilege Escalation
4. **Payload 4**: Anonymous or unauthenticated user tries to read `/users/bob_uid`.
   - *Result*: `PERMISSION_DENIED`
5. **Payload 5**: A user with `email_verified` as `false` tries to save configuration (if email verification is mandated).
   - *Result*: `PERMISSION_DENIED`

### Resource Exhaustion & Data Poisoning
6. **Payload 6**: Attacker attempts to set an extremely long username or scenario name (e.g., 50KB string).
   - *Result*: `PERMISSION_DENIED`
7. **Payload 7**: Attacker attempts to send an array with 10,000 income streams inside a single user document to blow up resource limits.
   - *Result*: `PERMISSION_DENIED`
8. **Payload 8**: An attacker attempts to use a malformed document ID (e.g. injected script tags `../hack`) instead of an alphanumeric string.
   - *Result*: `PERMISSION_DENIED`

### Temporal & Operational Violations
9. **Payload 9**: Client tries to submit a custom client-side timestamp (e.g., set `createdAt` in outer space) instead of `request.time`.
   - *Result*: `PERMISSION_DENIED`
10. **Payload 10**: User tries to update their configurations but drops required nested fields (e.g. omitting `params` completely while sending other items).
    - *Result*: `PERMISSION_DENIED`
11. **Payload 11**: Client tries to bypass `affectedKeys().hasOnly()` security safeguards on update by posting a "Ghost Field" like `isAdmin: true` on the root level of UserConfig.
    - *Result*: `PERMISSION_DENIED`
12. **Payload 12**: Client updates `scenarios` but alters the immutable `ownerId` to point to a different user.
    - *Result*: `PERMISSION_DENIED`

---

## 3. Conceptual Security Test Suite

A mock implementation of `firestore.rules.test.ts` representing assertions checking that each of the "Dirty Dozen" payloads yields a permission failure.
