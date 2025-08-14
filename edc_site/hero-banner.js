// Dynamically load hero background images from images/banner
// Randomize order and rotate every 3 seconds

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  fetch('./images/banner/banner-images.json')
    .then(response => response.json())
    .then(files => {
      files = files
        .filter(name => name.match(/\.(jpe?g|png|gif)$/i))
        .map(name => `images/banner/${name}`);

      if (files.length === 0) return;

      // Shuffle the array for random order
      for (let i = files.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [files[i], files[j]] = [files[j], files[i]];
      }

      // Preload images
      files.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      let index = 0;
      hero.style.backgroundImage = `url('${files[index]}')`;
      setInterval(() => {
        index = (index + 1) % files.length;
        hero.style.backgroundImage = `url('${files[index]}')`;
      }, 3000);
    })
    .catch(err => {
      console.error('Failed to load banner images', err);
    });
});
