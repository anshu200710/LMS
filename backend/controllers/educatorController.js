import { clerkClient } from '@clerk/express'
import Cousre from '../models/Course.js';
import {v2 as cloudinary} from 'cloudinary';
import Purchase from '../models/Purchase.js';

// UPDATE ROLE TO EDUCATOR
export const updateRoleToEducator = async (req, res) => {
    try {
        const { userId } = req.auth();


        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: 'You Can publish a course now.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// ADD NEW COURSE
export const addCourse = async(req, res) => {
    try {
        const {courseData} = req.body;
        const imageFile = req.file;
        const eduactorId = req.auth.userId;


        if (!imageFile){
            return res.status(400).json({success: false, message: 'Course thumbnail is not Attached.'});
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.eduactor = eduactorId

        const newCourse = await Cousre.create(parsedCourseData)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url

        await newCourse.save();

        res.json({success: true, message: 'Course Created Successfully', courseId: newCourse._id});

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// GET EDUCATOR COURSES
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Cousre.find({eduactor: educator})
        res.json({success: true, courses});
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// GET EDUCATOR DASHBOARD DATA (TOTAL, EARNING, ENROLLED STUDENTS, No OF COURSES)
export const eduactorDashboardData = async (req, res) => {
    try {
        const eduactor = req.auth.userId;

        const courses = await Cousre.find({eduactor})
        const totalCourses = courses.length;

        const coursesIds = courses.map((course) => course._id);

        // calculate total earning from purchase
        const purchases = await Purchase.find({
            courseId: { $in: coursesIds },
            status: 'completed'
        })

        const totalEarning = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

        // collect unique enrolled student Id's with their courses titles
        const enrolledStudentsData = [];

    for (const course of courses) {
        const students = await User.find({
            _id: { $in: course.enrolledStudents },

        }, 'name imageUrl');

        students.forEach(student => {
            enrolledStudentsData.push({
                courseTitle: course.courseTitle,
                student
            });
        });
    }

    res.json({
        success: true,
        dashboardData: {
            totalCourses,   
            totalEarning,
            enrolledStudents: enrolledStudentsData
        }   
    })
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get enrolled student data with purchase data

export const getenrolledStudentsData = async(req, res) => {
    try {
        const eduactor = req.auth.userId;

        const courses = Cousre.find({eduactor})

        const coursesIds = courses.map((course) => course._id);

        const puchases = await purchase.find({
            courseId: { $in: coursesIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        const enrolledStudents = puchases.map((purchase) => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt,
        }))
        res.json({success: true, enrolledStudents});

    } catch (error) {
        res.json({ success: false, message: error.message });        
    }
}

