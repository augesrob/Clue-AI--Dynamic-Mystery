// Use the contextBridge API exposed in preload.cjs
const input = document.getElementById('commandInput');
const sendBtn = document.getElementById('sendBtn');
const musicVol = document.getElementById('musicVol');
const fxVol = document.getElementById('fxVol');
const solutionBox = document.getElementById('solution');

// 🔹 Send command via preload bridge
function sendCommand() {
  const text = input.value.trim();
  if (!text) return;
  if (window.electronAPI) {
    window.electronAPI.sendCommand(text);
    console.log('[Control] Sent command:', text);
  } else {
    console.warn('[Control] electronAPI not found.');
  }
  input.value = '';
}

// Handle button click and Enter key
sendBtn.addEventListener('click', sendCommand);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendCommand();
});

// 🔹 Volume control
[musicVol, fxVol].forEach(slider => {
  slider.addEventListener('input', () => {
    const data = {
      music: parseInt(musicVol.value),
      fx: parseInt(fxVol.value)
    };
    if (window.electronAPI) window.electronAPI.sendLogDebug(`Volume changed → Music: ${data.music}, FX: ${data.fx}`);
    window.electronAPI?.sendLogRound(`🎵 Volume updated: Music ${data.music}% / FX ${data.fx}%`);
    window.electronAPI?.sendLogDebug('Volume data sent to main process.');
    window.electronAPI?.sendCommand(`.vol ${data.music} ${data.fx}`); // optional log command
  });
});

// 🔹 Solution updates (from main process)
if (window.electronAPI) {
  window.electronAPI.onTikTokMessage?.((msg) => {
    // not needed here, but safe to log
    console.log('[Control] Message from main:', msg);
  });
}

// Listen for solution updates directly (if main sends them)
window.electronAPI?.onVolume?.((data) => {
  console.log('[Control] Volume event:', data);
});

window.electronAPI?.onTikTokMessage?.((msg) => {
  if (msg.startsWith('SOLUTION:')) {
    const content = msg.replace('SOLUTION:', '').trim();
    solutionBox.textContent = content;
  }
});
