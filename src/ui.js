/**
 * src/ui.js
 * Handles all UI interactions, parameter rendering, and calculation display.
 */

const UIManager = (function () {
    let shapeSelector, foldSlider, animateOpenBtn, animateCloseBtn, resetCameraBtn, descriptionPanel;
    let currentShape = 'cube';
    let animationInterval = null;

    const shapeData = {
        cube: { name: 'Kubus', desc: 'Kubus memiliki 6 sisi persegi yang sama besar.' },
        box: { name: 'Balok', desc: 'Balok memiliki 6 sisi persegi panjang.' },
        cylinder: { name: 'Tabung', desc: 'Tabung memiliki 2 sisi lingkaran dan 1 selimut persegi panjang.' },
        pyramid: { name: 'Limas Segi Empat', desc: 'Limas segi empat memiliki alas persegi dan 4 sisi tegak segitiga.' },
        cone: { name: 'Kerucut', desc: 'Kerucut memiliki alas lingkaran dan selimut juring lingkaran.' },
        prism: { name: 'Prisma Segitiga', desc: 'Prisma segitiga memiliki alas dan tutup segitiga serta 3 sisi tegak.' }
    };

    function updateDescription() {
        if (descriptionPanel) {
            descriptionPanel.innerHTML = `<p>${shapeData[currentShape].desc}</p>`;
        }
    }

    function selectShape(shape) {
        if (currentShape === shape) return;

        // Update active button
        if (document.querySelector(`.shape-options button.active`)) {
            document.querySelector(`.shape-options button.active`).classList.remove('active');
        }
        const newBtn = document.getElementById(`select-${shape}`);
        if (newBtn) newBtn.classList.add('active');

        currentShape = shape;
        updateDescription();

        // Reset slider
        if (foldSlider) {
            foldSlider.value = 0;
        }

        // Load new shape
        if (window.SceneManager) {
            window.SceneManager.loadShape(currentShape);
        }
    }

    function handleSliderChange(e) {
        const value = parseFloat(e.target.value);
        if (window.SceneManager) {
            window.SceneManager.updateFold(value);
        }
    }

    function animate(targetValue) {
        if (animationInterval) clearInterval(animationInterval);

        const startValue = parseFloat(foldSlider.value);
        const duration = 1000; // ms
        const startTime = Date.now();

        animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            const currentValue = startValue + (targetValue - startValue) * ease;

            foldSlider.value = currentValue;
            if (window.SceneManager) {
                window.SceneManager.updateFold(currentValue);
            }

            if (progress >= 1) {
                clearInterval(animationInterval);
            }
        }, 16);
    }

    function initUI() {
        shapeSelector = document.getElementById('shape-selector');
        foldSlider = document.getElementById('fold-slider');
        animateOpenBtn = document.getElementById('animate-open-btn');
        animateCloseBtn = document.getElementById('animate-close-btn');
        resetCameraBtn = document.getElementById('reset-camera-btn');
        descriptionPanel = document.getElementById('shape-description');

        if (shapeSelector) {
            shapeSelector.querySelectorAll('.shape-options button').forEach(button => {
                button.addEventListener('click', () => selectShape(button.dataset.shape));
            });
        }

        if (foldSlider) foldSlider.addEventListener('input', handleSliderChange);
        if (animateOpenBtn) animateOpenBtn.addEventListener('click', () => animate(1));
        if (animateCloseBtn) animateCloseBtn.addEventListener('click', () => animate(0));
        if (resetCameraBtn) resetCameraBtn.addEventListener('click', () => {
            if (window.SceneManager) window.SceneManager.resetCamera();
        });

        updateDescription();
    }

    return {
        initUI,
        selectShape
    };
})();

window.UIManager = UIManager;
