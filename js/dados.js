const musicDatabase = [
{ id: 23957, title: "23957 - Love Theme", composer: "Catherine Rollin", book: "Avulso", pdfUrl: "partituras/23957.pdf", youtubeUrl: "", mp3Url: "https://blog-imgs-201.fc2.com/n/b/m/nbmescolademusica/202607030237243ed.mp3", temMp3: true },
{ id: 11, title: "11 - 1st Inversion Boogie", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23958.pdf", youtubeUrl: "", mp3Url: "", temMp3: true },
{ id: 12, title: "12 - 2nd Inversion Rock", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23959.pdf", youtubeUrl: "", mp3Url: "", temMp3: true },
{ id: 13, title: "13 - A Visit to the Royal Court", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23960.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23961, title: "23961 - Acrobats", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23961.pdf", youtubeUrl: "", mp3Url: "", temMp3: false },
{ id: 23962, title: "23962 - Blue Grass", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23962.pdf", youtubeUrl: "", mp3Url: "", temMp3: false},
{ id: 23963, title: "23963 - Evening Serenade", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23963.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23964, title: "23964 - He's Got the Whole World In His Hands", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23964.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23965, title: "23965 - Minuet", composer: "Johann Christian Bach", book: "7029 - PDF", pdfUrl: "partituras/23965.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23966, title: "23966 - New Orleans Carnival", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23966.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23967, title: "23967 - Parallel Bars", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23967.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23968, title: "23968 - Romance", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23968.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23969, title: "23969 - Sonatina in C", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23969.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23970, title: "23970 - Space Ride", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23970.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23971, title: "23971 - Spanish Guitars", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23971.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23972, title: "23972 - Spooky House", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23972.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23973, title: "23973 - Swiss Music Boxх", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23973.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23974, title: "23974 - The Bee", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23974.pdf", youtubeUrl: "https://www.youtube.com/watch?v=Ih-zaPky4TU", mp3Url: "" },
{ id: 23975, title: "23975 - The Midnight Express", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23975.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23976, title: "23976 - The Mill Wheel", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23976.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23977, title: "23977 - The Streets of Laredo", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23977.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23978, title: "23978 - Wild Rider", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23978.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23979, title: "23979 - William Tell Overture", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23979.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23980, title: "23980 - Windsong", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23980.pdf", youtubeUrl: "", mp3Url: "" },
{ id: 23981, title: "23981 - Winter Celebration", composer: "James Bastien", book: "7029 - PDF", pdfUrl: "partituras/23981.pdf", youtubeUrl: "", mp3Url: "" }

];

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
