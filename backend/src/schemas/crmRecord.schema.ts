import { z } from "zod";

export const crmStatusEnum = z.enum([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
]);

export const dataSourceEnum = z.enum([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
]);

export const crmRecordSchema = z.object({
  created_at: z.string().optional().default(""),
  name: z.string().optional().default(""),
  email: z
  .string()
  .optional()
  .default("")
  .refine((val) => val === "" || z.string().email().safeParse(val).success, {
    message: "Invalid email format",
  }),
  country_code: z.string().optional().default(""),
  mobile_without_country_code: z.string().optional().default(""),
  company: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  lead_owner: z.string().optional().default(""),
  crm_status: z
    .union([crmStatusEnum, z.literal("")])
    .optional()
    .default(""),
  crm_note: z.string().optional().default(""),
  data_source: z
    .union([dataSourceEnum, z.literal("")])
    .optional()
    .default(""),
  possession_time: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type CrmRecord = z.infer<typeof crmRecordSchema>;