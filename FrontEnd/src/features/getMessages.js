import api from "../../utils/axios.js"
export async function getMessages(id) {
    try {
        const { data } = await  api.get(`chat/get-messages/${id}`)
        return data
    }catch(error){
        console.log(error)
        return null
    }
    
}