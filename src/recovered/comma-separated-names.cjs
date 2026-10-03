module.exports = {
/***/ "./src/comma-separated-names.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   w: () => (/* binding */ parseCommaSeparatedNames)
/* harmony export */ });
/**
 * Parses a comma-separated name list, preserving first-seen order.
 */
function parseCommaSeparatedNames(value) {
    const names = new Set();
    if (value === undefined) {
        return [];
    }
    for (const name of value.split(",")) {
        const trimmedName = name.trim();
        if (trimmedName.length > 0) {
            names.add(trimmedName);
        }
    }
    return [...names];
}


/***/ },

};
