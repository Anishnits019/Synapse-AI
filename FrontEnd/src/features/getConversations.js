import api from "../../utils/axios.js"
export async function getConversations () {
    try {
        const { data } = await api.get("chat/get-conversation")
        return data
    }catch(error){
        console.log(error)
        return []
    }
    
}