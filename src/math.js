/**
 * src/math.js
 * Contains all mathematical calculation functions for volume and surface area.
 */

const PI = Math.PI;

/**
 * Validates a number input.
 * @param {number} value - The value to validate.
 * @returns {number} The validated value, or a default if invalid.
 */
function validateInput(value) {
    const min = 0.1;
    const max = 10000;
    let num = parseFloat(value);

    if (isNaN(num) || num < min) {
        return min;
    }
    if (num > max) {
        return max;
    }
    return num;
}

/**
 * Rounds a number to 2 decimal places.
 * @param {number} value - The number to round.
 * @returns {number} The rounded number.
 */
function roundToTwoDecimals(value) {
    return Math.round(value * 100) / 100;
}

// --- Kubus (Cube) ---

function volumeKubus(s) {
    s = validateInput(s);
    return roundToTwoDecimals(s * s * s);
}

function luasKubus(s) {
    s = validateInput(s);
    return roundToTwoDecimals(6 * s * s);
}

// --- Balok (Box/Rectangular Prism) ---

function volumeBalok(p, l, t) {
    p = validateInput(p);
    l = validateInput(l);
    t = validateInput(t);
    return roundToTwoDecimals(p * l * t);
}

function luasBalok(p, l, t) {
    p = validateInput(p);
    l = validateInput(l);
    t = validateInput(t);
    // 2(pl + pt + lt)
    return roundToTwoDecimals(2 * (p * l + p * t + l * t));
}

// --- Tabung (Cylinder) ---

function volumeTabung(r, t) {
    r = validateInput(r);
    t = validateInput(t);
    // V = πr²t
    return roundToTwoDecimals(PI * r * r * t);
}

function luasTabung(r, t) {
    r = validateInput(r);
    t = validateInput(t);
    // Luas Permukaan = 2πr(r + t)
    return roundToTwoDecimals(2 * PI * r * (r + t));
}

// Export functions for use in other modules
window.MathFunctions = {
    validateInput,
    volumeKubus,
    luasKubus,
    volumeBalok,
    luasBalok,
    volumeTabung,
    luasTabung
};
