import { createSlice } from "@reduxjs/toolkit"
export const messageSlice=createSlice({
   name: "message",
   initialState:{
    messagesList:[],
    isGenerating:false,
    isInitializingConversation:true,
   },
   reducers:{
    setMessages:(state,action)=>{
        state.messagesList=action.payload
    },
    addMessages:(state,action)=>{
        state.messagesList.push(action.payload);
    },
    setGenerating:(state, action) => {
        state.isGenerating = action.payload;
    },
    setInitializingConversation:(state,action)=>{
        state.isInitializingConversation=action.payload
    },
//     This reducer is created here by this i can use push keyword 
//     which is easy to do than using spread operator
//     so i did that here and  i willpush using these reducer
//    }
},
});

export const {setMessages,addMessages,setGenerating,setInitializingConversation}=messageSlice.actions
export default messageSlice.reducer