import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import extractRoute from "./routes/extract.route";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 extract requests per window
  message: { error: "Too many requests. Please try again later." },
});

app.use("/api/extract", extractLimiter);

app.get("/", (req, res) => {
      res.send("GrowEasy CRM CSV Importer backend is running.");
});

app.use("/api/extract", extractRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});