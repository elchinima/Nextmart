class LogoLoop {
    static #SMOOTH_TAU = 0.25;
    static #MIN_COPIES = 2;
    static #COPY_HEADROOM = 2;

    #container;
    #track;
    #seqEl;
    #opts;

    #seqWidth = 0;
    #copyCount = LogoLoop.#MIN_COPIES;
    #offset = 0;
    #velocity = 0;
    #isHovered = false;
    #rafId = null;
    #lastTs = null;

    #resizeObserver = null;
    #cleanupAnimation = null;

    constructor(container, options = {}) {
        this.#container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.#container) {
            console.warn('LogoLoop: container not found');
            return;
        }

        this.#opts = {
            logos: [],
            speed: 80,
            direction: 'left',
            logoHeight: 40,
            gap: 48,
            pauseOnHover: true,
            fadeOut: true,
            fadeColor: null,
            ...options
        };

        this.#build();
        this.#setupEvents();

        setTimeout(() => {
            this.#setupResizeObserver();
            this.#setupImageLoader();
        }, 10);
    }

    get #targetVelocity() {
        const mag = Math.abs(this.#opts.speed);
        const dir = this.#opts.direction === 'left' ? 1 : -1;
        const sign = this.#opts.speed < 0 ? -1 : 1;
        return mag * dir * sign;
    }

    #build() {
        this.#container.classList.add('logo-loop');
        this.#container.style.setProperty('--ll-logo-height', `${this.#opts.logoHeight}px`);
        this.#container.style.setProperty('--ll-gap', `${this.#opts.gap}px`);
        if (this.#opts.fadeColor) {
            this.#container.style.setProperty('--ll-fade-color', this.#opts.fadeColor);
        }

        if (this.#opts.fadeOut) {
            const fadeLeft = document.createElement('div');
            fadeLeft.className = 'logo-loop__fade logo-loop__fade--left';
            fadeLeft.setAttribute('aria-hidden', 'true');

            const fadeRight = document.createElement('div');
            fadeRight.className = 'logo-loop__fade logo-loop__fade--right';
            fadeRight.setAttribute('aria-hidden', 'true');

            this.#container.appendChild(fadeLeft);
            this.#container.appendChild(fadeRight);
        }

        this.#track = document.createElement('div');
        this.#track.className = 'logo-loop__track';
        this.#container.appendChild(this.#track);

        this.#renderCopies();
    }

    #createList(isFirst) {
        const ul = document.createElement('ul');
        ul.className = 'logo-loop__list';
        ul.setAttribute('role', 'list');
        if (!isFirst) ul.setAttribute('aria-hidden', 'true');

        for (const item of this.#opts.logos) {
            const li = document.createElement('li');
            li.className = 'logo-loop__item';
            li.setAttribute('role', 'listitem');

            const inner = this.#createItemContent(item);

            if (item.href) {
                const a = document.createElement('a');
                a.className = 'logo-loop__link';
                a.href = item.href;
                a.target = '_blank';
                a.rel = 'noreferrer noopener';
                a.setAttribute('aria-label', item.ariaLabel || item.alt || item.title || 'logo link');
                a.appendChild(inner);
                li.appendChild(a);
            } else {
                li.appendChild(inner);
            }

            ul.appendChild(li);
        }

        return ul;
    }

    #createItemContent(item) {
        if (item.src) {
            const img = document.createElement('img');
            img.className = 'logo-loop__img';
            img.src = item.src;
            img.alt = item.alt ?? '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.draggable = false;
            if (item.width) img.width = item.width;
            if (item.height) img.height = item.height;
            if (item.scale) img.style.transform = `scale(${item.scale})`;
            return img;
        }

        const span = document.createElement('span');
        span.className = 'logo-loop__node';
        span.innerHTML = item.node ?? '';
        return span;
    }

    #renderCopies() {
        this.#track.innerHTML = '';
        this.#seqEl = null;

        for (let i = 0; i < this.#copyCount; i++) {
            const ul = this.#createList(i === 0);
            if (i === 0) this.#seqEl = ul;
            this.#track.appendChild(ul);
        }
    }

    #setupEvents() {
        if (!this.#opts.pauseOnHover) return;
        this.#container.addEventListener('mouseenter', () => { this.#isHovered = true; });
        this.#container.addEventListener('mouseleave', () => { this.#isHovered = false; });
    }

    #updateDimensions() {
        const containerW = this.#container.clientWidth ?? 0;
        const seqW = this.#seqEl?.getBoundingClientRect?.().width ?? 0;

        if (seqW > 0) {
            this.#seqWidth = Math.ceil(seqW);
            const needed = Math.ceil(containerW / seqW) + LogoLoop.#COPY_HEADROOM;
            const newCount = Math.max(LogoLoop.#MIN_COPIES, needed);

            if (newCount !== this.#copyCount) {
                this.#copyCount = newCount;
                this.#renderCopies();
            }

            this.#cleanupAnimation?.();
            this.#cleanupAnimation = this.#startLoop();
        }
    }

    #setupResizeObserver() {
        if (!window.ResizeObserver) {
            window.addEventListener('resize', () => this.#updateDimensions());
            this.#updateDimensions();
            return;
        }

        this.#resizeObserver = new ResizeObserver(() => this.#updateDimensions());
        this.#resizeObserver.observe(this.#container);
        if (this.#seqEl) this.#resizeObserver.observe(this.#seqEl);
        this.#updateDimensions();
    }

    #setupImageLoader() {
        const images = [...(this.#seqEl?.querySelectorAll('img') ?? [])];
        if (images.length === 0) { this.#updateDimensions(); return; }

        let remaining = images.length;
        const onLoad = () => { if (--remaining === 0) this.#updateDimensions(); };
        images.forEach(img => {
            if (img.complete) { onLoad(); }
            else {
                img.addEventListener('load', onLoad, { once: true });
                img.addEventListener('error', onLoad, { once: true });
            }
        });
    }

    #startLoop() {
        const track = this.#track;
        if (!track) return;

        const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            track.style.transform = 'translate3d(0,0,0)';
            return () => { this.#lastTs = null; };
        }

        if (this.#seqWidth > 0) {
            this.#offset = ((this.#offset % this.#seqWidth) + this.#seqWidth) % this.#seqWidth;
            track.style.transform = `translate3d(${-this.#offset}px,0,0)`;
        }

        const animate = (ts) => {
            if (this.#lastTs === null) this.#lastTs = ts;
            const dt = Math.max(0, ts - this.#lastTs) / 1000;
            this.#lastTs = ts;

            const target = (this.#opts.pauseOnHover && this.#isHovered) ? 0 : this.#targetVelocity;
            const ease = 1 - Math.exp(-dt / LogoLoop.#SMOOTH_TAU);
            this.#velocity += (target - this.#velocity) * ease;

            if (this.#seqWidth > 0) {
                let next = this.#offset + this.#velocity * dt;
                next = ((next % this.#seqWidth) + this.#seqWidth) % this.#seqWidth;
                this.#offset = next;
                track.style.transform = `translate3d(${-next}px,0,0)`;
            }

            this.#rafId = requestAnimationFrame(animate);
        };

        this.#rafId = requestAnimationFrame(animate);

        return () => {
            if (this.#rafId !== null) {
                cancelAnimationFrame(this.#rafId);
                this.#rafId = null;
            }
            this.#lastTs = null;
        };
    }

    destroy() {
        this.#cleanupAnimation?.();
        this.#resizeObserver?.disconnect();
        this.#container.innerHTML = '';
        this.#container.classList.remove('logo-loop');
    }
}