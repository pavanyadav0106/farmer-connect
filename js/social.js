  // Enhanced Splash Screen Functionality
        document.addEventListener('DOMContentLoaded', function() {
            const splashScreen = document.getElementById('splashScreen');
            const mainContent = document.getElementById('mainContent');
            
            // Fallback timer to ensure splash screen disappears
            const fallbackTimer = setTimeout(() => {
    if (splashScreen && splashScreen.parentNode) {
        splashScreen.classList.add('splash-screen-hiding');
        splashScreen.addEventListener('animationend', () => {
            splashScreen.remove();
            if (mainContent) {
                mainContent.classList.add('visible');
            }
        }, { once: true });
    }
}, 2300);

            // Primary timer with animation
            setTimeout(() => {
                clearTimeout(fallbackTimer); // Clear fallback if primary works
                
                if (splashScreen && splashScreen.parentNode) {
                    splashScreen.classList.add('splash-screen-hiding');
                    
                    const removeSplashScreen = () => {
                        if (splashScreen.parentNode) {
                            splashScreen.remove();
                        }
                        if (mainContent) {
                            mainContent.classList.add('visible');
                        }
                    };

                    // Use animationend event or fallback to setTimeout
                    splashScreen.addEventListener('animationend', removeSplashScreen, { once: true });
                    
                    // Fallback in case animationend doesn't fire
                    setTimeout(removeSplashScreen, 700);
                }
            }, 2300);
        });

        // Enhanced Testimonial Slider JavaScript
        const track = document.querySelector(".testimonial-track");
        const cards = document.querySelectorAll(".testimonial-card");
        const nextBtn = document.querySelector(".next");
        const prevBtn = document.querySelector(".prev");
        const dots = document.querySelectorAll(".dot");
        
        let index = 0;
        let autoSlideInterval;

        function updateSlider() {
            const width = cards[0].offsetWidth + 32; // card width + gap
            track.style.transform = `translateX(${-index * width}px)`;
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function nextSlide() {
            index = (index + 1) % cards.length;
            updateSlider();
        }

        function prevSlide() {
            index = (index - 1 + cards.length) % cards.length;
            updateSlider();
        }

        // Event Listeners
        nextBtn.addEventListener("click", nextSlide);
        prevBtn.addEventListener("click", prevSlide);

        // Dot navigation
        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                index = i;
                updateSlider();
                resetAutoSlide();
            });
        });

        // Auto-slide with reset on interaction
        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 2500);
        }

        function resetAutoSlide() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }

        // Pause auto-slide on hover
        track.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });

        track.addEventListener('mouseleave', startAutoSlide);

        // Touch swipe support for mobile
        let startX = 0;
        let endX = 0;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        track.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = startX - endX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
                resetAutoSlide();
            }
        }

        // Initialize
        updateSlider();
        startAutoSlide();

        // Handle window resize
        window.addEventListener('resize', updateSlider);

        // Weather data simulation
        function simulateWeatherData() {
            const weatherElement = document.getElementById('weatherPlaceholder');
            if (weatherElement) {
                const conditions = ['Sunny', 'Partly Cloudy', 'Light Rain', 'Clear'];
                const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
                const temp = Math.floor(Math.random() * 15) + 20; // 20-35°C
                
                weatherElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-thermometer-half"></i>
                        <span>${temp}°C</span>
                        <i class="fas fa-${randomCondition === 'Sunny' ? 'sun' : 
                                          randomCondition === 'Partly Cloudy' ? 'cloud-sun' : 
                                          randomCondition === 'Light Rain' ? 'cloud-rain' : 'cloud'}"></i>
                        <span>${randomCondition}</span>
                    </div>
                `;
            }
        }

        // Dark Mode Functionality
        document.addEventListener('DOMContentLoaded', function() {
            const darkModeToggle = document.getElementById('darkModeToggle');
            const icon = darkModeToggle.querySelector('i');
            
            // Check for saved theme or prefer-color-scheme
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                document.body.classList.add('dark');
                icon.className = 'fas fa-sun';
            }
            
            darkModeToggle.addEventListener('click', function() {
                document.body.classList.toggle('dark');
                
                if (document.body.classList.contains('dark')) {
                    icon.className = 'fas fa-sun';
                    localStorage.setItem('theme', 'dark');
                } else {
                    icon.className = 'fas fa-moon';
                    localStorage.setItem('theme', 'light');
                }
            });

            // Initialize weather data after splash screen
            setTimeout(simulateWeatherData, 2200);
        });

        // Scroll Animations
        document.addEventListener('DOMContentLoaded', function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, observerOptions);

            // Observe all animated elements
            document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                observer.observe(el);
            });
        });

        // Mobile Menu Toggle
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navMenu = document.querySelector('nav ul');

            mobileMenuBtn.addEventListener('click', function() {
                navMenu.classList.toggle('show');
                mobileMenuBtn.querySelector('i').className = 
                    navMenu.classList.contains('show') ? 'fas fa-times' : 'fas fa-bars';
            });

            // Close menu when clicking on a link
            document.querySelectorAll('nav a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('show');
                    mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    navMenu.classList.remove('show');
                    mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                }
            });
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            // Escape key to close mobile menu
            if (e.key === 'Escape') {
                document.querySelector('nav ul').classList.remove('show');
                document.querySelector('.mobile-menu-btn i').className = 'fas fa-bars';
            }
        });