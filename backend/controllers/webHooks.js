import { Webhook } from "svix";
import User from "../models/user.js";
import Purchase from "../models/Purchase.js";
import Course from "../models/Course.js";
import Stripe from "stripe";

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

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);


// export const stripeWebhooks = async (request, response) => {
//   const sig = request.headers['stripe-signature'];

//   let event;

//   try {
//     event = Stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   }
//   catch (err) {
//     response.status(400).send(`Webhook Error: ${err.message}`);
//   }


//   // Handle the event
//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object;
//       const paymentIntentId = paymentIntent.id
      

//       const session = await stripeInstance.checkout.sessions.list({
//         payment_intent: paymentIntentId,

//       })

//       const { purchaseId }= session.data[0].metadata;
//       const purchaseData = await Purchase.findById(purchaseId);


//       const userData = await User.findById(purchaseData.userId);
//       const courseData = await Course.findById(purchaseData.courseId.toString());

//       courseData.enrolledStudents.push(userData);
//       await courseData.save();

//       userData.enrolledCourses.push(courseData._id);
//       await userData.save();

//       purchaseData.status = "completed";
//       await purchaseData.save();


//       break;
//     case 'payment_intent.payment_failed':{
//       const paymentIntent = event.data.object;
//       const paymentIntentId = paymentIntent.id
      

//       const session = await stripeInstance.checkout.sessions.list({
//         payment_intent: paymentIntentId,

//       })

//       const { purchaseId }= session.data[0].metadata;

//       const purchaseData = await Purchase.findById(purchaseId);
//       purchaseData.status = "failed";
//       await purchaseData.save();
//       break;
//     }
//     // ... handle other event types
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }

//   // Return a response to acknowledge receipt of the event
//   response.json({received: true});
// };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  // Top-level logging so we can see every incoming request to /stripe
  console.log('Incoming Stripe webhook request. headers.stripe-signature present:', typeof req.headers['stripe-signature'] !== 'undefined');
  console.log('Request body length:', req.body ? (Buffer.isBuffer(req.body) ? req.body.length : JSON.stringify(req.body).length) : 0);

  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ ONLY THIS EVENT FOR CHECKOUT
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const purchaseId = session?.metadata?.purchaseId;
      console.log('Stripe webhook received checkout.session.completed, session.id:', session?.id, 'purchaseId:', purchaseId);

      try {
        if (!purchaseId) {
          console.warn('No purchaseId in session metadata for session', session?.id);
          return res.json({ received: true });
        }

        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
          console.warn('Purchase not found for id', purchaseId);
          return res.json({ received: true });
        }

        // ✅ mark purchase completed
        if (purchase.status !== 'completed') {
          purchase.status = "completed";
          await purchase.save();
          console.log('Purchase marked completed:', purchaseId);
        } else {
          console.log('Purchase was already completed:', purchaseId);
        }

        // ✅ enroll user
        await User.findByIdAndUpdate(purchase.userId, {
          $addToSet: { enrolledCourses: purchase.courseId },
        });

        // ✅ add student to course
        await Course.findByIdAndUpdate(purchase.courseId, {
          $addToSet: { enrolledStudents: purchase.userId },
        });
        console.log('Enrollment updated for purchase:', purchaseId);
      } catch (err) {
        console.error('Error processing checkout.session.completed:', err && err.stack ? err.stack : err);
        return res.status(500).send('Webhook handler error');
      }
    }

    return res.json({ received: true });
  } catch (err) {
    // Catch any unexpected error and return 500 with a helpful log
    console.error('Unexpected error in stripeWebhooks handler:', err && err.stack ? err.stack : err);
    return res.status(500).send('Internal webhook handler error');
  }
};