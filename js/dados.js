const musicDatabase = [
    {
        id: 1,
        title: "A Casa",
        composer: "Vinicius de Moraes / Toquinho",
        book: "Arca de Noé",
        pdfUrl: "partituras/a_casa.pdf",
        youtubeUrl: "https://www.youtube.com/watch?v=K3DEgVGA0Gs&list=RDK3DEgVGA0Gs&start_radio=1",
        mp3Url: "" // <-- sem MP3
    },
    {
        id: 2,
        title: "O Caderno",
        composer: "Toquinho",
        book: "Música na Infância Vol. 1",
        pdfUrl: "", // <-- sem PDF
        youtubeUrl: "https://www.youtube.com/watch?v=_0mpldsbZdc",
        mp3Url: "https://blog-imgs-201.fc2.com/n/b/m/nbmescolademusica/20260703001739f89.mp3"
    },
    {
        id: 23957,
        title: "Love Theme",
        composer: "Catherine Rollin",
        book: "Avulso",
        pdfUrl: "partituras/23957.pdf",
        youtubeUrl: "",
        mp3Url: "https://blog-imgs-201.fc2.com/n/b/m/nbmescolademusica/202607030237243ed.mp3" // só MP3
    },

    {
    id: 23958,
    title: "1st Inversion Boogie",
    composer: "James Bastien",
    book: "7029 - PDF",
    pdfUrl: "partituras/23958.pdf",
    youtubeUrl: "",
    mp3Url: ""
}
];

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
