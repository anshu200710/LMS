import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

//connect to mongodb 

const connectDB = async ()=> {
    mongoose.connection.on('connected', ()=> console.log("DB connected"))

    try {
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
   
}

export default connectDB;