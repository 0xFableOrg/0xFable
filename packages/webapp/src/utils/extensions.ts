/**
 * Useful extensions to native types.
 *
 * @module utils/extensions
 */

export {}

// =================================================================================================

declare global {
  interface Array<T> {
    last(): T;
    setLast(item: T): void;
  }
}

Array.prototype.last = function() {
  return this[this.length - 1]
}

Array.prototype.setLast = function(item) {
  this[this.length - 1] = item
}

// =================================================================================================