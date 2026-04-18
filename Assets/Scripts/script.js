document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".gooey-nav-container");
    if (!container) return;

    const navRef = container.querySelector("nav ul");
    const filterRef = container.querySelector(".effect.filter");
    const textRef = container.querySelector(".effect.text");

    if (!navRef || !filterRef || !textRef) return;

    const items = Array.from(navRef.querySelectorAll("li"));

    // Options
    const animationTime = 600;
    const particleCount = 15;
    const particleDistances = [90, 10];
    const particleR = 100;
    const timeVariance = 300;
    const colors = [1, 2, 3, 4, 1, 2, 3, 4];
    
    let activeIndex = 0;

    // Set initial active state based on DOM
    items.forEach((item, index) => {
        if (item.classList.contains("active")) {
            activeIndex = index;
        }
    });

    const noise = (n = 1) => n / 2 - Math.random() * n;

    const getXY = (distance, pointIndex, totalPoints) => {
        const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
        return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };

    const createParticle = (i, t, d, r) => {
        let rotate = noise(r / 10);
        return {
            start: getXY(d[0], particleCount - i, particleCount),
            end: getXY(d[1] + noise(7), particleCount - i, particleCount),
            time: t,
            scale: 1 + noise(0.2),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
        };
    };

    const makeParticles = (element) => {
        const d = particleDistances;
        const r = particleR;
        const bubbleTime = animationTime * 2 + timeVariance;
        element.style.setProperty('--time', `${bubbleTime}ms`);

        for (let i = 0; i < particleCount; i++) {
            const t = animationTime * 2 + noise(timeVariance * 2);
            const p = createParticle(i, t, d, r);
            element.classList.remove('active');

            setTimeout(() => {
                const particle = document.createElement('span');
                const point = document.createElement('span');
                
                particle.classList.add('particle');
                particle.style.setProperty('--start-x', `${p.start[0]}px`);
                particle.style.setProperty('--start-y', `${p.start[1]}px`);
                particle.style.setProperty('--end-x', `${p.end[0]}px`);
                particle.style.setProperty('--end-y', `${p.end[1]}px`);
                particle.style.setProperty('--time', `${p.time}ms`);
                particle.style.setProperty('--scale', `${p.scale}`);
                particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
                particle.style.setProperty('--rotate', `${p.rotate}deg`);

                point.classList.add('point');
                particle.appendChild(point);
                element.appendChild(particle);
                
                requestAnimationFrame(() => {
                    element.classList.add('active');
                });
                
                setTimeout(() => {
                    try {
                        element.removeChild(particle);
                    } catch {
                        // Ignore
                    }
                }, t);
            }, 30);
        }
    };

    const updateEffectPosition = (element) => {
        const containerRect = container.getBoundingClientRect();
        const pos = element.getBoundingClientRect();

        const styles = {
            left: `${pos.x - containerRect.x}px`,
            top: `${pos.y - containerRect.y}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`
        };

        Object.assign(filterRef.style, styles);
        Object.assign(textRef.style, styles);
        textRef.innerText = element.innerText;
    };

    const handleClick = (index, liEl) => {
        if (activeIndex === index) return;

        items[activeIndex].classList.remove('active');
        activeIndex = index;
        liEl.classList.add('active');

        updateEffectPosition(liEl);

        const particles = filterRef.querySelectorAll('.particle');
        particles.forEach(p => p.remove());

        textRef.classList.remove('active');
        // trigger reflow
        void textRef.offsetWidth;
        textRef.classList.add('active');

        makeParticles(filterRef);
    };

    items.forEach((item, index) => {
        const link = item.querySelector('a');

        link.addEventListener('click', (e) => {
            handleClick(index, item);
        });

        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleClick(index, item);
            }
        });
    });

    // Initial setup
    const activeLi = items[activeIndex];
    if (activeLi) {
        updateEffectPosition(activeLi);
        textRef.classList.add('active');
    }

    // Update positions on resize
    const resizeObserver = new ResizeObserver(() => {
        const currentActiveLi = items[activeIndex];
        if (currentActiveLi) {
            updateEffectPosition(currentActiveLi);
        }
    });

    resizeObserver.observe(container);

    const featuresGrid = document.querySelector(".features .grid");
    if (!featuresGrid) return;

    const featureCards = Array.from(featuresGrid.querySelectorAll(".card"));
    if (featureCards.length <= 1) return;

    const indicatorsWrap = document.createElement("div");
    indicatorsWrap.className = "features-carousel-indicators";
    indicatorsWrap.setAttribute("aria-label", "Feature cards pagination");

    const indicatorButtons = featureCards.map((_, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Go to card ${index + 1}`);
        btn.addEventListener("click", () => {
            const step = getStep();
            featuresGrid.scrollTo({
                left: step * index,
                behavior: "smooth"
            });
        });
        indicatorsWrap.appendChild(btn);
        return btn;
    });

    const featuresSection = document.querySelector(".features");
    if (featuresSection) {
        featuresSection.appendChild(indicatorsWrap);
    }

    let currentCard = 0;
    let autoplayTimer = null;
    let isMobile = window.matchMedia("(max-width: 768px)").matches;
    const getStep = () => {
        const styles = window.getComputedStyle(featuresGrid);
        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
        return featureCards[0].offsetWidth + gap;
    };

    const setActiveIndicator = (index) => {
        indicatorButtons.forEach((btn, btnIndex) => {
            btn.classList.toggle("is-active", btnIndex === index);
        });
    };

    const getCurrentCardByScroll = () => {
        const step = getStep();
        const index = Math.round(featuresGrid.scrollLeft / step);
        return Math.max(0, Math.min(index, featureCards.length - 1));
    };

    const startAutoplay = () => {
        if (!isMobile) return;
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = window.setInterval(() => {
            const step = getStep();
            currentCard = (currentCard + 1) % featureCards.length;
            featuresGrid.scrollTo({
                left: step * currentCard,
                behavior: "smooth"
            });
            setActiveIndicator(currentCard);
        }, 3000);
    };

    const stopAutoplay = () => {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    };

    featuresGrid.addEventListener("scroll", () => {
        if (!isMobile) return;
        currentCard = getCurrentCardByScroll();
        setActiveIndicator(currentCard);
    });

    featuresGrid.addEventListener("touchstart", stopAutoplay, { passive: true });
    featuresGrid.addEventListener("touchend", startAutoplay, { passive: true });
    featuresGrid.addEventListener("mouseenter", stopAutoplay);
    featuresGrid.addEventListener("mouseleave", startAutoplay);

    const syncMode = () => {
        isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
            currentCard = getCurrentCardByScroll();
            setActiveIndicator(currentCard);
            startAutoplay();
        } else {
            stopAutoplay();
            setActiveIndicator(0);
        }
    };

    window.addEventListener("resize", syncMode);
    setActiveIndicator(0);
    syncMode();
});

