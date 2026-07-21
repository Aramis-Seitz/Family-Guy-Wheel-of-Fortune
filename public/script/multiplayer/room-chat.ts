import { supabaseClient } from '../shared/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { optionalElement } from '../shared/dom-helpers';

const MAX_LENGTH = 200;
const SPAM_DELAY_MS = 1000;

let chatChannel: RealtimeChannel | null = null;
let myUsername = '';
let lastSentAt = 0;
let abortController: AbortController | null = null;

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}

const chatMessagesList = optionalElement<HTMLUListElement>('chat-messages');

function appendMessage(msg: ChatMessage, isMine: boolean): void {
  if (!chatMessagesList) return;

  const li = document.createElement('li');
  li.className = isMine ? 'chat__message chat__message--mine' : 'chat__message';

  const meta = document.createElement('span');
  meta.className = 'chat__meta';
  meta.textContent = `${msg.username} · ${msg.timestamp}`;

  const text = document.createElement('p');
  text.className = 'chat__text';
  text.textContent = msg.text;

  li.appendChild(meta);
  li.appendChild(text);
  chatMessagesList.appendChild(li);
  chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}

const sendBtn = optionalElement<HTMLButtonElement>('chat-send-btn');
const chatInput = optionalElement<HTMLInputElement>('chat-input');
const toggleBtn = optionalElement<HTMLElement>('chat-toggle-btn');
const chatHeader = optionalElement<HTMLDivElement>('chat-header');
const chatBody = optionalElement<HTMLDivElement>('chat-body');

export function initChat(roomKey: string, username: string): void {
  destroyChat();
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

  if (chatMessagesList) chatMessagesList.innerHTML = '';

  chatBody?.classList.add('chat__body--collapsed');

  if (toggleBtn) toggleBtn.textContent = '▼';
}
