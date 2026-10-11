import api from "../../utils/axios.js"

export async function deleteConversation(conversation_id) {
     try{
       const {data}=await api.post(`chat/delete-conversation/${conversation_id}`)
       return data
     }catch(error){
        console.log(error)
        return null
     }
}