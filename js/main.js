// ============================================================
        // FUNÇÃO AUXILIAR (já em dados.js)
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
        // CARREGA API DO YOUTUBE
        // ============================================================
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

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
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            resizerLeft.style.display = sidebar.classList.contains('collapsed') ? 'none' : 'flex';
        });

        // ============================================================
        // FILTROS
        // ============================================================
        function initFilters() {
            if (typeof musicDatabase === 'undefined') return;
            const composers = [...new Set(musicDatabase.map(m => m.composer))].sort();
            const books = [...new Set(musicDatabase.map(m => m.book))].sort();
            filterComposer.innerHTML = '<option value="">Compositores</option>';
            filterBook.innerHTML = '<option value="">Referência</option>';
            composers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                filterComposer.appendChild(opt);
            });
            books.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                filterBook.appendChild(opt);
            });
        }

        function getViewMode() {
            let mode = 'all';
            viewModeRadios.forEach(r => { if (r.checked) mode = r.value; });
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
            pdfPreviewTitle.textContent = `Partitura: ${title}`;
            pdfIframe.src = url;
            pdfPreviewPanel.style.display = 'flex';
            resizerRight.style.display = 'flex';
        }
        function closePdfPreview() {
            pdfPreviewPanel.style.display = 'none';
            resizerRight.style.display = 'none';
            pdfIframe.src = '';
        }

        // ============================================================
        // VIEW TOGGLE
        // ============================================================
        function toggleViewMode() {
            isListView = !isListView;
            const icon = document.getElementById('viewIcon');
            const label = document.getElementById('viewLabel');
            if (isListView) {
                icon.textContent = '☰';
                label.textContent = 'Lista';
                catalogGrid.className = 'catalog-list';
            } else {
                icon.textContent = '▦';
                label.textContent = 'Grade';
                catalogGrid.className = 'catalog-grid';
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
                el.classList.toggle('hidden', !videoListVisible);
            } else if (type === 'mp3') {
                mp3ListVisible = !mp3ListVisible;
                const el = document.getElementById('mp3PlaylistItems');
                el.classList.toggle('hidden', !mp3ListVisible);
            }
        }

        // ============================================================
// YOUTUBE API READY
// ============================================================
function onYouTubeIframeAPIReady() {
    // Cria o container fixo para o YouTube
    let container = document.getElementById('youtube-player-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'youtube-player-container';
        container.style.width = '100%';
        container.style.height = '100%';
        playerLeft.appendChild(container);
    }

    // Se o globalPlayer já existir, destrua-o antes de recriar
    if (globalPlayer) {
        globalPlayer.destroy();
        globalPlayer = null;
    }

    globalPlayer = new YT.Player('youtube-player-container', {
        height: '100%',
        width: '100%',
        playerVars: {
            origin: window.location.origin,
            enablejsapi: 1,
            rel: 0,
            autoplay: 0 // não inicia automaticamente
        },
        events: {
            onReady: function() {
                console.log('YouTube Player pronto');
            },
            onStateChange: function(event) {
                if (event.data === YT.PlayerState.ENDED) {
                    playNext();
                }
            }
        }
    });
}
// ============================================================
// FUNÇÃO PRINCIPAL DE REPRODUÇÃO
// ============================================================
function playMusic(musicId, forceMp3 = false) {
    const music = musicDatabase.find(m => m.id === musicId);
    if (!music) return;

    const ytId = localGetYouTubeId(music.youtubeUrl);
    const hasMp3 = music.mp3Url && music.mp3Url.trim() !== '';

    // Validações
    if (forceMp3 && !hasMp3) {
        alert('MP3 não disponível para esta música.');
        return;
    }
    if (!forceMp3 && !ytId && !hasMp3) {
        alert('Nenhuma mídia disponível para esta música.');
        return;
    }

    // Atualiza informações
    currentlyPlayingMusicId = musicId;
    currentPlayingTitle.textContent = music.title;
    currentPlayingMeta.textContent = `${music.composer} | ${music.book}`;

    // --- LIMPEZA COMPLETA DO PLAYER ANTERIOR ---
    // Para o áudio (se existir)
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Remove todos os elementos filhos do playerLeft
    playerLeft.innerHTML = '';

    // Se forçar MP3 ou não houver YouTube, usa áudio
    if (forceMp3 || (!ytId && hasMp3)) {
        // Cria player de áudio
        const audio = document.createElement('audio');
        audio.src = music.mp3Url;
        audio.controls = true;
        audio.autoplay = true;
        audio.style.width = '100%';
        audio.style.height = '50px';
        audio.style.background = '#1a1a1a';
        audio.style.borderRadius = '4px';
        playerLeft.appendChild(audio);
        currentAudio = audio;
        activePlaylistType = 'mp3';
        audio.addEventListener('ended', () => playNext());

        // Atualiza UI
        document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing-now'));
        const card = document.getElementById(`card-${musicId}`);
        if (card) card.classList.add('playing-now');
        updatePlaylistUI();
        return;
    }

    // --- VÍDEO (YouTube) ---
    // Recria o container do YouTube
    const container = document.createElement('div');
    container.id = 'youtube-player-container';
    container.style.width = '100%';
    container.style.height = '100%';
    playerLeft.appendChild(container);

    // Destroi o player antigo se existir
    if (globalPlayer) {
        try {
            globalPlayer.destroy();
        } catch (e) { /* ignore */ }
        globalPlayer = null;
    }

    // Cria um novo player com o ID do vídeo
    globalPlayer = new YT.Player('youtube-player-container', {
        height: '100%',
        width: '100%',
        videoId: ytId,
        playerVars: {
            origin: window.location.origin,
            enablejsapi: 1,
            rel: 0,
            autoplay: 1 // toca automaticamente
        },
        events: {
            onReady: function(event) {
                event.target.playVideo();
            },
            onStateChange: function(event) {
                if (event.data === YT.PlayerState.ENDED) {
                    playNext();
                }
            }
        }
    });

    activePlaylistType = 'video';

    // Destaca o card
    document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing-now'));
    const card = document.getElementById(`card-${musicId}`);
    if (card) card.classList.add('playing-now');

    updatePlaylistUI();
}

        // ============================================================
        // FUNÇÕES DAS PLAYLISTS
        // ============================================================
        function addToVideoPlaylist(musicId) {
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
            const music = musicDatabase.find(m => m.id === musicId);
            if (!music || !music.mp3Url || music.mp3Url.trim() === '') {
                alert('MP3 não disponível para esta música.');
                return;
            }
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
            // Vídeos
            const vc = document.getElementById('videoPlaylistItems');
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
            // Aplica estado de visibilidade
            vc.classList.toggle('hidden', !videoListVisible);

            // MP3
            const mc = document.getElementById('mp3PlaylistItems');
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

        // ============================================================
        // PERSISTÊNCIA
        // ============================================================
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
        // RENDERIZAÇÃO DO CATÁLOGO (com 5 botões e verificação de links)
        // ============================================================
        function renderCatalog() {
            if (typeof musicDatabase === 'undefined') return;
            const query = searchGeneral.value.toLowerCase();
            const selectedComposer = filterComposer.value;
            const selectedBook = filterBook.value;
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
            catalogGrid.innerHTML = '';

            if (filtered.length === 0) {
                catalogGrid.innerHTML = `<div class="no-results">Nenhuma música encontrada.</div>`;
                return;
            }

            filtered.forEach(music => {
                const card = document.createElement('div');
                card.className = `music-card ${music.id === currentlyPlayingMusicId ? 'playing-now' : ''}`;
                card.id = `card-${music.id}`;
                const safeTitle = music.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

                // Verifica disponibilidade
                const hasPdf = music.pdfUrl && music.pdfUrl.trim() !== '';
                const hasVideo = localGetYouTubeId(music.youtubeUrl) !== null;
                const hasMp3 = music.mp3Url && music.mp3Url.trim() !== '';

                // Cria botões com classe 'disabled' se não disponível
                const pdfBtn = `<button class="btn-view-pdf ${hasPdf ? '' : 'disabled'}" 
                                    onclick="${hasPdf ? `openPdfPreview('${safeTitle}','${music.pdfUrl}')` : ''}">📄</button>`;
                const videoAddBtn = `<button class="btn-add-video ${hasVideo ? '' : 'disabled'}" 
                                        onclick="${hasVideo ? `addToVideoPlaylist(${music.id})` : ''}">🎬</button>`;
                const mp3AddBtn = `<button class="btn-add-mp3 ${hasMp3 ? '' : 'disabled'}" 
                                      onclick="${hasMp3 ? `addToMp3Playlist(${music.id})` : ''}">🎵</button>`;
                const playVideoBtn = `<button class="btn-play-video ${hasVideo ? '' : 'disabled'}" 
                                         onclick="${hasVideo ? `playMusic(${music.id}, false)` : ''}">▶️</button>`;
                const playMp3Btn = hasMp3 ? 
                    `<button class="btn-play-mp3" onclick="playMusic(${music.id}, true)">🎧</button>` :
                    `<button class="btn-play-mp3 disabled">🎧</button>`;

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
                catalogGrid.appendChild(card);
            });
        }

        // ============================================================
        // RESIZERS
        // ============================================================
        function setupResizer(resizer, target, side) {
            let startX, startWidth;
            resizer.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                startWidth = parseInt(getComputedStyle(target).width, 10);
                resizer.classList.add('dragging');
                pdfIframe.style.pointerEvents = 'none';
                const doDrag = (ev) => {
                    if (side === 'left') target.style.width = (startWidth + ev.clientX - startX) + 'px';
                    else if (side === 'right') target.style.width = (startWidth - (ev.clientX - startX)) + 'px';
                };
                const stopDrag = () => {
                    resizer.classList.remove('dragging');
                    pdfIframe.style.pointerEvents = 'auto';
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
        searchGeneral.addEventListener('input', renderCatalog);
        filterComposer.addEventListener('change', renderCatalog);
        filterBook.addEventListener('change', renderCatalog);
        viewModeRadios.forEach(r => r.addEventListener('change', renderCatalog));
        btnClosePreview.addEventListener('click', closePdfPreview);
        btnClear.addEventListener('click', () => {
            searchGeneral.value = '';
            filterComposer.value = '';
            filterBook.value = '';
            viewModeRadios[0].checked = true;
            closePdfPreview();
            renderCatalog();
        });

        // ============================================================
        // INICIALIZAÇÃO
        // ============================================================
        window.addEventListener('DOMContentLoaded', () => {
            initFilters();
            loadPlaylists();
            renderCatalog();
            // Aplica estado inicial dos toggles (visível)
            document.getElementById('videoPlaylistItems').classList.remove('hidden');
            document.getElementById('mp3PlaylistItems').classList.remove('hidden');
            videoListVisible = true;
            mp3ListVisible = true;
        });
