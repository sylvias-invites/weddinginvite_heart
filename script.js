const canvas = document.getElementById("scratch-canvas");
const ctx = canvas.getContext("2d");
const container = document.querySelector(".heart-container");
const instruction = document.getElementById("instruction");
const nextBtn = document.getElementById("next-btn");

// Zabránění nechtěnému označování nebo přetahování plátna
canvas.addEventListener('dragstart', (e) => e.preventDefault());
canvas.addEventListener('selectstart', (e) => e.preventDefault());

let scratching = false;

// 1. Načtení obrázku srdíčka
const heartImg = new Image();
heartImg.src = "heart.png";

// 2. Inicializace až po načtení obrázku
heartImg.onload = () => {
    initCanvas();
};

// Pokud se obrázek nenačte (např. špatný název nebo cesta), použije se zlaté srdce
heartImg.onerror = () => {
    console.error("Obrázek heart.png se nepodařilo načíst! Používám záložní barvu.");
    initCanvas();
};

function initCanvas() {
    // Načte přesné aktuální rozměry kontejneru z obrazovky
    const w = container ? container.offsetWidth : 320;
    const h = container ? container.offsetHeight : 350;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.scale(dpr, dpr);

    if (heartImg.complete && heartImg.naturalWidth !== 0) {
        // 1. Vytvoření zlatého podkladu v paměti
        const goldCanvas = document.createElement("canvas");
        goldCanvas.width = canvas.width;
        goldCanvas.height = canvas.height;
        const gCtx = goldCanvas.getContext("2d");
        gCtx.scale(dpr, dpr);

        gCtx.drawImage(heartImg, 0, 0, w, h);
        gCtx.globalCompositeOperation = "source-in";
        gCtx.fillStyle = "#EA98A5";
        gCtx.fillRect(0, 0, w, h);

        // 2. Nastavení zlatého podkladu pro text
        const revealText = document.querySelector(".reveal-text");
        if (revealText) {
            revealText.style.backgroundImage = `url(${goldCanvas.toDataURL()})`;
            revealText.style.backgroundSize = "contain";
            revealText.style.backgroundRepeat = "no-repeat";
            revealText.style.backgroundPosition = "center";
        }

        // 3. Vykreslení stírací vrstvy (růží)
        ctx.drawImage(heartImg, 0, 0, w, h);
    }
}

// Pojistka: při změně velikosti okna (např. otočení mobilu) se plátno přizpůsobí
window.addEventListener("resize", () => {
    // Překreslit pouze pokud ještě nebylo setřeno
    if (canvas.style.display !== "none") {
        initCanvas();
    }
});

// Události pro stírání (myš i dotykové displeje)
["mousedown", "touchstart"].forEach(evt =>
    canvas.addEventListener(evt, (e) => {
        scratching = true;
        scratch(e);
    }, { passive: false })
);

["mouseup", "touchend"].forEach(evt =>
    canvas.addEventListener(evt, () => scratching = false)
);

["mousemove", "touchmove"].forEach(evt =>
    canvas.addEventListener(evt, scratch, { passive: false })
);

function scratch(e) {
    if (!scratching) return;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Přepnutí do režimu gumování
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2); // Velikost stíracího štětce
    ctx.fill();

    checkReveal();
}

function checkReveal() {
    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let cleared = 0;

        // Kontrola průhledných pixelů
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) cleared++;
        }

        const percentage = (cleared / (pixels.length / 4)) * 100;

        // Pokud je setřeno více než 45 %, odhalí se tlačítko dál
        if (percentage > 85) {
            revealEverything();
        }
    } catch (e) {
        // Pojistka pro případ CORS blokace při lokálním otevírání
        if (!window.backupTimer) {
            window.backupTimer = setTimeout(revealEverything, 2000);
        }
    }
}

let hasRevealed = false; // Pojistka proti opakovanému spuštění

function revealEverything() {
    if (hasRevealed) return;
    hasRevealed = true;

    // Schování textu nad srdíčkem

    const mainTitle = document.getElementById("main-title");
    
    if (mainTitle) {

        mainTitle.style.transition = "opacity 0.6s ease";

        mainTitle.style.opacity = "0";
    }

    // 2. Spuštění trvajících konfet (např. po dobu 3 sekund)
    if (typeof confetti === "function") {
        const diamond = confetti.shapeFromPath({
            path: 'M 0 -10 L 7 0 L 0 10 L -7 0 Z'
        });

        const duration = 3 * 1000; // Doba trvání v milisekundách (3 sekundy)
        const animationEnd = Date.now() + duration;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval); // Po uplynutí času zastavíme generování
            }

            // Vystřelujeme v průběhu času menší dávky z obou stran
            confetti({
                particleCount: 12,
                spread: 60,
                origin: { x: 0.2, y: 0.6 }, // Výstřel zleva
                colors: ['#B41313', '#ffdce2', '#5B7065', '#ffffff'],
                shapes: ['heart', diamond],
                scalar: 1.2
            });

            confetti({
                particleCount: 12,
                spread: 60,
                origin: { x: 0.8, y: 0.6 }, // Výstřel zprava
                colors: ['#B41313', '#ffdce2', '#5B7065', '#ffffff'],
                shapes: ['heart', diamond],
                scalar: 1.2
            });
        }, 200); // Každých 200 ms vyletí nová vlna
    }

    // 2. Postupné schování stírací vrstvy a instrukce
    canvas.style.transition = "opacity 0.8s ease";
    canvas.style.opacity = "0";

    if (instruction) {
        instruction.style.transition = "opacity 0.5s ease";
        instruction.style.opacity = "0";
    }

    // 3. Zobrazení tlačítka
    setTimeout(() => {
        canvas.style.display = "none";
        if (nextBtn) {
            nextBtn.classList.add("visible");
        }
    }, 800);
}

// Funkce pro otevření detailů pozvánky po kliknutí na tlačítko
function openDetails() {
    const scratchScreen = document.getElementById("scratch-screen");
    const contentScreen = document.getElementById("content-screen");

    if (scratchScreen) scratchScreen.style.display = "none";
    if (contentScreen) {
        contentScreen.classList.add("active");
    }
}
