import { describe, it, expect } from "vitest";
import { validateAndEnforceRecords } from "./ai.service";

function makeRecord(overrides: Partial<Record<string, string>> = {}) {
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

describe("validateAndEnforceRecords", () => {
  it("keeps a record with an email", () => {
    const parsed = [makeRecord({ email: "test@example.com" })];
    const rows = [{ Email: "test@example.com" }];
    const { validRecords } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords).toHaveLength(1);
  });

  it("keeps a record with only a mobile number", () => {
    const parsed = [makeRecord({ mobile_without_country_code: "9876543210" })];
    const rows = [{ Phone: "9876543210" }];
    const { validRecords } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords).toHaveLength(1);
  });

  it("skips a record with neither email nor mobile", () => {
    const parsed = [makeRecord({ name: "No Contact" })];
    const rows = [{ Name: "No Contact" }];
    const { validRecords, skipped } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]!.reason).toBe("No email or mobile number found");
  });

  it("blanks out data_source if it doesn't appear in the original row", () => {
    const parsed = [
      makeRecord({ email: "a@example.com", data_source: "leads_on_demand" }),
    ];
    const rows = [{ Email: "a@example.com", Campaign: "Summer Sale" }];
    const { validRecords } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords[0]!.data_source).toBe("");
  });

  it("keeps data_source if it genuinely appears in the original row", () => {
    const parsed = [
      makeRecord({ email: "a@example.com", data_source: "eden_park" }),
    ];
    const rows = [{ Email: "a@example.com", Source: "eden_park" }];
    const { validRecords } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords[0]!.data_source).toBe("eden_park");
  });

  it("rejects a record that fails schema validation", () => {
    const parsed = [{ invalid: "shape" }];
    const rows = [{ Email: "a@example.com" }];
    const { validRecords, skipped } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });

  it("rejects a record with a non-empty but invalid email format", () => {
    const parsed = [makeRecord({ email: "notanemail" })];
    const rows = [{ Email: "notanemail" }];
    const { validRecords, skipped } = validateAndEnforceRecords(parsed, rows);
    expect(validRecords).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]!.reason).toContain("email");
  });
});