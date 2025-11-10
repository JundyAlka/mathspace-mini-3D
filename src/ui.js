/**
 * src/ui.js
 * Handles all UI interactions, parameter rendering, and calculation display.
 */

const UIManager = (function() {
    const shapeSelector = document.getElementById('shape-selector');
    const parameterPanel = document.getElementById('shape-info');
    const resultsPanel = document.getElementById('calculation-results');
    const netViewer = document.getElementById('net-viewer');
    const netImage = document.getElementById('net-image');
    const toggleNetBtn = document.getElementById('toggle-net-btn');
    const resetCameraBtn = document.getElementById('reset-camera-btn');

    let currentShape = 'cube';
    let currentParams = JSON.parse(JSON.stringify(window.SceneManager.defaultParams)); // Deep copy defaults

    const shapeData = {
        cube: {
            name: 'Kubus',
            params: [{ id: 's', label: 'Sisi (s)' }],
            formula: 'Volume = s³; Luas Permukaan = 6s²',
            netImage: 'assets/nets/net_cube.png',
            calculate: (p) => ({
                volume: window.MathFunctions.volumeKubus(p.s),
                area: window.MathFunctions.luasKubus(p.s)
            })
        },
        box: {
            name: 'Balok',
            params: [
                { id: 'p', label: 'Panjang (p)' },
                { id: 'l', label: 'Lebar (l)' },
                { id: 't', label: 'Tinggi (t)' }
            ],
            formula: 'Volume = p·l·t; Luas Permukaan = 2(pl + pt + lt)',
            netImage: 'assets/nets/net_box.png',
            calculate: (p) => ({
                volume: window.MathFunctions.volumeBalok(p.p, p.l, p.t),
                area: window.MathFunctions.luasBalok(p.p, p.l, p.t)
            })
        },
        cylinder: {
            name: 'Tabung',
            params: [
                { id: 'r', label: 'Jari-jari (r)' },
                { id: 't', label: 'Tinggi (t)' }
            ],
            formula: 'Volume = πr²t; Luas Permukaan = 2πr(r + t)',
            netImage: 'assets/nets/net_cylinder.png',
            calculate: (p) => ({
                volume: window.MathFunctions.volumeTabung(p.r, p.t),
                area: window.MathFunctions.luasTabung(p.r, p.t)
            })
        }
    };

    /**
     * Renders the input fields for the currently selected shape.
     */
    function renderParameters() {
        const data = shapeData[currentShape];
        let html = `
            <div class="parameter-group">
                <h3>${data.name}</h3>
                <div class="parameter-list">
        `;

        data.params.forEach(param => {
            const value = currentParams[currentShape][param.id];
            const unit = param.label.match(/\(([^)]+)\)/)[1]; // Extract unit from label (e.g., 'cm' from 'Panjang (cm)')
            
            html += `
                <div class="parameter">
                    <label for="input-${param.id}">${param.label}</label>
                    <div style="position: relative;">
                        <input 
                            type="number" 
                            id="input-${param.id}" 
                            data-param="${param.id}" 
                            value="${value}" 
                            min="0.1" 
                            max="10000" 
                            step="0.1"
                            class="parameter-input"
                        >
                        <span class="unit">${unit}</span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        parameterPanel.innerHTML = html;
        
        // Add event listeners to all inputs
        parameterPanel.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', handleParameterChange);
            // Add focus/blur effects
            input.addEventListener('focus', (e) => {
                e.target.parentElement.classList.add('focused');
            });
            input.addEventListener('blur', (e) => {
                e.target.parentElement.classList.remove('focused');
            });
        });
    }

    /**
     * Reads parameter values from the input fields, validates them, and updates the model.
     * @param {Event} event - The input event.
     */
    function handleParameterChange(event) {
        const input = event.target;
        const paramId = input.dataset.param;
        let value = parseFloat(input.value);

        // Validate and update internal state
        const validatedValue = window.MathFunctions.validateInput(value);
        currentParams[currentShape][paramId] = validatedValue;

        // Update the input field value if it was invalid (e.g., < 0.1)
        if (value !== validatedValue) {
            input.value = validatedValue;
        }

        // Update 3D model and calculations
        updateShapeAndCalculations();
    }

    /**
     * Updates the 3D model and recalculates volume/area.
     */
    function updateShapeAndCalculations() {
        const params = currentParams[currentShape];
        window.SceneManager.loadShape(currentShape, params);
        renderResults();
    }

    /**
     * Renders the calculation results (Volume and Luas Permukaan).
     */
    function renderResults() {
        const data = shapeData[currentShape];
        const params = currentParams[currentShape];
        const results = data.calculate(params);

        const html = `
            <h3>Rumus</h3>
            <p class="formula">${data.formula}</p>
            <h3>Hasil Perhitungan</h3>
            <p>Volume: <span class="result-value">${results.volume}</span></p>
            <p>Luas Permukaan: <span class="result-value">${results.area}</span></p>
        `;
        resultsPanel.innerHTML = html;
    }

    /**
     * Handles the selection of a new shape.
     * @param {string} shape - The shape ID ('cube', 'box', 'cylinder').
     */
    function selectShape(shape) {
        if (currentShape === shape) return;

        // Update active button
        document.querySelector(`.shape-options button.active`).classList.remove('active');
        document.getElementById(`select-${shape}`).classList.add('active');

        currentShape = shape;
        renderParameters();
        updateShapeAndCalculations();
        hideNet(); // Hide net when switching shapes
    }

    /**
     * Toggles the visibility of the net diagram.
     */
    function toggleNet() {
        const isHidden = netViewer.classList.contains('hidden');
        if (isHidden) {
            showNet();
        } else {
            hideNet();
        }
    }

    /**
     * Shows the net diagram.
     */
    function showNet() {
        netImage.src = shapeData[currentShape].netImage;
        netImage.alt = `Jaring-jaring ${shapeData[currentShape].name}`;
        netViewer.classList.remove('hidden');
        toggleNetBtn.textContent = 'Sembunyikan Net';
    }

    /**
     * Hides the net diagram.
     */
    function hideNet() {
        netViewer.classList.add('hidden');
        toggleNetBtn.textContent = 'Tampilkan Net';
    }

    /**
     * Initializes all UI event listeners.
     */
    function initUI() {
        // Shape selection listeners
        shapeSelector.querySelectorAll('.shape-options button').forEach(button => {
            button.addEventListener('click', () => selectShape(button.dataset.shape));
        });

        // Action button listeners
        toggleNetBtn.addEventListener('click', toggleNet);
        resetCameraBtn.addEventListener('click', window.SceneManager.resetCamera);

        // Load default shape UI and calculations
        renderParameters();
        renderResults();
    }

    return {
        initUI,
        selectShape,
        updateShapeAndCalculations // Exposed for initial load in main.js
    };
})();

window.UIManager = UIManager;
