const CONFIG = {
  API_URL: "/api/chat",
  MAX_MESSAGES: 20
};

const STORAGE_KEY = "dhairya_gpt_chats";
const SETTINGS_KEY = "dhairya_gpt_settings";

let chats = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

let settings = JSON.parse(
  localStorage.getItem(SETTINGS_KEY) || "{}"
);

let currentChatId = null;
let isGenerating = false;
let abortController = null;
let pendingFiles = [];

/* GAME MODE: the panel has a Video tab and a Game tab. Only embed content you have the right to embed. */
const VIDEO_ID = "QPW3XwBoQlw"; // Subway Surfers gameplay (SYBO TV, vertical 9:16). Change to any embeddable YouTube video ID.
const VIDEO_URL =
  "https://www.youtube-nocookie.com/embed/" + VIDEO_ID +
  "?autoplay=1&mute=1&loop=1&playlist=" + VIDEO_ID +
  "&playsinline=1&rel=0&modestbranding=1";
const GAME_URL = "/runner.html"; // built-in Lane Runner
let gameMode = "video";

/* ADS: fill both in after Google AdSense approves your site (leave empty to keep ads off). */
const ADSENSE_CLIENT = ""; // e.g. "ca-pub-1234567890123456"
const ADSENSE_SLOT = "";   // your ad unit's slot ID, e.g. "1234567890"
let adsLoaded = false;

const MAX_FILE_CHARS = 15000;
const MAX_FILES = 3;
const TEXT_EXT = /\.(txt|md|csv|tsv|json|js|jsx|ts|tsx|py|java|c|cpp|h|cs|go|rs|php|rb|sh|html|css|xml|yml|yaml|sql|log|ini|toml)$/i;

const ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';

const $ = selector =>
  document.querySelector(selector);


/* STORAGE */

function saveChats() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );

  } catch {

    alert("Browser storage is full. Delete some old chats.");
  }
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}


/* GAME MODE */

function loadGameFrame() {

  const frame = $("#gameFrame");

  if (!frame) {
    return;
  }

  frame.src = gameMode === "video" ? VIDEO_URL : GAME_URL;

  document.querySelectorAll(".game-tabs button").forEach(b => {
    b.classList.toggle("on", b.dataset.mode === gameMode);
  });
}


function toggleGame() {

  const on = document.body.classList.toggle("game-on");
  const frame = $("#gameFrame");

  if (!frame) {
    return;
  }

  if (on) {
    loadGameFrame();
  } else {
    frame.src = "about:blank";
  }
}


/* ADS (Google AdSense) */

function setupAds() {

  if (adsLoaded || !ADSENSE_CLIENT || !ADSENSE_SLOT) {
    return;
  }

  if (document.documentElement.classList.contains("needs-terms")) {
    return;
  }

  const box = $("#adBox");
  const slot = $("#adSlot");

  if (!box || !slot) {
    return;
  }

  adsLoaded = true;

  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      ADSENSE_CLIENT;
    document.head.appendChild(script);
  }

  slot.innerHTML =
    '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
    ADSENSE_CLIENT + '" data-ad-slot="' + ADSENSE_SLOT +
    '" data-ad-format="auto" data-full-width-responsive="true"></ins>';

  box.hidden = false;

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {}
}


/* FILE ATTACHMENTS */

function loadScript(url) {

  return new Promise((resolve, reject) => {

    const el = document.createElement("script");
    el.src = url;
    el.onload = resolve;
    el.onerror = () => reject(new Error("Could not load file reader."));
    document.head.appendChild(el);
  });
}


async function extractText(file) {

  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    );

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer()
    }).promise;

    let out = "";

    for (let i = 1; i <= Math.min(pdf.numPages, 60); i++) {

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map(it => it.str).join(" ") + "\n\n";
    }

    return out;
  }

  if (name.endsWith(".docx")) {

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
    );

    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer()
    });

    return result.value;
  }

  if (file.type.startsWith("text/") || TEXT_EXT.test(name)) {
    return await file.text();
  }

  throw new Error("Unsupported file type.");
}


async function handleFiles(fileList) {

  for (const file of Array.from(fileList)) {

    if (pendingFiles.length >= MAX_FILES) {
      alert("You can attach up to " + MAX_FILES + " files per message.");
      break;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(file.name + " is too large (max 10 MB).");
      continue;
    }

    try {

      let text = (await extractText(file)).trim();

      if (!text) {
        throw new Error("No readable text found (scanned PDFs and images are not supported).");
      }

      let truncated = false;

      if (text.length > MAX_FILE_CHARS) {
        text = text.slice(0, MAX_FILE_CHARS) + "\n[...file truncated]";
        truncated = true;
      }

      pendingFiles.push({ name: file.name, text, truncated });

    } catch (error) {

      alert(file.name + ": " + error.message);
    }

    renderTray();
  }
}


function renderTray() {

  const tray = $("#fileTray");

  if (!tray) {
    return;
  }

  tray.innerHTML = "";

  pendingFiles.forEach((file, i) => {

    const chip = document.createElement("div");
    chip.className = "file-chip";

    chip.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/></svg>' +
      "<span>" + escapeHtml(file.name) +
      (file.truncated ? " (truncated)" : "") + "</span>" +
      '<button title="Remove">×</button>';

    chip.querySelector("button").onclick = () => {
      pendingFiles.splice(i, 1);
      renderTray();
    };

    tray.appendChild(chip);
  });
}


function buildContent(text, files) {

  const parts = files.map(
    f => "[Attached file: " + f.name + "]\n" + f.text + "\n[End of file]"
  );

  return (
    parts.join("\n\n") +
    "\n\n" +
    (text || "Please summarize this file.")
  ).trim();
}


function userFilesHtml(message) {

  const chips = message.files
    .map(n => '<span class="msg-file">📄 ' + escapeHtml(n) + "</span>")
    .join("");

  return (
    '<div class="msg-files">' + chips + "</div>" +
    renderMarkdown(message.text || "")
  );
}


/* CHAT MANAGEMENT */

function createChat() {

  const chat = {
    id: Date.now().toString(),
    title: "New chat",
    messages: [],
    createdAt: Date.now()
  };

  chats.unshift(chat);

  currentChatId = chat.id;

  saveChats();

  renderAll();
}


function getCurrentChat() {
  return chats.find(
    chat => chat.id === currentChatId
  );
}


function deleteChat(id) {

  chats = chats.filter(
    chat => chat.id !== id
  );

  if (currentChatId === id) {
    currentChatId =
      chats[0]?.id || null;
  }

  saveChats();

  renderAll();
}


function clearChats() {

  if (!confirm("Delete all chats?")) {
    return;
  }

  chats = [];

  currentChatId = null;

  saveChats();

  createChat();
}


/* TEXT */

function escapeHtml(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function renderMarkdown(text) {

  let html = escapeHtml(text);

  html = html.replace(
    /```[a-zA-Z0-9+#-]*\n?([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );

  html = html.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  html = html.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /\*(.*?)\*/g,
    "<em>$1</em>"
  );

  html = html.replace(
    /^### (.*)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^## (.*)$/gm,
    "<h2>$1</h2>"
  );

  html = html.replace(
    /^# (.*)$/gm,
    "<h1>$1</h1>"
  );

  html = html.replace(
    /^- (.*)$/gm,
    "<li>$1</li>"
  );

  html = html.replace(/\n/g, "<br>");

  html = html.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (m, c) =>
      "<pre><code>" +
      c.replace(/<br>/g, "\n").replace(/^\n/, "") +
      "</code></pre>"
  );

  html = html
    .replace(/(<\/li>)(?:<br>){2,}/g, '$1<span class="sp"></span>')
    .replace(/(<\/li>)<br>/g, "$1")
    .replace(/(<\/(?:h[123]|pre)>)(?:<br>)+/g, "$1")
    .replace(/(?:<br>)+(<(?:h[123]|pre|li)>)/g, "$1")
    .replace(/(?:<br>){2,}/g, '<span class="sp"></span>');

  return html;
}


/* CHAT LIST */

function renderChatList() {

  const list = $("#chatList");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  chats.forEach(chat => {

    const item =
      document.createElement("div");

    item.className =
      "chat-item" +
      (
        chat.id === currentChatId
          ? " active"
          : ""
      );

    item.innerHTML = `

      <button class="chat-open">

        <span class="chat-icon">
          ◼
        </span>

        <span class="chat-title">
          ${escapeHtml(chat.title)}
        </span>

      </button>

      <button
        class="chat-delete"
        title="Delete chat"
      >
        ×
      </button>

    `;

    item
      .querySelector(".chat-open")
      .onclick = () => {

        currentChatId = chat.id;

        renderAll();
      };


    item
      .querySelector(".chat-delete")
      .onclick = event => {

        event.stopPropagation();

        deleteChat(chat.id);
      };


    list.appendChild(item);
  });
}


/* MESSAGES */

function renderMessages() {

  const container =
    $("#messages");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const chat =
    getCurrentChat();


  if (
    !chat ||
    chat.messages.length === 0
  ) {

    container.innerHTML = `

      <div class="welcome">

        <div class="welcome-logo">
          <img
            src="/logo.svg"
            alt="Dhairya GPT"
          >
        </div>

        <h1>
          How can I help you?
        </h1>

        <p>Ask anything, or start with one of these.</p>
        <div class="chips">
          <button class="chip" data-prompt="Explain how the internet works in simple terms"><b>Explain something</b><small>How the internet works, simply</small></button>
          <button class="chip" data-prompt="Write a short, friendly email asking my teacher for an extension"><b>Write an email</b><small>Ask a teacher for an extension</small></button>
          <button class="chip" data-prompt="Give me a 3-day beginner workout plan"><b>Make a plan</b><small>3-day beginner workout</small></button>
          <button class="chip" data-prompt="Help me write a JavaScript function that reverses a string"><b>Write code</b><small>Reverse a string in JavaScript</small></button>
        </div>

      </div>

    `;

    return;
  }


  chat.messages.forEach(
    (message, index) => {

      const row =
        document.createElement("div");

      row.className =
        "message-row " +
        (
          message.role === "user"
            ? "user-row"
            : "assistant-row"
        );


      const bubble =
        document.createElement("div");

      bubble.className =
        "message " +
        (
          message.role === "user"
            ? "user-message"
            : "assistant-message"
        );


      bubble.innerHTML =
        message.role === "assistant" && !message.content && isGenerating
          ? '<span class="typing"><i></i><i></i><i></i></span>'
          : message.files
            ? userFilesHtml(message)
            : renderMarkdown(message.content);


      if (
        message.role === "assistant"
      ) {

        const actions =
          document.createElement("div");

        actions.className =
          "message-actions";


        actions.innerHTML = `

          <button data-copy>
            Copy
          </button>

          <button data-regenerate>
            Regenerate
          </button>

        `;


        actions.querySelector(
          "[data-copy]"
        ).onclick = () => {

          navigator.clipboard.writeText(message.content);
          const b = actions.querySelector("[data-copy]");
          b.textContent = "Copied";
          setTimeout(() => (b.textContent = "Copy"), 1200);

        };


        actions.querySelector(
          "[data-regenerate]"
        ).onclick = () => {

          regenerate(index);

        };


        bubble.appendChild(actions);
      }


      if (message.role === "assistant") {
        const av = document.createElement("img");
        av.src = "/logo.svg";
        av.className = "avatar";
        av.alt = "";
        row.appendChild(av);
      }

      row.appendChild(bubble);

      container.appendChild(row);
    }
  );


  container.scrollTop =
    container.scrollHeight;
}


function renderAll() {

  document.body.classList.remove("sidebar-open");

  renderChatList();

  renderMessages();
}


/* GENERATION */

function setGenerating(value) {

  isGenerating = value;

  const button = $("#sendBtn");

  if (button) {
    button.innerHTML = value ? ICON_STOP : ICON_SEND;
    button.title = value ? "Stop" : "Send";
  }

  if (!value) {
    renderMessages();
  }
}


async function sendMessage() {

  if (isGenerating) {
    return;
  }

  const input =
    $("#messageInput");

  if (!input) {
    return;
  }

  const text = input.value.trim();

  if (!text && !pendingFiles.length) {
    return;
  }

  const files = pendingFiles.slice();

  const content = buildContent(text, files);


  if (!currentChatId) {
    createChat();
  }


  const chat =
    getCurrentChat();

  if (!chat) {
    return;
  }


  chat.messages.push({
    role: "user",
    content,
    text,
    files: files.map(f => f.name)
  });


  if (
    chat.title === "New chat"
  ) {

    chat.title = (() => {
      const t = text || files[0]?.name || "New chat";
      return t.length > 40 ? t.substring(0, 40) + "..." : t;
    })();
  }


  input.value = "";

  input.style.height = "auto";

  pendingFiles = [];

  renderTray();

  saveChats();

  renderAll();

  await generateResponse(chat);
}


async function generateResponse(chat) {

  setGenerating(true);

  abortController = new AbortController();


  chat.messages.push({
    role: "assistant",
    content: ""
  });


  const assistantMessage =
    chat.messages[
      chat.messages.length - 1
    ];


  renderMessages();


  try {

    let messages =
      chat.messages
        .slice(0, -1)
        .slice(-CONFIG.MAX_MESSAGES)
        .map(m => ({ role: m.role, content: m.content }));


    if (settings.instructions) {

      messages = [
        {
          role: "system",
          content:
            settings.instructions
        },
        ...messages
      ];
    }


    const response =
      await fetch(
        CONFIG.API_URL,
        {
          method: "POST",

          signal: abortController.signal,

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            messages,
            stream: true
          })
        }
      );


    if (!response.ok) {

      let errorText =
        await response.text();


      try {

        const errorJson =
          JSON.parse(errorText);

        errorText =
          errorJson.error ||
          errorJson.details ||
          errorText;

      } catch {}


      if (response.status === 429 || response.status === 413) {
        throw new Error(errorText);
      }

      throw new Error(
        `Server error ${response.status}: ${errorText}`
      );
    }


    if (!response.body) {

      throw new Error(
        "No response stream received."
      );
    }


    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = "";


    while (true) {

      const {
        value,
        done
      } =
        await reader.read();


      if (done) {
        break;
      }


      buffer += decoder.decode(
        value,
        {
          stream: true
        }
      );


      const lines =
        buffer.split("\n");


      buffer =
        lines.pop() || "";


      for (const line of lines) {

        const trimmed =
          line.trim();


        if (!trimmed) {
          continue;
        }


        if (
          !trimmed.startsWith("data:")
        ) {
          continue;
        }


        const data =
          trimmed
            .substring(5)
            .trim();


        if (data === "[DONE]") {
          continue;
        }


        try {

          const json =
            JSON.parse(data);


          const delta =
            json?.choices?.[0]?.delta?.content;


          if (delta) {

            assistantMessage.content +=
              delta;

            renderMessages();
          }

        } catch {
          // Ignore malformed/incomplete SSE data
        }
      }
    }


    saveChats();

    renderMessages();


  } catch (error) {

    if (error.name === "AbortError") {
      if (!assistantMessage.content) {
        assistantMessage.content = "(Stopped)";
      }
    } else {
      assistantMessage.content = "Error: " + error.message;
    }

    saveChats();

    renderMessages();
  }


  setGenerating(false);
}


/* REGENERATE */

async function regenerate(index) {

  if (isGenerating) {
    return;
  }

  const chat =
    getCurrentChat();

  if (!chat) {
    return;
  }


  chat.messages.splice(index);

  saveChats();

  renderMessages();

  await generateResponse(chat);
}


/* THEME */

function toggleTheme() {

  const html =
    document.documentElement;


  const current =
    localStorage.getItem(
      "oac.theme"
    ) || "dark";


  const next =
    current === "dark"
      ? "light"
      : "dark";


  localStorage.setItem(
    "oac.theme",
    next
  );


  html.dataset.t =
    next;
}


/* CUSTOM INSTRUCTIONS */

function openInstructions() {

  const modal =
    $("#instructionsModal");

  if (!modal) {
    return;
  }


  const textarea =
    $("#instructionsInput");


  if (textarea) {

    textarea.value =
      settings.instructions || "";
  }


  modal.classList.add("show");
}


function saveInstructionsData() {

  const textarea =
    $("#instructionsInput");


  settings.instructions =
    textarea?.value.trim() || "";


  saveSettings();


  const modal =
    $("#instructionsModal");


  if (modal) {

    modal.classList.remove(
      "show"
    );
  }
}


/* COMPOSER */

function setupComposer() {

  const input =
    $("#messageInput");

  const send =
    $("#sendBtn");


  if (!input || !send) {
    return;
  }


  send.innerHTML = ICON_SEND;

  send.onclick = () => {
    if (isGenerating) {
      abortController?.abort();
    } else {
      sendMessage();
    }
  };


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }

    }
  );


  input.addEventListener(
    "input",
    () => {

      input.style.height =
        "auto";

      input.style.height =
        Math.min(
          input.scrollHeight,
          150
        ) + "px";
    }
  );
}


/* BUTTONS */

function toggleSidebar() {

  if (window.innerWidth <= 760) {
    document.body.classList.toggle("sidebar-open");
  } else {
    document.body.classList.toggle("sidebar-collapsed");
  }
}


function setupButtons() {

  const gameBtn = $("#gameBtn");
  const gameClose = $("#gameClose");

  if (gameBtn) gameBtn.onclick = toggleGame;
  if (gameClose) gameClose.onclick = toggleGame;

  document.querySelectorAll(".game-tabs button").forEach(b => {
    b.onclick = () => {
      gameMode = b.dataset.mode;
      loadGameFrame();
    };
  });

  const attach = $("#attachBtn");
  const fileInput = $("#fileInput");

  if (attach && fileInput) {

    attach.onclick = () => fileInput.click();

    fileInput.onchange = () => {
      handleFiles(fileInput.files);
      fileInput.value = "";
    };
  }


  document
    .querySelectorAll("[data-toggle-sidebar]")
    .forEach(b => (b.onclick = toggleSidebar));

  $("#messages").addEventListener("click", event => {

    const chip = event.target.closest(".chip");

    if (chip) {
      $("#messageInput").value = chip.dataset.prompt;
      sendMessage();
    }
  });


  const newChat =
    $("#newChatBtn");

  if (newChat) {
    newChat.onclick =
      createChat;
  }


  const clear =
    $("#clearChatsBtn");

  if (clear) {
    clear.onclick =
      clearChats;
  }


  const theme =
    $("#themeBtn");

  if (theme) {
    theme.onclick =
      toggleTheme;
  }


  const instructions =
    $("#instructionsBtn");

  if (instructions) {
    instructions.onclick =
      openInstructions;
  }


  const saveInstructions =
    $("#saveInstructionsBtn");

  if (saveInstructions) {

    saveInstructions.onclick =
      saveInstructionsData;
  }
}


/* MODALS */

function setupModals() {

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(button => {

      button.onclick = () => {

        const modal =
          button.closest(".modal");


        if (modal) {

          modal.classList.remove(
            "show"
          );
        }
      };

    });


  document
    .querySelectorAll(".modal")
    .forEach(modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            modal.classList.remove(
              "show"
            );
          }

        }
      );

    });
}


/* LAUNCH PARAMS (app shortcut + share target) */

function handleLaunchParams() {

  const q = new URLSearchParams(location.search);

  if (!q.has("new") && !q.has("text") && !q.has("url") && !q.has("title")) {
    return;
  }

  const current = getCurrentChat();

  if (q.has("new") && current && current.messages.length) {
    createChat();
  }

  const shared = [q.get("title"), q.get("text"), q.get("url")]
    .filter(Boolean)
    .join("\n");

  const input = $("#messageInput");

  if (shared && input) {

    input.value = shared;
    input.dispatchEvent(new Event("input"));
  }

  if (input) {
    input.focus();
  }

  history.replaceState(null, "", location.pathname);
}


/* INITIALIZATION */

function init() {

  const theme =
    localStorage.getItem(
      "oac.theme"
    ) || "dark";


  document.documentElement.dataset.t =
    theme;


  if (!chats.length) {

    createChat();

  } else {

    currentChatId =
      chats[0].id;

    renderAll();
  }


  setupComposer();

  setupButtons();

  setupModals();

  handleLaunchParams();

  setupAds();
}


document.addEventListener(
  "DOMContentLoaded",
  init
);