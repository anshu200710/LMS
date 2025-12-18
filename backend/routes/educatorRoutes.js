import express from 'express'
import { addCourse, eduactorDashboardData, getEducatorCourses, getenrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js'
import upload from '../config/multer.js'
import protect from '../middlewares/authMiddleware.js'


const educatorRouter = express.Router()


educatorRouter.post('/add-course', upload.single('image'), protect, addCourse)
educatorRouter.get('/courses', protect, getEducatorCourses)

educatorRouter.post('/update-role', updateRoleToEducator)
educatorRouter.get('/dashboard', protect, eduactorDashboardData)
educatorRouter.get('/enrolled-students', getenrolledStudentsData)



export default educatorRouter