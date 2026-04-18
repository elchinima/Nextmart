(function () {
    const settings = {
        sparkColor: "#111111",
        sparkSize: 10,
        sparkRadius: 15,
        sparkCount: 8,
        duration: 420,
        easing: "ease-out",
        extraScale: 1
    };

    const sparks = [];

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.userSelect = "none";
    canvas.style.display = "block";
    canvas.style.zIndex = "9999";

    const ctx = canvas.getContext("2d");
    let animationId = 0;

    function easeFunc(t) {
        if (settings.easing === "linear") return t;
        if (settings.easing === "ease-in") return t * t;
        if (settings.easing === "ease-in-out") {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        return t * (2 - t);
    }

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i];
            const elapsed = timestamp - spark.startTime;

            if (elapsed >= settings.duration) {
                sparks.splice(i, 1);
                continue;
            }

            const progress = elapsed / settings.duration;
            const eased = easeFunc(progress);

            const distance = eased * settings.sparkRadius * settings.extraScale;
            const lineLength = settings.sparkSize * (1 - eased);

            const x1 = spark.x + distance * Math.cos(spark.angle);
            const y1 = spark.y + distance * Math.sin(spark.angle);
            const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
            const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

            ctx.strokeStyle = settings.sparkColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        animationId = requestAnimationFrame(draw);
    }

    function onClick(e) {
        const now = performance.now();
        for (let i = 0; i < settings.sparkCount; i++) {
            sparks.push({
                x: e.clientX,
                y: e.clientY,
                angle: (2 * Math.PI * i) / settings.sparkCount,
                startTime: now
            });
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.body.appendChild(canvas);
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        document.addEventListener("click", onClick);
        animationId = requestAnimationFrame(draw);
    });

    window.addEventListener("beforeunload", function () {
        cancelAnimationFrame(animationId);
        document.removeEventListener("click", onClick);
        window.removeEventListener("resize", resizeCanvas);
    });
})();
