// ============================================================
// PDF (ABRE ARQUIVO ÚNICO LADO A LADO: PÁGINA 1 E PÁGINA 2)
// ============================================================
function openPdfPreview(title, urlString) {
    if (!urlString || urlString.trim() === '') {
        alert('Partitura não disponível para esta música.');
        return;
    }

    if (pdfPreviewTitle) pdfPreviewTitle.textContent = `Partitura: ${title}`;
    
    // Garante que o caminho do arquivo comece correto para evitar o 404 do GitHub Pages
    let urlFinal = urlString.trim();
    if (!urlFinal.startsWith('http') && !urlFinal.startsWith('/')) {
        urlFinal = './' + urlFinal;
    }

    const iframeContainer = pdfIframe ? pdfIframe.parentElement : null;

    // Configura o container para colocar os dois visualizadores lado a lado (row)
    if (iframeContainer) {
        iframeContainer.style.display = 'flex';
        iframeContainer.style.flexDirection = 'row';
        iframeContainer.style.gap = '10px';
        iframeContainer.style.width = '100%';
        iframeContainer.style.height = '100%';
    }

    // Primeiro visualizador (Lado Esquerdo): Abre o PDF forçando a Página 1
    if (pdfIframe) {
        pdfIframe.src = `${urlFinal}#page=1&view=FitH`;
        pdfIframe.style.width = '50%';
        pdfIframe.style.display = 'block';
    }

    // Cria ou configura o Segundo visualizador (Lado Direito)
    if (!pdfIframe2) {
        pdfIframe2 = document.createElement('iframe');
        pdfIframe2.id = 'pdfIframe2';
        pdfIframe2.style.border = '0';
        pdfIframe2.style.height = '100%';
        if (iframeContainer) iframeContainer.appendChild(pdfIframe2);
    }
    
    // Segundo visualizador (Lado Direito): Abre o MESMO PDF forçando a Página 2
    pdfIframe2.src = `${urlFinal}#page=2&view=FitH`;
    pdfIframe2.style.width = '50%';
    pdfIframe2.style.display = 'block';

    if (pdfPreviewPanel) pdfPreviewPanel.style.display = 'flex';
    if (resizerRight) resizerRight.style.display = 'flex';
}
