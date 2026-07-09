import { CrmRecord } from "../schemas/crmRecord.schema";
export declare function validateAndEnforceRecords(parsed: unknown[], rows: Record<string, string>[]): CrmRecord[];
export declare function extractCrmRecords(rows: Record<string, string>[]): Promise<{
    records: CrmRecord[];
    skippedCount: number;
}>;
//# sourceMappingURL=ai.service.d.ts.map