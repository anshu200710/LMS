import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { clerkWebhooks } from "./controllers/webHooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./config/cloudinary.js";
import courseRouter from "./routes/courseRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/webHooks.js";

dotenv.config();

const app = express();
await connectDB();
await connectCloudinary()

app.use(cors());


// Health check
app.get("/", (req, res) => res.send("API IS WORKING"));


// Register webhooks BEFORE body parser and Clerk middleware to ensure raw body is available
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

app.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

// Clerk middleware and regular JSON body parsing for application routes
app.use(clerkMiddleware())

app.use("/api/educator", express.json(), educatorRouter);
app.use('/api/courses', express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter)

app.use(express.json())

const PORT = process.env.PORT || 5003;
app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
