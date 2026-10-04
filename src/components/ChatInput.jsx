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
    <footer className="p-3 sm:p-5 md:p-6 w-full max-w-4xl lg:max-w-5xl mx-auto flex flex-col items-center">
      {/* Quick Prompt Suggestion Pills */}
      {showSuggestions && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3.5 sm:mb-5 w-full overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:justify-center px-1">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(q)}
              className={`flex-shrink-0 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full text-sm sm:text-[0.95rem] md:text-base font-medium transition-all shadow-sm border cursor-pointer active:scale-95 whitespace-nowrap ${
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
        <div className="w-full max-w-4xl lg:max-w-5xl mb-2 sm:mb-3 flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
            {attachment.type.startsWith('image/') ? (
              <img src={attachment.url || attachment.base64Data} alt="thumb" className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-lg sm:rounded-xl flex-shrink-0" />
            ) : (
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <span className="text-xs sm:text-sm md:text-base font-medium truncate max-w-[200px] sm:max-w-md">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={onRemoveAttachment}
            className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form 
        onSubmit={onSendMessage}
        className={`w-full flex items-center gap-1 sm:gap-2 md:gap-3 px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 rounded-full border shadow-md md:shadow-lg transition-all ${
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
          className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full cursor-pointer flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleRecording}
          className={`p-1.5 sm:p-2 transition-colors rounded-full cursor-pointer flex-shrink-0 ${
            isRecording ? 'text-red-500 animate-pulse bg-red-50 dark:bg-red-950/40' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Voice input"
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Ask EAU Garowe..."}
          className="flex-1 bg-transparent py-1.5 sm:py-2.5 px-2 text-base sm:text-lg md:text-[1.125rem] focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white min-w-0"
        />

        {/* ChatGPT Style Live Voice Launcher Button */}
        {onOpenLiveVoice && !input.trim() && !attachment && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#1e60f2] hover:bg-[#1554dd] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md flex-shrink-0"
            title="Live Voice Mode"
          >
            <div className="flex items-center gap-[2.5px] sm:gap-[3px] justify-center h-4 sm:h-5">
              <span className="w-[2.5px] sm:w-[3px] h-[8px] sm:h-[10px] bg-white rounded-full"></span>
              <span className="w-[2.5px] sm:w-[3px] h-[14px] sm:h-[18px] bg-white rounded-full"></span>
              <span className="w-[2.5px] sm:w-[3px] h-[11px] sm:h-[14px] bg-white rounded-full"></span>
              <span className="w-[2.5px] sm:w-[3px] h-[7px] sm:h-[9px] bg-white rounded-full"></span>
            </div>
          </button>
        )}

        <button
          type="submit"
          disabled={(!input.trim() && !attachment) || isLoading}
          className={`p-2.5 sm:p-3 md:p-3.5 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer flex-shrink-0 active:scale-95 ${
            theme === 'dark' 
              ? 'bg-white text-black hover:bg-slate-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>

      <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 text-center mt-2 sm:mt-3 font-medium">
        Powered by East Africa University
      </p>
    </footer>
  );
}
