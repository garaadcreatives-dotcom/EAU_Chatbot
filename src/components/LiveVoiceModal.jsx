import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  X, 
  VolumeX, 
  Sparkles,
  Globe
} from 'lucide-react';

import { cleanSomaliForSpeech, getOptimalSomaliVoice } from '../utils/somaliSpeech.js';

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

function cleanTextForSpeech(text, lang = 'so-SO') {
  return cleanSomaliForSpeech(text, lang);
}

export default function LiveVoiceModal({
  isOpen,
  onClose,
  theme,
  onSendMessageVoice,
  currentLanguage = 'so-SO',
  setCurrentLanguage
}) {
  // Voice states: 'listening' | 'speaking' | 'muted'
  const [voiceState, setVoiceState] = useState('listening');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiSpokenText, setAiSpokenText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeLang, setActiveLang] = useState(currentLanguage || 'so-SO');

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  // Web Audio API refs for real microphone analysis
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Real-Time Streaming Audio Queue
  const speechQueueRef = useRef([]);
  const isQueuePlayingRef = useRef(false);

  // Sync active language
  useEffect(() => {
    if (currentLanguage) {
      setActiveLang(currentLanguage);
    }
  }, [currentLanguage]);

  // Real Mic Volume Visualizer using Web Audio API
  const startAudioMeter = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!isOpen) return;

        if (isSpeakingRef.current) {
          // AI speaking animation simulation
          setAudioLevel(0.4 + Math.random() * 0.5);
        } else if (!isMutedRef.current && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize volume 0 to 1
          const norm = Math.min(Math.max((avg - 10) / 70, 0), 1);
          setAudioLevel(norm);
        } else {
          setAudioLevel(0);
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn("Real mic audio meter not started, using fallback visualizer:", err);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
  };

  // Initialize Speech Recognition & Greeting
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
      stopAudioMeter();
      return;
    }

    startAudioMeter();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser-kaagu ma taageero Web Speech API. Fadlan isticmaal Google Chrome ama Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = activeLang;
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

        // Turn-around silence timeout - ultra snappy & responsive (290ms)
        silenceTimerRef.current = setTimeout(() => {
          if (currentSpeech.trim() && !isProcessingRef.current) {
            handleSendSpokenQuery(currentSpeech.trim());
          }
        }, 290);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'language-not-supported' && recognition.lang === 'so-SO') {
        // Fallback to English/multilingual recognition if Somali language model is unavailable in browser
        console.warn("Somali language model not in browser, falling back to English recognition");
        recognition.lang = 'en-US';
        try {
          recognition.start();
        } catch (_) {}
      } else if (event.error === 'not-allowed') {
        alert("Fadlan oggolow makarafoonka (Allow Microphone) si aad u isticmaasho Live Voice.");
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

    // Instant Warm & Enthusiastic Welcome Greeting on Open
    const welcomeTimer = setTimeout(() => {
      if (isOpen && !isProcessingRef.current && !userTranscript) {
        const greeting = activeLang.startsWith('so') 
          ? "Salaamu calaykum! Kusoo dhawow Jaamacadda Bariga Afrika Faraca Garowe! Waan ku dhagaysanayaa, maxaan kugu caawiyaa maanta?"
          : "Hello and welcome to East Africa University Garowe! I am excited to help you, what would you like to ask?";
        setAiSpokenText(greeting);
        queueAndSpeakSentence(greeting, activeLang);
      }
    }, 250);

    return () => {
      clearTimeout(welcomeTimer);
      stopAllAudio();
      stopAudioMeter();
    };
  }, [isOpen, activeLang]);

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
    const selectedVoice = getOptimalSomaliVoice(voices, nextItem.lang);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.rate = nextItem.lang === 'so-SO' ? 1.08 : 1.12;
    utterance.pitch = 1.02;

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
    setVoiceState('speaking');
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

      // Instant phrase boundary detection for instantaneous voice delivery
      const match = phraseBuffer.match(/([^,.!?:\n]+[,.!?:\n]+)\s*/);
      if (match) {
        const phraseToSpeak = match[1].trim();
        phraseBuffer = phraseBuffer.slice(match[0].length);
        if (phraseToSpeak) {
          const chunkLang = detectLanguage(phraseToSpeak) || detectedLang;
          queueAndSpeakSentence(phraseToSpeak, chunkLang);
        }
      } else if (phraseBuffer.split(/\s+/).filter(Boolean).length >= 3) {
        // Trigger as soon as 3 words arrive for instant zero-lag spoken delivery
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
      if (!isSpeakingRef.current) {
        setVoiceState('muted');
      }
    }
  };

  const handleLanguageChange = (lang) => {
    setActiveLang(lang);
    if (setCurrentLanguage) setCurrentLanguage(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
    stopSpeaking();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 select-none overflow-hidden bg-gradient-to-b from-[#080d16]/95 via-[#030712]/98 to-[#000000] text-white backdrop-blur-3xl"
      >
        {/* Top Header Bar */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10 gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all ${
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
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-200">
                {voiceState === 'speaking'
                  ? (isMuted ? 'Speaking (Muted)' : 'Speaking')
                  : isMuted ? 'Muted' : 'Listening'}
              </span>
            </div>
          </div>

          {/* Language Switcher Pills */}
          <div className="flex items-center bg-white/10 rounded-full p-0.5 sm:p-1 border border-white/10 backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => handleLanguageChange('so-SO')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeLang === 'so-SO'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇸🇴 Soomaali
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en-US')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeLang === 'en-US'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md flex-shrink-0 active:scale-95"
            title="Exit Live Voice"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Center: Dynamic Fluid Voice Visualizer Orb */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl my-auto relative">
          <div className="relative flex items-center justify-center">
            {/* Outer Ambient Reactive Glow */}
            <div 
              style={{
                transform: `scale(${1 + audioLevel * 0.35})`,
                opacity: 0.6 + audioLevel * 0.4
              }}
              className={`absolute w-60 h-60 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full transition-all duration-300 blur-3xl pointer-events-none ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-blue-600/40 via-cyan-500/30 to-emerald-400/40'
                  : isMuted
                  ? 'bg-slate-700/30'
                  : 'bg-gradient-to-tr from-blue-500/35 via-cyan-400/30 to-sky-300/30'
              }`}
            />

            {/* Ripple rings when listening */}
            {voiceState === 'listening' && !isMuted && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.4 + audioLevel * 0.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full border border-cyan-400/40 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.6 + audioLevel * 0.3, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2.2, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full border border-blue-400/30 pointer-events-none"
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
              style={{
                transform: `scale(${1 + audioLevel * 0.12})`
              }}
              className={`relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300 overflow-hidden ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-indigo-600 animate-orb-speaking shadow-cyan-500/40'
                  : isMuted
                  ? 'bg-slate-800 border-2 border-red-500/30 shadow-red-500/10'
                  : 'bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 animate-orb-breathe shadow-blue-500/40'
              }`}
            >
              <div className="absolute inset-2 sm:inset-3 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center">
                {/* Speaking Waveform Bars */}
                {voiceState === 'speaking' && (
                  <div className="flex items-center gap-1.5 sm:gap-2 z-10">
                    {[0.6, 1, 0.45, 0.9, 0.5, 0.95, 0.7].map((heightScale, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['10px', `${Math.max(16, heightScale * 50 * (0.5 + audioLevel * 0.7))}px`, '10px'] }}
                        transition={{ duration: 0.5 + i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 sm:w-2 rounded-full bg-white shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {/* Listening Audio Reactive Wave Bars */}
                {voiceState === 'listening' && !isMuted && (
                  <div className="flex items-center gap-1.5 sm:gap-2 z-10">
                    {[14, 26, 44, 26, 14].map((baseH, i) => (
                      <motion.div
                        key={i}
                        style={{
                          height: `${Math.max(8, baseH * (0.3 + audioLevel * 1.2))}px`
                        }}
                        transition={{ duration: 0.1 }}
                        className="w-1.5 sm:w-2 rounded-full bg-white/90 shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {/* Muted Display */}
                {isMuted && voiceState !== 'speaking' && (
                  <div className="flex flex-col items-center gap-2 text-red-300">
                    <MicOff className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Muted</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Subtitle / Live Transcript Card */}
          <div className="mt-6 sm:mt-10 w-full max-w-lg min-h-[85px] flex flex-col items-center justify-center text-center px-3 sm:px-4">
            {voiceState === 'speaking' && aiSpokenText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 border border-white/15 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-xl shadow-lg max-w-full"
              >
                <p className="text-xs sm:text-sm md:text-base text-slate-100 font-medium leading-relaxed line-clamp-3">
                  "{aiSpokenText}"
                </p>
              </motion.div>
            )}

            {voiceState === 'listening' && userTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/20 border border-blue-400/35 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-xl shadow-lg max-w-full"
              >
                <p className="text-xs sm:text-sm md:text-base text-cyan-200 font-medium leading-relaxed">
                  "{userTranscript}"
                </p>
              </motion.div>
            )}

            {isMuted && voiceState !== 'speaking' && (
              <p className="text-xs sm:text-sm text-red-300/90 font-medium bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                Makarafoonku wuu aamusan yahay. Riix Unmute si aad u hadasho.
              </p>
            )}

            {!isMuted && !userTranscript && !aiSpokenText && (
              <p className="text-xs sm:text-sm md:text-base text-slate-400 font-light flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>
                  {activeLang.startsWith('so') 
                    ? "Waan ku dhagaysanayaa... Si dabiici ah ula hadal EAU" 
                    : "Listening... Speak naturally with EAU"}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full max-w-md flex items-center justify-center gap-3 sm:gap-5 z-10 pb-2 sm:pb-4">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-full transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 font-medium text-xs sm:text-sm ${
              isMuted
                ? 'bg-red-500/25 text-red-300 border border-red-500/50 hover:bg-red-500/35 ring-2 ring-red-500/30'
                : 'bg-white/15 text-white border border-white/20 hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <>
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                <span>Mute</span>
              </>
            )}
          </button>

          {/* Stop AI Speaking Button */}
          {voiceState === 'speaking' && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="p-2.5 sm:p-3.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-xl active:scale-95 flex items-center gap-2 font-medium text-xs sm:text-sm"
            title="End Session"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>End</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
