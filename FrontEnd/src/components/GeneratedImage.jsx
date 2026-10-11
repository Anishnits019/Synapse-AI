
import {ExternalLink } from 'lucide-react'

export const GeneratedImage = ({ url }) => {
    console.log(url)
    return (
        <div className="relative group max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 shadow-md transition-all">
            <img
                src={url}
                alt="AI Generated"
                className="w-full h-auto max-h-[360px] object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                loading="lazy"
                onError={() => console.error("Unable to load S3 image:", url)}
            />
            {/* Hover overlay with action button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white border border-white/10 backdrop-blur-sm flex items-center gap-1 text-xs"
                    title="Open full size"
                >
                    
                    <ExternalLink size={13} />
                </a>
            </div>
        </div>
    )
}