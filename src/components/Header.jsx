import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

export default function Header({
  theme,
  setTheme,
  onOpenDrawer,
  onOpenLiveVoice,
  onLogoClick,
  onClearChat,
  hasMessages
}) {
  return (
    <header className={`${
      theme === 'dark' ? 'bg-[#000000] border-b border-[#212121]' : 'bg-gradient-to-r from-blue-700 to-indigo-600 shadow-md border-b border-white/10'
    } text-white px-5 py-4 z-10 transition-colors`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenDrawer}
            className={`p-2.5 rounded-full transition-colors ${
              theme === 'dark' ? 'text-slate-300 hover:bg-[#212121] hover:text-white' : 'text-blue-100 hover:bg-white/20 hover:text-white'
            } backdrop-blur-sm cursor-pointer`}
            title="Recent Chats"
          >
            <Menu size={24} />
          </button>
          <div 
            onClick={onLogoClick}
            className={`w-14 h-14 flex items-center justify-center overflow-hidden rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-transform ${
              theme === 'dark' ? 'bg-[#181818] border border-[#2f2f2f]' : 'bg-white shadow-md border border-white/20'
            }`}
            title="EAU Garowe Logo"
          >
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQflmfbmpLajicm82NGmm6dAcXd0ERTuoCdEFZe1MriM2NxGzKKzkne_so&s=10" alt="EAU Logo" className="w-full h-full object-cover scale-[1.35]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">EAU Garowe</h1>
            <p className={`text-xs md:text-sm font-semibold tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-blue-200'}`}>University</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasMessages && (
            <button
              onClick={onClearChat}
              className={`px-5 py-2.5 rounded-full transition-all text-sm md:text-base font-bold shadow-sm border cursor-pointer ${
                theme === 'dark' ? 'bg-[#1e1e1e] text-slate-200 border-[#333333] hover:bg-[#2a2a2a] hover:text-white' : 'bg-white text-blue-700 border-white/40 hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5'
              } backdrop-blur-sm`}
              title="New Chat"
            >
              New Chat
            </button>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-slate-300 hover:bg-[#212121]' : 'text-blue-100 hover:bg-white/20'
            }`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
