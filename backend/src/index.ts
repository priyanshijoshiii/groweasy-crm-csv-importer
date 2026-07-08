import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import extractRoute from "./routes/extract.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
      res.send("GrowEasy CRM CSV Importer backend is running.");
});

app.use("/api/extract", extractRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});