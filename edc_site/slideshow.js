function startSlideshows() {
  document.querySelectorAll('.slideshow').forEach(container => {
    if (container.dataset.slideshowInit === 'true') return;

    const images = container.querySelectorAll('img');
    let index = 0;
    if (images.length === 0) return;
    images[index].classList.add('active');
    container.dataset.slideshowInit = 'true';
    setInterval(() => {
      images[index].classList.remove('active');
      index = (index + 1) % images.length;
      images[index].classList.add('active');
    }, 3000);
  });
}

document.addEventListener('DOMContentLoaded', startSlideshows);
document.addEventListener('slideshows:refresh', startSlideshows);
