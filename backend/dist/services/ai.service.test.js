"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ai_service_1 = require("./ai.service");
function makeRecord(overrides = {}) {
    return {
        created_at: "",
        name: "Test Lead",
        email: "",
        country_code: "",
        mobile_without_country_code: "",
        company: "",
        city: "",
        state: "",
        country: "",
        lead_owner: "",
        crm_status: "",
        crm_note: "",
        data_source: "",
        possession_time: "",
        description: "",
        ...overrides,
    };
}
(0, vitest_1.describe)("validateAndEnforceRecords", () => {
    (0, vitest_1.it)("keeps a record with an email", () => {
        const parsed = [makeRecord({ email: "test@example.com" })];
        const rows = [{ Email: "test@example.com" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result).toHaveLength(1);
    });
    (0, vitest_1.it)("keeps a record with only a mobile number", () => {
        const parsed = [makeRecord({ mobile_without_country_code: "9876543210" })];
        const rows = [{ Phone: "9876543210" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result).toHaveLength(1);
    });
    (0, vitest_1.it)("skips a record with neither email nor mobile", () => {
        const parsed = [makeRecord({ name: "No Contact" })];
        const rows = [{ Name: "No Contact" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result).toHaveLength(0);
    });
    (0, vitest_1.it)("blanks out data_source if it doesn't appear in the original row", () => {
        const parsed = [
            makeRecord({ email: "a@example.com", data_source: "leads_on_demand" }),
        ];
        const rows = [{ Email: "a@example.com", Campaign: "Summer Sale" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result[0].data_source).toBe("");
    });
    (0, vitest_1.it)("keeps data_source if it genuinely appears in the original row", () => {
        const parsed = [
            makeRecord({ email: "a@example.com", data_source: "eden_park" }),
        ];
        const rows = [{ Email: "a@example.com", Source: "eden_park" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result[0].data_source).toBe("eden_park");
    });
    (0, vitest_1.it)("rejects a record that fails schema validation", () => {
        const parsed = [{ invalid: "shape" }];
        const rows = [{ Email: "a@example.com" }];
        const result = (0, ai_service_1.validateAndEnforceRecords)(parsed, rows);
        (0, vitest_1.expect)(result).toHaveLength(0);
    });
});
//# sourceMappingURL=ai.service.test.js.map