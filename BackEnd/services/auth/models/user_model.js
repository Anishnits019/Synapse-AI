import mongoose from "mongoose"
import { timeStamp } from "node:console"
const userSchema= new mongoose.Schema(
    {
        firebaseUID:{
           type:String,
           unique:true
        },
        name:String,
        email:String,
        avatar:String,
        plan:{
            type:String,
            default:"free"
        },
        credits:{
            type:Number,
            default:100
        },
        totalCredits:{
            type:Number,
            default:100
        },
        planExpiresAt:Date
    },
    {
    timestamps:true
    }
)
const UserModel=mongoose.model("User",userSchema)
 
export default UserModel