"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleExtract = handleExtract;
exports.handleProgress = handleProgress;
const batch_service_1 = require("../services/batch.service");
async function handleExtract(req, res) {
    try {
        const { rows, jobId } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: "No CSV rows provided." });
        }
        const result = await (0, batch_service_1.processBatches)(rows, jobId);
        return res.status(200).json(result);
    }
    catch (err) {
        console.error("Extraction error:", err);
        return res.status(500).json({ error: "Failed to process CSV extraction." });
    }
}
function handleProgress(req, res) {
    const jobId = req.params.jobId;
    if (!jobId || Array.isArray(jobId)) {
        return res.status(400).json({ error: "Missing jobId" });
    }
    const progress = batch_service_1.progressStore.get(jobId);
    if (!progress) {
        return res.status(404).json({ error: "Job not found" });
    }
    return res.status(200).json(progress);
}
//# sourceMappingURL=extract.controller.js.map