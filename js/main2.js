// ============================================================
// LINK DO REPOSITÓRIO GITHUB (ÁUDIOS MP3)
// ============================================================
const LINK_DA_PASTA_MP3 = "https://albertinosesc.github.io/audionbm/";

// Variável global para rastrear quais IDs de áudio realmente existem no GitHub
let arquivosDisponiveisNoGithub = [];

// Guarda a música ativa inteira para os botões do cabeçalho saberem o que tocar
let currentActiveMusic = null;

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
const pdfIframe = document.getElementById('pdfIframe'); // Primeiro visualizador
const btnClosePreview = document.getElementById('btnClosePreview');
const currentPlayingTitle = document.getElementById('currentPlayingTitle');
const currentPlayingMeta = document.getElementById('currentPlayingMeta');
const playerLeft = document.getElementById('playerLeft');

// Segundo visualizador de PDF (Gerado dinamicamente)
let pdfIframe2 = document.getElementById('pdfIframe2');

// Elementos de controle dinâmicos das páginas e áudio
let btnView1Page = null;
let btnView2Pages = null;
let btnFullscreen = null;
let btnHeaderPlayVideo = null;
let btnHeaderPlayMp3 = null;

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

let videoListVisible = true;
let mp3ListVisible = true;

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
// CRIAÇÃO E GERENCIAMENTO DOS BOTÕES NO TOPO DO PDF (INCLUINDO AUDIO/VÍDEO)
// ============================================================
function injectPdfControlButtons() {
    const header = document.querySelector('.pdf-preview-header');
    if (!header) return;

    // Se os controles já existirem, nós os removemos para recriar com os botões certos da música atual
    const antigoContainer = document.getElementById('pdfCustomControls');
    if (antigoContainer) antigoContainer.remove();

    const controlWrapper = document.createElement('div');
    controlWrapper.id = 'pdfCustomControls';
    controlWrapper.style.display = 'flex';
    controlWrapper.style.gap = '6px';
    controlWrapper.style.alignItems = 'center';
    controlWrapper.style.marginRight = '15px';

    if (!currentActiveMusic) return;

    const ytId = localGetYouTubeId(currentActiveMusic.youtubeUrl) !== null;
    const hasMp3 = (currentActiveMusic.mp3Url && currentActiveMusic.mp3Url.trim() !== '') || arquivosDisponiveisNoGithub.includes(currentActiveMusic.id);

    // Estrutura HTML contendo layout de páginas E players de áudio/vídeo imediatos
    controlWrapper.innerHTML = `
        <button id="btnHeaderPlayVideo" class="${ytId ? '' : 'disabled'}" style="padding: 5px 9px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; border: 1px solid #555; background: #e74c3c; color: #fff; font-weight: bold; ${ytId ? '' : 'opacity:0.4; pointer-events:none;'}">▶️ Vídeo</button>
        <button id="btnHeaderPlayMp3" class="${hasMp3 ? '' : 'disabled'}" style="padding: 5px 9px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; border: 1px solid #555; background: #9b59b6; color: #fff; font-weight: bold; margin-right: 15px; ${hasMp3 ? '' : 'opacity:0.4; pointer-events:none;'}">🎧 Áudio</button>
        
        <button id="btnView1Page" style="padding: 5px 9px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; border: 1px solid #555; background: #3498db; color: #fff; font-weight: bold;">📄 1 Pág</button>
        <button id="btnView2Pages" style="padding: 5px 9px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; font-weight: bold;">📖 2 Págs</button>
        <button id="btnFullscreen" style="padding: 5px 9px; font-size: 0.85rem; cursor: pointer; border-radius: 4px; border: 1px solid #555; background: #27ae60; color: #fff; font-weight: bold;">🖵 Tela Cheia</button>
    `;

    header.insertBefore(controlWrapper, btnClosePreview);

    btnView1Page = document.getElementById('btnView1Page');
    btnView2Pages = document.getElementById('btnView2Pages');
    btnFullscreen = document.getElementById('btnFullscreen');
    btnHeaderPlayVideo = document.getElementById('btnHeaderPlayVideo');
    btnHeaderPlayMp3 = document.getElementById('btnHeaderPlayMp3');

    // Escutas dos eventos de cliques
    btnView1Page.addEventListener('click', () => setPdfLayout(1));
    btnView2Pages.addEventListener('click', () => setPdfLayout(2));
    btnFullscreen.addEventListener('click', togglePdfFullscreen);
    
    if (ytId) {
        btnHeaderPlayVideo.addEventListener('click', () => playMusic(currentActiveMusic.id, false));
    }
    if (hasMp3) {
        btnHeaderPlayMp3.addEventListener('click', () => playMusic(currentActiveMusic.id, true));
    }
}

function setPdfLayout(pagesCount) {
    if (!currentActiveMusic || !currentActiveMusic.pdfUrl) return;
    
    let urlFinal = currentActiveMusic.pdfUrl.trim();
    if (!urlFinal.startsWith('http') && !urlFinal.startsWith('/')) {
        urlFinal = './' + urlFinal;
    }

    const iframeContainer = pdfPreviewPanel;

    if (pagesCount === 1) {
        if (pdfIframe) {
            pdfIframe.src = `${urlFinal}#page=1&view=FitH`;
            pdfIframe.style.width = '100%';
            pdfIframe.style.height = 'calc(100% - 50px)';
        }
        if (pdfIframe2) {
            pdfIframe2.src = '';
            pdfIframe2.style.display = 'none';
        }
        if (btnView1Page) btnView1Page.style.background = '#3498db';
        if (btnView2Pages) btnView2Pages.style.background = '#222';

    } else if (pagesCount === 2) {
        if (pdfIframe) {
            pdfIframe.src = `${urlFinal}#page=1&view=FitH`;
            pdfIframe.style.width = '50%';
            pdfIframe.style.height = 'calc(100% - 50px)';
            pdfIframe.style.float = 'left';
        }
        
        if (!pdfIframe2) {
            pdfIframe2 = document.createElement('iframe');
            pdfIframe2.id = 'pdfIframe2';
            pdfIframe2.className = 'pdf-frame';
            pdfIframe2.style.border = '0';
            pdfIframe2.style.height = 'calc(100% - 50px)';
            if (iframeContainer) iframeContainer.appendChild(pdfIframe2);
        }
        
        pdfIframe2.src = `${urlFinal}#page=2&view=FitH`;
        pdfIframe2.style.width = '50%';
        pdfIframe2.style.float = 'right';
        pdfIframe2.style.display = 'block';

        if (btnView1Page) btnView1Page.style.background = '#222';
        if (btnView2Pages) btnView2Pages.style.background = '#3498db';
    }
}

function togglePdfFullscreen() {
    if (!pdfPreviewPanel) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
        if (btnFullscreen) btnFullscreen.innerHTML = "🖵 Tela Cheia";
    } else {
        pdfPreviewPanel.requestFullscreen().then(() => {
            if (btnFullscreen) btnFullscreen.innerHTML = "❌ Sair Fila";
        }).catch(err => {
            alert("Não foi possível ativar a tela cheia: " + err.message);
        });
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && btnFullscreen) {
        btnFullscreen.innerHTML = "🖵 Tela Cheia";
    }
});

// ============================================================
// PDF (ABRIR PREVIEW INICIAL - CONFIGURADO PARA 1 PÁGINA PADRÃO)
// ============================================================
function openPdfPreview(title, urlString) {
    if (!urlString || urlString.trim() === '') {
        alert('Partitura não disponível para esta música.');
        return;
    }

    if (typeof musicDatabase === 'undefined') return;
    
    // Localiza e salva o objeto completo da música ativa
    const music = musicDatabase.find(m => m.title === title || m.pdfUrl === urlString);
    if (music) {
        currentActiveMusic = music;
    } else {
        currentActiveMusic = { id: Date.now(), title: title, pdfUrl: urlString, youtubeUrl: '', mp3Url: '' };
    }

    if (pdfPreviewTitle) pdfPreviewTitle.textContent = `Partitura: ${title}`;

    if (pdfPreviewPanel) pdfPreviewPanel.style.display = 'block';
    if (resizerRight) resizerRight.style.display = 'flex';

    injectPdfControlButtons();
    
    // MUDANÇA PEDIDA: Abre por padrão no formato de 1 Página sempre!
    setPdfLayout(1); 
}

function closePdfPreview() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    if (pdfPreviewPanel) pdfPreviewPanel.style.display = 'none';
    if (resizerRight) resizerRight.style.display = 'none';
    if (pdfIframe) pdfIframe.src = '';
    if (pdfIframe2) pdfIframe2.src = '';
    currentActiveMusic = null;
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
// MAPEAMENTO AUTOMÁTICO DINÂMICO E SEGURO DO GITHUB
// ============================================================
async function escanearAudiosGithub() {
    if (typeof musicDatabase === 'undefined' || !LINK_DA_PASTA_MP3) return;

    const checagens = musicDatabase.map(async (music) => {
        if (music.mp3Url && music.mp3Url.trim() !== '') {
            return { id: music.id, existe: true };
        }
        const urlDoAudio = `${LINK_DA_PASTA_MP3}${music.id}.mp3`;
        try {
            const resposta = await fetch(urlDoAudio, { method: 'HEAD' });
            return { id: music.id, existe: resposta.ok };
        } catch (error) {
            return { id: music.id, existe: false };
        }
    });

    const resultados = await Promise.all(checagens);
    arquivosDisponiveisNoGithub = resultados.filter(r => r.existe).map(r => r.id);
}

// ============================================================
// FUNÇÃO PRINCIPAL DE REPRODUÇÃO
// ============================================================
function playMusic(musicId, forceMp3 = false) {
    if (typeof musicDatabase === 'undefined') return;
    const music = musicDatabase.find(m => m.id === musicId);
    if (!music) return;

    const ytId = localGetYouTubeId(music.youtubeUrl);
    const urlMp3Github = `${LINK_DA_PASTA_MP3}${music.id}.mp3`;
    const hasMp3 = (music.mp3Url && music.mp3Url.trim() !== '') || arquivosDisponiveisNoGithub.includes(music.id);

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

    if (forceMp3 || (!ytId && hasMp3)) {
        const audio = document.createElement('audio');
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
    else if (ytId && !forceMp3) {
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-player-' + musicId;
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
    if (!mp3Playlist.includes(musicId)) {
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

// O restante do arquivo segue a mesma estrutura original prototipada
function clearPlaylist(type) {
    if (type === 'video') {
        if (videoPlaylist.length === 0) return;
        if (confirm('Limpar fila de vídeos?')) { videoPlaylist = []; activeVideoIndex = -1; updatePlaylistUI(); }
    } else if (type === 'mp3') {
        if (mp3Playlist.length === 0) return;
        if (confirm('Limpar fila de MP3?')) { mp3Playlist = []; activeMp3Index = -1; updatePlaylistUI(); }
    }
}

function exportPlaylist(type) {
    const lista = type === 'video' ? videoPlaylist : mp3Playlist;
    if(lista.length === 0) {
        alert('A fila está vazia para exportação.');
        return;
    }
    alert('Fila pronta para exportação: ' + JSON.stringify(lista));
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
                item.innerHTML = `<div class="item-text" onclick="playVideoPlaylistItem(${idx})" title="${song.title}"><strong>${idx+1}.</strong> ${song.title}</div><span class="remove-item" onclick="removeFromPlaylist('video', ${idx})">&times;</span>`;
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
                item.innerHTML = `<div class="item-text" onclick="playMp3PlaylistItem(${idx})" title="${song.title}"><strong>${idx+1}.</strong> ${song.title}</div><span class="remove-item" onclick="removeFromPlaylist('mp3', ${idx})">&times;</span>`;
                mc.appendChild(item);
            });
        }
        mc.classList.toggle('hidden', !mp3ListVisible);
    }
}

function playVideoPlaylistItem(index) {
    if (index >= 0 && index < videoPlaylist.length) { activeVideoIndex = index; activePlaylistType = 'video'; updatePlaylistUI(); playMusic(videoPlaylist[index], false); }
}
function playMp3PlaylistItem(index) {
    if (index >= 0 && index < mp3Playlist.length) { activeMp3Index = index; activePlaylistType = 'mp3'; updatePlaylistUI(); playMusic(mp3Playlist[index], true); }
}
function playNext() {
    if (activePlaylistType === 'video' && activeVideoIndex + 1 < videoPlaylist.length) playVideoPlaylistItem(activeVideoIndex + 1);
    else if (activePlaylistType === 'mp3' && activeMp3Index + 1 < mp3Playlist.length) playMp3PlaylistItem(activeMp3Index + 1);
}
function playPrevious() {
    if (activePlaylistType === 'video' && activeVideoIndex - 1 >= 0) playVideoPlaylistItem(activeVideoIndex - 1);
    else if (activePlaylistType === 'mp3' && activeMp3Index - 1 >= 0) playMp3PlaylistItem(activeMp3Index - 1);
}
function savePlaylist(type) {
    const key = type === 'video' ? 'nbm_video_playlist' : 'nbm_mp3_playlist';
    localStorage.setItem(key, JSON.stringify(type === 'video' ? videoPlaylist : mp3Playlist));
    alert(`✅ Playlist de ${type === 'video' ? 'vídeos' : 'MP3'} salva!`);
}
function loadPlaylists() {
    const v = localStorage.getItem('nbm_video_playlist'); if (v) { videoPlaylist = JSON.parse(v); activeVideoIndex = -1; }
    const m = localStorage.getItem('nbm_mp3_playlist'); if (m) { mp3Playlist = JSON.parse(m); activeMp3Index = -1; }
    updatePlaylistUI();
}

// ============================================================
// RENDERIZAÇÃO DO CATÁLOGO
// ============================================================
// ============================================================
// RENDERIZAÇÃO DO CATÁLOGO
// ============================================================
function renderCatalog() {
    if (typeof musicDatabase === 'undefined') return;
    const query = searchGeneral ? searchGeneral.value.toLowerCase() : '';
    const selectedComposer = filterComposer ? filterComposer.value : '';
    const selectedBook = filterBook ? filterBook.value : '';
    const mode = getViewMode();

    // VERIFICA SE HÁ ALGUM FILTRO ATIVO
    const hasFilter = query !== '' || selectedComposer !== '' || selectedBook !== '';

    // SE NÃO HOUVER FILTRO, MOSTRA MENSAGEM PARA DIGITAR ALGO
    if (!hasFilter) {
        if (catalogGrid) {
            catalogGrid.innerHTML = `<div class="no-results">🔍 Digite algo no filtro para buscar músicas</div>`;
        }
        return;
    }

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
        if (catalogGrid) catalogGrid.innerHTML = `<div class="no-results">Nenhuma música encontrada com os filtros atuais.</div>`;
        return;
    }

    filtered.forEach(music => {
        const card = document.createElement('div');
        card.className = `music-card ${music.id === currentlyPlayingMusicId ? 'playing-now' : ''}`;
        card.id = `card-${music.id}`;
        
        const safeTitle = music.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safePdfUrl = music.pdfUrl ? music.pdfUrl.replace(/'/g, "\\'") : '';

        const hasPdf = music.pdfUrl && music.pdfUrl.trim() !== '';
        const hasVideo = localGetYouTubeId(music.youtubeUrl) !== null;
        const hasMp3 = (music.mp3Url && music.mp3Url.trim() !== '') || (music.temMp3 === true) || arquivosDisponiveisNoGithub.includes(music.id);

        const pdfBtn = `<button class="btn-view-pdf ${hasPdf ? '' : 'disabled'}" 
                            onclick="${hasPdf ? `openPdfPreview('${safeTitle}','${safePdfUrl}')` : ''}">📄</button>`;
        const videoAddBtn = `<button class="btn-add-video ${hasVideo ? '' : 'disabled'}" 
                                onclick="${hasVideo ? `addToVideoPlaylist(${music.id})` : ''}">🎬</button>`;
        const mp3AddBtn = `<button class="btn-add-mp3 ${hasMp3 ? '' : 'disabled'}" 
                              onclick="${hasMp3 ? `addToMp3Playlist(${music.id})` : ''}">🎵</button>`;
        const playVideoBtn = `<button class="btn-play-video ${hasVideo ? '' : 'disabled'}" 
                                 onclick="${hasVideo ? `playMusic(${music.id}, false)` : ''}">▶️</button>`;
        const playMp3Btn = `<button class="btn-play-mp3 ${hasMp3 ? '' : 'disabled'}" 
                                onclick="${hasMp3 ? `playMusic(${music.id}, true)` : ''}">🎧</button>`;

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
        if (pdfIframe2) pdfIframe2.style.pointerEvents = 'none';
        const doDrag = (ev) => {
            if (side === 'left') target.style.width = (startWidth + ev.clientX - startX) + 'px';
            else if (side === 'right') target.style.width = (startWidth - (ev.clientX - startX)) + 'px';
        };
        const stopDrag = () => {
            resizer.classList.remove('dragging');
            if (pdfIframe) pdfIframe.style.pointerEvents = 'auto';
            if (pdfIframe2) pdfIframe2.style.pointerEvents = 'auto';
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
        searchGeneral.value = ''; filterComposer.value = ''; filterBook.value = '';
        viewModeRadios[0].checked = true; closePdfPreview(); renderCatalog();
    });
}

// ============================================================
// INICIALIZAÇÃO ASSÍNCRONA COMPLETA
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
    initFilters();
    loadPlaylists();
    await escanearAudiosGithub();
    renderCatalog();
    
    const videoItems = document.getElementById('videoPlaylistItems');
    const mp3Items = document.getElementById('mp3PlaylistItems');
    if (videoItems) videoItems.classList.remove('hidden');
    if (mp3Items) mp3Items.classList.remove('hidden');
    
    videoListVisible = true;
    mp3ListVisible = true;
});
