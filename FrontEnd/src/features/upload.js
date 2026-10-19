import api from "../../utils/axios.js"
export const upload = async (payload, onUploadProgress, signal) => {
    try {
        const { data } = await api.post("agent/upload", payload, {
            onUploadProgress,
            signal
        })
        return data
    }catch(error){
        if (error.code !== "ERR_CANCELED") {
            console.error("Unable to upload file", error.response?.data ?? error.message)
        }
        throw error
    }
}