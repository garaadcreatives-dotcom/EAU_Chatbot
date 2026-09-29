import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

import Header from './components/Header.jsx';
import ChatMessage from './components/ChatMessage.jsx';
import ChatInput from './components/ChatInput.jsx';
import Drawer from './components/Drawer.jsx';
import AdminModal from './components/AdminModal.jsx';
import LiveVoiceModal from './components/LiveVoiceModal.jsx';

const SUGGESTED_QUESTIONS = [
  "Admission requirements",
  "Library hours",
  "Available courses",
  "Contact support"
];

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'bot',
      content: 'Soo dhawoow! 👋 Welcome to EAU Garowe. Sideen kuu caawin karaa maanta?'
    }
  ]);
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('eau_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState('initial');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('eau_theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [speakingId, setSpeakingId] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [liveVoiceLanguage, setLiveVoiceLanguage] = useState('so-SO');

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInputText, setEditInputText] = useState('');

  // Secret Admin Panel State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('eau2026');
  const [adminAnnouncements, setAdminAnnouncements] = useState('');
  const [adminCustomKnowledge, setAdminCustomKnowledge] = useState('');
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [adminCustomDocuments, setAdminCustomDocuments] = useState([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [adminSaveToast, setAdminSaveToast] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('documents');
  const logoClickRef = useRef(0);
  const adminDocFileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('eau_theme', theme);
    } catch {}
  }, [theme]);

  // Sync chatSessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('eau_chat_sessions', JSON.stringify(chatSessions));
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  }, [chatSessions]);

  // Check ?admin=eau2026 in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'eau2026') {
      fetchAdminData('eau2026');
      setIsAdminOpen(true);
    }
  }, []);

  const fetchAdminData = async (key = 'eau2026') => {
    try {
      const res = await fetch(`/api/admin/knowledge?key=${key}`);
      if (res.ok) {
        const data = await res.json();
        setAdminAnnouncements(data.announcements || '');
        setAdminCustomKnowledge(data.customKnowledge || '');
        setAdminDocuments(data.documents || []);
        setAdminCustomDocuments(data.customDocuments || []);
      }
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    }
  };

  const handleSaveAdminData = async () => {
    setIsAdminSaving(true);
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: adminKey || 'eau2026',
          announcements: adminAnnouncements,
          customKnowledge: adminCustomKnowledge
        })
      });
      if (res.ok) {
        setAdminSaveToast(true);
        setTimeout(() => setAdminSaveToast(false), 3000);
      } else {
        alert("Invalid Secret Admin Key!");
      }
    } catch (e) {
      console.error("Failed to save admin data", e);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleToggleDoc = async (docId, currentEnabled) => {
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: adminKey || 'eau2026',
          action: 'toggle',
          docId,
          enabled: !currentEnabled
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setAdminDocuments(data.data.documents || []);
          setAdminCustomDocuments(data.data.customDocuments || []);
        }
      }
    } catch (e) {
      console.error("Failed to toggle document", e);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Ma hubtaa inaad tirtirto document-kan?")) return;
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: adminKey || 'eau2026',
          action: 'delete',
          docId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setAdminDocuments(data.data.documents || []);
          setAdminCustomDocuments(data.data.customDocuments || []);
        }
      }
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewDocName(file.name.replace(/\.[^/.]+$/, ""));
    setNewDocDescription(`Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      setNewDocContent(text);
    };
    reader.readAsText(file);
  };

  const handleSaveNewDoc = async () => {
    if (!newDocName.trim() || !newDocContent.trim()) {
      alert("Fadlan geli magaca iyo qoraalka document-ka!");
      return;
    }
    setIsAdminSaving(true);
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: adminKey || 'eau2026',
          action: 'add',
          document: {
            name: newDocName.trim(),
            description: newDocDescription.trim() || 'Custom Document',
            content: newDocContent.trim(),
            size: `${(newDocContent.length / 1024).toFixed(1)} KB`
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setAdminDocuments(data.data.documents || []);
          setAdminCustomDocuments(data.data.customDocuments || []);
        }
        setNewDocName('');
        setNewDocDescription('');
        setNewDocContent('');
        setAdminActiveTab('documents');
        setAdminSaveToast(true);
        setTimeout(() => setAdminSaveToast(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save new doc", e);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleLogoClick = () => {
    logoClickRef.current += 1;
    if (logoClickRef.current >= 3) {
      logoClickRef.current = 0;
      fetchAdminData('eau2026');
      setIsAdminOpen(true);
    }
    setTimeout(() => {
      logoClickRef.current = 0;
    }, 2000);
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-save session
  useEffect(() => {
    if (messages.length > 1) {
      const userMsg = messages.find(m => m.role === 'user');
      const title = userMsg ? (userMsg.content.length > 30 ? userMsg.content.substring(0, 30) + '...' : userMsg.content) : 'New Conversation';
      const sessionIdToUse = currentSessionId === 'initial' ? messages[1].id : currentSessionId;
      
      const currentSessionToSave = {
        id: sessionIdToUse,
        title,
        date: new Date().toISOString(),
        messages: [...messages]
      };
      
      setChatSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === sessionIdToUse);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...currentSessionToSave,
            isPinned: prev[existingIndex].isPinned || false
          };
          return updated;
        }
        return [{ ...currentSessionToSave, isPinned: false }, ...prev];
      });
      
      if (currentSessionId === 'initial') {
        setCurrentSessionId(sessionIdToUse);
      }
    }
  }, [messages, currentSessionId]);

  // Handle shared chat URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      fetch(`/api/share/${shareId}`)
        .then(res => res.json())
        .then(data => {
          if (data.session) {
            setMessages(data.session);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => console.error("Failed to load shared chat", err));
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'so-SO';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Could not start recording or get permissions", e);
          alert("Fadlan oggolow makarafoonka si aad u isticmaasho codka.");
          setIsRecording(false);
        }
      } else {
        alert("Your browser doesn't support voice input.");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Faylku wuu weyn yahay. Fadlan dooro fayl ka yar 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      setAttachment({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        base64Data: base64String
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleClearChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([
      {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Soo dhawoow! 👋 Welcome to EAU Garowe. Sideen kuu caawin karaa maanta?'
      }
    ]);
    setIsDrawerOpen(false);
  };

  const loadSession = (session) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsDrawerOpen(false);
  };

  const handleClearAllHistory = () => {
    setChatSessions([]);
    try {
      localStorage.removeItem('eau_chat_sessions');
    } catch {}
    setMessages([
      {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Soo dhawoow! 👋 Welcome to EAU Garowe. Sideen kuu caawin karaa maanta?'
      }
    ]);
    setCurrentSessionId(Date.now().toString());
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      handleClearChat();
    }
  };

  const handleTogglePinSession = (id, e) => {
    if (e) e.stopPropagation();
    setChatSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isPinned: !s.isPinned };
      }
      return s;
    }));
  };

  const handleRenameSession = (id, newTitle) => {
    if (!newTitle.trim()) return;
    setChatSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, title: newTitle.trim() };
      }
      return s;
    }));
  };

  const handleArchiveSession = (id) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isArchived: !s.isArchived };
      }
      return s;
    }));
  };

  const handleExportChat = () => {
    if (messages.length <= 1) return;
    
    let textContent = `EAU Garowe University - Chat Export\n`;
    textContent += `Date: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(m => {
      const role = m.role === 'user' ? 'You' : 'Assistant';
      textContent += `${role}:\n${m.content}\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `EAU-chat-export-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareChat = async () => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: messages })
      });
      const data = await response.json();
      if (data.id) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${data.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch (e) {
      console.error("Failed to share chat", e);
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      } catch {}
    } finally {
      setIsSharing(false);
    }
  };

  const handleFeedback = (messageId, type) => {
    let wasAlreadySet = false;
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        if (msg.feedback === type) {
          wasAlreadySet = true;
          return { ...msg, feedback: undefined };
        }
        return { ...msg, feedback: type };
      }
      return msg;
    }));
    
    if (type === 'up' && !wasAlreadySet) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#38bdf8', '#818cf8']
      });
    }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSpeak = (id, text) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\|/g, ' ')
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92;
    utterance.pitch = 0.98;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.lang.toLowerCase().includes('so') || 
      v.name.toLowerCase().includes('natural') || 
      v.lang.toLowerCase().includes('ar') ||
      v.name.toLowerCase().includes('google')
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  const playTypingSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const playTick = (delay) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400 + Math.random() * 200, audioCtx.currentTime + delay);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.05);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 0.05);
      };
      
      playTick(0);
      playTick(0.15);
      playTick(0.3);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const sendMessage = async (
    text,
    currentAttachment = null,
    overrideHistory = null
  ) => {
    if ((!text.trim() && !currentAttachment) || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      attachment: currentAttachment || undefined
    };

    const baseList = overrideHistory !== null && overrideHistory !== undefined ? overrideHistory : messages;
    const newMessagesList = [...baseList, userMessage];

    setMessages(newMessagesList);
    setInput('');
    setAttachment(null);
    setIsLoading(true);
    setLoadingStatus('Processing...');
    playTypingSound();

    const statusInterval = setInterval(() => {
      setLoadingStatus(prev => {
        const statuses = ['Processing...', 'Searching knowledge base...', 'Thinking...', 'Formulating response...'];
        const currentIndex = statuses.indexOf(prev);
        if (currentIndex === -1) return statuses[0];
        return statuses[(currentIndex + 1) % statuses.length];
      });
    }, 2000);

    let botMessageId = '';
    try {
      const chatHistory = newMessagesList.map(m => ({
        role: m.role,
        content: m.content,
        attachment: m.attachment
      })).slice(-10);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch response');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let botResponse = '';
      botMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'bot',
        content: '',
        isTyping: true
      }]);

      if (reader) {
        let isFirstChunk = true;
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const line = buffer.trim();
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                 try {
                   const data = JSON.parse(line.slice(6));
                   if (data.text) {
                     botResponse += data.text;
                     setMessages(prev => {
                       const newMessages = [...prev];
                       const lastMessageIndex = newMessages.findIndex(m => m.id === botMessageId);
                       if (lastMessageIndex !== -1) {
                         newMessages[lastMessageIndex].content = botResponse;
                       }
                       return newMessages;
                     });
                   }
                 } catch (e) {
                   console.error("Error parsing final stream chunk", e);
                 }
              }
            }
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.trim().slice(6));
                if (data.text) {
                  if (isFirstChunk) {
                    setIsLoading(false);
                    isFirstChunk = false;
                  }
                  botResponse += data.text;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessageIndex = newMessages.findIndex(m => m.id === botMessageId);
                    if (lastMessageIndex !== -1) {
                      newMessages[lastMessageIndex].content = botResponse;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error("Error parsing stream chunk", e, "Line:", line);
              }
            }
          }
        }
      }

      if (!botResponse.trim()) {
        throw new Error('Jawaab lagama helin server-ka.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = error?.message || 'Waan ka xumahay, cillad ayaa dhacday. Fadlan mar kale isku day. 😔';
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      clearInterval(statusInterval);
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.role === 'bot' && !m.content.trim() && m.id === botMessageId));
        return filtered.map(m => m.isTyping ? { ...m, isTyping: false } : m);
      });
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleRegenerate = async (botMessageId) => {
    if (isLoading) return;
    const botIndex = messages.findIndex(m => m.id === botMessageId);
    if (botIndex === -1) return;

    const previousUserMsgIndex = messages.slice(0, botIndex).map(m => m.role).lastIndexOf('user');
    if (previousUserMsgIndex === -1) return;

    const userMsg = messages[previousUserMsgIndex];
    const historyBeforeUser = messages.slice(0, previousUserMsgIndex);
    await sendMessage(userMsg.content, userMsg.attachment || null, historyBeforeUser);
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditInputText(message.content);
  };

  const handleSaveEdit = async (messageId) => {
    if (!editInputText.trim() || isLoading) return;
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const currentMsg = messages[msgIndex];
    const historyBeforeThis = messages.slice(0, msgIndex);
    setEditingMessageId(null);
    await sendMessage(editInputText.trim(), currentMsg.attachment || null, historyBeforeThis);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInputText('');
  };

  const handleLiveVoiceSend = async (spokenQuery, lang = 'so-SO', onChunk = null) => {
    if (!spokenQuery || !spokenQuery.trim()) return '';

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: spokenQuery.trim()
    };

    const newMessagesList = [...messages, userMessage];
    setMessages(newMessagesList);

    try {
      const chatHistory = newMessagesList.map(m => ({
        role: m.role,
        content: m.content
      })).slice(-10);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, isLiveVoice: true })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.trim().slice(6));
                if (data.text) {
                  botResponse += data.text;
                  if (onChunk) onChunk(data.text);
                }
              } catch (e) {
                console.error("Voice stream chunk parse error", e);
              }
            }
          }
        }
      }

      const finalResponse = botResponse.trim() || (
        lang.startsWith('so') 
          ? 'Waan ku dhagaysanayaa! Maxaan kugu caawin karaa?'
          : 'I am listening! How can I help you?'
      );

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: finalResponse
      };

      setMessages(prev => [...prev, botMessage]);
      return finalResponse;
    } catch (err) {
      console.error("Live voice send error:", err);
      const fallbackText = lang.startsWith('so')
        ? 'Waan ku dhagaysanayaa! Fadlan su\'aashaada ii sheeg.'
        : 'I am listening! Please tell me your question.';

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: fallbackText
      };
      setMessages(prev => [...prev, errorMessage]);
      return fallbackText;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage(input, attachment);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex flex-col h-screen font-sans relative transition-colors ${
        theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#ffffff] text-slate-950'
      }`}
    >
      {/* 1. Header Component */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Header
          theme={theme}
          setTheme={setTheme}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          onLogoClick={handleLogoClick}
          onClearChat={handleClearChat}
          hasMessages={messages.length > 1}
        />
      </motion.div>

      {/* Share Toast */}
      <AnimatePresence>
        {shareCopied && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl flex items-center gap-2 text-xs md:text-sm font-medium border border-slate-700/40"
          >
            <Check size={16} className="text-green-400 dark:text-green-600" />
            <span>Link copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Chat Messages Canvas */}
      <main 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto"
      >
        <div className="space-y-6 pb-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full group ${
                  message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'
                }`}
              >
                <ChatMessage
                  message={message}
                  theme={theme}
                  copiedId={copiedId}
                  speakingId={speakingId}
                  isLoading={isLoading}
                  editingMessageId={editingMessageId}
                  editInputText={editInputText}
                  setEditInputText={setEditInputText}
                  onCopy={handleCopy}
                  onShare={handleShareChat}
                  onSpeak={handleSpeak}
                  onRegenerate={handleRegenerate}
                  onFeedback={handleFeedback}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 text-xs md:text-sm text-slate-400 dark:text-slate-500 py-2"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{loadingStatus || "EAU Assistant is thinking..."}</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`fixed bottom-24 right-6 p-2.5 rounded-full shadow-xl border transition-all z-20 ${
            theme === 'dark' 
              ? 'bg-[#1e1e1e] border-[#333333] text-white hover:bg-[#2a2a2a]' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* 3. Bottom Chat Input Component */}
      <ChatInput
        input={input}
        setInput={setInput}
        attachment={attachment}
        setAttachment={setAttachment}
        isLoading={isLoading}
        loadingStatus={loadingStatus}
        isRecording={isRecording}
        theme={theme}
        fileInputRef={fileInputRef}
        inputRef={inputRef}
        onSendMessage={handleSubmit}
        onToggleRecording={toggleRecording}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onFileChange={handleFileChange}
        onRemoveAttachment={removeAttachment}
        suggestedQuestions={SUGGESTED_QUESTIONS}
        onSelectSuggestion={(q) => sendMessage(q)}
        showSuggestions={messages.length === 1}
      />

      {/* 4. Chat History Drawer Component */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        theme={theme}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLoadSession={loadSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onRenameSession={handleRenameSession}
        onArchiveSession={handleArchiveSession}
        onShareSession={handleShareChat}
        onNewChat={handleClearChat}
        onExportChat={handleExportChat}
        onClearAllHistory={handleClearAllHistory}
        messagesCount={messages.length}
      />

      {/* 5. Secret Admin Modal Component */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        theme={theme}
        adminKey={adminKey}
        setAdminKey={setAdminKey}
        adminActiveTab={adminActiveTab}
        setAdminActiveTab={setAdminActiveTab}
        adminDocuments={adminDocuments}
        adminCustomDocuments={adminCustomDocuments}
        adminAnnouncements={adminAnnouncements}
        setAdminAnnouncements={setAdminAnnouncements}
        adminCustomKnowledge={adminCustomKnowledge}
        setAdminCustomKnowledge={setAdminCustomKnowledge}
        newDocName={newDocName}
        setNewDocName={setNewDocName}
        newDocDescription={newDocDescription}
        setNewDocDescription={setNewDocDescription}
        newDocContent={newDocContent}
        setNewDocContent={setNewDocContent}
        isAdminSaving={isAdminSaving}
        adminSaveToast={adminSaveToast}
        adminDocFileInputRef={adminDocFileInputRef}
        onSaveAdminData={handleSaveAdminData}
        onToggleDoc={handleToggleDoc}
        onDeleteDoc={handleDeleteDoc}
        onFileUpload={handleFileUpload}
        onSaveNewDoc={handleSaveNewDoc}
      />

      {/* 6. Live Voice Modal (ChatGPT / Gemini Style) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        theme={theme}
        onSendMessageVoice={handleLiveVoiceSend}
        currentLanguage={liveVoiceLanguage}
        setCurrentLanguage={setLiveVoiceLanguage}
      />
    </motion.div>
  );
}
