import { Webhook } from "svix";
import User from "../models/user.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const payload = req.body.toString(); // RAW BODY REQUIRED
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const event = wh.verify(payload, headers);

    const { type, data } = event;

    console.log(`Clerk webhook received: ${type} for id ${data?.id}`);

    // ✅ SAFELY GET EMAIL
    const email =
      data.email_addresses?.[0]?.email_address || "";

    switch (type) {
      case "user.created":
        // Use upsert to create or update the user safely even if some fields are missing
        await User.findByIdAndUpdate(
          data.id,
          {
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            email: email || undefined,
            image: data.image_url || undefined,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        break;

      case "user.updated":
        await User.findByIdAndUpdate(
          data.id,
          {
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            email: email || undefined,
            image: data.image_url || undefined,
          },
          { new: true }
        );
        break;

      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;

      default:
        break;
    }

    // ✅ MUST RETURN 200
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.status(400).json({ success: false });
  }
};
