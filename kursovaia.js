const container = document.querySelector('.slides-container');
const slides = document.querySelectorAll('.slide');
let isScrolling = false;
let currentSlide = 0;

// Функция для перехода к конкретному слайду
function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    
    slides[index].scrollIntoView({ behavior: 'smooth' });
    currentSlide = index;
    
    // Добавляем эффект появления (анимация)
    slides.forEach((slide, i) => {
        if (i === index) {
            slide.style.opacity = '1';
            slide.style.transform = 'scale(1)';
        } else {
            slide.style.opacity = '0.5';
            slide.style.transform = 'scale(0.98)';
        }
    });
}

// Отслеживаем прокрутку для определения текущего слайда
container.addEventListener('scroll', () => {
    if (!isScrolling) {
        isScrolling = true;
        setTimeout(() => {
            const slideHeight = window.innerHeight;
            const scrollPosition = container.scrollTop;
            currentSlide = Math.round(scrollPosition / slideHeight);
            goToSlide(currentSlide);
            isScrolling = false;
        }, 100);
    }
});

