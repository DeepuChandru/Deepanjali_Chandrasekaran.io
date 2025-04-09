// Hamburger menu toggle
const hamMenu = document.querySelector('.header__main-ham-menu');
const closeMenu = document.querySelector('.header__main-ham-menu-close');
const smMenu = document.querySelector('.header__sm-menu');
const smMenuLinks = document.querySelectorAll('.header__sm-menu-link a');

hamMenu.addEventListener('click', () => {
  smMenu.classList.add('header__sm-menu--active');
  hamMenu.classList.add('d-none');
  closeMenu.classList.remove('d-none');
});

closeMenu.addEventListener('click', () => {
  smMenu.classList.remove('header__sm-menu--active');
  hamMenu.classList.remove('d-none');
  closeMenu.classList.add('d-none');
});

smMenuLinks.forEach(link => {
  link.addEventListener('click', () => {
    smMenu.classList.remove('header__sm-menu--active');
    hamMenu.classList.remove('d-none');
    closeMenu.classList.add('d-none');
  });
});

// Typed.js init
const typed = new Typed('.typing', {
  strings: ["Data Analyst", "Data Scientist", "AI Enthusiast", "Software Engineer"],
  typeSpeed: 80,
  backSpeed: 50,
  loop: true,
  showCursor: true,
  cursorChar: "|",
  smartBackspace: true
});

// Back to Top button
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTop.style.opacity = '1';
    backToTop.style.pointerEvents = 'auto';
  } else {
    backToTop.style.opacity = '0';
    backToTop.style.pointerEvents = 'none';
  }
});
