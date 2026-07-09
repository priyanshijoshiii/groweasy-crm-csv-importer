import { z } from "zod";
export declare const crmStatusEnum: z.ZodEnum<{
    GOOD_LEAD_FOLLOW_UP: "GOOD_LEAD_FOLLOW_UP";
    DID_NOT_CONNECT: "DID_NOT_CONNECT";
    BAD_LEAD: "BAD_LEAD";
    SALE_DONE: "SALE_DONE";
}>;
export declare const dataSourceEnum: z.ZodEnum<{
    leads_on_demand: "leads_on_demand";
    meridian_tower: "meridian_tower";
    eden_park: "eden_park";
    varah_swamy: "varah_swamy";
    sarjapur_plots: "sarjapur_plots";
}>;
export declare const crmRecordSchema: z.ZodObject<{
    created_at: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    email: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    country_code: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    mobile_without_country_code: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    company: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    city: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    state: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    country: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    lead_owner: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    crm_status: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        GOOD_LEAD_FOLLOW_UP: "GOOD_LEAD_FOLLOW_UP";
        DID_NOT_CONNECT: "DID_NOT_CONNECT";
        BAD_LEAD: "BAD_LEAD";
        SALE_DONE: "SALE_DONE";
    }>, z.ZodLiteral<"">]>>>;
    crm_note: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    data_source: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        leads_on_demand: "leads_on_demand";
        meridian_tower: "meridian_tower";
        eden_park: "eden_park";
        varah_swamy: "varah_swamy";
        sarjapur_plots: "sarjapur_plots";
    }>, z.ZodLiteral<"">]>>>;
    possession_time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CrmRecord = z.infer<typeof crmRecordSchema>;
//# sourceMappingURL=crmRecord.schema.d.ts.map