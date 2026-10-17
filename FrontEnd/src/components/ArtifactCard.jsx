import {useState} from "react"
import { FileCode, FileText, Check, Copy, ExternalLink } from 'lucide-react'

export const ArtifactCard = ({ file }) => {
    const [copied, setCopied] = useState(false)
    const hasContent = file.content != null
    const fileUrl = file.file_path

    const handleCopy = () => {
        if (!hasContent) return
        navigator.clipboard.writeText(file.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="w-full max-w-xl rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-lg transition-all">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                    {hasContent
                        ? <FileCode size={15} className="text-indigo-400 shrink-0" />
                        : <FileText size={15} className="text-indigo-400 shrink-0" />}
                    <span className="text-xs font-medium text-slate-300 truncate">
                        {file.name || 'code_snippet'}
                    </span>
                    {file.language && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                            {file.language}
                        </span>
                    )}
                </div>
                {hasContent ? (
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check size={13} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={13} />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                ) : fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                    >
                        <ExternalLink size={13} />
                        <span>Open file</span>
                    </a>
                ) : null}
            </div>

            {hasContent && (
                <div className="p-3 overflow-x-auto max-h-[320px] scrollbar-thin scrollbar-thumb-white/10">
                    <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
                        <code>{file.content}</code>
                    </pre>
                </div>
            )}
        </div>
    )
}