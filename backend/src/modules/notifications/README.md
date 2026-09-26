<!-- backend/src/modules/notifications/README.md (do not remove this comment) -->
# Notifications Module

Centralized notification system for Cureli.

## Usage

### Basic Usage

```javascript
import { notify, Notify, NOTIFICATION_EVENTS } from './modules/notifications';

// Method 1: Using notify() directly
await notify({
  type: NOTIFICATION_EVENTS.SHOP_VERIFIED,
  context: { shop_id: '...' },
});

// Method 2: Using convenience methods
await Notify.shopVerified(shop_id);
await Notify.ticketCreated({ ticket_number, subject, category, ... });
await Notify.passwordResetRequested(email, resetUrl, userName);

```
