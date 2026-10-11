import mongoose from "mongoose"

const fileSchema =new mongoose.Schema(
    {
    name:String,
    content:String
},
{ _id: false })

const artifactSchema = new mongoose.Schema({
    artifactId:String,
    title:String,
    type:{
        type:String,
        enum:["code","image","text","video"]
    },
    files:[fileSchema]
})

const messageSchema=new mongoose.Schema({
    conversation_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Conversation"
      },
      role:{
         type:String,
         enum:["user","assistant"]
      },
      content:String,
      artifacts:[artifactSchema],
      image_url:{
        type:String
      }
      
},{
    timestamps:true
})

const Message=mongoose.model("Message",messageSchema)
export default Message
