import React from 'react';

export default function TabBar({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="inline-flex gap-2 p-1.5 mb-6 bg-black/40 border border-[#1a1a1a] rounded-lg backdrop-blur-md animate-[fadeUp_0.5s_0.15s_ease_both] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const color = tab.color;
        
        let rgb = '255,255,255';
        if (color === '#00ffcc') rgb = '0,255,204'; // Cyber Cyan
        else if (color === '#ff3030') rgb = '255,48,48'; // Cyber Red
        else if (color === '#a855f7') rgb = '168,85,247'; // Cyber Purple

        return (
          <button 
            key={tab.id} 
            onClick={() => tab.id !== 'comingsoon' && setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold tracking-wide transition-all duration-300 ${
              tab.id === 'comingsoon' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${
              isActive 
                ? 'bg-[#111] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            {/* Active Glow */}
            {isActive && (
              <div 
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 12px rgba(${rgb}, 0.15), 0 0 8px rgba(${rgb}, 0.1)`
                }}
              />
            )}
            
            <span className="opacity-90">{tab.icon}</span>
            <span className="uppercase text-xs tracking-wider">{tab.label}</span>
            
            {tab.count !== null && tab.count > 0 && (
              <span 
                className="px-2 py-0.5 rounded text-[10px] ml-1 font-mono tracking-widest border"
                style={{
                  background: isActive ? `rgba(${rgb},0.1)` : 'rgba(255,255,255,0.03)',
                  color: isActive ? color : '#666',
                  borderColor: isActive ? `rgba(${rgb},0.3)` : 'rgba(255,255,255,0.05)'
                }}
              >
                {String(tab.count).padStart(2, '0')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
