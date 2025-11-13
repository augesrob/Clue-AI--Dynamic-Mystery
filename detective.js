// detective.js
const container = document.getElementById('sheet');
const waiting = document.getElementById('waiting');

function renderDetective(data) {
  waiting.style.display = 'none';
  container.innerHTML = '';

  container.innerHTML += `<h3>🧠 Detective Sheet</h3>`;
  const you = data.you;
  const bots = data.bots;

  container.innerHTML += '<h4>Your Notes</h4>';
  for (const cat of ['suspects', 'weapons', 'rooms']) {
    const section = document.createElement('div');
    section.innerHTML = `<strong>${cat.toUpperCase()}</strong><br>`;
    for (const [k, v] of Object.entries(you[cat])) {
      const mark = v === 'x' ? '❌' : v === 'check' ? '✅' : v === 'maybe' ? '❓' : '';
      section.innerHTML += `${k} ${mark}<br>`;
    }
    container.appendChild(section);
  }

  container.innerHTML += '<hr><h4>Other Players</h4>';
  for (const [bot, mem] of Object.entries(bots)) {
    const bdiv = document.createElement('div');
    bdiv.innerHTML = `<strong>${bot}</strong><br>`;
    for (const cat of ['suspects', 'weapons', 'rooms']) {
      for (const [k, v] of Object.entries(mem[cat])) {
        const mark = v === 'x' ? '❌' : v === 'check' ? '✅' : v === 'maybe' ? '❓' : '';
        bdiv.innerHTML += `${k} ${mark} `;
      }
      bdiv.innerHTML += '<br>';
    }
    container.appendChild(bdiv);
  }
}

if (window.electronAPI) {
  window.electronAPI.sendLogDebug('Detective sheet bridge active.');
  window.electronAPI.onTikTokMessage?.(() => {}); // ignore
  window.electronAPI.onVolume?.(() => {});        // ignore
  // Real listener for detective updates
  window.electronAPI.sendLogDebug('Listening for detective:update');
  window.electronAPI.onTikTokMessage?.(() => {});
}

if (window.electronAPI) {
  window.electronAPI.onTikTokMessage?.(() => {});
}

if (window.electronAPI) {
  window.electronAPI.sendLogDebug('Detective ready.');
}
