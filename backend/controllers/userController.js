import User from "../models/user.js";


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