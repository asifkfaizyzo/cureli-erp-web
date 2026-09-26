// backend/src/modules/cadmin/broadcast/email/index.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/index.js

export * from './cadminEmailBroadcast.service.js';
export * from './cadminEmailBroadcast.controller.js';
export * from './cadminEmailBroadcast.schema.js';
export { default as emailBroadcastRoutes } from './cadminEmailBroadcast.routes.js';

// Utilities
export * from './emailBroadcast.converter.js';
export * from './emailBroadcast.template.js';
export * from './emailBroadcast.quota.js';
export * from './emailBroadcast.unsubscribe.js';
export * from './emailBroadcast.recipients.js';

// Unsubscribe Management
export * from './unsubscribeManagement.controller.js';