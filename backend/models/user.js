import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    // Make email optional and sparse so multiple users without an email can exist
    email: { type: String, unique: true, sparse: true },
    resume: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
}, { timestamps: true })


const User = mongoose.model('User', userSchema);

export default User