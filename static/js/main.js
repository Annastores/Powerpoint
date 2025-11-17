const videoEl = document.getElementById('slideVideo');
const imgEl = document.getElementById('slideImage');
const playBtn = document.getElementById('playButton');
const container = document.getElementById('slideContainer');

let slides = [];
let slideKeys = [];
let currentSlideIndex = 0;
let loaded=  false
let videoonprogres = false
// Получаем слайды с бекенда
fetch('/slides')
.then(res => res.json())
.then(data => {
    slides = data;
    slideKeys = Object.keys(slides);
    preloadSlides(slides).then(() => {
        playBtn.style.display = 'block'; // показать кнопку Play после загрузки
    });
});

// Предзагрузка всех видео и изображений
function preloadSlides(slides) {
    let promises = slideKeys.map(key => {
        return new Promise(resolve => {
            const slide = slides[key];
            if(slide.type === 'video') {
                let vid = document.createElement('video');

                vid.src = slide.src;
                vid.preload = "auto";
                vid.oncanplaythrough = resolve;
            } else if(slide.type === 'image') {
                let img = new Image();
                img.src = slide.src;
                img.onload = () => resolve();
            }
        });
    });
    return Promise.all(promises);
}

// Нажатие кнопки Play
playBtn.addEventListener('click', () => {
    loaded = true
    playBtn.style.display = 'none';
    // Переключение в полноэкранный режим
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    }
    showSlide(0)

});

// Показ слайда
function showSlide(index) {
    if(index < 0 || index >= slideKeys.length) return;

    currentSlideIndex = index;
    const slide = slides[slideKeys[index]];

    videoEl.style.display = 'none';
    imgEl.style.display = 'none';
    videoEl.pause();

    if(slide.type === 'video') {
        videoEl.src = slide.src;
        videoEl.style.display = 'block';
        videoEl.play();
        videoonprogres = true
        videoEl.onended = () => {showSlide(currentSlideIndex + 1);
            currentSlideIndex + 1
            function send(n) {
    fetch("/setSlide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: n })
    });
}
send(currentSlideIndex);
            videoonprogres = false;


        }
           
    } else if(slide.type === 'image') {
        imgEl.src = slide.src;
        imgEl.style.display = 'block';
    }
}
setInterval(() => {
    if (loaded == false && videoonprogres == false){ return}
 fetch("/currentSlide")
        .then(r => r.json())
        .then(data =>{ if(data.slide != currentSlideIndex){
            console.log(data.slide )
            console.log(currentSlideIndex)
            showSlide(data.slide)}});
}, 500);
    

