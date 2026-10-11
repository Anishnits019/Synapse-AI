// import React from 'react'
// export function ArtifactCard({ file }) {
//     const [copied, setCopied] = useState(false)
//     const messages=useSelector(state=>state.message.messagesList)
//     const artifacts =messages?.artifacts

//     const files = Array.isArray(artifacts)
//         ? artifacts.flatMap((artifact) => (
//             Array.isArray(artifact?.files) ? artifact.files : [artifact]
//         )).filter((file) => file?.name && file?.content != null)
//         : []
//     const handleCopy = () => {
//         if (!file.content) return
//         navigator.clipboard.writeText(file.content)
//         setCopied(true)
//         setTimeout(() => setCopied(false), 2000)
//     }

//     return (
//         <div className="w-full max-w-xl rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-lg transition-all">
//             {/* Header / Toolbar */}
//             <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10">
//                 <div className="flex items-center gap-2 min-w-0">
//                     <FileCode size={15} className="text-indigo-400 shrink-0" />
//                     <span className="text-xs font-medium text-slate-300 truncate">
//                         {file.name || 'code_snippet'}
//                     </span>
//                     {file.language && (
//                         <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
//                             {file.language}
//                         </span>
//                     )}
//                 </div>
//                 <button
//                     onClick={handleCopy}
//                     className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
//                     title="Copy code"
//                 >
//                     {copied ? (
//                         <>
//                             <Check size={13} className="text-emerald-400" />
//                             <span className="text-emerald-400">Copied</span>
//                         </>
//                     ) : (
//                         <>
//                             <Copy size={13} />
//                             <span>Copy</span>
//                         </>
//                     )}
//                 </button>
//             </div>

//             {/* Code Body */}
//             <div className="p-3 overflow-x-auto max-h-[320px] scrollbar-thin scrollbar-thumb-white/10">
//                 <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
//                     <code>{file.content}</code>
//                 </pre>
//             </div>
//         </div>
//     )
// }

// 	</div>


// export default Artifact