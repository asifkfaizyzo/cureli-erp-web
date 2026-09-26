### Cureli — System Overview

Cureli is a pharmacy-focused healthcare platform in India built around **four connected components**: the **Cureli ERP**, **Cureli Customer Mobile App**, **Cureli Rider Mobile App**, and the **Cureli Backend/API**.

**1. Cureli ERP — Pharmacy Management**
The ERP is used by pharmacies and their staff to manage their day-to-day operations. It handles pharmacy onboarding, branches, users/staff, medicine inventory, stock management, billing/orders, prescriptions, subscriptions, and other pharmacy-side operations. The ERP is also the primary interface through which pharmacies receive and process orders coming from the customer marketplace.

**2. Cureli Customer Mobile App — Medicine Marketplace** (Android and ios)
This is the public-facing mobile application used by customers to search for and order medicines from registered pharmacies. Customers can browse medicines, select a pharmacy, upload prescriptions when required, add medicines to their cart, manage addresses, place orders, make payments, and track their orders.

A key marketplace rule is that a customer's cart is associated with **one pharmacy at a time**. The app communicates with the Cureli backend to retrieve pharmacy/medicine data and manage the complete customer order lifecycle.

**3. Cureli Rider Mobile App — Delivery Operations** (Android only)
The Rider App is used by Cureli delivery personnel to handle deliveries generated from customer orders. Riders receive assigned delivery orders, view relevant customer/order information, navigate to the pharmacy and customer, update delivery status, and complete the delivery. It is focused specifically on the operational delivery workflow rather than customer shopping or pharmacy management.

**4. Cureli Backend/API — Central System**
The backend is the central layer connecting all three applications. It exposes APIs, manages authentication and authorization, users, pharmacies, branches, inventory, orders, payments, prescriptions, subscriptions, delivery workflows, notifications, and other business logic. It communicates with the PostgreSQL database and external services such as payment, messaging, email, storage, and mapping providers.

### Overall Flow

The basic ecosystem is:

**Customer App → Backend → Pharmacy ERP**

When an order is created, the backend coordinates the order between the customer and pharmacy. Once the order is ready for delivery, the delivery workflow connects the order to the **Rider App**, allowing a rider to collect the medicine from the pharmacy and deliver it to the customer.

In short:

**Customer App = Customer / Marketplace**
**ERP = Pharmacy / Business Operations**
**Rider App = Delivery Operations**
**Backend = Central Brain / Integration Layer**

All four components form a single Cureli ecosystem rather than four independent products.
    


