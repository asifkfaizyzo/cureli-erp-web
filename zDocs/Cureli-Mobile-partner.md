<!-- zDocs/Cureli-Mobile-partner.md (do not remove this comment) -->
# Cureli Delivery — Rider App

## Complete Scope of Work Document


## PART 1 — RIDER ONBOARDING

### 1.1 App Download & Registration

The Cureli Delivery app is available on the Google Play Store. Anyone interested in becoming a Cureli delivery rider can download it and apply directly.

**Two onboarding paths are supported:**

**Path A — Self Registration (Open Application)**
- Rider downloads app from Play Store
- Enters mobile number → OTP verification
- Fills personal details (name, date of birth, city/zone selection)
- Uploads required documents
- Submits application for review
- Waits for CAdmin approval before going live

**Path B — CAdmin Invited (Direct Onboarding)**
- CAdmin creates rider profile from admin panel
- Rider receives SMS/notification with app download link and login credentials
- Rider downloads app, logs in, completes document upload
- CAdmin reviews and approves

---

### 1.2 Document Upload

Every rider must submit the following before being approved:

| Document | Details |
|----------|---------|
| Profile photo | Clear face photo, captured in-app or uploaded |
| Aadhaar card | Front and back |
| PAN card | Front photo |
| Driving license | Front and back |
| Vehicle RC (Registration Certificate) | Front photo |
| Bank account details | Account number, IFSC code, account holder name |

**Document upload features:**
- In-app camera capture or gallery upload
- Document preview before submission
- Resubmission allowed if rejected by CAdmin with reason shown
- Upload progress indicator
- Each document shows status: Pending / Under Review / Approved / Rejected

---

### 1.3 Eligibility Requirements

- Minimum age: 18 years
- Must hold a valid two-wheeler driving license
- Must own or have access to a bike or scooter
- Must be based in a Cureli-supported city/zone

---

### 1.4 Application Status Tracking

Rider can track their application inside the app at all times.

**Statuses shown:**
- Documents submitted — under review
- Additional information required (with specific document flagged)
- Approved — ready to go online
- Rejected — with reason provided by CAdmin

---

### 1.5 Zone / City Assignment

- Rider selects their preferred city and zone during signup
- Zone is fixed after approval
- Rider can submit a zone change request from within the app
- Zone change requests are reviewed and approved by CAdmin

---

## PART 2 — RIDER AUTHENTICATION & PROFILE

### 2.1 Login

- Phone number + OTP based login (no password)
- OTP via SMS
- Session persists until rider explicitly logs out
- Automatic logout on account suspension

---

### 2.2 Rider Profile

Rider can view and manage their profile from the app.

**What rider can see:**
- Profile photo
- Full name, phone number, city/zone
- Vehicle details
- Document status for each uploaded document
- Current approval status
- Rating (average stars + total deliveries rated)
- Member since date
- Referral code

**What rider can edit:**
- Profile photo
- Phone number (with OTP verification)
- Bank account details (with re-verification trigger for CAdmin)
- Zone change request

---

### 2.3 Training & Onboarding Content

Before a newly approved rider goes live, they are shown onboarding content inside the app.

**Includes:**
- How the app works (short illustrated walkthrough)
- Delivery flow explained step by step
- What to do if customer is unavailable
- How earnings are calculated
- Safety guidelines
- Code of conduct
- FAQ section

Content is managed and updated by CAdmin from the admin panel.

---

## PART 3 — AVAILABILITY & SHIFTS

### 3.1 Go Online / Go Offline Toggle

The core availability control. Rider manually switches between online and offline.

**Online state:**
- Rider is visible to the assignment system
- Rider can receive order notifications
- Live location tracking begins
- Earnings counter is active

**Offline state:**
- Rider receives no orders
- Location tracking pauses
- Rider can go offline between deliveries or at end of day

**Rules:**
- Rider cannot go offline mid-delivery (toggle is locked during active delivery)
- If rider has an active order and app is force-closed, system retains assignment and notifies rider on reopen

---

### 3.2 Shift System (Optional — for Incentives)

Cureli can define peak-hour shifts with bonus incentives attached.

**How it works:**
- CAdmin defines shifts (e.g. Morning 9am–12pm, Evening 5pm–9pm)
- Shifts are tagged as "bonus eligible"
- Rider can see available shifts in the app
- Rider opts into a shift by going online within that time window
- If rider completes the minimum required deliveries within the shift window, bonus is credited automatically

**Shift details shown to rider:**
- Shift name and time window
- Minimum deliveries required for bonus
- Bonus amount
- Current progress within shift (e.g. 3 of 5 deliveries done)

---

## PART 4 — ORDER ASSIGNMENT & ACCEPTANCE

### 4.1 Auto-Assignment Logic

When a pharmacy marks an order ready for pickup, the system automatically finds the best available rider.

**Assignment criteria:**
- Rider must be online
- Rider must be in the same zone as the pharmacy
- Rider must not have an active delivery in progress
- Nearest rider (by real-time GPS distance) is assigned first

**Assignment cascade:**
- Nearest available rider is notified first
- If no response within 30 seconds → next nearest rider is notified
- Cascade continues until a rider accepts
- If no rider accepts after X attempts → CAdmin is alerted

---

### 4.2 Order Notification

When assigned, rider receives:
- Push notification (even if app is in background)
- In-app full-screen alert with accept / reject buttons
- 30-second countdown timer
- Audio alert

---

### 4.3 Order Preview (Before Accepting)

Rider sees the following before deciding:

| Info shown | Detail |
|------------|--------|
| Pharmacy name | Pickup point |
| Pharmacy address | With map pin |
| Estimated distance to pharmacy | In km |
| Estimated distance pharmacy to customer | In km |
| Estimated total trip distance | In km |
| Estimated earnings for this delivery | In ₹ |
| Estimated time | In minutes |

**What rider does NOT see before accepting:**
- Customer name or phone number
- Order contents or item details
- Customer address (shown only after acceptance)

---

### 4.4 Accept / Reject

- **Accept** → rider is locked into the order, full details revealed
- **Reject** → rider remains online, order cascades to next rider
- **No response in 30 seconds** → treated as reject, order cascades

**Reject reason required:** Rider must select a reason when rejecting (too far / not feeling well / bike issue / other)

**Reject rate monitoring:** High rejection rates are flagged to CAdmin

---

## PART 5 — ACTIVE DELIVERY FLOW

### 5.1 Step-by-Step Delivery Flow

Once rider accepts, the following flow begins:

---

**Step 1 — Navigate to Pharmacy**
- Full customer order hidden until pickup confirmation
- Map navigation to pharmacy address (integrated with Google Maps / device maps app)
- Estimated arrival time shown
- Rider can call pharmacy from this screen

---

**Step 2 — Arrived at Pharmacy**
- Rider taps "I've Arrived at Pharmacy"
- Pharmacy is notified in ERP that rider is outside
- Pharmacy staff sees rider name and phone

---

**Step 3 — Package Handover**
- Pharmacy marks package as handed over in ERP
- Rider confirms receipt by tapping "Package Picked Up"
- This step requires both sides to confirm (double confirmation)
- Timestamp recorded

---

**Step 4 — Navigate to Customer**
- Customer address and name now fully visible
- Map navigation to customer address
- Estimated delivery time shown
- Rider can call customer (masked number) from this screen
- Rider can open in-app chat with customer

---

**Step 5 — Arrived at Customer Location**
- Rider taps "Arrived at Customer Location"
- Customer receives push notification that rider is outside

---

**Step 6 — Delivery Confirmation**
- Rider hands over package
- Rider taps "Mark as Delivered"
- Delivery timestamp recorded
- Earnings updated in real time
- Customer prompted to rate rider in customer app

---

### 5.2 Navigation Integration

- Tapping any address opens Google Maps (or default maps app) with destination pre-filled
- In-app map shows rider's current location, pharmacy pin, and customer pin throughout delivery

---

### 5.3 Failed Delivery Flow

If rider cannot complete the delivery:

**Rider taps "Report Failed Delivery"**

**Selects reason:**
- Customer not available / not responding
- Customer refused delivery
- Wrong address / unable to locate
- Safety concern at location
- Other (free text)

**What happens next:**
- CAdmin is notified immediately
- Order is flagged for manual review
- Rider is instructed to return package to pharmacy
- Pharmacy is notified in ERP
- Resolution is handled by CAdmin (reassign / refund / retry)

---

## PART 6 — EARNINGS

### 6.1 Earnings Structure

Every delivery earns the rider a combination of:

| Component | Description |
|-----------|-------------|
| Base delivery fee | Fixed amount per delivery (set by CAdmin) |
| Distance fee | Per km rate × total trip distance |
| Surge bonus | Extra amount during peak hours or high demand periods |
| Shift completion bonus | Bonus for completing minimum deliveries in a defined shift |
| Incentive / streak bonus | Bonus for completing X deliveries in a day/week |
| Referral bonus | One-time bonus when a referred rider completes their first delivery |

Exact amounts for each component are configured by CAdmin and can be updated anytime.

---

### 6.2 Live Earnings Counter

Rider sees a real-time earnings summary on their home screen:

**Today's earnings breakdown:**
- Deliveries completed today
- Base fees earned
- Distance fees earned
- Bonuses earned
- Total today

**This week:**
- Total deliveries
- Total earnings
- Pending payout amount

---

### 6.3 Earnings History

Rider can view detailed earnings history:

- Date-wise delivery log
- Per-delivery breakdown (base + distance + surge + bonus)
- Weekly earnings summary
- Payout history (date, amount, bank account, status)

---

### 6.4 Payouts

- Payouts are processed weekly (every Monday for previous week)
- Transferred directly to rider's registered bank account
- Rider receives in-app notification when payout is processed
- Rider can see payout history with transaction reference numbers
- Minimum payout threshold may apply (configurable by CAdmin)

---

### 6.5 Incentives & Bonus System

**Daily streak bonus:**
- Complete 5 deliveries → earn ₹X bonus
- Complete 10 deliveries → earn ₹Y bonus

**Weekly challenge:**
- CAdmin can create weekly challenges with targets and rewards

**Peak hour surge:**
- Surge multiplier applied automatically during high-demand windows
- Rider sees surge active indicator on home screen

**Shift bonus:**
- Completing an opted-in shift with minimum deliveries → bonus credited

**Referral program:**
- Rider gets a unique referral code
- Shares with friends to join as riders
- Referrer earns bonus when referred rider completes first 10 deliveries

All incentive structures are defined and managed by CAdmin.

---

## PART 7 — COMMUNICATION FEATURES

### 7.1 Call Customer (Masked Number)

- Rider can call customer from within the app during active delivery
- Customer's actual phone number is masked
- Call is routed through Cureli's telephony layer
- Neither rider nor customer sees the other's real number

---

### 7.2 Call Pharmacy

- Rider can call the pharmacy directly from the app during active delivery
- Pharmacy's contact number is shown (not masked — this is a business number)

---

### 7.3 In-App Chat with Customer

- Rider can send text messages to customer during active delivery
- Customer receives and replies via their Cureli mobile app
- Chat is limited to the duration of the active delivery
- Chat history is retained for support/dispute purposes
- Pre-set quick messages available (e.g. "I'm on my way", "I'm outside your building", "Please come to the gate")

---

## PART 8 — RATINGS & FEEDBACK

### 8.1 Customer Rates Rider

- After delivery is marked complete, customer is prompted to rate the rider in the Cureli customer app
- Rating: 1 to 5 stars
- Optional written feedback
- Rating is anonymous to the rider (rider sees average, not individual review text)

---

### 8.2 Rider Rates Customer

- After delivery is marked complete, rider is prompted to rate the customer
- Rating: 1 to 5 stars
- Reason selection for low ratings: Not available / Rude behavior / Wrong address given / Other
- Helps Cureli flag problematic customers

---

### 8.3 Rider Rating Dashboard

Rider can see their own rating performance:

- Overall average rating
- Total deliveries rated
- Rating breakdown (how many 5-star, 4-star, etc.)
- Recent rating trend (improving / declining)

---

### 8.4 Low Rating Consequences

- If rider rating falls below a configured threshold (e.g. below 3.5 stars):
  - CAdmin is automatically alerted
  - Rider receives in-app warning notification
  - If rating continues to drop → automatic temporary suspension
  - Rider is notified of suspension with reason
  - Rider can submit appeal from within the app

---

## PART 9 — SAFETY FEATURES

### 9.1 SOS Emergency Button

- Prominently placed SOS button accessible from active delivery screen and home screen
- One tap triggers emergency alert
- Alert is sent to:
  - Cureli CAdmin panel (immediate notification)
  - Rider's registered emergency contact (SMS)
- Alert includes:
  - Rider name
  - Current GPS location
  - Active order details (if any)
  - Timestamp

---

### 9.2 Live Location Sharing During Delivery

- When rider is on an active delivery, their GPS location is continuously shared with:
  - Cureli backend (for customer live tracking and CAdmin monitoring)
  - Customer mobile app (for live map tracking)
  - CAdmin dashboard (for fleet overview)
- Location sharing pauses when rider goes offline or completes delivery

---

### 9.3 Accident / Incident Reporting

Rider can report an incident from within the app at any time:

**Incident types:**
- Road accident
- Bike breakdown
- Theft or robbery
- Medical emergency
- Other

**Reporting flow:**
- Rider selects incident type
- Adds description (optional)
- Current location is auto-attached
- Report is sent to CAdmin immediately
- Active delivery (if any) is flagged for reassignment
- CAdmin contacts rider

---

### 9.4 Emergency Contact

- Rider registers one emergency contact during onboarding (name + phone)
- Used for SOS alert SMS
- Can be updated from profile settings

---

## PART 10 — SUPPORT & TICKETS

### 10.1 In-App Support Ticket System

Rider can raise a support request directly from the app.

**Issue categories:**
- Earnings / payout issue
- Order-related issue
- App technical problem
- Document or account issue
- Safety or incident follow-up
- Other

**Ticket flow:**
- Rider describes issue and submits
- Ticket number generated
- CAdmin receives and responds from admin panel
- Rider receives in-app notification for each reply
- Rider can reply, add details, or close ticket

---

### 10.2 FAQ Section

Common questions answered inside the app:

- How are earnings calculated?
- When will I get paid?
- What do I do if customer is not available?
- How do I change my zone?
- How do I update my bank details?
- What happens if I have an accident?

Content managed by CAdmin.

---

### 10.3 Rider Notifications

Rider receives in-app and push notifications for:

- New order assigned
- Order assignment timeout warning
- Payout processed
- Rating received
- Incentive unlocked
- Warning (low rating / high rejection rate)
- Suspension notice
- Appeal decision
- Support ticket reply
- System announcements from CAdmin

---

## PART 11 — RIDER HOME SCREEN

The home screen is the rider's command center.

**When Offline:**
- Go Online button (prominent, full width)
- Today's earnings summary
- Deliveries completed today
- Active incentive/challenge progress
- Available shift with bonus (if any)
- Rating display
- Quick links: Support / Profile / Earnings

**When Online (No Active Order):**
- Online indicator (green)
- Go Offline button
- Waiting for order animation
- Today's earnings live counter
- Current surge indicator (if active)
- Deliveries completed today

**When Order Assigned (Pending Accept):**
- Full-screen order request overlay
- 30-second countdown
- Pickup location, distance, estimated earnings
- Accept / Reject buttons

**When On Active Delivery:**
- Current step indicator (Going to pharmacy / Picked up / Going to customer / Arrived)
- Map with current location and destination
- Call / Chat buttons
- Mark step complete button
- SOS button (always visible)
- Estimated time remaining

---

## PART 12 — CADMIN PANEL — RIDER MANAGEMENT

All rider management is handled from within the existing Cureli CAdmin panel. A new "Delivery" section is added.

### 12.1 Rider Management

- View all riders (pending / active / suspended / rejected)
- Review and approve rider applications
- Review uploaded documents (Aadhaar, PAN, DL, RC, bank details)
- Approve or reject individual documents with reason
- Approve or reject full application
- Suspend or block a rider with reason
- Reactivate suspended riders
- View rider profile, rating, delivery history
- Manually assign a rider to an order (override auto-assign)

---

### 12.2 Zone Management

- Create and manage delivery zones (city-level and sub-zone level)
- Assign riders to zones
- Review and approve zone change requests from riders

---

### 12.3 Earnings & Payout Management

- Configure base delivery fee
- Configure per-km rate
- Configure surge rules (time-based or demand-based)
- Configure shift definitions and bonus amounts
- Configure daily/weekly incentive targets and rewards
- View weekly payout summary
- Process weekly payouts (or configure auto-payout)
- View individual rider earnings breakdown
- Manually adjust earnings (with reason — for dispute resolution)

---

### 12.4 Fleet Live Dashboard

- Map view of all online riders in real time
- Each rider shown as a pin with status (available / on delivery)
- Click rider pin to see name, rating, current order
- Active deliveries list with status and location
- Alerts panel (SOS triggered / no rider available / high rejection rate)

---

### 12.5 Incident & Safety Management

- View all incident reports submitted by riders
- SOS alerts with real-time location
- Assign follow-up action to incidents
- Mark incidents as resolved

---

### 12.6 Training Content Management

- Upload and manage onboarding training content
- Add / edit / remove FAQ articles
- Push announcements to all riders or specific zones

---

### 12.7 Performance Reports (Delivery Module)

- Total deliveries per day / week / month
- Average delivery time
- Acceptance rate by rider
- Rejection rate by rider
- Failed delivery report
- Rider rating leaderboard
- Zone-wise delivery volume
- Payout summary reports
- Incentive utilization report

---

### 12.8 Appeal Management

- View rider appeals for suspensions
- Review appeal details and rider history
- Approve appeal (reactivate rider) or reject appeal with reason
- Rider notified of decision in app

---

## PART 13 — CUSTOMER APP ADDITIONS

The existing Cureli customer mobile app needs the following additions to support the delivery module.

### 13.1 Live Rider Tracking Screen

- Appears automatically after order is picked up by rider
- Live map showing rider's moving location
- Customer address pin on map
- Rider name and profile photo shown
- Estimated arrival time (updates in real time)
- Call rider button (masked)
- Chat with rider button

---

### 13.2 Delivery Status Notifications

Customer receives push notifications at each step:

- Order assigned to rider
- Rider arrived at pharmacy
- Rider picked up your order
- Rider is on the way
- Rider arrived at your location
- Order delivered

---

### 13.3 Rate Your Rider

- After delivery marked complete, customer sees rating prompt
- 1–5 stars
- Optional feedback text
- Can be dismissed and completed later (reminder after 1 hour)

---

## PART 14 — PHARMACY ERP ADDITIONS

The existing pharmacy ERP web app needs the following additions to support the delivery module.

### 14.1 Delivery Status in Order Panel

- Marketplace order detail panel shows delivery status
- Rider name shown once assigned
- Current step shown (Going to pharmacy / Picked up / On the way / Delivered)
- Estimated arrival time at pharmacy shown
- Pharmacy can call rider from order panel

---

### 14.2 Package Handover Confirmation

- When rider marks "Arrived at Pharmacy", ERP shows alert
- Pharmacy staff taps "Hand Over Package" to confirm
- This triggers rider's ability to mark "Picked Up"
- Prevents pickup confirmation without pharmacy acknowledging

---

---

# COMPLETE FEATURE SUMMARY

| Module | Features |
|--------|----------|
| Onboarding | Self-registration, CAdmin invite, document upload, status tracking, zone assignment |
| Authentication | Phone + OTP login, persistent session, auto-logout on suspension |
| Profile | View/edit profile, document status, rating, referral code |
| Training | In-app onboarding walkthrough, FAQ, code of conduct |
| Availability | Go online/offline toggle, shift opt-in, surge indicator |
| Order Assignment | Auto-assign, 30-second accept window, cascade to next rider, order preview |
| Delivery Flow | 6-step confirmed delivery flow, map navigation, double confirmation at pickup |
| Failed Delivery | Reason selection, CAdmin alert, return to pharmacy flow |
| Communication | Masked call to customer, call to pharmacy, in-app chat with quick replies |
| Earnings | Live counter, per-delivery breakdown, history, weekly payout, statement |
| Incentives | Daily streak, weekly challenge, shift bonus, surge, referral program |
| Ratings | Customer rates rider, rider rates customer, rating dashboard, low-rating alerts |
| Safety | SOS button, live location sharing, accident/incident reporting, emergency contact |
| Support | In-app ticket system, FAQ, push notifications |
| CAdmin Panel | Rider management, zone management, earnings config, live fleet dashboard, payout processing, incident management, content management, appeal management, performance reports |
| Customer App | Live rider tracking, delivery notifications, rate your rider |
| Pharmacy ERP | Delivery status in order panel, package handover confirmation |

---

*This document defines the complete scope of the Cureli Delivery rider application. Implementation will be phased based on client priorities. Core delivery flow, onboarding, and CAdmin management form Phase 1. Incentives, safety features, and advanced reporting form Phase 2.*