import Conversation from "../models/convo_model.js"
import Message from "../models/msg_model.js"

export const CreateConversation =async(req,res)=>{
   try{
    const userID=req.headers['x-user-id']
    if (!userID) {
      return res.status(400).json({ message: "User ID header (x-user-id) is required" })
    }
    const conversation=await Conversation.create({
          userID:userID
    })
    return res.status(200).json(conversation)
   }catch(error){
      return res.status(500).json({
        message:`create conversation error ${error}`
      })
   }
}

export const getConversations =async(req,res)=>{
   try{
    const userID=req.headers['x-user-id']
    if (!userID) {
      return res.status(400).json({ message: "User ID header (x-user-id) is required" })
    }
    const conversation=await Conversation.find({
          $or: [
            { userID: userID },
            { user_id: userID }
          ]
    }).sort({updatedAt:-1})

      console.log("Fetched conversations:", conversation)

    return res.status(200).json(conversation)
   }catch(error){
      return res.status(500).json({
        message:`create conversation error ${error}`
      })
   }
}

export const updateConversation =async(req,res)=>{
   try{
    const {conversation_id,title}=req.body
    const userID=req.headers['x-user-id']
    if (!userID) {
      return res.status(400).json({ message: "User ID header (x-user-id) is required" })
    }
    const update_conversation=await Conversation.findOneAndUpdate({
      _id: conversation_id,
      $or: [{ userID }, { user_id: userID }]
    }, { title },
     {returnDocument: 'after', 
      runValidators:true
    }
  )
    if (!update_conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }
    return res.status(200).json(update_conversation)
   }catch(error){
      return res.status(500).json({
        message:`create update_conversation error ${error}`
      })
   }
}

export const deleteConversation =async(req,res)=>{
   try{
      const {conversation_id}=req.params
      
      const delete_conversation=await Conversation.findByIdAndDelete({
         _id: conversation_id
      })

      const delete_messages= await Message.deleteMany({
        conversation_id:conversation_id
      })
      return res.status(200).json({
         message: "Conversation deleted successfully",
         "delete_converstaion":delete_conversation,
         "delete_messages":delete_messages
      })
   }catch(error){
      return res.status(500).json({
        message:`create conversation error ${error}`
      })
   }}

export const saveMessage =async(req,res)=>{
   try{
      const {conversation_id,role,content,artifacts=[],image_url}=req.body
    const message= await Message.create({
        conversation_id:conversation_id,
        role:role,
        content:content,
        artifacts: artifacts.length > 0 ? [{
               type: artifacts.some((artifact) => artifact.file_path) ? "text" : "code",
               files: artifacts.map(({name,content,file_path,language}) => ({
                  name,
                  ...(content != null && { content }),
                  ...(file_path && { file_path }),
                  ...(language && { language })
               }))
         }] : [],
      image_url: image_url || undefined
    })
    return res.status(200).json(message)
   }catch(error){
      return res.status(500).json({
        message:`create conversation error ${error}`
      })
   }
}

export const getMessages =async(req,res)=>{

   try{
    const userID=req.headers['x-user-id']
    if (!userID) {
      return res.status(400).json({ message: "User ID header (x-user-id) is required" })
    }
    const conversation=await Conversation.findOne({
      _id:req.params.conversationId,
      $or: [{ userID }, { user_id: userID }]
    })
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }
    const messages= await Message.find({
        conversation_id:req.params.conversationId
    })
    
    return res.status(200).json(messages)
   }catch(error){
      return res.status(500).json({
        message:`create conversation error ${error}`
      })
   }
}
