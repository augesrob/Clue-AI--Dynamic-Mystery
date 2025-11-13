// log.js
const roundLog = document.getElementById('roundLog');
const debugLog = document.getElementById('debugLog');

function appendLine(el, text) {
  const div = document.createElement('div');
  div.textContent = text;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// Initial message
appendLine(roundLog, "🕵️ Log window initialized...");

if (window.electronAPI) {
  window.electronAPI.sendLogDebug('🪶 Log window connected.');

  // Receive round log entries
  window.electronAPI.onRoundLog = (msg) => appendLine(roundLog, msg);
  // Receive debug log entries
  window.electronAPI.onDebugLog = (msg) => appendLine(debugLog, msg);

  // Backward compatibility in case main uses same event names:
  window.electronAPI.onTikTokMessage?.(() => {});
  window.electronAPI.onVolume?.(() => {});
}
