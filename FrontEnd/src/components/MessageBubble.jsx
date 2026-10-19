import { User, Bot } from 'lucide-react'
import Markdown from "react-markdown"
import {GeneratedImage} from "./GeneratedImage"
import {ArtifactCard} from "./ArtifactCard"

const getMarkdownElementProps = (props) => {
    const elementProps = { ...props }
    delete elementProps.node
    return elementProps
}

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
        )).filter((file) => (
            file?.name && (file.content != null || file.file_path)
        ))
        : []
    const imageFiles = files.filter((file) => (
        file.file_path && (
            file.type === "image" ||
            file.content_type?.startsWith("image/") ||
            /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name)
        )
    ))
    const documentFiles = files.filter((file) => !imageFiles.includes(file))

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
                p: (props) => <p className="m-0 [&:not(:first-child)]:mt-2" {...getMarkdownElementProps(props)} />,
                h1: (props) => <h1 className="mt-3 mb-1.5 text-[18px] font-semibold text-slate-100 first:mt-0" {...getMarkdownElementProps(props)} />,
                h2: (props) => <h2 className="mt-3 mb-1.5 text-[16px] font-semibold text-slate-100 first:mt-0" {...getMarkdownElementProps(props)} />,
                h3: (props) => <h3 className="mt-2.5 mb-1 text-[15px] font-semibold text-slate-100 first:mt-0" {...getMarkdownElementProps(props)} />,
                ul: (props) => <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...getMarkdownElementProps(props)} />,
                ol: (props) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...getMarkdownElementProps(props)} />,
                li: (props) => <li className="text-[14.5px] leading-relaxed" {...getMarkdownElementProps(props)} />,
                strong: (props) => <strong className="font-semibold text-slate-100" {...getMarkdownElementProps(props)} />,
                a: (props) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...getMarkdownElementProps(props)} />,
                code: (props) => <code className="rounded bg-white/[0.08] px-1 py-0.5 text-[13px]" {...getMarkdownElementProps(props)} />,
                blockquote: (props) => <blockquote className="my-1.5 border-l-2 border-white/20 pl-3 text-slate-400" {...getMarkdownElementProps(props)} />,
                hr: (props) => <hr className="my-3 border-white/10" {...getMarkdownElementProps(props)} />,
            }}
        >
            {content}
        </Markdown>
    </div>
)}

                {imageFiles.length > 0 && (
                    <div className={`flex max-w-full flex-wrap gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                        {imageFiles.map((file, index) => (
                            <a
                                key={`${file.name}-${index}`}
                                href={file.file_path}
                                target="_blank"
                                rel="noreferrer"
                                className='block max-w-[220px] overflow-hidden rounded-xl border border-white/[0.08] bg-black/20'
                                title={`Open ${file.name}`}
                            >
                                <img
                                    src={file.file_path}
                                    alt={file.name}
                                    className='max-h-[180px] max-w-[220px] object-cover'
                                />
                                <span className='block max-w-[220px] truncate px-2.5 py-1.5 text-[11px] text-slate-300'>
                                    {file.name}
                                </span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Render documents and code snippets */}
                {documentFiles.length > 0 && (
                    <div className="flex flex-col gap-2.5 w-full mt-1">
                        {documentFiles.map((file, index) => (
                            <ArtifactCard key={index} file={file} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MessageBubble