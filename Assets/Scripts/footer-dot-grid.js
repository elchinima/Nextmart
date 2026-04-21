(function () {
    const canvas = document.getElementById('footer-dot-grid');
    if (!canvas) return;

    const footer = canvas.closest('.site-footer');

    const CONFIG = {
        dotSize: 3,
        gap: 18,
        baseColor: { r: 200, g: 200, b: 200 },
        activeColor: { r: 17, g: 17, b: 17 },
        proximity: 80,
        shockRadius: 200,
        shockStrength: 6,
        resistance: 0.82,
        returnSpeed: 0.08,
        returnDuration: 60,
    };

    let dots = [];
    let pointer = { x: -9999, y: -9999 };
    let rafId;
    let isPointerInFooter = false;

    function buildGrid() {
        const dpr = window.devicePixelRatio || 1;
        const w = footer.offsetWidth;
        const h = footer.offsetHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const cell = CONFIG.dotSize + CONFIG.gap;
        const cols = Math.floor((w + CONFIG.gap) / cell);
        const rows = Math.floor((h + CONFIG.gap) / cell);

        const gridW = cols * cell - CONFIG.gap;
        const gridH = rows * cell - CONFIG.gap;

        const startX = (w - gridW) / 2 + CONFIG.dotSize / 2;
        const startY = (h - gridH) / 2 + CONFIG.dotSize / 2;

        dots = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                dots.push({
                    cx: startX + col * cell,
                    cy: startY + row * cell,
                    ox: 0, oy: 0,
                    vx: 0, vy: 0,
                });
            }
        }
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function draw() {
        const canvas = document.getElementById('footer-dot-grid');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.clearRect(0, 0, w, h);

        const proxSq = CONFIG.proximity * CONFIG.proximity;
        const r = CONFIG.dotSize / 2;

        for (const dot of dots) {
            // physics
            dot.vx *= CONFIG.resistance;
            dot.vy *= CONFIG.resistance;
            dot.ox += dot.vx;
            dot.oy += dot.vy;

            // return to origin
            dot.ox += (0 - dot.ox) * CONFIG.returnSpeed;
            dot.oy += (0 - dot.oy) * CONFIG.returnSpeed;

            const dx = dot.cx - pointer.x;
            const dy = dot.cy - pointer.y;
            const dsq = dx * dx + dy * dy;

            let cr, cg, cb;

            if (dsq <= proxSq && isPointerInFooter) {
                const dist = Math.sqrt(dsq);
                const t = 1 - dist / CONFIG.proximity;
                cr = Math.round(lerp(CONFIG.baseColor.r, CONFIG.activeColor.r, t));
                cg = Math.round(lerp(CONFIG.baseColor.g, CONFIG.activeColor.g, t));
                cb = Math.round(lerp(CONFIG.baseColor.b, CONFIG.activeColor.b, t));
            } else {
                cr = CONFIG.baseColor.r;
                cg = CONFIG.baseColor.g;
                cb = CONFIG.baseColor.b;
            }

            ctx.beginPath();
            ctx.arc(dot.cx + dot.ox, dot.cy + dot.oy, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
            ctx.fill();
        }

        rafId = requestAnimationFrame(draw);
    }

    function onMouseMove(e) {
        const rect = footer.getBoundingClientRect();
        isPointerInFooter = (
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom &&
            e.clientX >= rect.left &&
            e.clientX <= rect.right
        );
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
        isPointerInFooter = false;
        pointer.x = -9999;
        pointer.y = -9999;
    }

    function onClick(e) {
        const rect = footer.getBoundingClientRect();
        if (
            e.clientY < rect.top || e.clientY > rect.bottom ||
            e.clientX < rect.left || e.clientX > rect.right
        ) return;

        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        for (const dot of dots) {
            const dx = dot.cx - cx;
            const dy = dot.cy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.shockRadius) {
                const falloff = 1 - dist / CONFIG.shockRadius;
                dot.vx += (dx / (dist || 1)) * CONFIG.shockStrength * falloff * 3;
                dot.vy += (dy / (dist || 1)) * CONFIG.shockStrength * falloff * 3;
            }
        }
    }

    let resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            cancelAnimationFrame(rafId);
            buildGrid();
            draw();
        }, 150);
    }

    buildGrid();
    draw();

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click', onClick);
    footer.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);
})();