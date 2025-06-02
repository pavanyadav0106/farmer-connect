document.addEventListener('DOMContentLoaded', () => {
  let index = 0;
  const testimonials = document.querySelectorAll('.testimonial');
  
  function showTestimonial() {
    testimonials.forEach(t => t.classList.remove('active'));
    testimonials[index].classList.add('active');
    index = (index + 1) % testimonials.length;
  }
  
  showTestimonial();
  setInterval(showTestimonial, 4000);
});