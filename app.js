// Elements
const playlistInput = document.getElementById('playlist-url');
const loadBtn = document.getElementById('load-playlist-btn');
const channelsSection = document.getElementById('channels-section');
const channelsList = document.getElementById('channels-list');
const playerSection = document.getElementById('player-section');
const videoPlayer = document.getElementById('video-player');
const channelInfo = document.getElementById('channel-info');

let channels = [];
let selectedChannelIdx = 0;
let hls;

// Parse M3U
function parseM3U(m3uText) {
    const lines = m3uText.split('\n');
    const parsed = [];
    let current = {};
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            const nameMatch = line.match(/,(.*)$/);
            current = { name: nameMatch ? nameMatch[1] : 'Chaîne inconnue' };
        } else if (line && !line.startsWith('#')) {
            current.url = line;
            parsed.push({ ...current });
        }
    }
    return parsed;
}

// Load Playlist
loadBtn.onclick = async () => {
    const url = playlistInput.value.trim();
    if (!url) {
        alert('Merci de renseigner une URL M3U valide.');
        return;
    }
    try {
        const res = await fetch(url);
        const text = await res.text();
        channels = parseM3U(text);
        if (channels.length === 0) throw new Error('Aucune chaîne trouvée.');
        displayChannels();
    } catch (e) {
        alert('Impossible de charger la playlist: ' + e.message);
    }
};

// Affichage chaînes
function displayChannels() {
    channelsList.innerHTML = '';
    channels.forEach((ch, idx) => {
        const div = document.createElement('div');
        div.className = 'channel-item' + (idx === 0 ? ' selected' : '');
        div.tabIndex = 0;
        div.textContent = ch.name;
        div.onclick = () => selectChannel(idx);
        channelsList.appendChild(div);
    });
    channelsSection.classList.remove('hidden');
    playerSection.classList.add('hidden');
    selectedChannelIdx = 0;
    setFocus();
}

// Lecture
function selectChannel(idx) {
    selectedChannelIdx = idx;
    setFocus();
    playChannel(channels[idx]);
}

function playChannel(channel) {
    channelInfo.textContent = channel.name;
    playerSection.classList.remove('hidden');
    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(videoPlayer);
    } else {
        videoPlayer.src = channel.url;
    }
    videoPlayer.play();
}

// Navigation télécommande
document.addEventListener('keydown', (e) => {
    if (channels.length === 0) return;
    const items = document.querySelectorAll('.channel-item');
    if (document.activeElement === playlistInput) return;
    switch (e.key) {
        case 'ArrowDown':
            if (selectedChannelIdx < channels.length - 1) {
                selectedChannelIdx++;
                setFocus();
            }
            break;
        case 'ArrowUp':
            if (selectedChannelIdx > 0) {
                selectedChannelIdx--;
                setFocus();
            }
            break;
        case 'Enter':
        case 'OK':
            selectChannel(selectedChannelIdx);
            break;
        case 'Backspace':
        case 'Escape':
            playerSection.classList.add('hidden');
            channelsSection.classList.remove('hidden');
            setFocus();
            break;
    }
});

function setFocus() {
    const items = document.querySelectorAll('.channel-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedChannelIdx);
        if (i === selectedChannelIdx) item.focus();
    });
}