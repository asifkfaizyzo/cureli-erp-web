# Cureli — System Overview

Cureli is a pharmacy-focused healthcare platform in India built around **four connected components**: the Cureli ERP, Cureli Customer Mobile App, Cureli Rider Mobile App, and Cureli Backend/API.

## 1. Cureli ERP — Pharmacy Management

The ERP is used by pharmacies and their staff to manage their day-to-day operations. It handles pharmacy onboarding, branches, users/staff, medicine inventory, stock management, billing/orders, prescriptions, subscriptions, and other pharmacy-side operations. The ERP is also the primary interface through which pharmacies receive and process orders coming from the customer marketplace.

## 2. Cureli Customer Mobile App — Medicine Marketplace

This is the public-facing mobile application used by customers to search for and order medicines from registered pharmacies. Customers can browse medicines, select a pharmacy, upload prescriptions when required, add medicines to their cart, manage addresses, place orders, make payments, and track their orders.

A key marketplace rule is that a customer's cart is associated with **one pharmacy at a time**. The app communicates with the Cureli backend to retrieve pharmacy/medicine data and manage the customer order lifecycle.

## 3. Cureli Rider Mobile App — Delivery Operations

The Rider App is used by Cureli delivery personnel to handle deliveries generated from customer orders. Riders receive assigned delivery orders, view relevant customer/order information, navigate to the pharmacy and customer, update delivery status, and complete the delivery. It focuses specifically on the operational delivery workflow rather than customer shopping or pharmacy management.

## 4. Cureli Backend/API — Central System

The backend is the central layer connecting all three applications. It exposes APIs, manages authentication and authorization, users, pharmacies, branches, inventory, orders, payments, prescriptions, subscriptions, delivery workflows, notifications, and other business logic. It communicates with the PostgreSQL database and external services such as payment, messaging, email, storage, and mapping providers.

## 5. Architecture and Technology Stack

Cureli is a shared platform with multiple applications connected to a central backend and PostgreSQL database.

- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL, and Redis for relevant infrastructure and application functionality.
- **Web applications:** Separate interfaces for pharmacy ERP/admin operations and the public-facing website.
- **Mobile applications:** React Native with Expo and Expo Router.
- **External integrations:** Razorpay for payment processing, email and SMS providers for communication and OTPs, object storage for assets, and mapping/location services for delivery operations.

The repository is organized as a monorepo containing the backend, web applications, and mobile application(s). Verify exact package names, versions, service responsibilities, and implementation details against the current repository.

## 6. Multi-tenant Pharmacy Structure

Cureli supports independent pharmacy businesses, each of which may operate multiple branches.

- A **shop** represents the pharmacy business or storefront.
- A **branch** represents an individual pharmacy location.
- Inventory, pricing, stock availability, operating hours, location, and fulfillment settings may be branch-specific.
- Pharmacy owners and administrators have permissions based on their roles and branch scope.
- Cureli's central administration interface has broader platform-level operational responsibilities.
- Marketplace orders must be associated with the appropriate pharmacy and fulfillment branch.

Data access must respect tenant isolation and role-based authorization. Never assume that a user authorized to manage one pharmacy or branch can access another pharmacy's data.

## 7. Marketplace and Catalog Rules

- A customer cart can contain medicines from **one pharmacy at a time**. Do not assume a single order can be fulfilled by multiple independent pharmacies.
- The centralized medicine catalog and each pharmacy's inventory serve different purposes. A medicine's presence in the central catalog does not establish that every pharmacy stocks it.
- Availability, price, applicable tax information, and prescription requirements must be evaluated in the context of the relevant pharmacy or branch.
- Pharmacy inventory is managed through the ERP and must remain consistent with marketplace availability.
- Prescription-related workflows may involve prescription uploads, pharmacy review, and additional order-processing steps.
- Marketplace participation and branch-level fulfillment settings must be respected when determining which pharmacies can serve a customer.

## 8. Order Fulfillment and Delivery

Cureli has distinct responsibilities for order processing and physical fulfillment.

A typical delivery order follows this operational sequence:

1. The customer selects a pharmacy, adds medicines, and places an order.
2. The backend processes the order and notifies the relevant pharmacy and administrative interfaces.
3. The pharmacy accepts or rejects the order.
4. The pharmacy prepares the accepted order and marks it ready.
5. An administrator assigns a rider under the current manual-assignment workflow.
6. The rider accepts the assignment, travels to the pharmacy, and collects the medicines after the required verification.
7. The rider travels to the customer and completes the delivery after the required customer verification.
8. The backend records the final order status and relevant notifications.

The exact statuses, permitted transitions, OTP purposes, and notification triggers must be verified against the current implementation.

Cureli may support or explore different fulfillment methods:

- **Instant delivery:** The existing order and rider workflow is used to fulfill an order as soon as operationally possible.
- **Customer pickup:** The customer collects the order from the pharmacy. This must not trigger unnecessary rider assignment or delivery charges.
- **Scheduled delivery:** Same-day or next-day delivery is a proposed extension unless verified as implemented. It requires explicit delivery commitments, preparation and dispatch deadlines, rider-capacity planning, overdue handling, and customer communication.

Scheduled delivery introduces operational dependencies that software alone cannot eliminate. A pharmacy marking an order as ready is a recorded declaration, not independent proof that the medicines have been physically prepared. Similarly, an accepted order does not guarantee that stock will remain available or that a rider will be available at the required time.

## 9. Payments, Pricing, and Financial Responsibilities

Cureli has distinct financial concepts that must not be treated as interchangeable:

- Medicine subtotal.
- Pharmacy commission.
- Customer-facing delivery charges and platform service charges.
- Rider payouts and applicable incentives.
- Pharmacy settlements and refunds.

The marketplace's pricing configuration defines how applicable charges are calculated. In the existing commission model, commission applies to the medicine subtotal, while delivery fees, service charges, and tips are allocated to Cureli according to the configured rules. Rider payout calculations are separate from pharmacy commission calculations.

Payment state, order state, refunds, and settlement state must be handled consistently. Never assume that cancelling an order automatically refunds a payment, or that a successful payment guarantees pharmacy acceptance or delivery completion. Verify the current implementation and financial rules before modifying these workflows.

## 10. Strict Operating Rules for AI Assistants

1. **Do NOT assume anything about my system.** Base conclusions on verified project context and the actual implementation.
2. **If anything is unclear, ask for the relevant context file.** Do not fill gaps with guesses.
3. **Ask clarification questions proactively** whenever missing information could affect the architecture, business logic, or implementation.
4. **Challenge vague requirements.** Identify ambiguity, hidden assumptions, conflicting requirements, and undefined business rules before proposing a solution.
5. **Surface edge cases and risks early.** Explain important failure scenarios, operational implications, and trade-offs before implementation.
6. **Think structurally and architecturally.** Consider system boundaries, data models, API contracts, state transitions, dependencies, and the impact on existing applications.
7. **Do NOT generate code unless I explicitly say: "Proceed with implementation."** Discussion, analysis, research, and architecture planning are not permission to write implementation code.
8. **If the solution becomes large, propose structured implementation phases before coding.** Explain the scope and dependencies of each phase.
9. **Finalize backend architecture before frontend planning**, unless I explicitly specify otherwise.
10. **Follow existing project conventions once provided.** Do not invent new patterns, abstractions, dependencies, or architectural approaches without justification.
11. **Do not start writing code until I clearly confirm that the architecture plan is approved.** Explicit implementation permission is required, and the architecture must also be approved before coding begins.

These rules apply throughout all Cureli-related discussions, planning, research, and development work.