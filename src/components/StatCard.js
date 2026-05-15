import React from 'react';

export default function StatCard({ label, count, icon, desc, color, rgb, onClick, active }) {
  return (
    <div
      className={`relative overflow-hidden border rounded-xl p-5 transition-all duration-300 cursor-pointer group ${
        active 
          ? 'bg-[#0a0a0a] scale-[1.02] border-transparent z-10' 
          : 'bg-[#050505] border-[#1a1a1a] hover:bg-[#0a0a0a] hover:border-[#333] hover:-translate-y-1'
      }`}
      style={active ? { boxShadow: `0 0 0 1px rgba(${rgb}, 0.4), 0 10px 40px -10px rgba(${rgb}, 0.2)` } : {}}
      onClick={onClick}
    >
      {/* Top Cyber Accent Line */}
      <div 
        className="absolute top-0 left-[10%] right-[10%] h-[1px] transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${rgb},0.8), transparent)`,
          opacity: active ? 1 : 0.2,
          boxShadow: active ? `0 0 8px rgba(${rgb}, 0.5)` : 'none'
        }} 
      />

      <div className="flex justify-between items-start mb-4">
        <span className="text-2xl opacity-90">{icon}</span>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-mono font-bold tracking-tighter transition-colors border"
          style={{
            background: `rgba(${rgb},0.05)`,
            borderColor: active ? `rgba(${rgb},0.3)` : `rgba(${rgb},0.1)`,
            color: color,
            textShadow: active ? `0 0 10px rgba(${rgb},0.5)` : 'none'
          }}
        >
          {String(count).padStart(2, '0')}
        </div>
      </div>
      
      <div className="text-sm font-bold text-gray-200 mb-1.5 uppercase tracking-widest">{label}</div>
      <div className="text-xs text-gray-500 font-medium font-mono">{desc}</div>
      
      {/* Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at bottom right, rgba(${rgb},0.08) 0%, transparent 60%)`
        }}
      />
    </div>
  );
}
