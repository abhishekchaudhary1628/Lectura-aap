import React from 'react';

export default function Navbar({ onNewRecording }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-[#020202]/80 backdrop-blur-md border-b border-[#1a1a1a] w-full">
      
      {/* Mobile Logo */}
      <div className="flex md:hidden items-center gap-2">
        <div className="w-7 h-7 bg-[#050505] border border-cyan-500/30 rounded flex items-center justify-center text-cyan-400 text-xs shadow-[0_0_10px_rgba(0,255,255,0.15)]">
          ◈
        </div>
        <span className="font-['Syne'] text-lg font-extrabold text-white tracking-widest uppercase">Lectura</span>
      </div>

      <div className="hidden md:block flex-1"></div>

      <div className="flex items-center gap-4 ml-auto">
        <button 
          onClick={onNewRecording}
          className="group relative flex items-center gap-2 px-5 py-2 bg-[#050505] hover:bg-cyan-950/20 border border-[#222] hover:border-cyan-500/30 rounded text-gray-300 hover:text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest cursor-pointer overflow-hidden transition-all duration-300 shadow-[0_0_0_rgba(0,255,255,0)] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        >
          {/* Scanning line animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_linear_infinite]" />
          
          <span className="text-base leading-none">＋</span>
          <span className="hidden sm:inline">New Stream</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
}
