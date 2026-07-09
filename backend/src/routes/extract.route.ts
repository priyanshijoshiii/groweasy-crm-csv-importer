import { Router } from "express";
import { handleExtract, handleProgress } from "../controllers/extract.controller";

const router = Router();

router.post("/", handleExtract);
router.get("/progress/:jobId", handleProgress);

export default router;