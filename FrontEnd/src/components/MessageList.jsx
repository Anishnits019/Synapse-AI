import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { MessageBubble } from './MessageBubble'

export const MessageList = () => {
  const messages = useSelector((state) => state.message.messagesList)
  const isGenerating = useSelector((state) => state.message.isGenerating)
  const isInitializingConversation = useSelector((state) => state.message.isInitializingConversation)
  const bottomRef = useRef(null)
  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <div className='min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      <div className='mx-auto w-full max-w-3xl'>
      {!hasMessages && isInitializingConversation ? null : !hasMessages ? (
        <div className='absolute inset-x-4 top-[32%] flex -translate-y-1/2 flex-col items-center gap-4 text-center'>
          <div className='flex flex-col gap-1.5'>
            <h1 className='text-[21px] font-semibold tracking-tight text-slate-200'>AgentVerse AI</h1>
            <p className='text-[15.75px] font-semibold tracking-tight text-slate-400'>How can I help you?</p>
            <p className='max-w-[260px] text-[13.65px] leading-relaxed text-slate-600'>Ask me anything: code, ideas, explanations, or a quick question.</p>
          </div>

          <div className='mt-1 flex flex-wrap justify-center gap-2'>
            {["Explain Redis", "Build a dashboard"].map((suggestion) => (
              <button
                key={suggestion}
                type='button'
                className='cursor-pointer rounded-lg border border-white/[0.07] bg-white/[0.04] px-3.5 py-1.5 text-[12.6px] text-slate-400 transition-colors duration-150 hover:bg-white/[0.08] hover:text-slate-200'
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {messages.map((message, index) => (
            <div key={message?._id || message?.id || index}>
              <MessageBubble
                role={message?.role}
                content={message?.content}
                image={message?.image}
                artifacts={message?.artifacts}
                image_url={message?.image_url}
              />

            </div>
          ))}
          {isGenerating && (
            <div className='px-3 py-1.5 md:px-5'>
              <div className='flex items-center gap-1 rounded-2xl rounded-tl-none border border-white/[0.07] bg-white/[0.04] px-4 py-3'>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className='h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce'
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} aria-hidden='true' />
      </div>
    </div>
  )
}

export default MessageList
