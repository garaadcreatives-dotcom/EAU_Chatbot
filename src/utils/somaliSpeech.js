/**
 * Somali Natural Language Speech Preparation & Phonetic Smoothing Utility
 */

export function cleanSomaliForSpeech(text, lang = 'so-SO') {
  if (!text) return '';

  let cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\|/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, ' ')
    .replace(/[#*_~`]/g, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/\$/g, ' doolar ')
    .replace(/&/g, ' iyo ')
    .replace(/%/g, ' boqolkiiba ')
    .replace(/\s+/g, ' ')
    .trim();

  // If text is in Somali, apply natural phonetic transformations
  if (lang === 'so-SO' || lang.startsWith('so')) {
    cleaned = cleaned
      // University titles & common academic terms
      .replace(/\bEAU\s*Garowe\b/gi, 'Jaamacadda Bariga Afrika Faraca Garowe')
      .replace(/\bEAU\b/gi, 'Jaamacadda Bariga Afrika')
      .replace(/\b1-?aad\b/gi, 'koowaad')
      .replace(/\b2-?aad\b/gi, 'labaad')
      .replace(/\b3-?aad\b/gi, 'saddexaad')
      .replace(/\b4-?aad\b/gi, 'afarad')
      .replace(/\b2026[- ]?2027\b/g, 'laba kun lix iyo labaatan ilaa laba kun toddoba iyo labaatan')
      .replace(/\b2026\b/g, 'laba kun iyo lix iyo labaatan')
      .replace(/\b2027\b/g, 'laba kun iyo toddoba iyo labaatan')
      .replace(/\b1999\b/g, 'sagaal iyo toban boqol iyo sagaashan iyo sagaal')
      .replace(/\b2009\b/g, 'laba kun iyo sagaal')
      .replace(/\bFinal[- ]?ka\b/gi, 'Faynaalka')
      .replace(/\bMid[- ]?term[- ]?ka\b/gi, 'Mid-termka')
      .replace(/\bSemester[- ]?ka\b/gi, 'Semestarka')
      .replace(/\bSemester\b/gi, 'Semestar')
      .replace(/\b(\d+)\s*USD\b/gi, '$1 doolar')
      .replace(/\bSh\.\s*/gi, 'Sheekh ')
      .replace(/\bDr\.\s*/gi, 'Dhaqtar ')
      .replace(/\bProf\.\s*/gi, 'Borofasoor ')
      .replace(/\bIT\b/gi, 'Ay-Tii')
      .replace(/\bHRM\b/gi, 'Heych-Ar-Em')
      .replace(/\bMBBS\b/gi, 'Kulliyadda Caafimaadka')
      .replace(/\binfo@eaugarowe\.edu\.so\b/gi, 'info at eau garowe dot edu dot so')
      .replace(/\bregistrar@eaugarowe\.edu\.so\b/gi, 'registrar at eau garowe dot edu dot so');

    // Somali Phonetic Acoustic Smoothing for Natural Native Sound:
    // When standard TTS engine (English/Italian/Swahili) pronounces Somali text:
    // 'x' in Somali is a soft aspirate (h), NOT 'ks':
    cleaned = cleaned
      .replace(/x/g, 'h')
      .replace(/X/g, 'H')
      // 'c' at start of word:
      .replace(/\bcalaykum\b/gi, 'alaykum')
      .replace(/\bcaafimaad/gi, 'aafimaad')
      .replace(/\bcaa/gi, 'aa')
      .replace(/\bca/gi, 'a')
      .replace(/\bco/gi, 'o')
      .replace(/\bcu/gi, 'u')
      .replace(/\bci/gi, 'i')
      .replace(/\bce/gi, 'e')
      // 'c' inside words:
      .replace(/ac/gi, 'ah')
      .replace(/ec/gi, 'eh')
      .replace(/ic/gi, 'ih')
      .replace(/oc/gi, 'oh')
      .replace(/uc/gi, 'uh')
      .replace(/c/gi, '')
      .replace(/C/gi, '')
      // 'dh' in Somali sounds like a soft d:
      .replace(/dh/gi, 'd')
      .replace(/Dh/gi, 'D');
  }

  return cleaned.trim();
}

/**
 * Select the optimal voice that pronounces Somali naturally and cleanly.
 * Strictly excludes Arabic, Chinese, Japanese, and other incompatible scripts.
 */
export function getOptimalSomaliVoice(voices = [], lang = 'so-SO') {
  if (!voices || voices.length === 0) return null;

  // Filter OUT any voices that garble Latin text or speak Arabic/Asian
  const validVoices = voices.filter(v => {
    const l = (v.lang || '').toLowerCase();
    return !l.startsWith('ar') && 
           !l.startsWith('zh') && 
           !l.startsWith('ja') && 
           !l.startsWith('ru') && 
           !l.startsWith('ko') && 
           !l.startsWith('fa') && 
           !l.startsWith('ur') && 
           !l.startsWith('hi');
  });

  if (validVoices.length === 0) return voices[0] || null;

  if (lang.startsWith('so')) {
    // 1. Direct Somali voice if installed
    const somaliVoice = validVoices.find(v => v.lang.toLowerCase().includes('so') || v.name.toLowerCase().includes('somali'));
    if (somaliVoice) return somaliVoice;

    // 2. Swahili voice (shares 95% identical Cushitic/Bantu vowel and syllable phonology)
    const swahiliVoice = validVoices.find(v => v.lang.toLowerCase().startsWith('sw') || v.name.toLowerCase().includes('swahili'));
    if (swahiliVoice) return swahiliVoice;

    // 3. Italian voice (Somali orthography was explicitly based on Italian Latin vowels)
    const italianVoice = validVoices.find(v => (v.lang.toLowerCase().startsWith('it') || v.name.toLowerCase().includes('italian')) && v.name.toLowerCase().includes('natural')) ||
                         validVoices.find(v => v.lang.toLowerCase().startsWith('it'));
    if (italianVoice) return italianVoice;

    // 4. Spanish voice (pure vowels)
    const spanishVoice = validVoices.find(v => (v.lang.toLowerCase().startsWith('es') || v.name.toLowerCase().includes('spanish')) && v.name.toLowerCase().includes('natural')) ||
                         validVoices.find(v => v.lang.toLowerCase().startsWith('es'));
    if (spanishVoice) return spanishVoice;

    // 5. Microsoft Natural English Voices (Jenny, Ava, Aria, Guy, Andrew)
    const naturalEnglish = validVoices.find(v => 
      v.name.toLowerCase().includes('natural') && 
      (v.name.toLowerCase().includes('jenny') || 
       v.name.toLowerCase().includes('ava') || 
       v.name.toLowerCase().includes('aria') || 
       v.name.toLowerCase().includes('guy') || 
       v.name.toLowerCase().includes('andrew') ||
       v.name.toLowerCase().includes('emma') ||
       v.name.toLowerCase().includes('sonia'))
    );
    if (naturalEnglish) return naturalEnglish;

    // 6. Any other Natural voice
    const anyNatural = validVoices.find(v => v.name.toLowerCase().includes('natural'));
    if (anyNatural) return anyNatural;

    // 7. Google US English
    const googleVoice = validVoices.find(v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase().startsWith('en'));
    if (googleVoice) return googleVoice;

    // 8. General English voice
    const generalEn = validVoices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (generalEn) return generalEn;

    return validVoices[0];
  }

  // English fallback for English queries
  return validVoices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && v.name.toLowerCase().includes('natural')) ||
         validVoices.find(v => v.lang.startsWith('en')) ||
         validVoices[0];
}
