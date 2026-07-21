import { supabaseClient } from '../shared/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { formatTime } from '../app/format';

const MAX_LENGTH = 200;
const SPAM_DELAY_MS = 1000;

let chatChannel: RealtimeChannel | null = null;
let myUsername = '';
let lastSentAt = 0;
let abortController: AbortController | null = null;

interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}

function appendMessage(msg: ChatMessage, isMine: boolean): void {
  const list = document.getElementById('chat-messages');
  if (!list) return;

  const li = document.createElement('li');
  li.className = isMine ? 'chat__message chat__message--mine' : 'chat__message';

  const meta = document.createElement('span');
  meta.className = 'chat__meta';
  meta.textContent = `${msg.username} · ${formatTime(msg.timestamp)}`;

  const text = document.createElement('p');
  text.className = 'chat__text';
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

  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;
  const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
  const toggleBtn = document.getElementById('chat-toggle-btn') as HTMLElement | null;
  const chatHeader = document.getElementById('chat-header') as HTMLDivElement | null;
  const chatBody = document.getElementById('chat-body') as HTMLDivElement | null;

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
      timestamp: new Date().toISOString(),
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
    const collapsed = chatBody?.classList.toggle('chat__body--collapsed');
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

  const list = document.getElementById('chat-messages');
  if (list) list.innerHTML = '';

  const chatBody = document.getElementById('chat-body');
  chatBody?.classList.add('chat__body--collapsed');

  const toggleBtn = document.getElementById('chat-toggle-btn') as HTMLElement | null;
  if (toggleBtn) toggleBtn.textContent = '▼';
}
