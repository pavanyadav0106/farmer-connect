


/* =======================
   SMOOTH STATS COUNTER
==========================*/
function animateCounter(id, target, duration = 1200) {
  const el = document.getElementById(id);
  let start = 0;
  const increment = target / (duration / 16);

  function update() {
    start += increment;
    if (start >= target) {
      el.innerText = target;
    } else {
      el.innerText = Math.floor(start);
      requestAnimationFrame(update);
    }
  }
  update();
}

animateCounter("statCrops", 125);
animateCounter("statOrders", 240);
animateCounter("statWeather", 12);
animateCounter("statMessages", 18);


/* =======================
   TESTIMONIAL SLIDER
==========================*/

let slideIndex = 0;
const slides = document.querySelectorAll(".testimonial");

function nextTestimonial() {
  slides.forEach(s => s.classList.remove("active"));
  slides[slideIndex].classList.add("active");
  slideIndex = (slideIndex + 1) % slides.length;
}

nextTestimonial();
setInterval(nextTestimonial, 3500);
