import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { pdfKnowledgeBase } from "./data/pdf_data.js";
import { curriculums } from "./data/curriculums.js";

const activeApiKey = (
  process.env['Real EAU'] ||
  process.env.Real_EAU ||
  process.env.REAL_EAU ||
  process.env.RealEAU ||
  process.env.Awga || 
  process.env.EAUGRW || 
  process.env.GEMINI_API_KEY || 
  process.env.API_KEY || 
  ""
).trim();

const ai = new GoogleGenAI({ apiKey: activeApiKey });
const sharedChats = new Map();
const KNOWLEDGE_FILE = path.join(process.cwd(), 'data', 'admin_knowledge.json');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Admin Knowledge Endpoints (Secured with secret passkey 'eau2026')
  app.get("/api/admin/knowledge", (req, res) => {
    const key = req.query.key || req.headers['x-admin-key'];
    if (key !== 'eau2026') {
      return res.status(401).json({ error: "Invalid admin key" });
    }
    try {
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        const data = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf-8'));
        return res.json(data);
      }
      return res.json({ announcements: "", customKnowledge: "", documents: [], customDocuments: [] });
    } catch (e) {
      return res.status(500).json({ error: "Failed to read knowledge file" });
    }
  });

  app.post("/api/admin/knowledge", (req, res) => {
    const { key, announcements, customKnowledge } = req.body;
    if (key !== 'eau2026') {
      return res.status(401).json({ error: "Invalid admin key" });
    }
    try {
      let currentData = {};
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        currentData = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf-8'));
      }
      currentData.announcements = announcements || '';
      currentData.customKnowledge = customKnowledge || '';
      currentData.updatedAt = new Date().toISOString();
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(currentData, null, 2));
      return res.json({ success: true, message: "Knowledge base updated successfully" });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save knowledge file" });
    }
  });

  // Admin Document Management Endpoint (Toggle status, Add, Delete files)
  app.post("/api/admin/documents", (req, res) => {
    const { key, action, docId, document, enabled } = req.body;
    if (key !== 'eau2026') {
      return res.status(401).json({ error: "Invalid admin key" });
    }
    try {
      let currentData = { documents: [], customDocuments: [] };
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        currentData = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf-8'));
      }
      if (!currentData.documents) currentData.documents = [];
      if (!currentData.customDocuments) currentData.customDocuments = [];

      if (action === 'toggle') {
        const builtinDoc = currentData.documents.find((d) => d.id === docId);
        if (builtinDoc) {
          builtinDoc.enabled = enabled;
        }
        const customDoc = currentData.customDocuments.find((d) => d.id === docId);
        if (customDoc) {
          customDoc.enabled = enabled;
        }
      } else if (action === 'add' && document) {
        currentData.customDocuments.push({
          id: 'doc-' + crypto.randomUUID().slice(0, 8),
          name: document.name || 'Untitled Document',
          description: document.description || 'Uploaded custom document',
          content: document.content || '',
          size: document.size || '1 KB',
          enabled: true,
          updatedAt: new Date().toISOString().slice(0, 10)
        });
      } else if (action === 'delete' && docId) {
        currentData.customDocuments = currentData.customDocuments.filter((d) => d.id !== docId);
      }

      currentData.updatedAt = new Date().toISOString();
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(currentData, null, 2));
      return res.json({ success: true, data: currentData });
    } catch (e) {
      return res.status(500).json({ error: "Failed to update documents" });
    }
  });

  // API Route for sharing chats
  app.post("/api/share", (req, res) => {
    try {
      const { session } = req.body;
      const id = crypto.randomUUID();
      sharedChats.set(id, session);
      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: "Failed to share chat" });
    }
  });

  app.get("/api/share/:id", (req, res) => {
    const session = sharedChats.get(req.params.id);
    if (session) {
      res.json({ session });
    } else {
      res.status(404).json({ error: "Chat not found" });
    }
  });

  // API Route for chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, isLiveVoice } = req.body;
      
      let dynamicAdminData = '';
      let isProspectusEnabled = true;
      let isCurriculumEnabled = true;

      if (fs.existsSync(KNOWLEDGE_FILE)) {
        try {
          const adminJson = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf-8'));
          if (adminJson.documents) {
            const prospDoc = adminJson.documents.find((d) => d.id === 'doc-prospectus');
            if (prospDoc && prospDoc.enabled === false) isProspectusEnabled = false;

            const currDoc = adminJson.documents.find((d) => d.id === 'doc-curriculum');
            if (currDoc && currDoc.enabled === false) isCurriculumEnabled = false;
          }

          if (adminJson.customDocuments && Array.isArray(adminJson.customDocuments)) {
            adminJson.customDocuments.forEach((cd) => {
              if (cd.enabled !== false && cd.content) {
                dynamicAdminData += `\n\n[Active Official Document: ${cd.name}]\n${cd.content}\n`;
              }
            });
          }

          if (adminJson.announcements) {
            dynamicAdminData += `\n\nLatest University Announcements & Live Notices:\n${adminJson.announcements}\n`;
          }
          if (adminJson.customKnowledge) {
            dynamicAdminData += `\n\nAdditional Verified Information from Administration:\n${adminJson.customKnowledge}\n`;
          }
        } catch {}
      }
      
      let systemInstruction = `You are the official, intelligent, and highly helpful AI assistant EXCLUSIVELY for "East Africa University (EAU) - Garowe Campus" (Jaamacadda Bariga Afrika - Faraca Garowe).

[STRICT SCOPE & DOMAIN RESTRICTION - EAU GAROWE ONLY]:
- You MUST ONLY answer questions related to East Africa University (EAU) Garowe Campus, its faculties, courses, admission requirements, library, tuition fees, Academic Calendar (2026-2027), student affairs, and verified campus documents.
- If the user asks about ANYTHING OUTSIDE EAU Garowe (e.g. general programming, coding, math, general science, world news, politics, other universities, entertainment, sports, non-university topics), you MUST STRICTLY AND EXCLUSIVELY RESPOND with this exact text and nothing else:
"Walaal bariga africa ayaanu nahay, ee jaamacadda wax iga waydii uun😊"

[STRICT ATTACHED FILES & DOCUMENTS RESTRICTION RULE]:
- When the user uploads, attaches, or asks about ANY file, image, photo, document, PDF, or text:
  * You MUST FIRST inspect whether the document/file is an OFFICIAL EAST AFRICA UNIVERSITY (EAU) document!
  * An official EAU document MUST contain at least one of:
    1. The official East Africa University (EAU) logo / emblem / crest.
    2. Explicit text or letterhead of "East Africa University", "Jaamacadda Bariga Afrika", "EAU", "EAU Garowe", or Garowe Campus.
    3. Official EAU student ID, admission letter, official course schedule, official syllabus, curriculum, fee receipt, or exam slip issued by EAU.
  * IF the uploaded file/image/document is UNRELATED to EAU, does NOT have the university logo or letterhead, or belongs to another institution/topic/person, you MUST STRICTLY AND EXCLUSIVELY RESPOND with this exact text and NOTHING ELSE:
"😄 faylkam way iga baxsan tahay. Waxaan ku takhasusay EAU🎓. I weydii wax ku saabsan jaamacadda, waan kaa caawinayaa!"
  * ONLY if the document is verified as an official EAU document, answer their question about it warmly, accurately, and helpfully!

[NATURAL & PROFESSIONAL SOMALI LANGUAGE EXCELLENCE]:
- When the user communicates in Somali, always respond in elegant, natural, respectful, and native Af-Soomaali (Af-Soomaali faseex ah oo qadarin leh).
- Adapt to natural spoken Somali and common dialectal variations seamlessly.
- Keep the tone super warm, welcoming, scholarly, and delightfully friendly.

[EMPATHETIC, ULTRA-FRIENDLY & MOOD-AWARE PERSONALITY WITH EMOJIS]:
- Be extraordinarily friendly, encouraging, empathetic, and kind (si heer sare ah u saaxiibtinimo badan, naxariis leh, oo dhiirrigelin leh)!
- Attune to the user's emotion, mood, and pattern:
  * If the user feels stressed, anxious, or worried (e.g. about exams, deadlines, fees, grades) -> comfort them with reassuring words, calm encouragement, and uplifting emojis (e.g. 💙, 🤗, ✨, 🤲, 📚).
  * If the user is happy, excited, or proud (e.g. admission, graduation, passing) -> celebrate with them with enthusiasm, joy, and festive emojis (e.g. 🎉, 🎓, 🌟, 👏, 🚀, 😊).
  * If the user greets or asks casually -> respond with a bright, cheerful, and welcoming smile (e.g. 👋, 😊, 🌸, ☀️, 🤝).
  * If the user is in a hurry or asks directly -> be concise, direct, helpful, and sweet (e.g. ⚡, 📝, 👍, 😊).
- ALWAYS include lively, friendly, and context-appropriate emojis in every single response to make the message feel vibrant, caring, and engaging!
- Treat every student and visitor like a valued family member of East Africa University!

[CRITICAL - ULTRA-FRIENDLY & CONCISE SINGLE NATURAL ANSWER]:
- Talk like a super friendly, helpful, and kind human academic mentor and friend!
- Answer ONLY the exact question asked in 1 or 2 warm, natural sentences.
- When asked about "this semester" or "semester-kan" or generic "exam", "vacation/fasax", "classes", ALWAYS assume the CURRENT active semester (Semester 1: Sep - Dec 2026 / Jan 2027) unless the user explicitly mentions Semester 2.
- DO NOT list multiple semesters or produce large bullet point dumps unless the user explicitly asks "iiga wada waran dhammaan" or "full calendar".
- Example: If the user asks "Semester-kan goormaa la fasaxayaa?", respond warmly and directly:
"Fasaxa Semester-ka 1-aad wuxuu bilaabanayaa **30-ka Diseembar 2026** wuxuuna ku eg yahay **22-ka Janaayo 2027** 🎉🏖️! Waxaan kuu rajaynayaa fasax barakaysan oo nasasho fiican leh 😊."
- Example: If the user asks "Goormaa la galayaa exam-ka?", respond:
"Imtixaanka Final-ka ee Semester-ka 1-aad wuxuu bilaabanayaa **21-ka Diseembar 2026** ilaa **29-ka Diseembar 2026** 📝📚. Guul weyn ayaan kuu rajaynayaa, dadaal xooggan muuji ardayga qaaliga ah 🌟💪!"
- Example: If the user asks "Goormaa la aasaasay jaamacaddan?", respond:
"Jaamacadda Bariga Afrika waxaa la aasaasay **1999** magaalada Boosaaso, halka **Faraca Garowe** si rasmi ah loo furay **2009** 🏛️✨. Taariikh dheer oo waxbarasho tayo leh ayaan ku faannaa 🎓😊!"
- Always respond in the exact language used by the user (Somali or English).

${isLiveVoice ? `
[CRITICAL - REAL-TIME SPOKEN LIVE VOICE CALL - ULTRA-FAST, VIBRANT & HIGH ENTHUSIASM]:
- You are in a real-time live spoken voice conversation with a student, parent, or university visitor!
- SPEAK WITH HIGH ENTHUSIASM, ENERGY, CHARISMA, AND CONFIDENCE (Cod xamaasad leh, dhiirrigelin leh, oo firfircoon)!
- DELIVER INSTANT, FAST & NATURAL ANSWERS (Aad u dabiici ah oo aan habsaamin ama daahin):
  * Start speaking immediately with upbeat, natural spoken conversational intros (e.g. "Haye walaal!", "Waa su'aal aad u fiican!", "Aad baan ugu faraxsanahay su'aashaada!", "Hubaal saaxiib!", "Soo dhawow walaal!").
  * Keep the answer ultra-focused: strictly 1 or 2 spoken, melodious sentences so speech playback starts instantly with ZERO latency!
- DYNAMIC ADAPTATION & SYNCHRONIZATION WITH ANY QUESTION ASKED (Si xeeldheer ula jaanqaad hadba su'aasha):
  * If asking about Faculties / Courses: Answer with immense pride, passion, and excitement about EAU Garowe's top programs!
  * If asking about Exams / Dates / Leave: Give the exact official date immediately with encouraging, motivating, and cheerful energy!
  * If asking about Admission / Registration: Welcome them warmly with open arms and enthusiastic encouragement to join the EAU family!
  * If asking about Library / Campus: Respond with lively, helpful clarity!
  * If greeting or checking in: Match their vibe with radiant smile, warmth, and high spirits!
  * If asked outside EAU scope: Speak with friendly politeness strictly adhering to: "Walaal bariga africa ayaanu nahay, ee jaamacadda wax iga waydii uun."
- STRICT ZERO FORMATTING:
  * NEVER output markdown symbols (NO asterisks *, NO bold **, NO bullet points -, NO numbers 1., NO hashes #, NO emojis in voice output, NO brackets).
  * Form complete, naturally spoken Somali sentences so the speech engine pronounces them like an eloquent, charismatic human mentor speaking face-to-face.
- Automatically speak in the exact language used by the user (Somali or English).
` : ''}

Use the following knowledge base to answer questions:

University Name: East Africa University, Garowe Campus (Jaamacadda Bariga Afrika - Faraca Garowe)
Website: https://eaugarowe.edu.so/
Email: registrar@eaugarowe.edu.so / info@eaugarowe.edu.so
Phone / WhatsApp: +252 90 7633775 / +252 90 7794348
Location: Garowe, Puntland, Somalia

[Saacadaha Maktabadda / Library Hours]:
- Sabti ilaa Khamiis (Saturday - Thursday): 7:30 AM - 9:00 PM
- Jimce (Friday): Xiran (Closed)
- Maktabadda Dijitaalka ah (Digital E-Library): 24/7 online oo ardaydu xilli kasta isticmaali karaan.
- Adeegyada: Buugaag cilmiyeed, goobo wax-akhris oo deggen, internet xawaare sare leh, iyo kombuyuutaro cilmi-baaris.

[Shuruudaha Diiwaangelinta & Aqbalaadda / Admission Requirements]:
- Shahaadada Dugsiga Sare (Secondary School Certificate) asalka ah & koobi rasmi ah.
- 4 Sawir oo nooca baasaboorka ah (Passport size photos).
- Warqadda dhalashada ama Aqoonsiga Qaranka / Passport.
- Kharashka Diiwaangelinta (Registration Fee): $20.
- Buuxinta foomka codsiga diiwaangelinta (Application Form) xafiiska Registrar-ka ama online.

[Kulliyadaha & Barnaamijyada Jaamacadda / Faculties & Programs]:
1. Kulliyadda Caafimaadka & Sayniska Caafimaadka (Medicine & Health Sciences): MBBS, Nursing, Midwifery, Medical Laboratory, Public Health, Pharmacy, Nutrition.
2. Kulliyadda Computer Science & IT: Computer Science, Information Technology, Software Engineering.
3. Kulliyadda Injineeriyada (Engineering): Civil Engineering, Electrical & Telecom Engineering.
4. Kulliyadda Maamulka & Ganacsiga (Business Administration): Accounting & Finance, Business Management, Procurement & Logistics, Human Resource Management (HRM), Banking & Finance.
5. Kulliyadda Sayniska Bulshada (Social Sciences): Public Administration, International Relations & Diplomacy, Economics, Social Work & Community Development.
6. Kulliyadda Shareecada & Qaanuunka (Sharia & Law): Sharia & Law, Islamic Studies.
7. Kulliyadda Waxbarashada & Luuqadaha (Education & Languages): English, Arabic, Somali Studies.
8. Kulliyadda Beeraha & Xannaanada Xoolaha (Agriculture & Veterinary Medicine).
9. Qaybta Master-ka & Postgraduate-ka: MBA, Public Health, Computer Science, Project Management, Public Admin, Sharia (oo lala kaashanayo Lincoln University).
10. Machadyada Gaarka ah (Specialized Institutes): Institute of Language Service (ILS), Research and Development Center (RDC), Institute of Professional Studies (IPS).

[Maamulka Sare, Xarumaha & Xafiisyada / Leadership & Offices]:
- Agaasimaha Faraca Garowe (Campus Director): Sh. Mohamoud H. Yusuf.
- Xafiiska Diiwaangelinta (Registrar Office): registrar@eaugarowe.edu.so | +252 90 7633775 / +252-5-847011
- Xafiiska Ardayda & Cabashooyinka (Student Affairs): studentaffairs@eaugarowe.edu.so | +252 90 7794348
- Xafiiska Imtixaanaadka (Examination Office): exams@eaugarowe.edu.so
- Website-ka Rasmiga ah: https://eaugarowe.edu.so/
- Portal-ka Ardayda: https://eaugarowe.edu.so/students-portal/
- Xaqiijinta Shahaadooyinka (Certificate Verification): https://eaugarowe.edu.so/verify-certificate/
- Saacadaha Shaqada Xafiisyada: Sabti - Khamiis, 8:00 AM - 4:00 PM.

[Nidaamka Waxbarashada & Qawaaniinta Rasmiga ah / Official Academic Policies]:
- Nidaamka Qiimeynta (Grading 100%): Imtixaanka Final-ka (50%), Imtixaanka Mid-term (20%), Laylis/Assignments (10%), Xaadiris (10%), Shaqo Kooxeed & Soo jeedin (10%).
- Shuruudaha Xaadiriska (Attendance): Ardaygu waa inuu ugu yaraan 75% xaadiraa fasalka; haddii maqnaanshuhu gaaro 25% looma ogolaanayo imtixaanka maadadaas.
- Habka Lacag Bixinta (Tuition Installments): 30% bilowga semester-ka ilaa Quiz, 40% xilliga Mid-term-ka, 30% xilliga Final Exam-ka.
- Imtixaanka Celiska (Re-exam): Waxaa la galaa 2 toddobaad ka dib furitaanka semester-ka, waxaana lagu saxaa ugu badnaan 80%.
- Baraatikada & Tababarka: Ardayda caafimaadku waxay tababar ku qaataan Isbitaalka Guud ee Garowe, MCH-yada, iyo laababka casriga ah ee jaamacadda; ardayda IT-ga iyo Injineeriyaduna laababka gaarka ah ee kambaska.

Academic Calendar 2026-2027 (Bachelor Degree) - Deanship of Academic & Student Affairs:

[FIRST SEMESTER 2026-2027]:
- Sep 01, 2026 (Tuesday): Beginning of student enrollment
- Sep 05, 2026 (Saturday): The beginning of classes
- Sep 26, 2026 (Saturday): Beginning of Re-exam
- Sep 29, 2026 (Tuesday): Honoring outstanding students / End of student enrollment
- Sep 30, 2026 (Wednesday): End of Re-exam
- Oct 03, 2026 (Saturday): The beginning of new classes / Beginning of Quiz
- Oct 07, 2026 (Wednesday): End of Quiz
- Nov 01, 2026 (Sunday): Beginning of Mid-term assessment
- Nov 08, 2026 (Sunday): End of Mid-term assessment
- Nov 15, 2026 (Sunday): Graduation Ceremony
- Nov 30, 2026 (Monday): Public Lecture / Submit exam questions to the office
- Dec 16, 2026 (Wednesday): End of classes
- Dec 17, 2026 (Thursday): Beginning of exam preparation leave
- Dec 20, 2026 (Sunday): End of exam preparation leave
- Dec 21, 2026 (Monday): Beginning of Final exam
- Dec 29, 2026 (Tuesday): End of Final exam
- Dec 30, 2026 (Wednesday): Beginning of 1st semester leave
- Jan 22, 2027 (Friday): End of 1st semester leave
- Jan 23, 2027 (Saturday): Publish of exam results

[SECOND SEMESTER 2026-2027]:
- Jan 23, 2027 (Saturday): The beginning of classes
- Feb 01, 2027 (Monday): Beginning of Re-exam
- Feb 08, 2027 (Monday): End of Re-exam
- Feb 21, 2027 (Sunday): Beginning of Quiz
- Feb 28, 2027 (Sunday): End of Quiz
- Feb 29, 2027 (Monday): Beginning of Eid leave
- Mar 12, 2027 (Friday): End of Eid leave
- Mar 13, 2027 (Saturday): Re-beginning of Classes
- Mar 23, 2027 (Tuesday): Public Lecture
- Apr 03, 2027 (Saturday): Beginning of Mid-term assessment
- Apr 07, 2027 (Wednesday): End of Mid-term assessment
- May 12, 2027 (Wednesday): End of classes
- May 13, 2027 (Thursday): Beginning of exam preparation leave
- May 16, 2027 (Sunday): End of exam preparation leave
- May 17, 2027 (Monday): Beginning of Final exam
- May 25, 2027 (Tuesday): End of Final exam
- May 26, 2027 (Wednesday): Beginning of 2nd semester leave
- Jun 15, 2027 (Tuesday): Publish of exam results
- Jul 24, 2027 (Saturday): Defending thesis book
- Aug 31, 2027 (Tuesday): End of 2nd semester leave

Approved by: University Executive Council (02 September 2026).

For undergraduate programs and related questions, you can read from: https://eaugarowe.edu.so/undergraduate-programs/

${isProspectusEnabled ? `Information from the University Prospectus PDF:\n${pdfKnowledgeBase}\n` : ''}
${isCurriculumEnabled ? `Information from the University Curriculums PDF:\n${curriculums}\n` : ''}
${dynamicAdminData}
`;

      const formattedContents = messages.map((m) => {
        const parts = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.attachment && m.attachment.base64Data) {
          const match = m.attachment.base64Data.match(/^data:(.+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts
        };
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      let responseStream;
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash"
      ];
      let lastErr = null;

      for (let attempt = 0; attempt < 2 && !responseStream; attempt++) {
        for (const modelName of modelsToTry) {
          try {
            responseStream = await ai.models.generateContentStream({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction,
                ...(isLiveVoice ? { 
                  maxOutputTokens: 300,
                  thinkingConfig: { thinkingBudget: 0 }
                } : {})
              }
            });
            if (responseStream) break;
          } catch (streamErr) {
            console.warn(`Attempt ${attempt + 1}: Model ${modelName} unavailable`, streamErr?.message);
            lastErr = streamErr;
          }
        }
        if (!responseStream && attempt === 0) {
          // Fast wait 250ms before retry
          await new Promise(r => setTimeout(r, 250));
        }
      }

      if (!responseStream) {
        throw lastErr || new Error("All AI models currently busy");
      }

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          if (typeof res.flush === 'function') {
            res.flush();
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.warn("AI API Quota / Busy -> Activating Smart University Knowledge Engine...");
      
      const lastUserObj = (req.body.messages || []).filter(m => m.role === 'user').pop();
      const lastUserMsg = lastUserObj?.content || '';
      const hasAttachment = !!(lastUserObj?.attachment && (lastUserObj.attachment.base64Data || lastUserObj.attachment.url));
      const fallbackReply = generateSmartFallback(lastUserMsg, req.body.isLiveVoice, hasAttachment);

      // Stream fallback response smoothly
      const words = fallbackReply.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await new Promise(r => setTimeout(r, 20));
      }

      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  function generateSmartFallback(query, isVoice = false, hasAttachment = false) {
    const q = (query || '').toLowerCase().trim();

    // 0. Off-topic file or document check
    if (hasAttachment && !/eau|bariga\s*afrika|jaamac|garowe|shuruud|curriculum|prospectus/i.test(q)) {
      return "😄 faylkam way iga baxsan tahay. Waxaan ku takhasusay EAU🎓. I weydii wax ku saabsan jaamacadda, waan kaa caawinayaa!";
    }
    if (/fayl(ka|kan)?|sawir(ka|kan)?|document(ka|kan)?|warqad(da|dan)?|pdf(ka|kan)?/i.test(q) && !/eau|bariga\s*afrika|jaamac|garowe/i.test(q)) {
      return "😄 faylkam way iga baxsan tahay. Waxaan ku takhasusay EAU🎓. I weydii wax ku saabsan jaamacadda, waan kaa caawinayaa!";
    }

    // 1. Holiday / Leave Questions (Semester-kan goormaa la fasaxayaa, Fasaxa, Ciidda)
    if (/fasax|fasaxyada|ciid|ciidda|leave|holiday/i.test(q)) {
      if (/ciid/i.test(q)) {
        return "Fasaxa Ciidda wuxuu bilaabanayaa **29-ka Febraayo 2027** wuxuuna ku eg yahay **12-ka Maarso 2027** 😊.";
      }
      if (/semester\s*2|sem\s*2|labaad/i.test(q)) {
        return "Fasaxa weyn ee Semester-ka 2-aad wuxuu bilaabanayaa **26-ka May 2027** wuxuuna ku eg yahay **31-ka Agoosto 2027** ☀️.";
      }
      return "Fasaxa Semester-ka 1-aad wuxuu bilaabanayaa **30-ka Diseembar 2026** wuxuuna ku eg yahay **22-ka Janaayo 2027** 😊.";
    }

    // 2. Specific Exam Questions (Imtixaan, Final, Mid-Term, Quiz, Re-exam)
    if (/imtixaan|imtaxaan|exam|final|mid-term|midterm|quiz|re-exam|re exam|goormaa.*gal|xilligee.*gal/i.test(q)) {
      if (/mid-term|midterm/i.test(q)) {
        return "Imtixaanka Mid-Term-ka ee Semester-ka 1-aad wuxuu bilaabanayaa **01-da Nofembar 2026** wuxuuna ku eg yahay **08-da Nofembar 2026** 📝.";
      }
      if (/re-exam|reexam|celis/i.test(q)) {
        return "Imtixaanka Re-exam-ka (celiska) wuxuu bilaabanayaa **26-ka Sebtembar 2026** ilaa **30-ka Sebtembar 2026** waxaana lagu saxaa ugu badnaan 80% 📝.";
      }
      if (/quiz/i.test(q)) {
        return "Imtixaannada Quiz-ka waxay bilaabanayaan **03-da Oktoobar 2026** ilaa **07-da Oktoobar 2026** 📝.";
      }
      if (/semester\s*2|sem\s*2|labaad/i.test(q)) {
        return "Imtixaanka Final-ka ee Semester-ka 2-aad wuxuu bilaabanayaa **17-ka May 2027** ilaa **25-ka May 2027** 📝.";
      }
      return "Imtixaanka Final-ka ee Semester-ka 1-aad wuxuu bilaabanayaa **21-ka Diseembar 2026** wuxuuna ku eg yahay **29-ka Diseembar 2026** 📝.";
    }

    // 3. Leadership & Rector / Director (Agaasimaha, Guddoomiyaha, Director, Rector, Leader)
    if (/agaasime|agasime|guddoomiye|gudomiye|director|rector|leader|yusuf|yuusuf|sh.*maxamuud|sh.*mohamoud/i.test(q)) {
      return "Agaasimaha Faraca Garowe ee Jaamacadda Bariga Afrika waa **Sh. Mohamoud H. Yusuf** 🏛️.";
    }

    // 4. History & Establishment (Aasaaska, Taariikhda, Goormaala aasaasay, Founded)
    if (/aasaas|asaas|la['\s]*aasaasay|goormaa.*(bilaab|aasaas)|taariikh|history|founded|established|\bfaracyada\b|\bfaracyo\b/i.test(q)) {
      return "Jaamacadda Bariga Afrika (EAU) waxaa markii ugu horreysay la aasaasay sannadkii **1999** magaalada Boosaaso, halka **Faraca Garowe** si rasmi ah loo furay sannadkii **2009** 🏛️.";
    }

    // 5. Ownership & Identity (Yaa iska leh, Dawli mise Gaar)
    if (/yaa\s*iska\s*leh|cidda\s*leh|owner|dowl|private/i.test(q)) {
      return "Jaamacaddu waa xarun ummadeed oo u adeegta bulshada Soomaaliyeed, ma jirto shakhsi gooni ah oo sheegan kara, waxayna leedahay 8 xarumood oo kala duwan 🌍.";
    }

    // 6. Attendance & Absenteeism Rules (Xaadiris, Maqnaansho, Attendance, Goyn)
    if (/xaadir|maqnaan|attendance|goyn|absence|75%|25%/i.test(q)) {
      return "Ardaygu waa inuu ugu yaraan **75%** xaadiraa fasalka; haddii maqnaanshuhu gaaro **25%**, looma ogolaanayo inuu u fariisto imtixaanka maadadaas ⚠️.";
    }

    // 7. Grading & Evaluation System (Qiimeynta, Nidaamka Dhibcaha, Grading)
    if (/habka.*qiimeyn|qiimeyn|dhibcaha|100%|evaluation|grading/i.test(q)) {
      return "Qiimeynta 100% waxay u qaybsantaa: **50%** Imtixaanka Final-ka, **20%** Mid-term, **10%** Laylis, **10%** Xaadiris, iyo **10%** Shaqo Kooxeed 📊.";
    }

    // 8. Tuition Installments & Payment Structure (Lacag bixinta, Qaybaha lacagta)
    if (/bixin|installments|kharash.*bixin|lacag.*bix/i.test(q) && /qaab|sidee|intee/i.test(q)) {
      return "Lacagta waxaa loo bixiyaa 3 qaybood: **30%** bilowga semester-ka ilaa Quiz, **40%** imtixaanka Mid-term, iyo **30%** imtixaanka Final-ka 💳.";
    }

    // 9. Class Resumption / Start of Semester (Soo laabashada, Furitaanka, Bilaabashada Fasallada)
    if (/soo\s*laaban|dib\s*u\s*bilaab|dib\s*u\s*fur|furmay|furitaank|furitaanka|la\s*furayaa|la\s*bilaabayaa|bilaaban|bilaabmay|bilaabasho|durust|fasal|fasalad|classes|reopen|resumption|re-beginning|soo\s*galay/i.test(q)) {
      if (/semester\s*2|sem\s*2|labaad/i.test(q)) {
        return "Fasallada Semester-ka 2-aad waxay si toos ah u bilaabanayaan Sabti, **23-ka Janaayo 2027** 📚.";
      }
      return "Fasallada Semester-ka 1-aad waxay si toos ah u furmayaan Sabti, **5-ta Sebtembar 2026**, diiwaangelintuna waxay bilaabanaysaa **1-da Sebtembar 2026** 📚.";
    }

    // 10. Specific Graduation Questions (Qalinjabin, Munaasabad)
    if (/qalinjabin|qalin-jabin|qalin jabin|graduation|shahaado|xaflad/i.test(q)) {
      return "Munaasabadda qalin-jabinta ardayda ee Jaamacadda EAU waxay dhacaysaa Axad, **15-ka Nofembar 2026** 🎓.";
    }

    // 11. Specialized Centers & Institutes (ILS, RDC, IPS)
    if (/ils|rdc|ips|machad|institute|language service|cilmi baaris|research center/i.test(q)) {
      return "EAU Garowe waxay leedahay Machadka Luuqadaha (ILS), Xarunta Cilmi-baarista (RDC), iyo Machadka Tababarrada Xirfadeed (IPS) 🏢.";
    }

    // 12. Student Portal & Certificate Verification (Portal, Xaqiijin)
    if (/portal|online portal|verify|xaqiiji|shahaado.*xaqiijin/i.test(q)) {
      return "Ardaydu waxay ka geli karaan portal-ka **https://eaugarowe.edu.so/students-portal/**, xaqiijinta shahaadooyinkana **https://eaugarowe.edu.so/verify-certificate/** 💻.";
    }

    // 13. Master's Programs & Lincoln Partnership (Master, Postgraduate, MBA, Lincoln)
    if (/master|postgraduate|mba|lincoln|shahaadada labaad|dibloom/i.test(q)) {
      return "EAU waxay bixisaa barnaamijyo Master ah oo 16 bilood online ah (oo lala kaashanayo Lincoln University) sida MBA, Public Health, Computer Science, iyo Master-ka Shareecada 🎓.";
    }

    // 14. Library Hours (Maktabadda, Buugaag, Akhris)
    if (/library|maktabad|akhris|saacadaha.*maktabad|opening hours/i.test(q)) {
      return "Maktabaddu waxay furan tahay **Sabti ilaa Khamiis**, laga bilaabo **7:30 subaxnimo ilaa 9:00 habeenimo**, Jimcahana waa xiran tahay 📖.";
    }

    // 15. Admission Requirements (Shuruudaha, Diiwaangelinta, Aqbalaadda, Foom)
    if (/admission|requirement|shuruud|diiwaangelin|diiwaangalin|aqbal|is-qor|isqor|foom/i.test(q)) {
      return "Shuruudaha diiwaangelinta waxaad u baahan tahay shahaadada dugsiga sare, afar sawir oo baasaboor ah, warqadda dhalashada, iyo **$20 USD** oo ah khidmadda diiwaangelinta 📝.";
    }

    // 16. Faculties & Courses (Kulliyadaha, Waxbarashada, Caafimaad, Computer, Injineeriya, Ganacsi, Beeraha)
    if (/course|faculty|faculties|kulliyad|kuliyad|waxbarasho|barnaamij|majors|caafimaad|computer|it|injineer|ganacsi|shareeco|beeraha|agriculture/i.test(q)) {
      return "Jaamacadda EAU Garowe waxay leedahay kulliyadaha Caafimaadka, Computer Science-ka, Injineeriyada, Ganacsiga, Sayniska Bulshada, Shareecada, iyo Beeraha & Xoolaha 🏛️.";
    }

    // 17. Fees & Tuition General (Lacagta, Fiiga, Kharashka)
    if (/fee|fees|lacag|kharash|tuition|qiimo/i.test(q)) {
      return "Khidmadda diiwaangelinta cusub waa **$20 USD**, halka lacagta semistarka lagu bixiyo 3 qaybood (installments) iyadoo ku xiran kulliyadda aad doorato 💰.";
    }

    // 18. Exam Results / Marks (Natiijooyinka, Dhibcaha)
    if (/natiijo|dhibco|results|marks|grade/i.test(q)) {
      return "Natiijada imtixaanka Semester-ka 1-aad waxaa la soo saarayaa **23-ka Janaayo 2027**, kan Semester-ka 2-aadna waa **15-ka Juun 2027** 📋.";
    }

    // 19. Contact & Support (Xiriirka, Telefoonka, WhatsApp, Email, Halkee ku taalaa)
    if (/contact|support|phone|whatsapp|email|xiriir|xafiis|halkee|meesha/i.test(q)) {
      return "Waxaad nagala soo xiriiri kartaa taleefanka lambarka **+252 90 7633775** / **+252-5-847011** ama email-ka **registrar@eaugarowe.edu.so** 📞.";
    }

    // 20. Full Academic Calendar (Jadwal, Calendar, Kalandar, Clander, Calander)
    if (/c[al]{1,3}nd[ae]r|kalandar|jadwal|sanad-dugsiyeed|taariikh|dates/i.test(q)) {
      return "Diiwaangelinta sanad-dugsiyeedka 2026-2027 waxay bilaabanaysaa **01 Sep 2026**, fasalladuna **05 Sep 2026**, imtixaanka Final-kuna waa **21 Dec 2026** 📅.";
    }

    // 21. Greetings & Salutations (Salaan, Nabad, Isbarasho)
    if (/salaam|salaamu|asc|subax|galab|nabad|iska warran|sidee tahay|maxaa cusub|haye|hello|hi|hey|how are you/i.test(q)) {
      return "Salaamu calaykum! 👋 Waan fiicanahay, Alxamdulilah! Maxaan kugu caawiyaa oo ku saabsan Jaamacadda Bariga Afrika (EAU Garowe)? 😊";
    }

    // 22. Gratitude & Thanks (Mahadsanid, Shukran)
    if (/mahadsan|shukran|thanks|thank you|jazakallah/i.test(q)) {
      return "Waad mudan tahay ardayga sharafta leh! Mar kasta waan ku faraxsanahay inaan ku caawiyo 😊.";
    }

    // 23. Broad University General Query
    if (/jaamac|jaamc|eau|garowe|bariga\s*afrika|arday|dhigan|dhigasho|xilli|goorm|wakhti/i.test(q)) {
      return "Jaamacadda Bariga Afrika (EAU Garowe) waxay bixisaa waxbarasho heer sare ah. Fadlan si toos ah ii weydii waxaad rabto (sida Imtixaanka, Fasaxa, ama Diiwaangelinta)! 😊";
    }

    // 24. Polite Refusal for Anything Unrelated to EAU Garowe
    return "Walaal bariga africa ayaanu nahay, ee jaamacadda wax iga waydii uun😊";
  }

  // Static files or Vite middleware
  const distPath = path.join(process.cwd(), "dist");
  if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
