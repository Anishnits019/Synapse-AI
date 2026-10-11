import React, { useState } from 'react'
import { User, Bot, FileCode, Check, Copy, ExternalLink } from 'lucide-react'
import Markdown from "react-markdown"
import {GeneratedImage} from "./GeneratedImage"
import {ArtifactCard} from "./ArtifactCard"

// Component to handle generated images nicely


export const MessageBubble = ({ role, content, image, image_url, artifacts }) => {
    const isUser = role === "user"

    // Support single URL string or array of generated URLs
    const generatedImages = Array.isArray(image_url) 
        ? image_url 
        : image_url 
            ? [image_url] 
            : []

    const files = Array.isArray(artifacts)
        ? artifacts.flatMap((artifact) => (
            Array.isArray(artifact?.files) ? artifact.files : [artifact]
        )).filter((file) => file?.name && file?.content != null)
        : []

    return (
        <div className={`flex items-start gap-2.5 px-3 md:px-5 py-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-lg
                ${isUser ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.06] text-slate-400"}`}>
                {isUser ? <User size={15} /> : <Bot size={15} />}
            </div>

            {/* Bubble Content Area */}
            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                
                {/* User Input Attachment Image */}
                {image && (
                    <img
                        src={image}
                        alt="user attachment"
                        className='max-w-[240px] max-h-[240px] rounded-xl object-cover border border-white/[0.08]'
                    />
                )}

                {/* AI Generated Images Display */}
                {generatedImages.length > 0 && (
                    <div className="flex flex-col gap-2.5 w-full my-1">
                        {generatedImages.map((url, idx) => (
                            <GeneratedImage key={idx} url={url} />
                        ))}
                    </div>
                )}

                {/* Text Content */}
                {content && (
    <div className={`text-[15px] leading-relaxed break-words w-full
        ${isUser ? "text-white bg-indigo-600/20 px-3.5 py-2.5 rounded-2xl rounded-tr-none border border-indigo-500/20" : "text-slate-200"}`}>
        <Markdown
            components={{
                p: ({node, ...props}) => <p className="m-0 [&:not(:first-child)]:mt-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="mt-3 mb-1.5 text-[18px] font-semibold text-slate-100 first:mt-0" {...props} />,
                h2: ({node, ...props}) => <h2 className="mt-3 mb-1.5 text-[16px] font-semibold text-slate-100 first:mt-0" {...props} />,
                h3: ({node, ...props}) => <h3 className="mt-2.5 mb-1 text-[15px] font-semibold text-slate-100 first:mt-0" {...props} />,
                ul: ({node, ...props}) => <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...props} />,
                ol: ({node, ...props}) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...props} />,
                li: ({node, ...props}) => <li className="text-[14.5px] leading-relaxed" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-slate-100" {...props} />,
                a: ({node, ...props}) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...props} />,
                code: ({node, ...props}) => <code className="rounded bg-white/[0.08] px-1 py-0.5 text-[13px]" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="my-1.5 border-l-2 border-white/20 pl-3 text-slate-400" {...props} />,
                hr: ({node, ...props}) => <hr className="my-3 border-white/10" {...props} />,
            }}
        >
            {content}
        </Markdown>
    </div>
)}

                {/* Render Artifacts / Code Snippets */}
                {files.length > 0 && (
                    <div className="flex flex-col gap-2.5 w-full mt-1">
                        {files.map((file, index) => (
                            <ArtifactCard key={index} file={file} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MessageBubble