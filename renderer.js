let ipcRenderer, fs, path;
try { ({ ipcRenderer } = require('electron')); } catch {}
try { fs = require('fs'); path = require('path'); } catch {}

let suspects = [], weapons = [], rooms = [];
let mansionMusic, fxAccuse, fxSolve;
let marks = { suspects: {}, weapons: {}, rooms: {} };
let currentRoom = null;
let currentPlayer = 'You';
let botIndex = 0;
const bots = ['Bot A', 'Bot B', 'Bot C'];
let botMemory = {};
bots.forEach(b => botMemory[b] = { suspects:{}, weapons:{}, rooms:{} });

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initAudio();
  setupIPC();
  buildGrids();
  renderChecklistBadgesOnly();
  setStatus('Free Play — waiting for command…');
});

// ─── Logging helpers ───
function logRound(msg){ if(ipcRenderer) ipcRenderer.send('log:round', msg); }
function logDebug(msg){ if(ipcRenderer) ipcRenderer.send('log:debug', msg); }

// ─── Load data ───
async function loadJSON(rel){
  if(fs) return JSON.parse(fs.readFileSync(path.join(__dirname,rel),'utf8'));
  const r=await fetch(rel); return r.json();
}
async function loadData(){
  suspects=await loadJSON('assets/data/suspects.json');
  weapons=await loadJSON('assets/data/weapons.json');
  rooms=await loadJSON('assets/data/rooms.json');
  suspects.forEach(s=>marks.suspects[s]='');
  weapons.forEach(w=>marks.weapons[w]='');
  rooms.forEach(r=>marks.rooms[r]='');
  bots.forEach(b=>{
    suspects.forEach(s=>botMemory[b].suspects[s]='');
    weapons.forEach(w=>botMemory[b].weapons[w]='');
    rooms.forEach(r=>botMemory[b].rooms[r]='');
  });
  logDebug('Game data loaded.');
}

// ─── Audio ───
function initAudio(){
  mansionMusic=new Audio('assets/sounds/Mansion.mp3');
  fxAccuse=new Audio('assets/sounds/Accusation.mp3');
  fxSolve=new Audio('assets/sounds/Solution.mp3');
  mansionMusic.loop=true; mansionMusic.volume=.35;
  fxAccuse.volume=.75; fxSolve.volume=.85;
  mansionMusic.play().catch(()=>{});
  logDebug('Audio initialized.');
}

// ─── IPC ───
function setupIPC() {
  if (!window.electronAPI) {
    console.warn('electronAPI not found — IPC bridge inactive.');
    return;
  }

  // Receive commands
  window.electronAPI.onTikTokMessage((msg) => {
    console.log('[Renderer] Received command:', msg);
    handleCommand(msg);
  });

  // Receive volume
  window.electronAPI.onVolume((data) => {
    if (mansionMusic) mansionMusic.volume = data.music / 100;
    if (fxAccuse && fxSolve) fxAccuse.volume = fxSolve.volume = data.fx / 100;
    console.log('[Renderer] Volume set:', data);
  });
}



// ─── UI ───
function safeId(t){return t.toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function gridCard(p,l){return `<div class="card"><img src="${p}" alt="${l}" onerror="this.style.display='none'"><div class="label">${l}</div><div class="badge" id="badge-${safeId(l)}" style="display:none"></div></div>`;}
function fileForCharacter(n){return `${n.split(' ')[0]}.jpg`;}
function fileForWeapon(n){const m={'Candlestick':'Candlestick.png','Dagger':'Dagger.png','Lead Pipe':'Lead Pipe.png','Revolver':'Revolver.png','Rope':'rope.png','Wrench':'Wrench.png'};return m[n]||`${n}.png`;}
function fileForRoom(n){return `${n}.png`;}

function buildGrids(){
  document.getElementById('suspectGrid').innerHTML=suspects.map(x=>gridCard(`assets/characters/${fileForCharacter(x)}`,x)).join('');
  document.getElementById('weaponGrid').innerHTML=weapons.map(x=>gridCard(`assets/weapons/${fileForWeapon(x)}`,x)).join('');
  document.getElementById('roomGrid').innerHTML=rooms.map(x=>gridCard(`assets/rooms/${fileForRoom(x)}`,x)).join('');
}

function renderChecklistBadgesOnly(){
  for(const [cat,obj]of Object.entries(marks)){
    for(const [label,v]of Object.entries(obj)){
      const b=document.getElementById('badge-'+safeId(label));
      if(!b)continue;
      if(v==='x'){b.textContent='X';b.className='badge no';b.style.display='inline-block';}
      else if(v==='check'){b.textContent='✓';b.className='badge ok';b.style.display='inline-block';}
      else if(v==='maybe'){b.textContent='?';b.className='badge room';b.style.display='inline-block';}
      else b.style.display='none';
    }
  }
}

function setStatus(m){
  const el=document.getElementById('status');
  if(el)el.textContent=m;
  console.log(m);
  logRound(m);
}

// ─── Commands ───
function findByPrefix(i,l){if(!i)return null;return l.find(x=>x.toLowerCase().startsWith(i.toLowerCase()));}

function handleCommand(text){
  if(!text||!text.startsWith('.'))return;
  const p=text.trim().toLowerCase().split(/\s+/);
  const cmd=p[0];

  if(cmd==='.m'||cmd==='.move'){
    const r=findByPrefix(p.slice(1).join(' '),rooms);
    if(!r)return setStatus('❌ Unknown room');
    currentRoom=r;marks.rooms[r]='check';
    setStatus(`🚶 ${currentPlayer} moved to ${r}`);
    renderChecklistBadgesOnly();updateDetectiveSheet();
    logDebug(`Current room set: ${r}`);return;
  }

  if(cmd==='.s'||cmd==='.suggest'){
    if(p.length<3)return setStatus('❌ Use .s [suspect] [weapon]');
    const s=findByPrefix(p[1],suspects);
    const w=findByPrefix(p[2],weapons);
    const r=currentRoom;if(!r)return setStatus('❌ Move to a room first (.m [room])');
    fxAccuse.currentTime=0;fxAccuse.play();
    const disproved=Math.random()<0.5;
    if(disproved){
      const which=['suspect','weapon','room'][Math.floor(Math.random()*3)];
      let revealed='';
      if(which==='suspect'){marks.suspects[s]='x';revealed=s;}
      if(which==='weapon'){marks.weapons[w]='x';revealed=w;}
      if(which==='room'){marks.rooms[r]='x';revealed=r;}
      setStatus(`❌ Card Disproved! ${revealed} eliminated.`);
      logDebug(`Disproved (${which}) -> ${revealed}`);
    }else{
      marks.suspects[s]='maybe';marks.weapons[w]='maybe';marks.rooms[r]='maybe';
      setStatus(`🤫 No one disproved ${s}, ${w}, or ${r}.`);
      logDebug('Suggestion marked uncertain.');
    }
    renderChecklistBadgesOnly();updateDetectiveSheet();nextBotTurn();
    return;
  }

  if(cmd==='.a'||cmd==='.accuse'){
    if(p.length<4)return setStatus('❌ Use .a [suspect] [weapon] [room]');
    const s=findByPrefix(p[1],suspects),w=findByPrefix(p[2],weapons),r=findByPrefix(p[3],rooms);
    if(!s||!w||!r)return setStatus('❌ Invalid accusation');
    fxAccuse.currentTime=0;fxAccuse.play();
    const correct=Math.random()<0.3;
    setTimeout(()=>{
      if(correct){fxSolve.play();setStatus(`✅ Correct! ${s} with ${w} in ${r}`);logDebug('Accusation success.');}
      else{setStatus('❌ Wrong accusation');logDebug('Accusation failed.');nextBotTurn();}
    },1500);return;
  }

  if(cmd==='.select'){
    const all=[...suspects,...weapons,...rooms];
    const t=findByPrefix(p.slice(1).join(' '),all);
    if(!t)return setStatus('❌ Unknown item');
    if(suspects.includes(t))marks.suspects[t]='check';
    else if(weapons.includes(t))marks.weapons[t]='check';
    else marks.rooms[t]='check';
    setStatus(`✅ Selected ${t}`);renderChecklistBadgesOnly();updateDetectiveSheet();
    logDebug(`Manual select -> ${t}`);return;
  }
}

// ─── Bot turns ───
function nextBotTurn(){
  botIndex=(botIndex+1)%bots.length;const bot=bots[botIndex];
  currentPlayer=bot;setStatus(`🤖 ${bot} is thinking...`);logDebug(`${bot} turn started.`);
  setTimeout(()=>{
    const s=suspects[Math.floor(Math.random()*suspects.length)];
    const w=weapons[Math.floor(Math.random()*weapons.length)];
    const r=rooms[Math.floor(Math.random()*rooms.length)];
    const disproved=Math.random()<0.6;
    if(disproved){
      const choice=['suspect','weapon','room'][Math.floor(Math.random()*3)];
      if(choice==='suspect')botMemory[bot].suspects[s]='x';
      else if(choice==='weapon')botMemory[bot].weapons[w]='x';
      else botMemory[bot].rooms[r]='x';
      setStatus(`❌ ${bot} disproved ${s} with the ${w} in the ${r}`);
      logDebug(`${bot}: marked ${choice}=${s||w||r} as X`);
    }else{
      botMemory[bot].suspects[s]='maybe';botMemory[bot].weapons[w]='maybe';botMemory[bot].rooms[r]='maybe';
      setStatus(`🤫 ${bot} found no disproof for ${s}, ${w}, ${r}`);
      logDebug(`${bot}: all three marked ?`);
    }
    updateDetectiveSheet();
    setTimeout(()=>{currentPlayer='You';setStatus(`🧠 ${bot} finished. Your turn!`);},2500);
  },2500);
}

// ─── Detective Sync ───
function updateDetectiveSheet(){
  if(ipcRenderer)ipcRenderer.send('detective:update',{you:marks,bots:botMemory});
  logDebug(`Detective sheet updated by ${currentPlayer}`);
}
