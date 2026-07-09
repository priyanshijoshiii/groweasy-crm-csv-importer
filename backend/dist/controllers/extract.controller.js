"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleExtract = handleExtract;
const batch_service_1 = require("../services/batch.service");
async function handleExtract(req, res) {
    try {
        const { rows } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: "No CSV rows provided." });
        }
        const result = await (0, batch_service_1.processBatches)(rows);
        return res.status(200).json(result);
    }
    catch (err) {
        console.error("Extraction error:", err);
        return res.status(500).json({ error: "Failed to process CSV extraction." });
    }
}
//# sourceMappingURL=extract.controller.js.map