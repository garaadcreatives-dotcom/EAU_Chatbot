import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Paperclip, Loader2, Trash2, Plus } from 'lucide-react';

export default function AdminModal({
  isOpen,
  onClose,
  theme,
  adminKey,
  setAdminKey,
  adminActiveTab,
  setAdminActiveTab,
  adminDocuments,
  adminCustomDocuments,
  adminAnnouncements,
  setAdminAnnouncements,
  adminCustomKnowledge,
  setAdminCustomKnowledge,
  newDocName,
  setNewDocName,
  newDocDescription,
  setNewDocDescription,
  newDocContent,
  setNewDocContent,
  isAdminSaving,
  adminSaveToast,
  adminDocFileInputRef,
  onSaveAdminData,
  onToggleDoc,
  onDeleteDoc,
  onFileUpload,
  onSaveNewDoc
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          theme === 'dark' ? 'bg-[#121212] border-[#292929] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              🔐
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Secret Admin Panel (EAU Garowe)</h2>
              <p className="text-xs text-slate-400">Maamulka xogta tooska ah, manhajka & ogaysiisyada AI-ga</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-3 border-b border-inherit overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAdminActiveTab('documents')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminActiveTab === 'documents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            📁 Documents-ka Firfircoon
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab('upload')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminActiveTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            📤 Soo Geli File / Manhaj Cusub
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminActiveTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            📢 Ogaysiisyada Cusub
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab('knowledge')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              adminActiveTab === 'knowledge'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            📚 Xogta & Kharashka
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs md:text-sm">
          {/* TAB 1: ACTIVE DOCUMENTS */}
          {adminActiveTab === 'documents' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Xakamaynta Manhajka & Documents-ka:</strong> Halkan waxaad ka damin kartaa (OFF) documents-kii hore sida manhajkii hore, adigoo shidi kara kuwa cusub. AI-gu kaliya wuxuu ku shaqaynayaa kuwa shidan!
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Documents-ka Asalka ah ee Jaamacadda</h3>
                {adminDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      doc.enabled !== false 
                        ? theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-slate-50 border-slate-200' 
                        : 'opacity-50 bg-black/5 dark:bg-white/5 border-dashed border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        📄
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs md:text-sm">{doc.name}</h4>
                        <p className="text-[11px] text-slate-400">{doc.description} • {doc.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleDoc(doc.id, doc.enabled !== false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                        doc.enabled !== false 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-slate-500 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {doc.enabled !== false ? '🟢 Shidan (ON)' : '⚪ Damiyeysan (OFF)'}
                    </button>
                  </div>
                ))}

                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 pt-3">Documents-ka Cusub ee Admin-ku Soo Geliyay</h3>
                {adminCustomDocuments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    Weli ma aadan soo gelin document cusub. Tag qaybta "Soo Geli File" si aad manhaj cusub ugu darto!
                  </div>
                ) : (
                  adminCustomDocuments.map((doc) => (
                    <div 
                      key={doc.id} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        doc.enabled !== false 
                          ? theme === 'dark' ? 'bg-[#181818] border-[#333333]' : 'bg-slate-50 border-slate-200' 
                          : 'opacity-50 bg-black/5 dark:bg-white/5 border-dashed border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          📑
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs md:text-sm">{doc.name}</h4>
                          <p className="text-[11px] text-slate-400">{doc.description} • {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleDoc(doc.id, doc.enabled !== false)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                            doc.enabled !== false 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-slate-500 hover:bg-slate-600 text-white'
                          }`}
                        >
                          {doc.enabled !== false ? '🟢 Shidan (ON)' : '⚪ Damiyeysan (OFF)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors"
                          title="Tirtir Document-kan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DOCUMENT */}
          {adminActiveTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300">
                📤 <strong>Soo Geli Manhaj/Document Cusub:</strong> Dooro file computer-kaaga yaalla (`.pdf`, `.docx`, `.txt`) ama qoraalka toos ugu dheji sanduuqa hoose si AI-gu ugu shaqeeyo.
              </div>

              <div>
                <label className="block font-semibold mb-1 text-xs">Magaca Document-ka / Manhajka:</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Tusaale: Manhajka Cusub ee IT 2025-2026"
                  className={`w-full p-2.5 rounded-xl border text-xs md:text-sm focus:outline-none ${
                    theme === 'dark' ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-xs">Sharaxaad Kooban:</label>
                <input
                  type="text"
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Tusaale: Maadooyinka cusub ee Semester 1 & 2"
                  className={`w-full p-2.5 rounded-xl border text-xs md:text-sm focus:outline-none ${
                    theme === 'dark' ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <input 
                  type="file" 
                  ref={adminDocFileInputRef} 
                  onChange={onFileUpload} 
                  className="hidden" 
                  accept=".txt,.pdf,.docx,.doc,.json"
                />
                <button
                  type="button"
                  onClick={() => adminDocFileInputRef.current?.click()}
                  className={`w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.01] ${
                    theme === 'dark' ? 'border-[#333333] bg-[#181818] hover:border-blue-500' : 'border-slate-300 bg-slate-50 hover:border-blue-500'
                  }`}
                >
                  <Paperclip size={22} className="text-blue-500" />
                  <span className="font-semibold text-xs md:text-sm">Riix si aad file uga soo doorato computer-kaaga</span>
                  <span className="text-[11px] text-slate-400">Taageeraya (.txt, .pdf, .docx, .doc, .json)</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-xs">Qoraalka Document-ka (Content):</label>
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={5}
                  placeholder="Halkan ku dheji ama ku qor xogta document-ka ama manhajka cusub..."
                  className={`w-full p-3 rounded-xl border text-xs md:text-sm resize-none focus:outline-none ${
                    theme === 'dark' ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={onSaveNewDoc}
                disabled={isAdminSaving || !newDocName.trim() || !newDocContent.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdminSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>Keydi & U Gudbi AI-ga</span>
              </button>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {adminActiveTab === 'announcements' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                📢 <strong>Ogaysiisyada Degdegga ah:</strong> Qor wareegtooyinka jaamacadda, xilliyada imtixaanka, fasaxyada, iyo taariikhaha muhiimka ah si AI-gu ardayda toos ugu wargeliyo.
              </div>
              <textarea
                value={adminAnnouncements}
                onChange={(e) => setAdminAnnouncements(e.target.value)}
                rows={8}
                placeholder="Tusaale: Diiwaangelinta semester-ka cusub waxay bilaabmaysaa 1-da bisha..."
                className={`w-full p-3.5 rounded-2xl border text-xs md:text-sm resize-none focus:outline-none ${
                  theme === 'dark' ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={onSaveAdminData}
                disabled={isAdminSaving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdminSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Keydi Ogaysiisyada</span>
              </button>
            </div>
          )}

          {/* TAB 4: KNOWLEDGE & FEES */}
          {adminActiveTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-xs text-green-800 dark:text-green-300">
                📚 <strong>Xogta Guud & Kharashyada:</strong> Ku dar shuruudaha aqbalaadda, jadwallada lacagta, qawaaniinta xafiiska maamulka iyo wixii faahfaahin dheeraad ah.
              </div>
              <textarea
                value={adminCustomKnowledge}
                onChange={(e) => setAdminCustomKnowledge(e.target.value)}
                rows={8}
                placeholder="Tusaale: Kharashka diiwaangelintu waa $20, lacagta semester-kuna waa..."
                className={`w-full p-3.5 rounded-2xl border text-xs md:text-sm resize-none focus:outline-none ${
                  theme === 'dark' ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={onSaveAdminData}
                disabled={isAdminSaving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdminSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Keydi Xogta</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer (Passkey status) */}
        <div className="p-4 border-t border-inherit flex items-center justify-between text-xs text-slate-400 bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span>Admin Passkey:</span>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="px-2 py-1 rounded bg-transparent border border-slate-400/30 text-xs font-mono w-24 text-center text-slate-900 dark:text-white"
            />
          </div>
          {adminSaveToast && (
            <span className="text-green-500 font-semibold flex items-center gap-1">
              <Check size={14} /> Si guul leh ayaa loo keydiyay!
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
