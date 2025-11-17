const videoEl = document.getElementById('slideVideo');
const imgEl = document.getElementById('slideImage');
const playBtn = document.getElementById('playButton');
const container = document.getElementById('slideContainer');

let slides = {};
let slideKeys = [];
let currentSlideIndex = 0;
let loaded = false;
let videoonprogres = false;

// Получаем список слайдов
fetch('/slides')
.then(res => res.json())
.then(data => {
    slides = data;
    slideKeys = Object.keys(slides); // оставил ваш стиль: slides может быть объектом или массивом
    preloadSlides(slides, slideKeys).then(() => {
        playBtn.style.display = 'block'; // показать кнопку Play после предзагрузки
    }).catch(err => {
        console.error('Preload error:', err);
        // всё равно показать кнопку — пользователь кликнет и тогда загрузим в момент жеста
        playBtn.style.display = 'block';
    });
}).catch(err => {
    console.error('Ошибка получения /slides:', err);
    playBtn.style.display = 'block';
});

// Предзагрузка всех видео и изображений через fetch -> blob -> objectURL
function preloadSlides(slides, keys) {
    const promises = keys.map(key => {
        const slide = slides[key];
        if (!slide || !slide.src) return Promise.resolve();

        return fetch(slide.src, { method: 'GET' })
            .then(resp => {
                if (!resp.ok) throw new Error(`Failed to fetch ${slide.src}: ${resp.status}`);
                return resp.blob();
            })
            .then(blob => {
                // сохраняем object URL прямо в объекте слайда
                slide._blobUrl = URL.createObjectURL(blob);
                return Promise.resolve();
            })
            .catch(err => {
                console.warn('Не удалось предзагрузить', slide.src, err);
                // Не прерываем всё; пометим ошибку, чтобы при показе попытаться загрузить "на лету"
                slide._preloadError = true;
                return Promise.resolve();
            });
    });

    return Promise.all(promises);
}

// Нажатие кнопки Play
playBtn.addEventListener('click', () => {
    loaded = true;
    playBtn.style.display = 'none';

    // Переключение в полноэкранный режим
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    }

    // пользователь сделал жест — если предзагрузка не прошла, теперь можно грузить безопасно
    showSlide(0);
});

// Показ слайда
function showSlide(index) {
    if (index < 0 || index >= slideKeys.length) return;
    currentSlideIndex = index;
    const slide = slides[slideKeys[index]];
    if (!slide) return;

    // очистка
    videoEl.style.display = 'none';
    imgEl.style.display = 'none';
    try { videoEl.pause(); } catch(e){}

    if (slide.type === 'video') {
        // если предзагрузили blobURL - используем его, иначе используем оригинальный src
        const src = slide._blobUrl || slide.src;
        videoEl.src = src;
        // если это blobURL, load() достаточно; если обычный url, лучше вызвать load() тоже
        videoEl.load();
        videoEl.style.display = 'block';

        // Установим muted только если нужно — пользователь уже кликнул Play, поэтому это не обязательно.
        // Но если автоплей все ещё блокируется, можно uncomment: videoEl.muted = true;
        videoonprogres = true;

        // навешиваем обработчик onended — удаляем старый сначала чтобы не накапливать
        videoEl.onended = null;
        videoEl.onended = () => {
            videoEl.pause();
            // const next = currentSlideIndex + 1;
            // // отправляем индекс *текущего* слайда на сервер (или нового — выбирайте по логике)
            // sendSlideIndex(next);
            // videoonprogres = false;
            // showSlide(next);
        };

        // Попытка проиграть (пользователь уже кликнул Play => жест есть)
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn('video.play() failed:', err);
                // В случае ошибки — оставить видео на видимом, но пользователь сможет запустить вручную
            });
        }
    } else if (slide.type === 'image') {
    const src = slide._blobUrl || slide.src;

    imgEl.style.display = 'none';
    imgEl.src = ''; // сбрасываем старый кадр

    const tmp = new Image();
    tmp.onload = () => {
        imgEl.src = src;
        imgEl.style.display = 'block';
    };
    tmp.src = src; // загружаем в фоне
}
}

function sendSlideIndex(n) {
    fetch("/setSlide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: n })
    }).catch(e => console.warn('sendSlideIndex error', e));
}

// Поллинг текущего слайда с сервера (оставил ваш интервал)
setInterval(() => {
    if (loaded === false && videoonprogres === false) { return; }
    fetch("/currentSlide")
        .then(r => r.json())
        .then(data => {
            if (typeof data.slide === 'number' && data.slide !== currentSlideIndex) {
                showSlide(data.slide);
            }
        }).catch(err => {
            // игнорируем ошибки сети
        });
}, 500);

// Очистка objectURL при выгрузке страницы (опционально)
window.addEventListener('beforeunload', () => {
    for (const k of slideKeys) {
        const s = slides[k];
        if (s && s._blobUrl) {
            URL.revokeObjectURL(s._blobUrl);
        }
    }
});
