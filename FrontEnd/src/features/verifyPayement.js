import api from "../../utils/axios.js"
export const verifyPayment=async(payload) =>{
    try {
        const { data } = await api.post("billing/verify-payment",payload)
        return data
    }catch(error){
        console.error("Unable to verify payment", error.response?.data ?? error.message)
        throw error
    }
 
}