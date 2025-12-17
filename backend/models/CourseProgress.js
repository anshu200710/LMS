import mongoose from 'mongoose';

const CourseProgressSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    courseId: {type: String, required: true},
    completed: {type: Boolean,  default: false}, // percentage of course completed
    lecturecompleted: [],

}, {minimize: false});

const CourseProgress = mongoose.model('CourseProgress', CourseProgressSchema);

export default CourseProgress;