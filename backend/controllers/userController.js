import User from "../models/user.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);


export const getUserdata = async (req, res) => {
    try {
        const { userId } = req.auth();


    const user= await User.findById(userId);

    if(!user){
        return res.json({success: false, message: "User not found"});
    }
    res.json({success: true, user});

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


///Users Enrolled Courses with lecture links

export const UserEnrolledCourses = async (req, res) => {
    try {
        const { userId } = req.auth();

        const userData= await User.findById(userId).populate('enrolledCourses');
        res.json({success: true, enrolledCourses: userData.enrolledCourses});
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


//purchase course functionality
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const { userId } = req.auth(); // ✅ correct Clerk usage

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const purchase = await Purchase.create({
      courseId: course._id,
      userId: user._id,
      amount: (
        course.coursePrice -
        (course.coursePrice * course.discount) / 100
      ).toFixed(2),
      status: "pending",
    });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: course.courseTitle },
            unit_amount: Math.floor(Number(purchase.amount) * 100),
          },
          quantity: 1,
        },
      ],
      // include the CHECKOUT_SESSION_ID so frontend can verify / poll if needed
      success_url: `${origin}/loading/my-enrollments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/course/${course._id}`,
      metadata: {
        purchaseId: purchase._id.toString(),
      },
    });

    // 🔴 THIS MUST BE THE LAST LINE
    return res.json({
      success: true,
      sessionUrl: session.url,
    });

  } catch (error) {
    console.error("purchaseCourse error:", error);

    // 🔴 ONLY reached if NO response was sent above
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



///updated user course progress

export const updateCourseProgress = async (req, res) => {
    try {
       const { userId } = req.auth()

        const { courseId, lectureId } = req.body;
        const progressData = await CourseProgress.findOne({userId, courseId});

        if(progressData){
          // If lecture already completed, do not re-add it
          if(progressData.lecturecompleted.includes(lectureId)){
            return res.json({success: false, message: "Lecture already completed"});
          }

          progressData.lecturecompleted.push(lectureId);
            await progressData.save();
            return res.json({success: true, message: "Course progress updated"});
        }else{
            await CourseProgress.create({
                userId,
                courseId,   
                lecturecompleted: [lectureId],
            });
            return res.json({success: true, message: "Course progress created"});
    }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// get user course progress

export const getuserCourseProgress = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({userId, courseId});

        res.json({success: true, progressData});
    } catch (error) {
                res.json({ success: false, message: error.message });
    }
}


//add user rating to course
export const addCourseRating = async (req, res) => {

    const { userId } = req.auth()

        const { courseId, rating } = req.body;
        const courseData = await Course.findById(courseId);

        
        if(!courseId || !userId || !rating || rating<1 || rating>5){
            return res.json({success: false, message: "All fields are required"});
        }


    try {
        const course = await Course.findById(courseId);
        if(!courseData){
            return res.json({success: false, message: "Course not found"});
        }

        const user = await User.findById(userId)

        if(!user || !user.enrolledCourses.includes(courseId)){
            return res.json({success: false, message: "User has not purchased this course"});
        }

        const existingRatingIndex = course.ratings.findIndex(r => r.userId.toString() === userId);

        if(existingRatingIndex !== -1){
            course.ratings[existingRatingIndex].rating = rating;
        }else{
            course.ratings.push({userId, rating});
        }

        await course.save();
        res.json({success: true, message: "Rating added successfully"});
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// Verify a Stripe session and report purchase/enrollment status
export const getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.auth();

    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });

    // Retrieve session from Stripe to read metadata (purchaseId)
    let session;
    try {
      session = await stripeClient.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error('Stripe retrieve session failed:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid session id' });
    }

    const purchaseId = session.metadata?.purchaseId;
    console.log('getSessionStatus: session metadata purchaseId ->', purchaseId);
    if (!purchaseId) {
      return res.json({ success: true, status: 'no_purchase', purchaseCompleted: false });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      console.warn('getSessionStatus: Purchase not found for purchaseId', purchaseId);
      return res.json({ success: true, status: 'purchase_not_found', purchaseCompleted: false });
    }

    // Check DB status and whether user is enrolled
    const purchaseCompleted = purchase.status === 'completed';

    const user = await User.findById(userId).select('enrolledCourses');
    const enrolled = user?.enrolledCourses?.some(id => id.toString() === purchase.courseId.toString()) || false;

    console.log('getSessionStatus result:', { purchaseCompleted, enrolled, purchaseId });

    return res.json({ success: true, purchaseCompleted, enrolled, purchaseId });
  } catch (error) {
    console.error('getSessionStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}