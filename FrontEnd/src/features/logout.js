import api from "../../utils/axios"
export const getLogOut =async()=>{
    try{
    const {data}=await api.post("/auth/logout")
    return data
    }
    catch(error){
        console.error("Logout request failed", error)
    }
}

