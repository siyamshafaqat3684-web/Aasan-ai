document.addEventListener('DOMContentLoaded', function () {

  // ---------- Screen Switching ----------

  function showScreen(id) {

    const screens = document.querySelectorAll('.screen');

    screens.forEach(function (screen) {
      screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(id);

    if (targetScreen) {
      targetScreen.classList.add('active');
    }

  }


  // ---------- Buttons ----------

  const getStartedBtn = document.getElementById('getStartedBtn');
  const menuBtn = document.getElementById('menuBtn');
  const settingsBackBtn = document.getElementById('settingsBackBtn');
  const historyBtn = document.getElementById('historyBtn');
  const historyBackBtn = document.getElementById('historyBackBtn');


  if (getStartedBtn) {

    getStartedBtn.addEventListener('click', function () {
      showScreen('screen-chat');
    });

    getStartedBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      showScreen('screen-chat');
    });

  }


  if (menuBtn) {

    menuBtn.addEventListener('click', function () {
      showScreen('screen-settings');
    });

  }


  if (settingsBackBtn) {

    settingsBackBtn.addEventListener('click', function () {
      showScreen('screen-chat');
    });

  }


  if (historyBtn) {

    historyBtn.addEventListener('click', function () {
      renderHistory();
      showScreen('screen-history');
    });

  }


  if (historyBackBtn) {

    historyBackBtn.addEventListener('click', function () {
      showScreen('screen-chat');
    });

  }


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
  const clearAttach = document.getElementById('clearAttach');

  let attachedBlob = null;


  // ---------- Local History ----------

  function loadHistory() {

    try {
      return JSON.parse(
        localStorage.getItem('aasan_history') || '[]'
      );
    } catch (e) {
      return [];
    }

  }


  function saveHistoryEntry(text, who) {

    const history = loadHistory();

    history.push({
      text: text,
      who: who,
      time: new Date().toLocaleString()
    });

    localStorage.setItem(
      'aasan_history',
      JSON.stringify(history)
    );

  }


  function renderHistory() {

    const list = document.getElementById('historyList');

    if (!list) return;

    const history = loadHistory();

    list.innerHTML = '';

    if (history.length === 0) {

      list.innerHTML =
        '<p style="color:#aab4cf;text-align:center;margin-top:30px;">Koi history nahi hai abhi.</p>';

      return;

    }


    history.slice().reverse().forEach(function (item) {

      const div = document.createElement('div');

      div.className = 'history-item';

      div.innerHTML =
        '<div class="date">' +
        item.time +
        ' — ' +
        (item.who === 'user'
          ? 'Aapne bola'
          : 'Aasan AI') +
        '</div><div>' +
        item.text +
        '</div>';

      list.appendChild(div);

    });

  }


  const clearHistoryBtn =
    document.getElementById('clearHistoryBtn');


  if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener('click', function () {

      localStorage.removeItem('aasan_history');

      renderHistory();

    });

  }


  // ---------- Add Message ----------

  function addMsg(html, who) {

    if (!chatArea) return null;

    const message = document.createElement('div');

    message.className = 'msg ' + who;

    message.innerHTML = html;

    chatArea.appendChild(message);

    chatArea.scrollTop = chatArea.scrollHeight;

    return message;

  }


  // ---------- Text To Speech ----------

  function speak(text) {

    const voiceToggle =
      document.getElementById('voiceToggle');

    if (
      voiceToggle &&
      !voiceToggle.checked
    ) {
      return;
    }


    if (
      !('speechSynthesis' in window) ||
      !text
    ) {
      return;
    }


    window.speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(text);


    utterance.lang = 'ur-PK';

    utterance.rate = 0.92;


    window.speechSynthesis.speak(utterance);

  }


  // ---------- Attachment Menu ----------

  if (plusBtn) {

    plusBtn.addEventListener('click', function (e) {

      e.stopPropagation();

      if (attachPop) {
        attachPop.classList.toggle('show');
      }

    });

  }


  document.addEventListener('click', function (e) {

    if (
      !e.target.closest('.attach-menu') &&
      attachPop
    ) {
      attachPop.classList.remove('show');
    }

  });


  const cameraOpt =
    document.getElementById('cameraOpt');


  if (cameraOpt) {

    cameraOpt.addEventListener('click', function () {

      if (attachPop) {
        attachPop.classList.remove('show');
      }

      if (cameraInput) {
        cameraInput.click();
      }

    });

  }


  const galleryOpt =
    document.getElementById('galleryOpt');


  if (galleryOpt) {

    galleryOpt.addEventListener('click', function () {

      if (attachPop) {
        attachPop.classList.remove('show');
      }

      if (galleryInput) {
        galleryInput.click();
      }

    });

  }


  // ---------- Image Handling ----------

  function handleFile(e) {

    const file = e.target.files[0];

    if (!file) return;


    attachedBlob = file;


    if (previewImg) {
      previewImg.src =
        URL.createObjectURL(file);
    }


    if (previewBar) {
      previewBar.classList.add('show');
    }

  }


  if (cameraInput) {
    cameraInput.addEventListener(
      'change',
      handleFile
    );
  }


  if (galleryInput) {
    galleryInput.addEventListener(
      'change',
      handleFile
    );
  }


  if (clearAttach) {

    clearAttach.addEventListener('click', function () {

      attachedBlob = null;

      if (previewBar) {
        previewBar.classList.remove('show');
      }

      if (cameraInput) {
        cameraInput.value = '';
      }

      if (galleryInput) {
        galleryInput.value = '';
      }

    });

  }


  // ---------- AI Placeholder ----------

  async function askAI(promptText, imageBlob) {

    return new Promise(function (resolve) {

      setTimeout(function () {

        resolve(
          'AI abhi connect nahi hua hai — ye hissa jald add hoga. Baaki app abhi test kar sakte hain.'
        );

      }, 800);

    });

  }


  // ---------- Send Message ----------

  async function sendMessage() {

    if (!textInput) return;


    const text =
      textInput.value.trim();


    if (!text && !attachedBlob) {
      return;
    }


    let userHtml = '';


    if (attachedBlob && previewImg) {

      userHtml +=
        '<img src="' +
        previewImg.src +
        '">';

    }


    if (text) {

      userHtml += text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    }


    addMsg(userHtml, 'user');


    saveHistoryEntry(
      text || '[Photo bheja]',
      'user'
    );


    const sentBlob = attachedBlob;


    textInput.value = '';


    if (clearAttach) {
      clearAttach.click();
    }


    const typing = addMsg(
      '<span style="color:#aab4cf;font-style:italic;">Aasan AI soch raha hai…</span>',
      'bot'
    );


    const reply =
      await askAI(text, sentBlob);


    if (typing) {

      typing.innerHTML =
        reply.replace(/\n/g, '<br>');

    }


    saveHistoryEntry(reply, 'bot');


    speak(reply);


    if (chatArea) {
      chatArea.scrollTop =
        chatArea.scrollHeight;
    }

  }


  if (sendBtn) {

    sendBtn.addEventListener(
      'click',
      sendMessage
    );

  }


  if (textInput) {

    textInput.addEventListener(
      'keydown',
      function (e) {

        if (e.key === 'Enter') {

          e.preventDefault();

          sendMessage();

        }

      }
    );

  }


  // ---------- Mic ----------

  const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  let recognizing = false;

  let recognition = null;


  if (micBtn) {

    micBtn.innerHTML = '🎤';


    micBtn.addEventListener(
      'click',
      function () {

        if (!SR) {

          addMsg(
            'Is device mein voice input support nahi hai.',
            'bot'
          );

          return;

        }


        if (recognizing && recognition) {

          recognizing = false;

          recognition.stop();

          micBtn.classList.remove('active');

          return;

        }


        try {

          recognition = new SR();

          recognition.lang = 'ur-PK';

          recognition.continuous = false;

          recognition.interimResults = true;


          recognition.onresult =
            function (event) {

              let transcript = '';


              for (
                let i = 0;
                i < event.results.length;
                i++
              ) {

                transcript +=
                  event.results[i][0].transcript;

              }


              if (textInput) {
                textInput.value = transcript;
              }

            };


          recognition.onend =
            function () {

              recognizing = false;

              micBtn.classList.remove('active');

            };


          recognition.onerror =
            function () {

              recognizing = false;

              micBtn.classList.remove('active');

            };


          recognizing = true;

          micBtn.classList.add('active');

          recognition.start();


        } catch (error) {

          recognizing = false;

          micBtn.classList.remove('active');

        }

      }
    );

  }


});
