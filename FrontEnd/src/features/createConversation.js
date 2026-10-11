import api from "../../utils/axios.js"
export async function createConversation() {
    try {
        const { data } = await api.post("chat/create-conversation")
        return data
    }catch(error){
        console.log(error)
        return null
    }
 
}