import api from "../../utils/axios.js"
export const upload = async (payload, onUploadProgress) => {
    try {
        const { data } = await api.post("agent/upload", payload, {
            onUploadProgress
        })
        return data
    }catch(error){
        console.error("Unable to upload file", error.response?.data ?? error.message)
        throw error
    }
}