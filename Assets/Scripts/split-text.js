document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll("[data-split-text]");
    if (!elements.length) return;

    elements.forEach((el) => {
        if (el.dataset.splitReady === "1") return;

        const originalText = el.textContent || "";
        const chars = Array.from(originalText);

        const fragment = document.createDocumentFragment();
        chars.forEach((char, index) => {
            if (char === " ") {
                fragment.appendChild(document.createTextNode(" "));
                return;
            }

            const span = document.createElement("span");
            span.className = "split-char";
            span.style.transitionDelay = `${index * 45}ms`;
            span.textContent = char;
            fragment.appendChild(span);
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
