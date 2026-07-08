import { Router } from "express";
import { handleExtract } from "../controllers/extract.controller";

const router = Router();

router.post("/", handleExtract);

export default router;