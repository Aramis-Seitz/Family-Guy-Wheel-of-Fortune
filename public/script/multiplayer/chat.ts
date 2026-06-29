import { supabaseClient } from '../shared/supabase-client.js';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MAX_LENGTH = 200;
const SPAM_DELAY_MS = 1000;

interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}

let chatChannel: RealtimeChannel | null = null;
let myUsername = '';
let lastSentAt = 0;
let abortController: AbortController | null = null;

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function appendMessage(msg: ChatMessage, isMine: boolean): void {
  const list = document.getElementById('chatMessages');
  if (!list) return;

  const li = document.createElement('li');
  li.className = isMine ? 'chat-message chat-message--mine' : 'chat-message';

  const meta = document.createElement('span');
  meta.className = 'chat-meta';
  meta.textContent = `${msg.username} · ${msg.timestamp}`;

  const text = document.createElement('p');
  text.className = 'chat-text';
  text.textContent = msg.text;

  li.appendChild(meta);
  li.appendChild(text);
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

export function initChat(roomKey: string, username: string): void {
  myUsername = username;
  lastSentAt = 0;
  abortController = new AbortController();
  const { signal } = abortController;

  chatChannel = supabaseClient
    .channel(`chat:${roomKey}`)
    .on('broadcast', { event: 'message' }, ({ payload }: { payload: ChatMessage }) => {
      appendMessage(payload, payload.username === myUsername);
    })
    .subscribe();

  const sendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement | null;
  const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
  const toggleBtn = document.getElementById('chatToggleBtn') as HTMLElement | null;
  const chatHeader = document.getElementById('chatHeader') as HTMLDivElement | null;
  const chatBody = document.getElementById('chatBody') as HTMLDivElement | null;

  function sendMessage(): void {
    if (!chatInput || !chatChannel) return;
    const text = chatInput.value.trim().slice(0, MAX_LENGTH);
    if (!text) return;

    const now = Date.now();
    if (now - lastSentAt < SPAM_DELAY_MS) return;
    lastSentAt = now;

    const msg: ChatMessage = {
      username: myUsername,
      text,
      timestamp: formatTime(new Date()),
    };

    void chatChannel.send({ type: 'broadcast', event: 'message', payload: msg });
    appendMessage(msg, true);
    chatInput.value = '';
  }

  sendBtn?.addEventListener('click', sendMessage, { signal });
  chatInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  }, { signal });

  function toggleChat(): void {
    const collapsed = chatBody?.classList.toggle('chat-body--collapsed');
    if (toggleBtn) toggleBtn.textContent = collapsed ? '▼' : '▲';
  }

  chatHeader?.addEventListener('click', toggleChat, { signal });
}

export function destroyChat(): void {
  abortController?.abort();
  abortController = null;

  if (chatChannel) {
    void supabaseClient.removeChannel(chatChannel);
    chatChannel = null;
  }

  myUsername = '';
  lastSentAt = 0;

  const list = document.getElementById('chatMessages');
  if (list) list.innerHTML = '';

  const chatBody = document.getElementById('chatBody');
  chatBody?.classList.remove('chat-body--collapsed');

  const toggleBtn = document.getElementById('chatToggleBtn') as HTMLElement | null;
  if (toggleBtn) toggleBtn.textContent = '▲';
}
