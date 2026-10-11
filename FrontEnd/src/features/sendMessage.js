import api from "../../utils/axios"
export const sendMessages=async(payload)=>{
    try{
    const {data}=await api.post("agent/send-messages",payload)
    return data
    }
    catch(error){
        console.error("Unable to send message", error.response?.data ?? error.message)
        throw error
    }

}

// axios is better in sending paylaod at once but here we have to do stremaing s iwe need somehting differnet we ar egoona use fetch whih h
