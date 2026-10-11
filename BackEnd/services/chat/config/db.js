import mongoose from "mongoose"

export const connectDB=async()=>{
    try{
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Mongo DB connected")
    }
    catch(error){
        console.log("DB didn't connected")
    }
}

export default connectDB