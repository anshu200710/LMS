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
        res.json({ success: false, message: error.message });
    }
}


///updated user course progress

export const updateCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;
        const progressData = await CourseProgress.findOne({userId, courseId});

        if(progressData){
            if(!progressData.lecturecompleted.includes(lectureId)){
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
        const userId = req.auth.userId;
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({userId, courseId});

        res.json({success: true, progressData});
    } catch (error) {
                res.json({ success: false, message: error.message });
    }
}


//add user rating to course
export const addCourseRating = async (req, res) => {

    const userId = req.auth.userId;
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