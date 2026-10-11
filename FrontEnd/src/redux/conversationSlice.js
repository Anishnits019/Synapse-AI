import { createSlice } from "@reduxjs/toolkit"

export const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversationList: [],
     // renamed from "conversation" to avoid state.conversation.conversation
    selectedConversation: null
  },
  reducers: {
    setConversation: (state, action) => {
      state.conversationList = action.payload
    },
    addConversation: (state, action) => {
      // unshift adds the new conversation to the front of the array
      state.conversationList.unshift(action.payload)
    },
    clearConversation: (state) => {
      state.conversationList = []
    },
    setselectedConversation: (state,action)=>{
        state.selectedConversation=action.payload
    }
  },
})

export const { setConversation, addConversation, clearConversation ,setselectedConversation} = conversationSlice.actions
export default conversationSlice.reducer