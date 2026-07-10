// ============================================================
// LINK DO REPOSITÓRIO GITHUB (ÁUDIOS MP3)
// ============================================================
const LINK_DA_PASTA_MP3 = "https://albertinosesc.github.io/audionbm/audios/";

// Variável global para rastrear quais IDs de áudio realmente existem no GitHub
let arquivosDisponiveisNoGithub = [];

// ============================================================
// FUNÇÃO AUXILIAR
// ============================================================
function localGetYouTubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (url.length === 11) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// REMOVIDO O SCRIPT INVASIVO DA API DO YOUTUBE PARA EVITAR ERROS EM "FILE://"

// ============================================================
// ELEMENTOS DOM
// ============================================================
const searchGeneral = document.getElementById('searchGeneral');
const filterComposer = document.getElementById('filterComposer');
const filterBook = document.getElementById('filterBook');
const viewModeRadios = document.getElementsByName('viewMode');
const catalogGrid = document.getElementById('catalogGrid');
const btnClear = document.getElementById('btnClear');
const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const pdfPreviewPanel = document.getElementById('pdfPreviewPanel');
const resizerLeft = document.getElementById('resizerLeft');
const resizerRight = document.getElementById('resizerRight');
const pdfPreviewTitle = document.getElementById('pdfPreviewTitle');
const pdfIframe = document.getElementById('pdfIframe');
const btnClosePreview = document.getElementById('btnClosePreview');
const currentPlayingTitle = document.getElementById('currentPlayingTitle');
const currentPlayingMeta = document.getElementById('currentPlayingMeta');
const playerLeft = document.getElementById('playerLeft');

// ============================================================
// VARIÁVEIS DE ESTADO
// ============================================================
let globalPlayer = null;
let currentAudio = null;
let currentlyPlayingMusicId = null;
let isListView = true;

let videoPlaylist = [];
let mp3Playlist = [];
let activeVideoIndex = -1;
let activeMp3Index = -1;
let activePlaylistType = null; // 'video' ou 'mp3'

// Estado dos toggles das playlists (visível por padrão)
let videoListVisible = true;
let mp3ListVisible = true;

// ============================================================
// TOGGLE SIDEBAR
// ============================================================
if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if (resizerLeft) {
            resizerLeft.style.display = sidebar.classList.contains('collapsed') ? 'none' : 'flex';
        }
    });
}

// ============================================================
// FILTROS
// ============================================================
function initFilters() {
    if (typeof musicDatabase === 'undefined') return;
    const composers = [...new Set(musicDatabase.map(m => m.composer))].sort();
    const books = [...new Set(musicDatabase.map(m => m.book))].sort();
    if (filterComposer) filterComposer.innerHTML = '<option value="">Compositores</option>';
    if (filterBook) filterBook.innerHTML = '<option value="">Referência</option>';
    
    composers.forEach(c => {
        if (filterComposer) {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            filterComposer.appendChild(opt);
        }
    });
    books.forEach(b => {
        if (filterBook) {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            filterBook.appendChild(opt);
        }
    });
}

function getViewMode() {
    let mode = 'all';
    if (viewModeRadios) {
        viewModeRadios.forEach(r => { if (r.checked) mode = r.value; });
    }
    return mode;
}

// ============================================================
// PDF
// ============================================================
function openPdfPreview(title, url) {
    if (!url || url.trim() === '') {
        alert('Partitura não disponível para esta música.');
        return;
    }
    if (pdfPreviewTitle) pdfPreviewTitle.textContent = `Partitura: ${title}`;
    if (pdfIframe) pdfIframe.src = url;
    if (pdfPreviewPanel) pdfPreviewPanel.style.display = 'flex';
    if (resizerRight) resizerRight.style.display = 'flex';
}
function closePdfPreview() {
    if (pdfPreviewPanel) pdfPreviewPanel.style.display = 'none';
    if (resizerRight) resizerRight.style.display = 'none';
    if (pdfIframe) pdfIframe.src = '';
}

// ============================================================
// VIEW TOGGLE
// ============================================================
function toggleViewMode() {
    isListView = !isListView;
    const icon = document.getElementById('viewIcon');
    const label = document.getElementById('viewLabel');
    if (isListView) {
        if (icon) icon.textContent = '☰';
        if (label) label.textContent = 'Lista';
        if (catalogGrid) catalogGrid.className = 'catalog-list';
    } else {
        if (icon) icon.textContent = '▦';
        if (label) label.textContent = 'Grade';
        if (catalogGrid) catalogGrid.className = 'catalog-grid';
    }
    renderCatalog();
}

// ============================================================
// TOGGLE PLAYLIST (mostrar/esconder)
// ============================================================
function togglePlaylist(type) {
    if (type === 'video') {
        videoListVisible = !videoListVisible;
        const el = document.getElementById('videoPlaylistItems');
        if (el) el.classList.toggle('hidden', !videoListVisible);
    } else if (type === 'mp3') {
        mp3ListVisible = !mp3ListVisible;
        const el = document.getElementById('mp3PlaylistItems');
        if (el) el.classList.toggle('hidden', !mp3ListVisible);
    }
}

// ============================================================
// MAPEAMENTO AUTOMÁTICO DINÂMICO DO GITHUB
// ============================================================
async function escanearAudiosGithub() {
    try {
        const resposta = await fetch(LINK_DA_PASTA_MP3);
        const html = await resposta.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        
        arquivosDisponiveisNoGithub = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.endsWith('.mp3')) {
                // Remove a extensão .mp3 para obter o id correspondente do banco
                const idMusica = href.replace('.mp3', '');
                arquivosDisponiveisNoGithub.push(parseInt(idMusica, 10));
            }
        });
        console.log("Áudios identificados no GitHub (IDs):", arquivosDisponiveisNoGithub);
    } catch (e) {
        console.warn("Não foi possível listar o diretório do GitHub diretamente. Usando mapeamento sob demanda.");
    }
}

// ============================================================
// FUNÇÃO PRINCIPAL DE REPRODUÇÃO (YOUTUBE EMBED LOCAL SEGURO)
// ============================================================
function playMusic(musicId, forceMp3 = false) {
    if (typeof musicDatabase === 'undefined') return;
    const music = musicDatabase.find(m => m.id === musicId);
    if (!music) return;

    const ytId = localGetYouTubeId(music.youtubeUrl);
    
    // Define a URL do MP3 dinamicamente baseada na pasta raiz do seu GitHub Pages + ID da música
    const urlMp3Github = `${LINK_DA_PASTA_MP3}${music.id}.mp3`;
    
    // Verifica se o MP3 está disponível (seja no banco ou escaneado no repositório)
    const hasMp3 = (music.mp3Url && music.mp3Url.trim() !== '') || arquivosDisponiveisNoGithub.includes(music.id) || forceMp3;

    if (forceMp3 && !hasMp3) {
        alert('MP3 não disponível para esta música no GitHub.');
        return;
    }
    if (!forceMp3 && !ytId && !hasMp3) {
        alert('Nenhuma mídia disponível para esta música.');
        return;
    }

    currentlyPlayingMusicId = musicId;
    if (currentPlayingTitle) currentPlayingTitle.textContent = music.title;
    if (currentPlayingMeta) currentPlayingMeta.textContent = `${music.composer} | ${music.book}`;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (playerLeft) playerLeft.innerHTML = '';

    // ===== MP3 =====
    if (forceMp3 || (!ytId && hasMp3)) {
        const audio = document.createElement('audio');
        // Usa a URL do Github vinculada ao ID como prioridade
        audio.src = (music.mp3Url && music.mp3Url.trim() !== '') ? music.mp3Url : urlMp3Github;
        audio.controls = true;
        audio.autoplay = true;
        audio.style.width = '100%';
        audio.style.height = '50px';
        audio.style.background = '#1a1a1a';
        audio.style.borderRadius = '4px';
        
        if (playerLeft) playerLeft.appendChild(audio);
        currentAudio = audio;
        activePlaylistType = 'mp3';
        audio.addEventListener('ended', () => playNext());
    } 
    // ===== YOUTUBE (NATIVO SEM POSTMESSAGE / ERRO DE ORIGEM) =====
    else if (ytId && !forceMp3) {
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-player-' + musicId;
        // Removido o enablejsapi=1 para bloquear disparos de postMessage locais impeditivos
        iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        
        if (playerLeft) playerLeft.appendChild(iframe);
        activePlaylistType = 'video';
    }

    document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing-now'));
    const card = document.getElementById(`card-${musicId}`);
    if (card) card.classList.add('playing-now');

    updatePlaylistUI();
}

// ============================================================
// FUNÇÕES DAS PLAYLISTS
// ============================================================
function addToVideoPlaylist(musicId) {
    if (typeof musicDatabase === 'undefined') return;
    const music = musicDatabase.find(m => m.id === musicId);
    if (!music || !localGetYouTubeId(music.youtubeUrl)) {
        alert('Vídeo não disponível para esta música.');
        return;
    }
    if (!videoPlaylist.includes(musicId)) {
        videoPlaylist.push(musicId);
        updatePlaylistUI();
        feedbackButton(musicId, 'btn-add-video', '✅');
    }
}

function addToMp3Playlist(musicId) {
    if (!videoPlaylist.includes(musicId)) {
        mp3Playlist.push(musicId);
        updatePlaylistUI();
        feedbackButton(musicId, 'btn-add-mp3', '✅');
    }
}

function feedbackButton(musicId, className, text) {
    const btn = document.querySelector(`#card-${musicId} .${className}`);
    if (btn) {
        const original = btn.textContent;
        btn.textContent = text;
        btn.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.backgroundColor = '';
        }, 1200);
    }
}

// [Mantidas as funções auxiliares de playlist: removeFromPlaylist, clearPlaylist, playVideoPlaylistItem, playMp3PlaylistItem, playNext, playPrevious, savePlaylist, loadPlaylists, exportPlaylist sem alterações de lógica para não quebrar sua estrutura]
function removeFromPlaylist(type, index) {
    if (type === 'video') {
        videoPlaylist.splice(index, 1);
        if (activeVideoIndex === index) activeVideoIndex = -1;
        else if (activeVideoIndex > index) activeVideoIndex--;
    } else if (type === 'mp3') {
        mp3Playlist.splice(index, 1);
        if (activeMp3Index === index) activeMp3Index = -1;
        else if (activeMp3Index > index) activeMp3Index--;
    }
    updatePlaylistUI();
}

function clearPlaylist(type) {
    if (type === 'video') {
        if (videoPlaylist.length === 0) return;
        if (confirm('Limpar fila de vídeos?')) {
            videoPlaylist = [];
            activeVideoIndex = -1;
            updatePlaylistUI();
        }
    } else if (type === 'mp3') {
        if (mp3Playlist.length === 0) return;
        if (confirm('Limpar fila de MP3?')) {
            mp3Playlist = [];
            activeMp3Index = -1;
            updatePlaylistUI();
        }
    }
}

function updatePlaylistUI() {
    const vc = document.getElementById('videoPlaylistItems');
    if (vc) {
        vc.innerHTML = '';
        if (videoPlaylist.length === 0) {
            vc.innerHTML = `<div style="color:#bdc3c7;font-size:0.75rem;text-align:center;padding:5px;">Vazia</div>`;
        } else {
            videoPlaylist.forEach((id, idx) => {
                const song = musicDatabase.find(m => m.id === id);
                if (!song) return;
                const item = document.createElement('div');
                item.className = `playlist-item ${idx === activeVideoIndex ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="item-text" onclick="playVideoPlaylistItem(${idx})" title="${song.title}">
                        <strong>${idx+1}.</strong> ${song.title}
                    </div>
                    <span class="remove-item" onclick="removeFromPlaylist('video', ${idx})">&times;</span>
                `;
                vc.appendChild(item);
            });
        }
        vc.classList.toggle('hidden', !videoListVisible);
    }

    const mc = document.getElementById('mp3PlaylistItems');
    if (mc) {
        mc.innerHTML = '';
        if (mp3Playlist.length === 0) {
            mc.innerHTML = `<div style="color:#bdc3c7;font-size:0.75rem;text-align:center;padding:5px;">Vazia</div>`;
        } else {
            mp3Playlist.forEach((id, idx) => {
                const song = musicDatabase.find(m => m.id === id);
                if (!song) return;
                const item = document.createElement('div');
                item.className = `playlist-item ${idx === activeMp3Index ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="item-text" onclick="playMp3PlaylistItem(${idx})" title="${song.title}">
                        <strong>${idx+1}.</strong> ${song.title}
                    </div>
                    <span class="remove-item" onclick="removeFromPlaylist('mp3', ${idx})">&times;</span>
                `;
                mc.appendChild(item);
            });
        }
        mc.classList.toggle('hidden', !mp3ListVisible);
    }
}

function playVideoPlaylistItem(index) {
    if (index >= 0 && index < videoPlaylist.length) {
        activeVideoIndex = index;
        activePlaylistType = 'video';
        updatePlaylistUI();
        playMusic(videoPlaylist[index], false);
    }
}

function playMp3PlaylistItem(index) {
    if (index >= 0 && index < mp3Playlist.length) {
        activeMp3Index = index;
        activePlaylistType = 'mp3';
        updatePlaylistUI();
        playMusic(mp3Playlist[index], true);
    }
}

function playNext() {
    if (activePlaylistType === 'video') {
        if (activeVideoIndex + 1 < videoPlaylist.length) {
            playVideoPlaylistItem(activeVideoIndex + 1);
        }
    } else if (activePlaylistType === 'mp3') {
        if (activeMp3Index + 1 < mp3Playlist.length) {
            playMp3PlaylistItem(activeMp3Index + 1);
        }
    }
}

function playPrevious() {
    if (activePlaylistType === 'video') {
        if (activeVideoIndex - 1 >= 0) {
            playVideoPlaylistItem(activeVideoIndex - 1);
        }
    } else if (activePlaylistType === 'mp3') {
        if (activeMp3Index - 1 >= 0) {
            playMp3PlaylistItem(activeMp3Index - 1);
        }
    }
}

function savePlaylist(type) {
    const key = type === 'video' ? 'nbm_video_playlist' : 'nbm_mp3_playlist';
    const data = type === 'video' ? videoPlaylist : mp3Playlist;
    localStorage.setItem(key, JSON.stringify(data));
    alert(`✅ Playlist de ${type === 'video' ? 'vídeos' : 'MP3'} salva!`);
}

function loadPlaylists() {
    const v = localStorage.getItem('nbm_video_playlist');
    if (v) { videoPlaylist = JSON.parse(v); activeVideoIndex = -1; }
    const m = localStorage.getItem('nbm_mp3_playlist');
    if (m) { mp3Playlist = JSON.parse(m); activeMp3Index = -1; }
    updatePlaylistUI();
}

function exportPlaylist(type) {
    const data = type === 'video' ? videoPlaylist : mp3Playlist;
    if (data.length === 0) { alert('Playlist vazia!'); return; }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist_${type}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================
// RENDERIZAÇÃO DO CATÁLOGO (INTEGRADO COM GITHUB AUDIO)
// ============================================================
// ============================================================
// RENDERIZAÇÃO DO CATÁLOGO (CORRIGIDA PARA EXECUÇÃO LOCAL FILE://)
// ============================================================
function renderCatalog() {
    if (typeof musicDatabase === 'undefined') return;
    const query = searchGeneral ? searchGeneral.value.toLowerCase() : '';
    const selectedComposer = filterComposer ? filterComposer.value : '';
    const selectedBook = filterBook ? filterBook.value : '';
    const mode = getViewMode();

    let filtered = musicDatabase.filter(music => {
        const matchGeneral = music.title.toLowerCase().includes(query) ||
            music.composer.toLowerCase().includes(query) ||
            music.book.toLowerCase().includes(query);
        const matchComposer = selectedComposer === '' || music.composer === selectedComposer;
        const matchBook = selectedBook === '' || music.book === selectedBook;
        return matchGeneral && matchComposer && matchBook;
    });

    if (mode === 'single' && filtered.length > 0) filtered = [filtered[0]];
    if (catalogGrid) catalogGrid.innerHTML = '';

    if (filtered.length === 0) {
        if (catalogGrid) catalogGrid.innerHTML = `<div class="no-results">Nenhuma música encontrada.</div>`;
        return;
    }

    filtered.forEach(music => {
        const card = document.createElement('div');
        card.className = `music-card ${music.id === currentlyPlayingMusicId ? 'playing-now' : ''}`;
        card.id = `card-${music.id}`;
        const safeTitle = music.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        const hasPdf = music.pdfUrl && music.pdfUrl.trim() !== '';
        const hasVideo = localGetYouTubeId(music.youtubeUrl) !== null;
        
        // CORREÇÃO: Força o botão de MP3 a ficar ativo se houver link no banco OU se você configurou o link do GitHub
        const hasMp3 = (music.mp3Url && music.mp3Url.trim() !== '') || (LINK_DA_PASTA_MP3 && LINK_DA_PASTA_MP3.trim() !== '');

        const pdfBtn = `<button class="btn-view-pdf ${hasPdf ? '' : 'disabled'}" 
                            onclick="${hasPdf ? `openPdfPreview('${safeTitle}','${music.pdfUrl}')` : ''}">📄</button>`;
        const videoAddBtn = `<button class="btn-add-video ${hasVideo ? '' : 'disabled'}" 
                                onclick="${hasVideo ? `addToVideoPlaylist(${music.id})` : ''}">🎬</button>`;
        const mp3AddBtn = `<button class="btn-add-mp3 ${hasMp3 ? '' : 'disabled'}" 
                              onclick="${hasMp3 ? `addToMp3Playlist(${music.id})` : ''}">🎵</button>`;
        const playVideoBtn = `<button class="btn-play-video ${hasVideo ? '' : 'disabled'}" 
                                 onclick="${hasVideo ? `playMusic(${music.id}, false)` : ''}">▶️</button>`;
        const playMp3Btn = `<button class="btn-play-mp3 ${hasMp3 ? '' : 'disabled'}" 
                                onclick="${hasMusicMp3Check(music) ? `playMusic(${music.id}, true)` : `playMusic(${music.id}, true)`}">🎧</button>`;

        card.innerHTML = `
            <div class="music-info">
                <h3>${music.title} - ${music.composer}</h3>
                <div class="music-meta">
                    ${isListView ?
                        `<p>${music.book ? '📖 ' + music.book : ''}</p>` :
                        `<p><strong>Compositor:</strong> ${music.composer}</p>
                         <p><strong>Livro:</strong> ${music.book}</p>`
                    }
                </div>
            </div>
            <div class="actions">
                ${pdfBtn}
                ${videoAddBtn}
                ${mp3AddBtn}
                ${playVideoBtn}
                ${playMp3Btn}
            </div>
        `;
        if (catalogGrid) catalogGrid.appendChild(card);
    });
}

// Função auxiliar para evitar travamento de renderização local
function hasMusicMp3Check(music) {
    return (music.mp3Url && music.mp3Url.trim() !== '') || arquivosDisponiveisNoGithub.includes(music.id);
}

// ============================================================
// INICIALIZAÇÃO CORRIGIDA (SEM TRAVAR NO ERRO 404)
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
    initFilters();
    loadPlaylists();
    
    // Tenta escanear, se falhar por segurança local, o catálogo abre do mesmo jeito
    await escanearAudiosGithub();
    
    renderCatalog();
    
    const videoItems = document.getElementById('videoPlaylistItems');
    const mp3Items = document.getElementById('mp3PlaylistItems');
    if (videoItems) videoItems.classList.remove('hidden');
    if (mp3Items) mp3Items.classList.remove('hidden');
    
    videoListVisible = true;
    mp3ListVisible = true;
});

// ============================================================
// RESIZERS
// ============================================================
function setupResizer(resizer, target, side) {
    if (!resizer || !target) return;
    let startX, startWidth;
    resizer.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(target).width, 10);
        resizer.classList.add('dragging');
        if (pdfIframe) pdfIframe.style.pointerEvents = 'none';
        const doDrag = (ev) => {
            if (side === 'left') target.style.width = (startWidth + ev.clientX - startX) + 'px';
            else if (side === 'right') target.style.width = (startWidth - (ev.clientX - startX)) + 'px';
        };
        const stopDrag = () => {
            resizer.classList.remove('dragging');
            if (pdfIframe) pdfIframe.style.pointerEvents = 'auto';
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    });
}
setupResizer(resizerLeft, sidebar, 'left');
setupResizer(resizerRight, pdfPreviewPanel, 'right');

// ============================================================
// EVENT LISTENERS
// ============================================================
if (searchGeneral) searchGeneral.addEventListener('input', renderCatalog);
if (filterComposer) filterComposer.addEventListener('change', renderCatalog);
if (filterBook) filterBook.addEventListener('change', renderCatalog);
if (viewModeRadios) viewModeRadios.forEach(r => r.addEventListener('change', renderCatalog));
if (btnClosePreview) btnClosePreview.addEventListener('click', closePdfPreview);
if (btnClear) {
    btnClear.addEventListener('click', () => {
        searchGeneral.value = '';
        filterComposer.value = '';
        filterBook.value = '';
        viewModeRadios[0].checked = true;
        closePdfPreview();
        renderCatalog();
    });
}

// ============================================================
// INICIALIZAÇÃO ASSÍNCRONA COMPLETA
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
    initFilters();
    loadPlaylists();
    
    // 1. Escaneia quais áudios existem no servidor do GitHub Pages antes de renderizar
    await escanearAudiosGithub();
    
    // 2. Renderiza a tabela do catálogo aplicando as travas corretas nos botões de fone de ouvido
    renderCatalog();
    
    // Aplica estado inicial dos toggles (visível)
    const videoItems = document.getElementById('videoPlaylistItems');
    const mp3Items = document.getElementById('mp3PlaylistItems');
    if (videoItems) videoItems.classList.remove('hidden');
    if (mp3Items) mp3Items.classList.remove('hidden');
    
    videoListVisible = true;
    mp3ListVisible = true;
});