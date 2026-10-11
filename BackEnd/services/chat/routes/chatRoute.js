import express from "express"
import { CreateConversation,
         getConversations,
        getMessages, 
        saveMessage,
        updateConversation,
        deleteConversation
    } from "../controllers/chat_controller.js"

const chatRouter=express.Router()


chatRouter.post("/create-conversation", CreateConversation)
chatRouter.get("/get-conversation", getConversations)
chatRouter.post("/save-message", saveMessage)
chatRouter.get("/get-messages/:conversationId", getMessages)
chatRouter.post("/update-conversation", updateConversation)
chatRouter.post("/delete-conversation/:conversation_id",deleteConversation)

export default chatRouter