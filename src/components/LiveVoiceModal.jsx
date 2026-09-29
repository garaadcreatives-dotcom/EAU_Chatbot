import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  X, 
  VolumeX, 
  Sparkles
} from 'lucide-react';

/**
 * Fast Language Detector (Somali vs English)
 */
/**
 * Fast Language Detector (Somali vs English)
 */
function detectLanguage(text) {
  if (!text) return 'so-SO';
  const englishPattern = /\b(what|how|where|when|who|why|is|are|the|you|your|university|course|courses|admission|fee|fees|requirement|requirements|faculty|library|hello|hi|hey|tell|show|can|could|would|thanks|thank)\b/i;
  if (englishPattern.test(text) && !/\b(waa|maxaa|sidee|xilligee|goormaa|jaamacad|kulliyad|imtixaan|shuruud|lacag|diiwaangelin|fadlan|haye)\b/i.test(text)) {
    return 'en-US';
  }
  return 'so-SO';
}

/**
 * Clean up text for natural spoken TTS with Somali phonetic smoothing
 */
function cleanTextForSpeech(text, lang = 'so-SO') {
  if (!text) return '';
  let cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
    .replace(/[#*_~`]/g, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/\$/g, ' dollar ')
    .replace(/\s+/g, ' ')
    .trim();

  // Natural phonetic expansions for spoken clarity
  if (lang === 'so-SO') {
    cleaned = cleaned
      .replace(/\b1aad\b/gi, 'koowaad')
      .replace(/\b2aad\b/gi, 'labaad')
      .replace(/\b3aad\b/gi, 'saddexaad')
      .replace(/\b4aad\b/gi, 'afarad')
      .replace(/\b(\d+)\s*USD\b/gi, '$1 doolar')
      .replace(/\bEAU\b/gi, 'I-Ey-Yu')
      .replace(/\bIT\b/gi, 'Ay-Tii')
      .replace(/\bHRM\b/gi, 'Heych-Ar-Em')
      .replace(/\bMBBS\b/gi, 'Em-Bii-Bii-Es');
  }

  return cleaned;
}

export default function LiveVoiceModal({
  isOpen,
  onClose,
  theme,
  onSendMessageVoice
}) {
  // Voice states: 'listening' | 'speaking' | 'muted'
  const [voiceState, setVoiceState] = useState('listening');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiSpokenText, setAiSpokenText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  // Real-Time Streaming Audio Queue
  const speechQueueRef = useRef([]);
  const isQueuePlayingRef = useRef(false);

  // Initialize Speech Recognition & Greeting
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser-kaagu ma taageero Web Speech API. Fadlan isticmaal Google Chrome ama Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'so-SO'; // Professional native Somali speech recognition!
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (!isSpeakingRef.current && !isProcessingRef.current && !isMutedRef.current) {
        setVoiceState('listening');
      }
    };

    recognition.onresult = (event) => {
      if (isMutedRef.current) return;

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const currentSpeech = final || interim;
      if (currentSpeech.trim()) {
        // INSTANT BARGE-IN: If AI was speaking and user speaks, IMMEDIATELY halt AI speech!
        if (isSpeakingRef.current || isQueuePlayingRef.current || synthRef.current?.speaking) {
          stopSpeaking();
          setAiSpokenText('');
        }

        setUserTranscript(currentSpeech);
        setVoiceState('listening');

        // Reset silence timer on every new speech chunk
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Turn-around silence timeout (420ms)
        silenceTimerRef.current = setTimeout(() => {
          if (currentSpeech.trim() && !isProcessingRef.current) {
            handleSendSpokenQuery(currentSpeech.trim());
          }
        }, 420);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Fadlan oggolow makarafoonka si aad u isticmaasho Live Voice.");
        setVoiceState('listening');
      }
    };

    recognition.onend = () => {
      // Continuous auto-restart without interrupting speech stream
      if (isOpen && !isMutedRef.current) {
        try {
          recognition.start();
        } catch (_) {}
      }
    };

    try {
      recognition.start();
      setVoiceState('listening');
    } catch (_) {}

    // Instant Warm Welcome Greeting on Open (Immediate Live Presence)
    const welcomeTimer = setTimeout(() => {
      if (isOpen && !isProcessingRef.current && !userTranscript) {
        const greeting = "Salaamu calaykum! Waan ku dhagaysanayaa, maxaan kugu caawiyaa oo ku saabsan Jaamacadda Bariga Afrika?";
        setAiSpokenText(greeting);
        queueAndSpeakSentence(greeting, 'so-SO');
      }
    }, 300);

    return () => {
      clearTimeout(welcomeTimer);
      stopAllAudio();
    };
  }, [isOpen]);

  // Dynamic Audio Visualizer simulation
  useEffect(() => {
    let interval;
    if (voiceState === 'listening' && !isMuted) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.7 + 0.3);
      }, 100);
    } else if (voiceState === 'speaking') {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.95 + 0.35);
      }, 80);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [voiceState, isMuted]);

  // Stop everything
  const stopAllAudio = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    stopSpeaking();
    isProcessingRef.current = false;
    isSpeakingRef.current = false;
  };

  // Stop TTS immediately and clear audio queue
  const stopSpeaking = () => {
    speechQueueRef.current = [];
    isQueuePlayingRef.current = false;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isSpeakingRef.current = false;
    if (voiceState === 'speaking') {
      setVoiceState('listening');
    }
  };

  // Queue a phrase for real-time speech
  const queueAndSpeakSentence = (sentence, lang = 'so-SO') => {
    const clean = cleanTextForSpeech(sentence, lang);
    if (!clean) return;

    speechQueueRef.current.push({ text: clean, lang });
    if (!isQueuePlayingRef.current) {
      processSpeechQueue();
    }
  };

  // Process the queue item by item with zero gaps
  const processSpeechQueue = () => {
    if (!synthRef.current || speechQueueRef.current.length === 0) {
      isQueuePlayingRef.current = false;
      if (!isProcessingRef.current) {
        isSpeakingRef.current = false;
        if (isOpen) {
          setVoiceState(isMutedRef.current ? 'muted' : 'listening');
        }
      }
      return;
    }

    isQueuePlayingRef.current = true;
    isSpeakingRef.current = true;
    setVoiceState('speaking');

    const nextItem = speechQueueRef.current.shift();
    const utterance = new SpeechSynthesisUtterance(nextItem.text);

    const voices = synthRef.current.getVoices() || [];
    let selectedVoice = null;

    if (nextItem.lang === 'so-SO') {
      selectedVoice = voices.find(v => v.lang.startsWith('so')) ||
                      voices.find(v => v.name.includes('Natural') && (v.lang.startsWith('en') || v.lang.startsWith('it') || v.lang.startsWith('tr'))) ||
                      voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                      voices.find(v => v.lang.startsWith('it')) ||
                      voices.find(v => v.lang.startsWith('sw')) ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices[0];
      utterance.rate = 1.0; // Natural, clear, human pace
      utterance.pitch = 1.0;
    } else {
      selectedVoice = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))) ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices[0];
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      processSpeechQueue();
    };

    utterance.onerror = () => {
      processSpeechQueue();
    };

    synthRef.current.speak(utterance);
  };

  // Process user spoken query with instant streaming response
  const handleSendSpokenQuery = async (query) => {
    if (!query || isProcessingRef.current || isMutedRef.current) return;

    isProcessingRef.current = true;
    setVoiceState('speaking'); // Stay active in conversation mode (no thinking stall)
    setUserTranscript(query);
    setAiSpokenText('');
    stopSpeaking();

    const detectedLang = detectLanguage(query);

    let phraseBuffer = '';
    let fullAccumulatedText = '';

    const handleStreamChunk = (chunkText) => {
      phraseBuffer += chunkText;
      fullAccumulatedText += chunkText;
      setAiSpokenText(fullAccumulatedText);

      // Early phrase boundary detection for instantaneous voice delivery
      const match = phraseBuffer.match(/([^,.!?\n]+[,.!?\n]+)\s*/);
      if (match) {
        const phraseToSpeak = match[1].trim();
        phraseBuffer = phraseBuffer.slice(match[0].length);
        if (phraseToSpeak) {
          const chunkLang = detectLanguage(phraseToSpeak) || detectedLang;
          queueAndSpeakSentence(phraseToSpeak, chunkLang);
        }
      } else if (phraseBuffer.split(' ').length >= 4) {
        // If 4 words accumulated without punctuation, speak them right away!
        const words = phraseBuffer.trim();
        phraseBuffer = '';
        if (words) {
          queueAndSpeakSentence(words, detectedLang);
        }
      }
    };

    try {
      if (onSendMessageVoice) {
        const finalResponseText = await onSendMessageVoice(query, detectedLang, handleStreamChunk);
        isProcessingRef.current = false;
        
        // Speak whatever remaining characters are in buffer
        if (phraseBuffer.trim()) {
          const finalLang = detectLanguage(phraseBuffer) || detectedLang;
          queueAndSpeakSentence(phraseBuffer.trim(), finalLang);
        } else if (!fullAccumulatedText.trim()) {
          setAiSpokenText(finalResponseText);
          const finalLang = detectLanguage(finalResponseText) || detectedLang;
          queueAndSpeakSentence(finalResponseText, finalLang);
        }
      }
    } catch (err) {
      console.error("Live voice error:", err);
      isProcessingRef.current = false;
      setVoiceState(isMutedRef.current ? 'muted' : 'listening');
    }
  };

  // Toggle Mute Microphone (Allows listening without barge-in interruptions)
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      try {
        recognitionRef.current?.start();
      } catch (_) {}
      if (!isSpeakingRef.current) {
        setVoiceState('listening');
      }
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      // User is muting THEIR mic to listen peacefully -> Do NOT kill AI's speech!
      if (!isSpeakingRef.current) {
        setVoiceState('muted');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 md:p-10 select-none overflow-hidden bg-gradient-to-b from-[#080d16]/95 via-[#030712]/98 to-[#000000] text-white backdrop-blur-3xl"
      >
        {/* Top Header Bar */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all ${
              isMuted
                ? 'bg-red-500/15 border-red-500/30'
                : 'bg-white/10 border-white/10'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  voiceState === 'speaking' ? 'bg-emerald-400' :
                  isMuted ? 'bg-red-400' : 'bg-cyan-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  voiceState === 'speaking' ? 'bg-emerald-500' :
                  isMuted ? 'bg-red-500' : 'bg-cyan-500'
                }`}></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {voiceState === 'speaking'
                  ? (isMuted ? 'Speaking (Muted)' : 'Speaking')
                  : isMuted ? 'Muted' : 'Listening'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Exit Live Voice"
          >
            <X size={20} />
          </button>
        </div>

        {/* Center: Dynamic ChatGPT Voice Orb */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl my-auto relative">
          <div className="relative flex items-center justify-center">
            {/* Outer Ambient Glows */}
            <div 
              className={`absolute w-72 h-72 md:w-96 md:h-96 rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-blue-600/40 via-cyan-500/30 to-emerald-400/40 scale-125'
                  : isMuted
                  ? 'bg-slate-700/30 scale-90'
                  : 'bg-gradient-to-tr from-blue-500/35 via-cyan-400/25 to-sky-300/30 scale-105'
              }`}
            />

            {/* Ripple rings when listening */}
            {voiceState === 'listening' && !isMuted && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-cyan-400/40 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2.2, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-blue-400/30 pointer-events-none"
                />
              </>
            )}

            {/* Main Fluid Animated Orb */}
            <motion.div
              onClick={() => {
                if (voiceState === 'speaking') stopSpeaking();
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 overflow-hidden ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-indigo-600 animate-orb-speaking shadow-cyan-500/30'
                  : isMuted
                  ? 'bg-slate-800 border-2 border-red-500/30 shadow-red-500/10'
                  : 'bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 animate-orb-breathe shadow-blue-500/30'
              }`}
            >
              <div className="absolute inset-2 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center">
                {voiceState === 'speaking' && (
                  <div className="flex items-center gap-1.5 z-10">
                    {[0.6, 1, 0.4, 0.85, 0.5, 0.9, 0.7].map((heightScale, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['12px', `${heightScale * 48}px`, '12px'] }}
                        transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 rounded-full bg-white shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {voiceState === 'listening' && !isMuted && (
                  <div className="flex items-center gap-1 z-10">
                    {[16, 28, 42, 28, 16].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${h * 0.4}px`, `${h * (audioLevel + 0.3)}px`, `${h * 0.4}px`] }}
                        transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 rounded-full bg-white/90"
                      />
                    ))}
                  </div>
                )}

                {isMuted && voiceState !== 'speaking' && (
                  <div className="flex flex-col items-center gap-2 text-red-300">
                    <MicOff size={40} className="animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Muted</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Subtitle / Live Transcript Card */}
          <div className="mt-8 md:mt-12 w-full max-w-lg min-h-[90px] flex flex-col items-center justify-center text-center px-4">
            {voiceState === 'speaking' && aiSpokenText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 border border-white/15 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-lg"
              >
                <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed line-clamp-3">
                  "{aiSpokenText}"
                </p>
              </motion.div>
            )}

            {voiceState === 'listening' && userTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/15 border border-blue-400/30 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-lg"
              >
                <p className="text-sm md:text-base text-cyan-200 font-medium leading-relaxed">
                  "{userTranscript}"
                </p>
              </motion.div>
            )}

            {isMuted && voiceState !== 'speaking' && (
              <p className="text-xs md:text-sm text-red-300/90 font-medium bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                Microphone is muted. Tap Unmute to speak.
              </p>
            )}

            {!isMuted && !userTranscript && !aiSpokenText && (
              <p className="text-sm md:text-base text-slate-400 font-light">
                Listening... Speak naturally
              </p>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full max-w-md flex items-center justify-center gap-4 md:gap-6 z-10 pb-4">
          {/* Mute / Unmute Button in concise English */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`px-5 py-3.5 rounded-full transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2.5 font-medium text-sm ${
              isMuted
                ? 'bg-red-500/25 text-red-300 border border-red-500/50 hover:bg-red-500/35 ring-2 ring-red-500/30'
                : 'bg-white/15 text-white border border-white/20 hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <>
                <MicOff size={20} className="text-red-400" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Mic size={20} className="text-cyan-300" />
                <span>Mute</span>
              </>
            )}
          </button>

          {voiceState === 'speaking' && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="p-3.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Stop"
            >
              <VolumeX size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="px-5 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-xl active:scale-95 flex items-center gap-2 font-medium text-sm"
            title="End"
          >
            <X size={20} />
            <span>End</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
