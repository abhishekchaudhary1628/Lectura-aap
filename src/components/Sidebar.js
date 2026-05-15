import React from 'react';

export default function Sidebar({ activeItem = 'dashboard' }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◧' },
    { id: 'library', label: 'Data Core', icon: '≡' },
    { id: 'settings', label: 'System', icon: '⚙' },
  ];

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-[#020202] border-r border-[#1a1a1a] z-40 hidden md:flex flex-col animate-[fadeUp_0.5s_ease_both]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#050505] border border-cyan-500/30 rounded flex items-center justify-center text-cyan-400 text-sm shadow-[0_0_15px_rgba(0,255,255,0.15)]">
          ◈
        </div>
        <span className="font-['Syne'] text-xl font-extrabold text-white tracking-widest uppercase">
          Lectura
        </span>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-4 px-2">Secure Link</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 text-sm font-mono tracking-wider ${
              activeItem === item.id
                ? 'bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 shadow-[inset_4px_0_0_rgba(0,255,255,0.5)]'
                : 'text-gray-500 border border-transparent hover:bg-[#0a0a0a] hover:text-gray-300 hover:border-[#1a1a1a]'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1a1a1a] bg-[#020202]">
        <div className="flex items-center gap-3 p-2 rounded hover:bg-[#0a0a0a] border border-transparent hover:border-[#1a1a1a] cursor-pointer transition-all">
          <div className="w-9 h-9 rounded bg-[#050505] flex items-center justify-center text-sm border border-[#222] text-gray-400">
            US
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-300 truncate font-mono uppercase tracking-widest">Admin</p>
            <p className="text-[10px] text-emerald-500 truncate font-mono tracking-wider">● ONLINE</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
