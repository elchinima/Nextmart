(function () {
    const desktopQuery = window.matchMedia("(min-width: 769px)");

    function parseHSL(hslStr) {
        const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
        if (!match) return { h: 40, s: 80, l: 80 };
        return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
    }

    function buildGlowVars(glowColor, intensity) {
        const parsed = parseHSL(glowColor);
        const base = parsed.h + "deg " + parsed.s + "% " + parsed.l + "%";
        const opacities = [100, 60, 50, 40, 30, 20, 10];
        const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
        const vars = {};

        for (let i = 0; i < opacities.length; i++) {
            vars["--glow-color" + keys[i]] = "hsl(" + base + " / " + Math.min(opacities[i] * intensity, 100) + "%)";
        }
        return vars;
    }

    const gradientPositions = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
    const gradientKeys = [
        "--gradient-one",
        "--gradient-two",
        "--gradient-three",
        "--gradient-four",
        "--gradient-five",
        "--gradient-six",
        "--gradient-seven"
    ];
    const colorMap = [0, 1, 2, 0, 1, 2, 1];

    function buildGradientVars(colors) {
        const vars = {};
        for (let i = 0; i < 7; i++) {
            const c = colors[Math.min(colorMap[i], colors.length - 1)];
            vars[gradientKeys[i]] = "radial-gradient(at " + gradientPositions[i] + ", " + c + " 0px, transparent 50%)";
        }
        vars["--gradient-base"] = "linear-gradient(" + colors[0] + " 0 100%)";
        return vars;
    }

    function getCenterOfElement(el) {
        const rect = el.getBoundingClientRect();
        return [rect.width / 2, rect.height / 2];
    }

    function getEdgeProximity(el, x, y) {
        const center = getCenterOfElement(el);
        const dx = x - center[0];
        const dy = y - center[1];
        let kx = Infinity;
        let ky = Infinity;

        if (dx !== 0) kx = center[0] / Math.abs(dx);
        if (dy !== 0) ky = center[1] / Math.abs(dy);

        return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    }

    function getCursorAngle(el, x, y) {
        const center = getCenterOfElement(el);
        const dx = x - center[0];
        const dy = y - center[1];
        if (dx === 0 && dy === 0) return 0;

        const radians = Math.atan2(dy, dx);
        let degrees = radians * (180 / Math.PI) + 90;
        if (degrees < 0) degrees += 360;
        return degrees;
    }

    function setupCard(card) {
        if (card.dataset.borderGlowReady === "1") return;

        const options = {
            edgeSensitivity: 30,
            glowColor: "198 82 72",
            backgroundColor: "#ffffff",
            borderRadius: 20,
            glowRadius: 28,
            glowIntensity: 1,
            coneSpread: 25,
            colors: ["#93c5fd", "#67e8f9", "#f9a8d4"],
            fillOpacity: 0.32
        };

        card.classList.add("border-glow-card");

        const children = Array.from(card.childNodes);
        const inner = document.createElement("div");
        inner.className = "border-glow-inner";
        children.forEach(function (node) {
            inner.appendChild(node);
        });

        const edgeLight = document.createElement("span");
        edgeLight.className = "edge-light";

        card.appendChild(edgeLight);
        card.appendChild(inner);

        const styleVars = {
            "--card-bg": options.backgroundColor,
            "--edge-sensitivity": String(options.edgeSensitivity),
            "--border-radius": options.borderRadius + "px",
            "--glow-padding": options.glowRadius + "px",
            "--cone-spread": String(options.coneSpread),
            "--fill-opacity": String(options.fillOpacity)
        };

        Object.assign(styleVars, buildGlowVars(options.glowColor, options.glowIntensity));
        Object.assign(styleVars, buildGradientVars(options.colors));

        Object.keys(styleVars).forEach(function (key) {
            card.style.setProperty(key, styleVars[key]);
        });

        card.addEventListener("pointermove", function (e) {
            if (!desktopQuery.matches) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const edge = getEdgeProximity(card, x, y);
            const angle = getCursorAngle(card, x, y);
            card.style.setProperty("--edge-proximity", (edge * 100).toFixed(3));
            card.style.setProperty("--cursor-angle", angle.toFixed(3) + "deg");
        });

        card.addEventListener("pointerleave", function () {
            card.style.setProperty("--edge-proximity", "0");
        });

        card.dataset.borderGlowReady = "1";
    }

    function initBorderGlow() {
        const cards = document.querySelectorAll(".features .grid .card");
        cards.forEach(setupCard);
    }

    document.addEventListener("DOMContentLoaded", initBorderGlow);
})();
