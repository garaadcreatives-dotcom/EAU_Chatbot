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
    } text-white px-3 sm:px-5 py-2.5 sm:py-3.5 z-10 transition-colors`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            onClick={onOpenDrawer}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors ${
              theme === 'dark' ? 'text-slate-300 hover:bg-[#212121] hover:text-white' : 'text-blue-100 hover:bg-white/20 hover:text-white'
            } backdrop-blur-sm cursor-pointer flex-shrink-0`}
            title="Recent Chats"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div 
            onClick={onLogoClick}
            className={`w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-transform ${
              theme === 'dark' ? 'bg-[#181818] border border-[#2f2f2f]' : 'bg-white shadow-md border border-white/20'
            }`}
            title="EAU Garowe Logo"
          >
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQflmfbmpLajicm82NGmm6dAcXd0ERTuoCdEFZe1MriM2NxGzKKzkne_so&s=10" alt="EAU Logo" className="w-full h-full object-cover scale-[1.35]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight truncate">EAU Garowe</h1>
            <p className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase truncate ${theme === 'dark' ? 'text-slate-400' : 'text-blue-200'}`}>University</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {hasMessages && (
            <button
              onClick={onClearChat}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all text-xs sm:text-sm font-semibold shadow-sm border cursor-pointer active:scale-95 ${
                theme === 'dark' ? 'bg-[#1e1e1e] text-slate-200 border-[#333333] hover:bg-[#2a2a2a] hover:text-white' : 'bg-white text-blue-700 border-white/40 hover:bg-blue-50 hover:shadow-md'
              } backdrop-blur-sm`}
              title="New Chat"
            >
              New Chat
            </button>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors cursor-pointer active:scale-95 ${
              theme === 'dark' ? 'text-slate-300 hover:bg-[#212121]' : 'text-blue-100 hover:bg-white/20'
            }`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
