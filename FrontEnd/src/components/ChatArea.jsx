import Nav from "./Nav"
import MessageList from "./MessageList"
import ChatInput  from "./ChatInput"
// import {ArtifactCard} from "./MessageBubble"
import {useSelector, useStore} from "react-redux"
import {useEffect } from "react"
import {getMessages} from "../features/getMessages"
import { setMessages, setInitializingConversation } from "../redux/messageSlice"

export const  ChatArea = () => {
    
    const selectedConversation=useSelector(state=>state.conversation.selectedConversation)
    const store=useStore()

    useEffect(()=>{
        const conversationId = selectedConversation?._id
        if (!conversationId) return

        store.dispatch(setInitializingConversation(true))
        const getMsg=async()=>{
            try {
                const data = await getMessages(conversationId)
                const state = store.getState()
                if (state.conversation.selectedConversation?._id !== conversationId) return

                if (Array.isArray(data)) {
                    const optimisticMessages = state.message.messagesList.filter(
                        (message) => message?._conversationId === conversationId
                    )
                    const missingOptimisticMessages = optimisticMessages.filter(
                        (message) => !data.some((savedMessage) => (
                            savedMessage.role === message.role
                            && savedMessage.content === message.content
                        ))
                    )
                    store.dispatch(setMessages([...data, ...missingOptimisticMessages]))
                }
            } finally {
                if (store.getState().conversation.selectedConversation?._id === conversationId) {
                    store.dispatch(setInitializingConversation(false))
                }
            }
        }
        getMsg()
    },[selectedConversation?._id, store])
    
	return (
		<div className="flex h-full min-h-0 flex-col">
        <Nav/>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <MessageList/>
            <ChatInput/>
        </div>
        </div>
	)
}
