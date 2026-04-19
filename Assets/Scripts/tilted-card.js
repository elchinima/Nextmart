function initTiltedCards() {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        const inner = card.querySelector('.product-card__inner');

        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let currentScale = 1;
        let targetScale = 1;
        let rafId = null;

        function lerp(a, b, t) {
            return a + (b - a) * t;
        }

        function animate() {
            currentX = lerp(currentX, targetX, 0.12);
            currentY = lerp(currentY, targetY, 0.12);
            currentScale = lerp(currentScale, targetScale, 0.1);

            inner.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg) scale(${currentScale})`;

            const dx = Math.abs(currentX - targetX);
            const dy = Math.abs(currentY - targetY);
            const ds = Math.abs(currentScale - targetScale);

            if (dx > 0.01 || dy > 0.01 || ds > 0.001) {
                rafId = requestAnimationFrame(animate);
            } else {
                inner.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg) scale(${targetScale})`;
                rafId = null;
            }
        }

        function startAnimation() {
            if (!rafId) rafId = requestAnimationFrame(animate);
        }

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const offsetX = e.clientX - rect.left - rect.width / 2;
            const offsetY = e.clientY - rect.top - rect.height / 2;

            targetY = (offsetX / (rect.width / 2)) * 12;
            targetX = (offsetY / (rect.height / 2)) * -12;

            startAnimation();
        });

        card.addEventListener('mouseenter', () => {
            targetScale = 1.05;
            startAnimation();
        });

        card.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            targetScale = 1;
            startAnimation();
        });
    });
}

document.addEventListener('DOMContentLoaded', initTiltedCards);