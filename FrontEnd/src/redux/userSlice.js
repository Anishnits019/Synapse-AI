import { createSlice } from "@reduxjs/toolkit"
export const userSlice=createSlice({
   name: "user",
   initialState:{
    userData:null,
    isLoading:true,
   },
   reducers:{
    setUserData:(state,action)=>{
        state.userData=action.payload
    },
    setUserLoading:(state,action)=>{
        state.isLoading=action.payload
    },
   }
})

export const {setUserData,setUserLoading}=userSlice.actions
export default userSlice.reducer