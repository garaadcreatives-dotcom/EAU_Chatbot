import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  AlertCircle,
  Pin,
  MoreHorizontal,
  Share2,
  Pencil,
  Archive,
  Check
} from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  theme,
  chatSessions = [],
  currentSessionId,
  searchQuery,
  setSearchQuery,
  onLoadSession,
  onDeleteSession,
  onTogglePinSession,
  onRenameSession,
  onArchiveSession,
  onShareSession,
  onNewChat,
  onExportChat,
  onClearAllHistory,
  messagesCount = 0
}) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');
  const menuRef = useRef(null);

  // Close 3-dots dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const filteredSessions = chatSessions.filter(s => 
    !s.isArchived && (s.title || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.isPinned);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);

  const groups = [
    { label: 'Today', sessions: [] },
    { label: 'Yesterday', sessions: [] },
    { label: 'Previous 7 Days', sessions: [] },
    { label: 'Previous 30 Days', sessions: [] },
    { label: 'Older', sessions: [] }
  ];

  unpinnedSessions.forEach(session => {
    const sessionDate = session.date ? new Date(session.date) : new Date();
    if (sessionDate >= today) groups[0].sessions.push(session);
    else if (sessionDate >= yesterday) groups[1].sessions.push(session);
    else if (sessionDate >= last7Days) groups[2].sessions.push(session);
    else if (sessionDate >= last30Days) groups[3].sessions.push(session);
    else groups[4].sessions.push(session);
  });

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setEditingId(session.id);
    setEditTitleText(session.title || '');
  };

  const handleSaveRename = (session, e) => {
    if (e) e.stopPropagation();
    if (onRenameSession && editTitleText.trim()) {
      onRenameSession(session.id, editTitleText.trim());
    }
    setEditingId(null);
    setEditTitleText('');
  };

  const handleKeyDownRename = (session, e) => {
    if (e.key === 'Enter') {
      handleSaveRename(session, e);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitleText('');
    }
  };

  const renderSessionItem = (session, sIdx = 0) => {
    const isActive = currentSessionId === session.id;
    const isPinned = !!session.isPinned;
    const isMenuOpen = activeMenuId === session.id;
    const isEditing = editingId === session.id;

    return (
      <div key={session.id} className="relative group/item">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: Math.min(sIdx * 0.02, 0.2), ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            if (!isEditing) {
              onLoadSession(session);
              onClose();
            }
          }}
          className={`relative flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all text-base ${
            isActive
              ? theme === 'dark'
                ? 'bg-[#212121] text-white font-medium shadow-sm'
                : 'bg-slate-200/70 text-slate-900 font-medium'
              : isPinned
                ? theme === 'dark'
                  ? 'bg-blue-950/25 text-blue-300 hover:bg-blue-950/40 hover:text-white'
                  : 'bg-blue-50/70 text-blue-950 hover:bg-blue-100/70'
                : theme === 'dark'
                  ? 'hover:bg-white/10 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
          }`}
        >
          {/* Title or Inline Edit Input */}
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  onKeyDown={(e) => handleKeyDownRename(session, e)}
                  autoFocus
                  className={`w-full py-0.5 px-2 text-sm md:text-base rounded-lg border outline-none ${
                    theme === 'dark'
                      ? 'bg-[#181818] border-blue-500 text-white'
                      : 'bg-white border-blue-500 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => handleSaveRename(session, e)}
                  className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="truncate text-sm md:text-base font-normal">
                {session.title || 'Conversation'}
              </span>
            )}
          </div>

          {/* Right Icons: Pin indicator & 3-dots Menu Button */}
          {!isEditing && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Slanted Pin icon if pinned */}
              {isPinned && (
                <span className="text-blue-500 dark:text-blue-400 p-0.5">
                  <Pin size={13} className="rotate-45 fill-blue-500" />
                </span>
              )}

              {/* 3-dots More Menu Trigger Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === session.id ? null : session.id);
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  isMenuOpen
                    ? theme === 'dark' ? 'bg-white/20 text-white opacity-100' : 'bg-slate-300 text-slate-900 opacity-100'
                    : 'opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Options"
              >
                <MoreHorizontal size={15} />
              </button>
            </div>
          )}
        </motion.div>

        {/* ChatGPT Style Floating Popup Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.94, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute right-2 top-10 z-50 w-44 py-1.5 rounded-2xl shadow-2xl border backdrop-blur-2xl ${
                theme === 'dark'
                  ? 'bg-[#1e1e1e]/98 border-[#2e2e2e] text-slate-200'
                  : 'bg-white/98 border-slate-200 text-slate-800'
              }`}
            >
              {/* Share Option */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  if (onShareSession) onShareSession(session);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Share2 size={14} className="text-slate-400" />
                <span>Share</span>
              </button>

              {/* Rename Option */}
              <button
                type="button"
                onClick={(e) => handleStartRename(session, e)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Pencil size={14} className="text-slate-400" />
                <span>Rename</span>
              </button>

              {/* Pin / Unpin Option */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  if (onTogglePinSession) onTogglePinSession(session.id, e);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Pin size={14} className={session.isPinned ? "rotate-45 fill-blue-500 text-blue-500" : "rotate-45 text-slate-400"} />
                <span>{session.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
              </button>

              {/* Archive Option */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  if (onArchiveSession) onArchiveSession(session.id);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Archive size={14} className="text-slate-400" />
                <span>Archive</span>
              </button>

              <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#2c2c2c]' : 'border-slate-100'}`} />

              {/* Delete Option (Red) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  onDeleteSession(session.id, e);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 size={14} className="text-red-500" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={() => {
              setActiveMenuId(null);
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '-100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className={`fixed top-0 left-0 bottom-0 w-80 sm:w-88 max-w-[88vw] z-50 flex flex-col shadow-2xl border-r backdrop-blur-2xl ${
              theme === 'dark' 
                ? 'bg-[#141414]/98 border-[#242424] text-white' 
                : 'bg-white/98 border-slate-200 text-slate-900'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQflmfbmpLajicm82NGmm6dAcXd0ERTuoCdEFZe1MriM2NxGzKKzkne_so&s=10" 
                    alt="EAU" 
                    className="w-full h-full object-cover scale-[1.3]" 
                  />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg tracking-tight">Recent Chats</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer active:scale-95"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* New Conversation Button */}
            <div className="p-3 border-b border-inherit">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm sm:text-base transition-all shadow-sm active:scale-95 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              >
                <Plus size={18} className="stroke-[2.5]" />
                <span>New Conversation</span>
              </button>
            </div>

            {/* Search History Input */}
            <div className="p-3 border-b border-inherit">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-[#1c1c1c] border-[#2c2c2c] focus-within:border-blue-500' 
                  : 'bg-slate-100 border-slate-200 focus-within:border-blue-400 focus-within:bg-white'
              }`}>
                <Search size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent text-sm sm:text-base w-full focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
              {filteredSessions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 text-center text-xs text-slate-400 dark:text-slate-500"
                >
                  <p>{searchQuery ? "No matching chats found" : "No past conversations yet"}</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Pinned Section */}
                  {pinnedSessions.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between px-3 py-1">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          <Pin size={11} className="rotate-45 fill-blue-500" />
                          <span>Pinned</span>
                        </span>
                      </div>

                      {pinnedSessions.map((session, sIdx) => renderSessionItem(session, sIdx))}
                    </div>
                  )}

                  {/* 2. Timeline Groups */}
                  {groups.filter(g => g.sessions.length > 0).map((group, gIdx) => (
                    <div key={gIdx} className="space-y-0.5">
                      <div className="px-3 py-1">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {group.label}
                        </span>
                      </div>

                      {group.sessions.map((session, sIdx) => renderSessionItem(session, sIdx))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-inherit space-y-1.5">
              {chatSessions.length > 0 && (
                <div>
                  {confirmClearAll ? (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>Clear all conversation history?</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClearAllHistory();
                            setConfirmClearAll(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          Yes, Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          className={`flex-1 py-1 px-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Clear All Chat History</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
