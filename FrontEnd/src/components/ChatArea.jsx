import Nav from "./Nav"
import MessageList from "./MessageList"
import ChatInput  from "./ChatInput"
// import {ArtifactCard} from "./MessageBubble"
import {useSelector,useDispatch } from "react-redux"
import {useEffect } from "react"
import {getMessages} from "../features/getMessages"
import {setMessages } from "../redux/messageSlice"

export const  ChatArea = () => {
    const selectedConversation=useSelector(state=>state.conversation.selectedConversation)

    const dispatch=useDispatch()

    useEffect(()=>{
        if (!selectedConversation?._id) return

        dispatch(setMessages([]))

        const getMsg=async()=>{
            const data = await getMessages(selectedConversation?._id)
            if (Array.isArray(data)) {
                dispatch(setMessages(data))
            }
            console.log(data)
        }
        getMsg()
    },[selectedConversation, dispatch])
    
	return (
		<div className="flex h-full min-h-0 flex-col">
        <Nav/>
        <MessageList/>
        <ChatInput/>
        </div>
	)
}

