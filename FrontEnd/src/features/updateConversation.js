import api from "../../utils/axios.js"

export async function updateConversation(conversation_id, title) {
     try{
       const {data}=await api.post(`chat/update-conversation`, 

        {   conversation_id: conversation_id,
            title: title
        }
    )

    return data
     }catch(error){
        console.log(error)
        return null
     }
}