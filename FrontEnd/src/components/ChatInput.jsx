import { getCurrentUser } from '../features/getCurrentUser'
import { useEffect, useState, useRef } from 'react'

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
    const textAreaRef = useRef(null)
    const previewUrlsRef = useRef(new Set())
    const uploadControllersRef = useRef(new Map())
    const dispatch =useDispatch()
    //  this dispatch use here to get the messages instanly in chat area when it user click and messages shown instanly

    const [selectedFiles, setSelectedFiles] = useState([])
    // const [text, setText] = useState("")

    const selectedconverstaion = useSelector(state => state.conversation.selectedConversation)
    const conversationList = useSelector(state => state.conversation.conversationList) || []
    const text=useSelector(state=>state.chat.inputText)
    const hasMessages = useSelector(state => state.message.messagesList.length > 0)
    const isInitializingConversation = useSelector(state => state.message.isInitializingConversation)
    const isGenerating = useSelector(state => state.message.isGenerating)
    const [selectedAgent,setselectedAgent]=useState("auto")
    const readyFiles = selectedFiles
        .filter(({ status, uploadedFile }) => status === "ready" && uploadedFile)
        .map(({ uploadedFile }) => uploadedFile)
    const isUploading = selectedFiles.some(({ status }) => status === "uploading")

    useEffect(() => {
        const textarea = textAreaRef.current
        if (!textarea) return

        textarea.style.height = "auto"
        textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
        textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden"
    }, [text])

    useEffect(() => () => {
        uploadControllersRef.current.forEach((controller) => controller.abort())
        uploadControllersRef.current.clear()
        previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
        previewUrlsRef.current.clear()
    }, [])

    const handleTextInput= (e) => {
        dispatch(setInputText(e.target.value))
    }

    const handleTextKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleFileInput = () => {
        fileInputRef.current.click()
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ""

        if (!files.length) return
        const nextFiles = files.map((file) => {
            const previewUrl = URL.createObjectURL(file)
            previewUrlsRef.current.add(previewUrl)
            return {
                id: crypto.randomUUID(),
                file,
                previewUrl,
                status: "uploading",
                progress: 0,
                uploadedFile: null,
                error: "",
            }
        })
        setSelectedFiles((current) => [...current, ...nextFiles])

        nextFiles.forEach((selectedFile) => {
            const controller = new AbortController()
            uploadControllersRef.current.set(selectedFile.id, controller)
            const formData = new FormData()
            formData.append("file", selectedFile.file)

            upload(formData, (event) => {
                if (!event.total) return
                const progress = Math.round((event.loaded * 100) / event.total)
                setSelectedFiles((current) => current.map((item) => (
                    item.id === selectedFile.id ? { ...item, progress } : item
                )))
            }, controller.signal)
                .then((response) => {
                    const uploadedFile = response?.files?.[0]
                    if (!uploadedFile) throw new Error("Upload response did not contain the uploaded file")
                    setSelectedFiles((current) => current.map((item) => (
                        item.id === selectedFile.id
                            ? { ...item, status: "ready", progress: 100, uploadedFile }
                            : item
                    )))
                })
                .catch((error) => {
                    if (controller.signal.aborted) return
                    setSelectedFiles((current) => current.map((item) => (
                        item.id === selectedFile.id
                            ? {
                                ...item,
                                status: "failed",
                                error: error.response?.data?.detail || error.message || "Upload failed. Please try again.",
                            }
                            : item
                    )))
                })
                .finally(() => {
                    if (uploadControllersRef.current.get(selectedFile.id) === controller) {
                        uploadControllersRef.current.delete(selectedFile.id)
                    }
                })
        })
    }

    const handleRemoveFile = (index) => {
        const selectedFile = selectedFiles[index]
        if (selectedFile) {
            uploadControllersRef.current.get(selectedFile.id)?.abort()
            uploadControllersRef.current.delete(selectedFile.id)
            URL.revokeObjectURL(selectedFile.previewUrl)
            previewUrlsRef.current.delete(selectedFile.previewUrl)
        }
        setSelectedFiles((current) => current.filter((file) => file.id !== selectedFile?.id))
    }

    const handleSendMessage = async () => {
        if (!text.trim() && !readyFiles.length) return

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
            artifacts: readyFiles,
            generate_title: !conversation?.title || conversation.title === "New Chat",
        }
 

        const userMessage = text.trim()

        dispatch(clearInputText())
        dispatch(setGenerating(true))
        dispatch(addMessages({
            role:"user",
            content:userMessage,
            artifacts: readyFiles,
            _conversationId: conversation._id,
        }))
        const sentFileIds = new Set(
            selectedFiles
                .filter(({ status, uploadedFile }) => status === "ready" && uploadedFile)
                .map(({ id }) => id)
        )
        selectedFiles
            .filter(({ id }) => sentFileIds.has(id))
            .forEach(({ previewUrl }) => {
                URL.revokeObjectURL(previewUrl)
                previewUrlsRef.current.delete(previewUrl)
        })
        setSelectedFiles((current) => current.filter(({ id }) => !sentFileIds.has(id)))
        
            try {
                const response = await sendMessages(payload)

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
                        image_url: response.image_url || null,
                        _conversationId: conversation._id,
                    }))
                }
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

        <div className={`z-10 w-full shrink-0 px-3 py-3 md:px-5 md:py-4 ${hasMessages || isInitializingConversation ? 'relative' : 'absolute inset-x-0 top-1/2 -translate-y-1/2'}`}>
        
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-1.5 rounded-2xl border border-white/[0.07] bg-[#11141b] px-3.5 py-2.5 shadow-xl shadow-black/10 md:px-4'>
                <div className='flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
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
                     px-2.5
                     py-1.5
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
                                            size={14}
                                            className={isActive ? "text-white" : "text-slate-500"}
                                        />
                    <span>{a.label}</span>
                    </div>
                );
                })}
                </div>
                <textarea
                    ref={textAreaRef}
                    placeholder='Ask Anything...'
                    className='max-h-40 min-h-6 w-full resize-none overflow-y-hidden bg-transparent text-[14.7px] leading-6 text-slate-200 outline-none placeholder:text-slate-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50'
                    rows={1}
                    value={text}
                    onChange={handleTextInput}
                    onKeyDown={handleTextKeyDown}

                />

                {selectedFiles.length > 0 && (
                    <div className='flex flex-wrap items-start gap-2 rounded-xl border border-white/[0.06] bg-black/10 p-2.5'>
                        {selectedFiles.map(({ id, file, previewUrl, status, progress, error }, index) => {
                            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name)
                            const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'FILE'
                            return (
                                <div key={id} className='relative flex h-[76px] w-[230px] items-center gap-2.5 overflow-hidden rounded-xl border border-white/[0.08] bg-[#11141b] pr-8' title={file.name}>
                                    {isImage ? (
                                        <img
                                            src={previewUrl}
                                            alt={file.name}
                                            className='h-[76px] w-[76px] shrink-0 object-cover'
                                        />
                                    ) : (
                                        <div className='flex h-[76px] w-[76px] shrink-0 flex-col items-center justify-center gap-1 bg-white/[0.04] text-indigo-300'>
                                            <FileText size={20} />
                                            <span className='text-[9.45px] font-semibold'>{fileExtension}</span>
                                        </div>
                                    )}
                                    <div className='min-w-0'>
                                        <p className='truncate text-xs font-medium text-slate-200'>{file.name}</p>
                                        <p className={`mt-1 truncate text-[10.5px] ${status === 'failed' ? 'text-rose-300' : 'text-slate-500'}`} title={error}>
                                            {status === 'uploading' ? `Uploading ${progress}%` : status === 'failed' ? error : 'Ready to send'}
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => handleRemoveFile(index)}
                                        aria-label={`Remove ${file.name}`}
                                        className='absolute right-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/80 text-base text-white shadow hover:bg-rose-500'
                                    >
                                        ×
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept='.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'
                    className='hidden'
                />

                <div className='flex items-center justify-between'>

                    <div className='flex items-center gap-1'>

                        <button
                            onClick={handleFileInput}
                            disabled={isGenerating}
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
                        disabled={(!text.trim() && !readyFiles.length) || isGenerating}
                        title={isGenerating ? 'Waiting for response' : !text.trim() && !readyFiles.length ? (isUploading ? 'Wait for upload or enter a message' : 'Enter a message or attach a file') : 'Send message'}
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