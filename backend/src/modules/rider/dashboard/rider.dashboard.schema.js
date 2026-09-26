// backend/src/modules/rider/dashboard/rider.dashboard.schema.js (do not remove this comment)
import { z } from "zod";

// No request body — GET endpoint.
// Query params are optional (reserved for future period filtering).
export const dashboardQuerySchema = z.object({}).optional();