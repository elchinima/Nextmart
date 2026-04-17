(function initGooeyNav() {
    const container = document.querySelector('[data-gooey-nav]');
    if (!container) return;

    const config = {
        animationTime: 600,
        particleCount: 15,
        particleDistances: [90, 10],
        particleR: 100,
        timeVariance: 300,
        colors: [1, 2, 3, 1, 2, 3, 1, 4],
        initialActiveIndex: 0
    };

    const navList = container.querySelector('ul');
    const items = Array.from(container.querySelectorAll('li'));
    const filterEl = container.querySelector('.effect.filter');
    const textEl = container.querySelector('.effect.text');

    if (!navList || !filterEl || !textEl || items.length === 0) return;

    let activeIndex = Math.min(config.initialActiveIndex, items.length - 1);

    const noise = (n) => n / 2 - Math.random() * n;

    const getXY = (distance, pointIndex, totalPoints) => {
        const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
        return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };

    const createParticle = (index) => {
        const rotateNoise = noise(config.particleR / 10);
        const start = getXY(config.particleDistances[0], config.particleCount - index, config.particleCount);
        const end = getXY(config.particleDistances[1] + noise(7), config.particleCount - index, config.particleCount);
        const time = config.animationTime * 2 + noise(config.timeVariance * 2);

        return {
            start,
            end,
            time,
            scale: 1 + noise(0.2),
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            rotate: rotateNoise > 0
                ? (rotateNoise + config.particleR / 20) * 10
                : (rotateNoise - config.particleR / 20) * 10
        };
    };

    const updateEffectPosition = (element) => {
        const containerRect = container.getBoundingClientRect();
        const rect = element.getBoundingClientRect();

        const styles = {
            left: `${rect.left - containerRect.left}px`,
            top: `${rect.top - containerRect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
        };

        Object.assign(filterEl.style, styles);
        Object.assign(textEl.style, styles);
        textEl.textContent = element.textContent.trim();
    };

    const makeParticles = () => {
        const bubbleTime = config.animationTime * 2 + config.timeVariance;
        filterEl.style.setProperty('--time', `${bubbleTime}ms`);

        for (let i = 0; i < config.particleCount; i++) {
            const particleData = createParticle(i);
            filterEl.classList.remove('active');

            setTimeout(() => {
                const particle = document.createElement('span');
                const point = document.createElement('span');

                particle.className = 'particle';
                particle.style.setProperty('--start-x', `${particleData.start[0]}px`);
                particle.style.setProperty('--start-y', `${particleData.start[1]}px`);
                particle.style.setProperty('--end-x', `${particleData.end[0]}px`);
                particle.style.setProperty('--end-y', `${particleData.end[1]}px`);
                particle.style.setProperty('--time', `${particleData.time}ms`);
                particle.style.setProperty('--scale', `${particleData.scale}`);
                particle.style.setProperty('--color', `var(--color-${particleData.color}, #111111)`);
                particle.style.setProperty('--rotate', `${particleData.rotate}deg`);

                point.className = 'point';
                particle.appendChild(point);
                filterEl.appendChild(particle);

                requestAnimationFrame(() => {
                    filterEl.classList.add('active');
                });

                setTimeout(() => {
                    particle.remove();
                }, particleData.time);
            }, 30);
        }
    };

    const setActive = (index) => {
        if (index === activeIndex) return;

        activeIndex = index;
        items.forEach((item, itemIndex) => {
            item.classList.toggle('active', itemIndex === activeIndex);
        });

        const target = items[activeIndex];
        updateEffectPosition(target);

        filterEl.querySelectorAll('.particle').forEach((particle) => particle.remove());

        textEl.classList.remove('active');
        void textEl.offsetWidth;
        textEl.classList.add('active');

        makeParticles();
    };

    items.forEach((item, index) => {
        const link = item.querySelector('a');
        if (!link) return;

        link.addEventListener('click', (event) => {
            if (link.getAttribute('href') === '#') {
                event.preventDefault();
            }
            setActive(index);
        });

        link.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActive(index);
            }
        });
    });

    items.forEach((item, index) => {
        item.classList.toggle('active', index === activeIndex);
    });

    updateEffectPosition(items[activeIndex]);
    textEl.classList.add('active');

    const resizeObserver = new ResizeObserver(() => {
        const current = items[activeIndex];
        if (current) {
            updateEffectPosition(current);
        }
    });

    resizeObserver.observe(container);
})();
