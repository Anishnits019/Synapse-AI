import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'
import  conversationReducer from './conversationSlice.js'
import  messageReducer from './messageSlice.js'
import chatReducer from "./chatSlice.js"
export const store = configureStore({
  reducer: {
   user:userReducer,
   conversation:conversationReducer,
   message:messageReducer,
   chat:chatReducer
  },
})

// const appReducer = combinedReducers({
//   user:userReducer,
//   conversation:conversationReducer,
//   messagee:messageReducer
// })
// const rootReducer = (state,action)=>{
//   if()
// }