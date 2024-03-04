/**
 * Useful extensions to native types.
 *
 * @module utils/extensions
 */

export {}

// =================================================================================================

declare global {
    interface Array<T> {
        last(): T
        setLast(item: T): void
    }
}

Object.defineProperty(Array.prototype, "last", {
    enumerable: false, // don't include in for...in loops
    configurable: true, // enable redefinition — good for hotloading
    value: function () {
        return this[this.length - 1]
    },
})

Object.defineProperty(Array.prototype, "setLast", {
    enumerable: false, // don't include in for...in loops
    configurable: true, // enable redefinition — good for hotloading
    value: function (item: any) {
        this[this.length - 1] = item
    },
})

// =================================================================================================
