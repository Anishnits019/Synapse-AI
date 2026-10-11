import api from "../../utils/axios.js"
export const createOrder=async(payload) =>{
    try {
        const { data } = await api.post("billing/create-order",payload)
        return data
    }catch(error){
        console.error("Unable to create payment order", error.response?.data ?? error.message)
        throw error
    }
 
}