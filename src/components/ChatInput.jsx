import React from 'react';
import { Send, Paperclip, Mic, X, Loader2, Headphones } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  attachment,
  setAttachment,
  isLoading,
  loadingStatus,
  isRecording,
  theme,
  fileInputRef,
  inputRef,
  onSendMessage,
  onToggleRecording,
  onOpenLiveVoice,
  onFileChange,
  onRemoveAttachment,
  suggestedQuestions,
  onSelectSuggestion,
  showSuggestions
}) {
  return (
    <footer className="p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Quick Prompt Suggestion Pills */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 w-full">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(q)}
              className={`px-5 py-3 rounded-2xl text-base md:text-lg font-medium transition-all shadow-sm border cursor-pointer active:scale-95 ${
                theme === 'dark'
                  ? 'bg-[#181818] border-[#2f2f2f] text-slate-200 hover:bg-[#252525] hover:text-white hover:border-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Preview Box */}
      {attachment && (
        <div className="w-full max-w-4xl mb-3 flex items-center justify-between p-3.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            {attachment.type.startsWith('image/') ? (
              <img src={attachment.url || attachment.base64Data} alt="thumb" className="w-14 h-14 object-cover rounded-xl" />
            ) : (
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Paperclip size={22} />
              </div>
            )}
            <span className="text-base md:text-lg font-medium truncate max-w-[260px] md:max-w-md">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={onRemoveAttachment}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form 
        onSubmit={onSendMessage}
        className={`w-full flex items-center gap-3 px-5 md:px-6 py-3.5 md:py-4 rounded-full border shadow-lg transition-all ${
          theme === 'dark' 
            ? 'bg-[#141414] border-[#2c2c2c] focus-within:border-slate-500' 
            : 'bg-white border-slate-200 focus-within:border-blue-400 focus-within:shadow-xl'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          className="hidden" 
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full cursor-pointer"
          title="Attach file"
        >
          <Paperclip size={22} />
        </button>

        <button
          type="button"
          onClick={onToggleRecording}
          className={`p-2 transition-colors rounded-full cursor-pointer ${
            isRecording ? 'text-red-500 animate-pulse bg-red-50 dark:bg-red-950/40' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Voice input"
        >
          <Mic size={22} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Ask East Africa University..."}
          className="flex-1 bg-transparent py-2 px-2 text-lg md:text-xl focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white"
        />

        {/* ChatGPT Style Live Voice Launcher Button */}
        {onOpenLiveVoice && !input.trim() && !attachment && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1e60f2] hover:bg-[#1554dd] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md flex-shrink-0"
            title="Live Voice Mode"
          >
            <div className="flex items-center gap-[3px] justify-center h-5">
              <span className="w-[3px] h-[10px] bg-white rounded-full"></span>
              <span className="w-[3px] h-[20px] bg-white rounded-full"></span>
              <span className="w-[3px] h-[15px] bg-white rounded-full"></span>
              <span className="w-[3px] h-[9px] bg-white rounded-full"></span>
            </div>
          </button>
        )}

        <button
          type="submit"
          disabled={(!input.trim() && !attachment) || isLoading}
          className={`p-3 md:p-3.5 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer ${
            theme === 'dark' 
              ? 'bg-white text-black hover:bg-slate-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>

      <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 text-center mt-3.5 font-medium">
        Powered by EAU Garowe
      </p>
    </footer>
  );
}
