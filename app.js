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

const $ = selector =>
  document.querySelector(selector);


/* STORAGE */

function saveChats() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chats)
  );
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
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
    /```([\s\S]*?)```/g,
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

  html = html.replace(
    /\n/g,
    "<br>"
  );

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

        <p>
          Ask anything and chat with Dhairya GPT.
        </p>

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
        renderMarkdown(
          message.content
        );


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

          navigator.clipboard.writeText(
            message.content
          );

        };


        actions.querySelector(
          "[data-regenerate]"
        ).onclick = () => {

          regenerate(index);

        };


        bubble.appendChild(actions);
      }


      row.appendChild(bubble);

      container.appendChild(row);
    }
  );


  container.scrollTop =
    container.scrollHeight;
}


function renderAll() {

  renderChatList();

  renderMessages();
}


/* GENERATION */

function setGenerating(value) {

  isGenerating = value;

  const button =
    $("#sendBtn");

  if (!button) {
    return;
  }

  button.disabled = value;

  button.textContent =
    value ? "Stop" : "Send";
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

  const content =
    input.value.trim();

  if (!content) {
    return;
  }


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
    content
  });


  if (
    chat.title === "New chat"
  ) {

    chat.title =
      content.length > 40
        ? content.substring(0, 40) + "..."
        : content;
  }


  input.value = "";

  saveChats();

  renderAll();

  await generateResponse(chat);
}


async function generateResponse(chat) {

  setGenerating(true);


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
        .slice(-CONFIG.MAX_MESSAGES);


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

    assistantMessage.content =
      "Error: " +
      error.message;

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


  send.onclick =
    sendMessage;


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

function setupButtons() {

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
}


document.addEventListener(
  "DOMContentLoaded",
  init
);
