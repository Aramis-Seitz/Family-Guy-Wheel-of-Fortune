const AUTH_CHANNEL_NAME = "auth";
const ACCOUNT_CHANGED_MESSAGE = "ACCOUNT_CHANGED";

export function initAuthChannelListener(): void {
  const authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  authChannel.onmessage = (event) => {
    if (event.data === ACCOUNT_CHANGED_MESSAGE) {
      location.reload();
    }
  };
}

export function notifyAccountChanged(): void {
  new BroadcastChannel(AUTH_CHANNEL_NAME).postMessage(ACCOUNT_CHANGED_MESSAGE);
}