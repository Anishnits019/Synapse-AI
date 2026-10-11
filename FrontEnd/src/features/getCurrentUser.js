import api from "../../utils/axios.js"

export async function getCurrentUser() {
     try{
       const {data}=await api.get("/auth/me")
       return data
     }catch(error){
        console.log(error)
        return null
     }
}