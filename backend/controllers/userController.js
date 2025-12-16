import User from "../models/user.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";


export const getUserdata = async (req, res) => {
    try {
        const userId = req.auth .userId;

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
        const userId = req.auth.userId;

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

        const {origin}  = req.headers;

        const userId = req.auth.userId;
        const userData = await User.findById(userId)

        const courseData = await Course.findById(courseId);

        if(!courseData || !userData){
            return res.json({success: false, message: "Course not found"});
        }

        const purchasedData = {
            courseId: courseData._id,
            userId: userData._id,
            amount: (courseData.coursePrice - (courseData.coursePrice * courseData.discount)/100).toFixed(2),

        }
        const newPurchase = await Purchase.create(purchasedData)


        //stripe gateway Initialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase() || 'USD';

        // creacting line items for stripe
        const line_items = [{
            price_date:{
                currency,
                product_data: {
                    name: courseData.courseTitle,

                },
                unit_amount: Math.floor(newPurchase.amount)*100,

            },

            quantity: 1,
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/course/${courseData._id}`,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString(),
            }
        })


        res.json({success: true, sessionUrl: session.url, message: "Course purchase initiated"});    
            
    } catch (error) {
        
    }
}