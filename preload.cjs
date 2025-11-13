// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Receive TikTok or control commands
  onTikTokMessage: (callback) => ipcRenderer.on('tiktok:message', (_e, msg) => callback(msg)),

  // Send a command from control panel (or local)
  sendCommand: (text) => ipcRenderer.send('control:sendCommand', text),

  // Volume control bridge
  onVolume: (callback) => ipcRenderer.on('volume:set', (_e, data) => callback(data)),

  // Logging & detective sheet sync
  sendDetective: (data) => ipcRenderer.send('detective:update', data),
  sendLogRound: (msg) => ipcRenderer.send('log:round', msg),
  sendLogDebug: (msg) => ipcRenderer.send('log:debug', msg)
});
