import React from 'react';

export default function RecordingCard({ r, onClick, getIcon, getAccent, formatDate, formatTime, index }) {
  const accent = getAccent(r);
  
  // Convert standard hex colors to more cyber/neon versions if needed
  let rgb = accent.rgb;
  if (accent.color === '#ff3030') rgb = '255,48,48'; // Red
  if (accent.color === '#a855f7') rgb = '168,85,247'; // Purple
  if (accent.color === '#3b82f6') rgb = '0,255,204'; // Cyan override for blue to look more cyber

  return (
    <div 
      className="relative overflow-hidden bg-[#050505] border border-[#1a1a1a] rounded-xl p-4 cursor-pointer transition-all duration-300 group hover:bg-[#0a0a0a] hover:border-[#333] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-[fadeUp_0.4s_ease_both]"
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onClick(r)}
    >
      {/* Left accent bar */}
      <div 
        className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-sm transition-all duration-300 group-hover:top-[10%] group-hover:bottom-[10%]"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${rgb}, 0.8), transparent)`,
          boxShadow: `0 0 10px rgba(${rgb}, 0.4)`
        }} 
      />

      <div className="flex items-center gap-4 pl-3 relative z-10">
        {/* Icon box */}
        <div 
          className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 border"
          style={{
            background: `rgba(${rgb},0.05)`,
            borderColor: `rgba(${rgb},0.2)`,
            boxShadow: `inset 0 0 10px rgba(${rgb},0.05)`
          }}
        >
          {getIcon(r)}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-gray-200 truncate mb-1.5 group-hover:text-white transition-colors tracking-wide">
            {r.topic || r.subject || 'Recording'}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {r.subject && r.subject !== r.topic && (
              <span className="text-[10px] uppercase tracking-wider text-gray-300 bg-[#111] px-2 py-0.5 rounded border border-[#222] font-mono">
                {r.subject}
              </span>
            )}
            <span className="text-[11px] text-gray-500 font-mono tracking-wide">
              {formatDate(r.created_at)} <span className="opacity-50">|</span> {formatTime(r.created_at)}
            </span>
          </div>
        </div>

        {/* Restored Arrow */}
        <div className="w-8 h-8 shrink-0 bg-[#0a0a0a] border border-[#222] rounded flex items-center justify-center text-gray-500 text-sm transition-all duration-300 group-hover:border-[#444] group-hover:text-white group-hover:translate-x-1">
          →
        </div>
      </div>
      
      {/* Gloss effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
