import express from 'express';
import { addCourseRating, getuserCourseProgress, getUserdata, purchaseCourse, updateCourseProgress, UserEnrolledCourses } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/data', getUserdata)
userRouter.get('/enrolled-courses', UserEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)

userRouter.post('/update-course-progress', updateCourseProgress)
userRouter.post('/get-course-progress', getuserCourseProgress)
userRouter.post('/add-rating', addCourseRating)

export default userRouter