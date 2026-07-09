"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const extract_controller_1 = require("../controllers/extract.controller");
const router = (0, express_1.Router)();
router.post("/", extract_controller_1.handleExtract);
router.get("/progress/:jobId", extract_controller_1.handleProgress);
exports.default = router;
//# sourceMappingURL=extract.route.js.map