import { CrmRecord } from "../schemas/crmRecord.schema";
export declare function extractCrmRecords(rows: Record<string, string>[]): Promise<{
    records: CrmRecord[];
    skippedCount: number;
}>;
//# sourceMappingURL=ai.service.d.ts.map