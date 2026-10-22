// ---------- Screen switching ----------
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('getStartedBtn').onclick = () => showScreen('screen-chat');
document.getElementById('menuBtn').onclick = () => showScreen('screen-settings');
document.getElementById('settingsBackBtn').onclick = () => showScreen('screen-chat');
document.getElementById('historyBtn').onclick = () => { renderHistory(); showScreen('screen-history'); };
document.getElementById('historyBackBtn').onclick = () => showScreen('screen-chat');

// ---------- Elements ----------
const chatArea = document.getElementById('chatArea');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const plusBtn = document.getElementById('plusBtn');
const attachPop = document.getElementById('attachPop');
const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const previewBar = document.getElementById('previewBar');
const previewImg = document.getElementById('previewImg');
const micBtn = document.getElementById('micBtn');
let attachedBlob = null;

// ---------- Local history (offline, saved on device) ----------
function loadHistory(){
  try{ return JSON.parse(localStorage.getItem('aasan_history') || '[]'); }
  catch(e){ return []; }
}
function saveHistoryEntry(text, who){
  const h = loadHistory();
  h.push({ text, who, time: new Date().toLocaleString() });
  localStorage.setItem('aasan_history', JSON.stringify(h));
}
function renderHistory(){
  const list = document.getElementById('historyList');
  const h = loadHistory();
  list.innerHTML = '';
  if(h.length === 0){
    list.innerHTML = '<p style="color:var(--muted);text-align:center;margin-top:30px;">Koi history nahi hai abhi.</p>';
    return;
  }
  h.slice().reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = '<div class="date">' + item.time + ' — ' + (item.who === 'user' ? 'Aapne bola' : 'Aasan AI') + '</div><div>' + item.text + '</div>';
    list.appendChild(div);
  });
}
document.getElementById('clearHistoryBtn').onclick = () => {
  localStorage.removeItem('aasan_history');
  renderHistory();
};

// ---------- Chat bubble helper ----------
function addMsg(html, who){
  const d = document.createElement('div');
  d.className = 'msg ' + who;
  d.innerHTML = html;
  chatArea.appendChild(d);
  chatArea.scrollTop = chatArea.scrollHeight;
  return d;
}

// ---------- Text-to-speech ----------
function speak(text){
  if(!document.getElementById('voiceToggle').checked) return;
  if(!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = navigator.language || 'ur-PK';
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

// ---------- Attach menu (camera / gallery) ----------
plusBtn.onclick = (e) => { e.stopPropagation(); attachPop.classList.toggle('show'); };
document.addEventListener('click', (e) => {
  if(!e.target.closest('.attach-menu')) attachPop.classList.remove('show');
});
document.getElementById('cameraOpt').onclick = () => { attachPop.classList.remove('show'); cameraInput.click(); };
document.getElementById('galleryOpt').onclick = () => { attachPop.classList.remove('show'); galleryInput.click(); };

function handleFile(e){
  const f = e.target.files[0];
  if(!f) return;
  attachedBlob = f;
  previewImg.src = URL.createObjectURL(f);
  previewBar.classList.add('show');
}
cameraInput.onchange = handleFile;
galleryInput.onchange = handleFile;
document.getElementById('clearAttach').onclick = () => {
  attachedBlob = null;
  previewBar.classList.remove('show');
  cameraInput.value = '';
  galleryInput.value = '';
};

// ---------- AI call (PLACEHOLDER — backend ke bagair kaam nahi karega) ----------
async function askAI(promptText, imageBlob){
  // TODO: Yahan apne secure backend ka URL lagana hoga jo AI ko call karta ho.
  // Abhi ye sirf ek placeholder jawab deta hai taake baaki app test ho sake.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("AI abhi connect nahi hua hai — ye hissa jald add hoga. Baaki app (camera, gallery, mic, history, settings) abhi test kar sakte hain.");
    }, 800);
  });
}

// ---------- Send message ----------
sendBtn.onclick = sendMessage;
textInput.addEventListener('keydown', e => { if(e.key === 'Enter') sendMessage(); });

async function sendMessage(){
  const text = textInput.value.trim();
  if(!text && !attachedBlob) return;

  let userHtml = '';
  if(attachedBlob) userHtml += '<img src="' + previewImg.src + '">';
  if(text) userHtml += text.replace(/</g, '&lt;');
  addMsg(userHtml, 'user');
  saveHistoryEntry(text || '[Photo bheja]', 'user');

  const sentBlob = attachedBlob;
  textInput.value = '';
  document.getElementById('clearAttach').click();

  const typing = addMsg('<span style="color:var(--muted);font-style:italic;">Aasan AI soch raha hai…</span>', 'bot');

  const reply = await askAI(text, sentBlob);
  typing.innerHTML = reply.replace(/\n/g, '<br>');
  saveHistoryEntry(reply, 'bot');
  speak(reply);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ---------- Voice input (mic) ----------
let recognizing = false, recognition = null, baseText = '';
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

micBtn.onclick = async () => {
  if(recognizing){
    recognizing = false;
    recognition.stop();
    micBtn.classList.remove('active');
    return;
  }
  if(!SR){
    addMsg('Is device/browser mein voice input support nahi hai.', 'bot');
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  }catch(err){
    addMsg('Mic ki ijaazat nahi mili. Phone ki Settings mein app ko microphone permission dein.', 'bot');
    return;
  }
  if(!recognition){
    recognition = new SR();
    recognition.lang = navigator.language || 'ur-PK';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let finalT = '', interimT = '';
      for(let i = 0; i < e.results.length; i++){
        if(e.results[i].isFinal) finalT += e.results[i][0].transcript;
        else interimT += e.results[i][0].transcript;
      }
      textInput.value = (baseText + ' ' + finalT + ' ' + interimT).trim();
    };
    recognition.onend = () => {
      if(recognizing){ try{ recognition.start(); return; }catch(e){} }
      micBtn.classList.remove('active');
    };
    recognition.onerror = () => {
      recognizing = false;
      micBtn.classList.remove('active');
    };
  }
  baseText = textInput.value ? textInput.value + ' ' : '';
  recognizing = true;
  micBtn.classList.add('active');
  try{ recognition.start(); }catch(err){ recognizing = false; }
};
