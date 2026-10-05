import React, { useState, useEffect } from 'react';
import { Copy, Check, Volume2, RotateCcw, ThumbsUp, ThumbsDown, Share2, Paperclip } from 'lucide-react';
import { ModernCopyIcon, ModernShareIcon, ModernEditIcon } from './Icons';

// Helper to render formatted markdown, tables, bold, and lists
const renderFormattedMessage = (rawText, theme = 'light') => {
  const lines = rawText.split('\n');
  const blocks = [];
  let i = 0;
  const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';

  const formatInline = (str) => {
    if (!str) return '';
    // Strip accidental <p> and </p> tags
    const cleanStr = str.replace(/<\/?p>/gi, '');
    
    // Split by <br> or <br/> tags so multi-line text inside tables or paragraphs works cleanly
    const subLines = cleanStr.split(/<br\s*\/?>/gi);
    
    return subLines.map((sub, sIdx) => {
      const parts = [];
      const regex = /(\*\*[^*]+\*\*|<b>.*?<\/b>|\*[^*]+\*|<i>.*?<\/i>|`[^`]+`|\[[^\]]+\]\([^)]+\))/gi;
      let lastIdx = 0;
      let match;

      while ((match = regex.exec(sub)) !== null) {
        if (match.index > lastIdx) {
          parts.push(sub.substring(lastIdx, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(<strong key={`${sIdx}-${match.index}`} style={{ color: textColor }} className="font-bold">{token.slice(2, -2)}</strong>);
        } else if (token.toLowerCase().startsWith('<b>') && token.toLowerCase().endsWith('</b>')) {
          parts.push(<strong key={`${sIdx}-${match.index}`} style={{ color: textColor }} className="font-bold">{token.slice(3, -4)}</strong>);
        } else if (token.startsWith('*') && token.endsWith('*')) {
          parts.push(<em key={`${sIdx}-${match.index}`} style={{ color: textColor }} className="italic">{token.slice(1, -1)}</em>);
        } else if (token.toLowerCase().startsWith('<i>') && token.toLowerCase().endsWith('</i>')) {
          parts.push(<em key={`${sIdx}-${match.index}`} style={{ color: textColor }} className="italic">{token.slice(3, -4)}</em>);
        } else if (token.startsWith('`') && token.endsWith('`')) {
          parts.push(
            <code 
              key={`${sIdx}-${match.index}`} 
              className={`px-2 py-0.5 rounded text-sm sm:text-base font-mono font-medium ${
                theme === 'dark' ? 'bg-white/15 text-blue-300' : 'bg-black/10 text-blue-700'
              }`}
            >
              {token.slice(1, -1)}
            </code>
          );
        } else if (token.startsWith('[') && token.includes('](')) {
          const lm = token.match(/\[(.*?)\]\((.*?)\)/);
          if (lm) {
            parts.push(
              <a 
                key={`${sIdx}-${match.index}`} 
                href={lm[2]} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`underline hover:opacity-80 font-medium ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {lm[1]}
              </a>
            );
          }
        }
        lastIdx = match.index + token.length;
      }
      if (lastIdx < sub.length) {
        parts.push(sub.substring(lastIdx));
      }

      return (
        <React.Fragment key={sIdx}>
          {parts.length > 0 ? parts : sub}
          {sIdx < subLines.length - 1 && <br className="my-1" />}
        </React.Fragment>
      );
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks ```
    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre key={`code-${i}`} className={`my-4 p-5 rounded-2xl overflow-x-auto text-sm sm:text-base md:text-lg font-mono leading-relaxed ${
          theme === 'dark' ? 'bg-[#181818] text-slate-200 border border-[#2a2a2a]' : 'bg-slate-900 text-slate-100'
        }`}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Headings (###, ##, #)
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${i}`} style={{ color: textColor }} className="text-base sm:text-lg font-bold mt-3 mb-1.5">
          {formatInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${i}`} style={{ color: textColor }} className="text-lg sm:text-xl font-bold mt-4 mb-2">
          {formatInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={`h1-${i}`} style={{ color: textColor }} className="text-xl sm:text-2xl font-extrabold mt-5 mb-2.5">
          {formatInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Horizontal Rule (---, ***)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(
        <hr key={`hr-${i}`} className={`my-4 sm:my-5 border-t ${theme === 'dark' ? 'border-[#282828]' : 'border-slate-200'}`} />
      );
      i++;
      continue;
    }

    // Markdown Table detection (| header 1 | header 2 | ...)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isSeparator = /^\|?[\s-:]+\|[\s-:|]+$/.test(tableLines[1]);
        const dataRows = isSeparator ? tableLines.slice(2) : tableLines.slice(1);

        blocks.push(
          <div 
            key={`table-${i}`} 
            className={`my-3 sm:my-5 overflow-x-auto rounded-xl sm:rounded-2xl border shadow-sm ${
              theme === 'dark' ? 'border-[#2f2f2f] bg-[#121212]' : 'border-slate-200 bg-white'
            }`}
          >
            <table className="min-w-full divide-y divide-inherit text-left text-sm sm:text-base md:text-lg">
              <thead className={theme === 'dark' ? 'bg-[#1c1c1c]' : 'bg-slate-100'}>
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} style={{ color: textColor }} className="px-4 sm:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">
                      {formatInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#222222]' : 'divide-slate-100'}`}>
                {dataRows.map((rowStr, rIdx) => {
                  const cells = rowStr.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                  return (
                    <tr 
                      key={rIdx} 
                      className={`transition-colors ${
                        theme === 'dark' ? 'hover:bg-[#181818]' : 'hover:bg-slate-50'
                      }`}
                    >
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} style={{ color: textColor }} className="px-4 sm:px-6 py-2.5 sm:py-3.5 font-normal align-top leading-relaxed">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Bullet points
    if (/^\s*[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^\s*[-*•]\s+/, '');
      blocks.push(
        <div key={`li-${i}`} style={{ color: textColor }} className="flex items-start gap-2 sm:gap-2.5 my-1.5 sm:my-2 text-sm sm:text-[15px] md:text-base leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
          <span>{formatInline(itemText)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Normal paragraph line
    if (!line.trim()) {
      i++;
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} style={{ color: textColor }} className="my-1.5 sm:my-2 text-sm sm:text-[15px] md:text-base leading-relaxed">
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return blocks;
};

const TypewriterMessage = ({ text, isTyping, theme = 'light' }) => {
  if (isTyping && !text.trim()) {
    return (
      <div className="flex items-center gap-2 py-3 text-blue-500">
        <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" />
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
      {renderFormattedMessage(text, theme)}
      {isTyping && (
        <span className="inline-flex items-center ml-1 align-middle">
          <span className="w-2.5 h-5 rounded-[2px] bg-blue-500 dark:bg-blue-400 animate-cursor shadow-sm shadow-blue-500/40" />
        </span>
      )}
    </div>
  );
};

export default function ChatMessage({
  message,
  theme,
  copiedId,
  speakingId,
  isLoading,
  editingMessageId,
  editInputText,
  setEditInputText,
  onCopy,
  onShare,
  onSpeak,
  onRegenerate,
  onFeedback,
  onStartEdit,
  onSaveEdit,
  onCancelEdit
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full max-w-[90%] md:max-w-[85%] ml-auto">
        {/* Attachment preview if any */}
        {message.attachment && (
          <div className="mb-2 p-2 rounded-2xl bg-black/5 dark:bg-white/10 max-w-xs overflow-hidden border border-black/5 dark:border-white/10">
            {message.attachment.type.startsWith('image/') ? (
              <img src={message.attachment.url || message.attachment.base64Data} alt="attachment" className="max-h-52 rounded-xl object-cover" />
            ) : (
              <div className="flex items-center gap-2 p-2.5 text-base font-medium">
                <Paperclip size={18} />
                <span className="truncate">{message.attachment.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Edit Box Mode */}
        {editingMessageId === message.id ? (
          <div className={`w-full p-5 rounded-[24px] border shadow-md ${
            theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-white border-slate-200'
          }`}>
            <textarea
              value={editInputText}
              onChange={(e) => setEditInputText(e.target.value)}
              className="w-full p-3.5 text-lg md:text-xl rounded-xl resize-none focus:outline-none bg-transparent"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-5 py-2.5 rounded-full text-base font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSaveEdit(message.id)}
                disabled={!editInputText.trim() || isLoading}
                className={`px-6 py-2.5 rounded-full text-base md:text-lg font-semibold transition-all shadow-sm disabled:opacity-50 ${
                  theme === 'dark' ? 'bg-white text-black hover:bg-slate-200' : 'bg-black text-white hover:bg-slate-800'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end max-w-full">
            {/* Soft Bubble */}
            <div
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-sm sm:text-[15px] md:text-base leading-relaxed break-words ${
                theme === 'dark' ? 'bg-[#0284c7] text-white font-normal shadow-sm' : 'bg-[#f4f4f4] text-slate-900 font-normal shadow-sm'
              }`}
            >
              {message.content}
            </div>

            {/* User Action Bar (Copy, Share, Edit) */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 mr-1 text-[#8e8e8e] dark:text-[#9e9e9e]">
              <button
                type="button"
                onClick={() => onCopy(message.id, message.content)}
                className="p-1 sm:p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Copy"
              >
                {copiedId === message.id ? <Check className="w-4 h-4 text-green-500" /> : <ModernCopyIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </button>
              <button
                type="button"
                onClick={onShare}
                className="p-1 sm:p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Share"
              >
                <ModernShareIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onStartEdit(message)}
                className="p-1 sm:p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Edit"
              >
                <ModernEditIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // BOT MESSAGE (Clean Canvas Text)
  return (
    <div className="flex flex-col items-start max-w-full md:max-w-[95%] space-y-1 sm:space-y-2">
      <div style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }} className="text-sm sm:text-[15px] md:text-base leading-relaxed whitespace-pre-wrap py-1 sm:py-1.5 font-normal w-full break-words">
        <TypewriterMessage text={message.content} isTyping={message.isTyping} theme={theme} />
      </div>

      {/* Bot Action Bar */}
      {!message.isTyping && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 text-slate-400 dark:text-slate-500">
          <button
            onClick={() => onCopy(message.id, message.content)}
            className="p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy"
          >
            {copiedId === message.id ? <Check className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem] text-green-500" /> : <Copy className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />}
          </button>

          <button
            onClick={() => onSpeak(message.id, message.content)}
            className={`p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
              speakingId === message.id ? 'text-blue-500 bg-blue-50 dark:bg-[#212121]' : 'hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={speakingId === message.id ? 'Stop' : 'Listen'}
          >
            <Volume2 className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />
          </button>

          <button
            onClick={() => onRegenerate(message.id)}
            disabled={isLoading}
            className="p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Regenerate"
          >
            <RotateCcw className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />
          </button>

          <button
            onClick={() => onFeedback(message.id, 'up')}
            className={`p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
              message.feedback === 'up' ? 'text-green-500 bg-green-50 dark:bg-[#212121]' : 'hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />
          </button>

          <button
            onClick={() => onFeedback(message.id, 'down')}
            className={`p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
              message.feedback === 'down' ? 'text-red-500 bg-red-50 dark:bg-[#212121]' : 'hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />
          </button>

          <button
            onClick={onShare}
            className="p-1.5 sm:p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 className="w-4 h-4 sm:w-[1.15rem] sm:h-[1.15rem]" />
          </button>
        </div>
      )}
    </div>
  );
}
