document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll("[data-split-text]");
    if (!elements.length) return;

    elements.forEach((el) => {
        if (el.dataset.splitReady === "1") return;

        const originalText = el.textContent || "";
        const words = originalText.split(/(\s+)/);

        const fragment = document.createDocumentFragment();
        let charIndex = 0;

        words.forEach((part) => {
            if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(part));
                return;
            }

            const word = document.createElement("span");
            word.className = "split-word";

            Array.from(part).forEach((char) => {
                const span = document.createElement("span");
                span.className = "split-char";
                span.style.transitionDelay = `${charIndex * 45}ms`;
                span.textContent = char;
                word.appendChild(span);
                charIndex += 1;
            });

            fragment.appendChild(word);
        });

        el.textContent = "";
        el.appendChild(fragment);
        el.dataset.splitReady = "1";

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    el.classList.add("is-inview");
                    obs.unobserve(entry.target);
                });
            },
            {
                threshold: 0.1,
                rootMargin: "-100px"
            }
        );

        observer.observe(el);
    });
});
