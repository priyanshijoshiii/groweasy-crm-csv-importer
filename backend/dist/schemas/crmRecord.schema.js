"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmRecordSchema = exports.dataSourceEnum = exports.crmStatusEnum = void 0;
const zod_1 = require("zod");
exports.crmStatusEnum = zod_1.z.enum([
    "GOOD_LEAD_FOLLOW_UP",
    "DID_NOT_CONNECT",
    "BAD_LEAD",
    "SALE_DONE",
]);
exports.dataSourceEnum = zod_1.z.enum([
    "leads_on_demand",
    "meridian_tower",
    "eden_park",
    "varah_swamy",
    "sarjapur_plots",
]);
exports.crmRecordSchema = zod_1.z.object({
    created_at: zod_1.z.string().optional().default(""),
    name: zod_1.z.string().optional().default(""),
    email: zod_1.z.string().optional().default(""),
    country_code: zod_1.z.string().optional().default(""),
    mobile_without_country_code: zod_1.z.string().optional().default(""),
    company: zod_1.z.string().optional().default(""),
    city: zod_1.z.string().optional().default(""),
    state: zod_1.z.string().optional().default(""),
    country: zod_1.z.string().optional().default(""),
    lead_owner: zod_1.z.string().optional().default(""),
    crm_status: zod_1.z
        .union([exports.crmStatusEnum, zod_1.z.literal("")])
        .optional()
        .default(""),
    crm_note: zod_1.z.string().optional().default(""),
    data_source: zod_1.z
        .union([exports.dataSourceEnum, zod_1.z.literal("")])
        .optional()
        .default(""),
    possession_time: zod_1.z.string().optional().default(""),
    description: zod_1.z.string().optional().default(""),
});
//# sourceMappingURL=crmRecord.schema.js.map