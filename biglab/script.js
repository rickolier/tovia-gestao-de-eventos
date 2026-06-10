// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile menu
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Fade-up on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.servico-card, .pilar, .plano-card, .sobre__card, .extra, .contato__form, .sobre__text, .contato__text'
).forEach((el, i) => {
  el.classList.add('fade-up');
  if (i % 3 === 1) el.classList.add('fade-up-delay-1');
  if (i % 3 === 2) el.classList.add('fade-up-delay-2');
  observer.observe(el);
});

// Form submit
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Enviado! ✓';
  btn.style.background = '#22c55e';
  btn.style.color = '#fff';
  btn.style.borderColor = '#22c55e';
  setTimeout(() => {
    btn.textContent = 'Enviar Mensagem';
    btn.style = '';
    e.target.reset();
  }, 3000);
});
