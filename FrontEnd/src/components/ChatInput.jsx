import { getCurrentUser } from '../features/getCurrentUser'
import { useState, useRef } from 'react'

import {
  Paperclip,
  Mic,
  ArrowUp,
  Zap,
  MessageSquare,
  Code2,
  FileText,
  ImageIcon,
  Globe
} from 'lucide-react'

import { useDispatch, useSelector } from 'react-redux'
import { createConversation } from '../features/createConversation'
import { sendMessages } from '../features/sendMessage'
import { addMessages, setGenerating } from '../redux/messageSlice'
import { setUserData } from '../redux/userSlice'
import { setInputText, clearInputText } from '../redux/chatSlice'

import {
    addConversation,
    setConversation,
    setselectedConversation
} from '../redux/conversationSlice'
import {upload} from "../features/upload"

// TODO: import your actual sendMessages function, e.g.:
// import { sendMessages } from '../../../BackEnd/services/chat/controllers/chat_cntrl'

export const ChatInput = () => {
    const fileInputRef = useRef(null)
    const dispatch =useDispatch()
    //  this dispatch use here to get the messages instanly in chat area when it user click and messages shown instanly

    const [selectedFiles, setSelectedFiles] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState("")
    const [uploadedFiles,setUploadedFiles]=useState([])
    // const [text, setText] = useState("")

    const selectedconverstaion = useSelector(state => state.conversation.selectedConversation)
    const conversationList = useSelector(state => state.conversation.conversationList) || []
    const text=useSelector(state=>state.chat.inputText)
    const isGenerating = useSelector(state => state.message.isGenerating)
    const [selectedAgent,setselectedAgent]=useState("auto")

    const handleTextInput= (e) => {
        dispatch(setInputText(e.target.value))
    }

    const handleTextKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if(isUploading) return

            handleSendMessage()
        }
    }

    const handleFileInput = () => {
        fileInputRef.current.click()
    }

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || [])

        if (!files.length) return
        setSelectedFiles(files)
        setUploadError("")
        setUploadProgress(0)
        setIsUploading(true)

        const formData = new FormData()
        files.forEach((file) => formData.append("file", file))

        try {
            const response = await upload(formData, (event) => {
                if (event.total) {
                    setUploadProgress(Math.round((event.loaded * 100) / event.total))
                }
            })
            if (!response?.files) throw new Error("File upload failed")
            setUploadedFiles(response.files)
            setUploadProgress(100)
        } catch (error) {
            console.error(error)
            setUploadedFiles([])
            setUploadError(error.response?.data?.detail || error.response?.data?.message || "Upload failed. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }
    

    
    const handleSendMessage = async () => {
        if (!text.trim()) return
        if(isUploading) return 

        let conversation = selectedconverstaion
        if(!selectedconverstaion){
            
            const convo =await createConversation()

            if (!convo?._id) return
            
            dispatch(setselectedConversation(convo))
            // This dispatch is used here beacuse when we start chat using direclty inout area it doesn't save it
            // so we waana save it adn stroe in chat area so we use dispatch  
            dispatch(addConversation(convo))
            // also we do saaem fro add converstaion dispatch
            conversation = convo;
        } 

        const payload = {
            prompt: text.trim(),
            conversation_id: conversation?._id,
            agent: selectedAgent,
            artifacts: uploadedFiles,
            generate_title: conversation?.title === "New Chat",
        }
 

        const userMessage = text.trim()

        dispatch(clearInputText())
        dispatch(setGenerating(true))

        dispatch(addMessages({
            role:"user",
            content:userMessage
        }))
        
            try {
                const response = await sendMessages(payload)
                console.log(response)

                if (response?.conversation_title) {
                    const updatedConversation = {
                        ...conversation,
                        title: response.conversation_title,
                    }
                    dispatch(setselectedConversation(updatedConversation))
                    const hasConversation = conversationList.some(
                        (item) => item._id === conversation._id
                    )
                    dispatch(setConversation(hasConversation
                        ? conversationList.map((item) =>
                            item._id === conversation._id ? updatedConversation : item
                        )
                        : [updatedConversation, ...conversationList]
                    ))
                }

                const updatedUser = await getCurrentUser()
                if (updatedUser) {
                    dispatch(setUserData(updatedUser))
                }

                if (response?.AIMessage || response?.image_url || response?.artifacts?.length) {
                    dispatch(addMessages({
                        role: "assistant",
                        content: response.AIMessage,
                        artifacts: response.artifacts || [],
                        image_url: response.image_url || null
                    }))
                }
                setUploadedFiles([])
                setSelectedFiles([])
                setUploadProgress(0)
            } finally {
                dispatch(setGenerating(false))
            }

        }

     const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "auto"
    },

    {
      id: "chat",
      icon: MessageSquare,
      label: "chat"
    },

    {
      id: "coding",
      icon: Code2,
      label: "coding"
    },

    {
      id: "pdf",
      icon: FileText,
      label: "pdf"
    },

    {
      id: "vision",
      icon: ImageIcon,
      label: "vision"
    },

    {
      id: "search",
      icon: Globe,
      label: "Search"
    }

  ]
    return (

        <div className='w-full shrink-0 overflow-hidden border-t border-white/[0.06] bg-[#0d0f14] px-3 py-3 md:px-5 md:py-4'>
        
            <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-3'>
                <div className='flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {agents.map((a)=>{
                    const isActive=selectedAgent===a.label
                    return (
                    <div 
                    key={a.id}
                    id={a.id}
                    onClick={()=>setselectedAgent(a.label)}
                    className={`
                     flex-shrink-0
                     cursor-pointer
                     inline-flex
                     shrink-0
                     items-center
                     gap-1.5
                     px-3
                     py-2
                     rounded-full
                     text-xs
                     font-medium
                     border
                     transition-all
                     ${isActive
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                        :"bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                     }
                    `}>

                                        <a.icon
                                            size={16}
                                            className={isActive ? "text-white" : "text-slate-500"}
                                        />
                    <span>{a.label}</span>
                    </div>
                );
                })}
                </div>
                <textarea
                    placeholder='Ask Anything...'
                    className='w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50'
                    rows={3}
                    value={text}
                    onChange={handleTextInput}
                    onKeyDown={handleTextKeyDown}

                />

                {(selectedFiles.length > 0 || uploadError) && (
                    <div className='flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-2.5'>
                        {selectedFiles.map((file) => {
                            const isImage = file.type.startsWith('image/')
                            const progress = uploadError ? 100 : uploadProgress
                            return (
                                <div key={`${file.name}-${file.lastModified}`} className='group flex w-16 flex-col items-center gap-1.5' title={file.name}>
                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-full p-[3px] ${uploadError ? 'bg-rose-400' : 'bg-indigo-400'}`}
                                        style={{ background: `conic-gradient(${uploadError ? '#fb7185' : '#818cf8'} ${progress}%, rgba(255,255,255,.08) ${progress}% 100%)` }}
                                    >
                                        <div className='flex h-full w-full items-center justify-center rounded-full bg-[#151821] text-slate-300'>
                                            {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
                                        </div>
                                    </div>
                                    <span className='w-full truncate text-center text-[10px] text-slate-400'>
                                        {isUploading ? `${progress}%` : uploadError ? 'Failed' : 'Uploaded'}
                                    </span>
                                </div>
                            )
                        })}
                        {uploadError && <p className='w-full text-xs text-rose-300'>{uploadError}</p>}
                    </div>
                )}

                <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept='image/*,application/pdf'
                    className='hidden'
                />

                <div className='flex items-center justify-between'>

                    <div className='flex items-center gap-1'>

                        <button
                            onClick={handleFileInput}
                            className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer'
                        >
                            <Paperclip size={16} />
                        </button>

                        <button
                            className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer'
                        >
                            <Mic size={16} />
                        </button>

                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={!text.trim() || isUploading || isGenerating}
                        title={isUploading ? 'Uploading file' : isGenerating ? 'Waiting for response' : !text.trim() ? 'Enter a message' : 'Send message'}
                        className='flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ArrowUp size={18} />
                    </button>

                </div>

            </div>

        </div>
    )
}

export default ChatInput