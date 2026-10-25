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
const inputBar = document.getElementById('inputBar');
let attachedBlob = null;

// ---------- Keep input bar pinned right above the keyboard ----------
function adjustForKeyboard(){
  if(!window.visualViewport) return;
  const vv = window.visualViewport;
  const keyboardOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  inputBar.style.transform = 'translateY(-' + keyboardOffset + 'px)';
  previewBar.style.transform = 'translateY(-' + keyboardOffset + 'px)';
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', adjustForKeyboard);
  window.visualViewport.addEventListener('scroll', adjustForKeyboard);
}

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

// ---------- Voice input (mic) — fresh session each time, no duplication ----------
let recognizing = false, recognition = null, baseText = '';
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const MIC_ICON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';

function setMicRecordingUI(on){
  if(on){
    micBtn.innerHTML = '<span class="mic-wave"><span></span><span></span><span></span><span></span><span></span></span>';
    micBtn.classList.add('active');
  } else {
    micBtn.innerHTML = MIC_ICON_SVG;
    micBtn.classList.remove('active');
  }
}
setMicRecordingUI(false);

function beep(freq, duration){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  }catch(e){}
}

// Har baar bilkul naya "session" banate hain — purana object reuse nahi karte,
// isse engine ka purana data repeat hone ka bug nahi aata.
function startMicSession(){
  recognition = new SR();
  recognition.lang = navigator.language || 'ur-PK';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let finalT = '', interimT = '';
    for(let i = 0; i < e.results.length; i++){
      if(e.results[i].isFinal) finalT += e.results[i][0].transcript;
      else interimT += e.results[i][0].transcript;
    }
    textInput.value = (baseText + ' ' + finalT + ' ' + interimT).trim();
    if(finalT) baseText = (baseText + ' ' + finalT).trim(); // isi waqt commit kar do, dobara na aaye
  };
  recognition.onend = () => {
    if(recognizing){
      try{ startMicSession(); }catch(e){ recognizing = false; setMicRecordingUI(false); }
    } else {
      setMicRecordingUI(false);
    }
  };
  recognition.onerror = (e) => {
    if(e.error === 'no-speech'){
      if(recognizing){ try{ startMicSession(); }catch(err){} }
      return;
    }
    recognizing = false;
    setMicRecordingUI(false);
  };
  recognition.start();
}

micBtn.onclick = async () => {
  if(recognizing){
    recognizing = false;
    if(recognition) recognition.stop();
    setMicRecordingUI(false);
    beep(440, 0.15);
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
  baseText = textInput.value ? textInput.value + ' ' : '';
  recognizing = true;
  setMicRecordingUI(true);
  beep(880, 0.15);
  try{ startMicSession(); }catch(err){ recognizing = false; setMicRecordingUI(false); }
};
