module.exports = {
/***/ "./src/ring-buffer.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   N: () => (/* binding */ RingBuffer)
/* harmony export */ });
/**
 * Ring buffer implementation for efficient fixed-size storage
 * Provides O(1) push and prevents array reallocation/shifting
 */
class RingBuffer {
    capacity;
    buffer;
    head = 0; // Index where next item will be written
    count = 0; // Number of items currently in buffer
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }
    /**
     * Adds an item to the buffer, overwriting oldest item if full
     */
    push(item) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.count < this.capacity) {
            this.count++;
        }
    }
    /**
     * Returns all items in chronological order (oldest to newest)
     */
    toArray() {
        if (this.count === 0) {
            return [];
        }
        const result = [];
        const start = this.count < this.capacity ? 0 : this.head;
        for (let i = 0; i < this.count; i++) {
            const index = (start + i) % this.capacity;
            const item = this.buffer[index];
            if (item !== undefined) {
                result.push(item);
            }
        }
        return result;
    }
    /**
     * Returns items starting from the item after the one with the given predicate
     */
    sliceAfter(predicate) {
        const all = this.toArray();
        const index = all.findIndex(predicate);
        if (index === -1) {
            return all;
        }
        return all.slice(index + 1);
    }
    /**
     * Returns the number of items in the buffer
     */
    get size() {
        return this.count;
    }
}


/***/ },

};
