import { z } from "zod";

// No request body — GET endpoint.
// Query params are optional (reserved for future period filtering).
export const dashboardQuerySchema = z.object({}).optional();