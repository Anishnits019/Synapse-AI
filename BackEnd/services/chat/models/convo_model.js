import mongoose, { Mongoose } from "mongoose"

const conversationSchema = new mongoose.Schema({
    title:{
        type:String,
        default:"New Chat"
    },
    userID:{
        type:String
    },
    messages_no:{
        type:Number,
        default:0
    }
})
const Conversation=mongoose.model("Conversation",conversationSchema)
export default Conversation
