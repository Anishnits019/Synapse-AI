import { createSlice } from "@reduxjs/toolkit"

export const chatSlice = createSlice({
    name: "chat",
    initialState: { 
        inputText: "",
    },
    reducers: {
        setInputText: (state, action) => {
            state.inputText = action.payload
        },
        clearInputText: (state) => {
            state.inputText = "" 
        }
    },
})

export const { setInputText, clearInputText } = chatSlice.actions
export default chatSlice.reducer