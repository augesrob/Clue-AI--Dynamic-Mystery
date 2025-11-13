const { ipcRenderer } = require('electron');
ipcRenderer.on('commands:update', (_e, list)=>{
  document.getElementById('cmdList').innerHTML = list.map(c=>`<li><span class="command">${c}</span></li>`).join('');
});