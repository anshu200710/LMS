import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { clerkWebhooks } from "./controllers/webHooks.js";

dotenv.config();

const app = express();
await connectDB();

app.use(cors());

// ❌ REMOVE express.json() globally for webhooks
// app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("API IS WORKING"));

// ✅ RAW BODY ONLY FOR CLERK
app.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
