import express from 'express';
import { getUserdata, UserEnrolledCourses } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/data', getUserdata)
userRouter.get('/enrolled-courses', UserEnrolledCourses)

export default userRouter