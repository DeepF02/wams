(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wamsClient = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = after;

function after(count, callback, err_cb) {
  var bail = false;
  err_cb = err_cb || noop;
  proxy.count = count;
  return count === 0 ? callback() : proxy;

  function proxy(err, result) {
    if (proxy.count <= 0) {
      throw new Error('after called too many times');
    }

    --proxy.count; // after first error, rest are passed to err_cb

    if (err) {
      bail = true;
      callback(err); // future error callbacks will go to error handler

      callback = err_cb;
    } else if (proxy.count === 0 && !bail) {
      callback(null, result);
    }
  }
}

function noop() {}

},{}],2:[function(require,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */
module.exports = function (arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) {
    return arraybuffer.slice(start, end);
  }

  if (start < 0) {
    start += bytes;
  }

  if (end < 0) {
    end += bytes;
  }

  if (end > bytes) {
    end = bytes;
  }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);

  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }

  return result.buffer;
};

},{}],3:[function(require,module,exports){
/**
 * Expose `Backoff`.
 */
module.exports = Backoff;
/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */


Backoff.prototype.duration = function () {
  var ms = this.ms * Math.pow(this.factor, this.attempts++);

  if (this.jitter) {
    var rand = Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
  }

  return Math.min(ms, this.max) | 0;
};
/**
 * Reset the number of attempts.
 *
 * @api public
 */


Backoff.prototype.reset = function () {
  this.attempts = 0;
};
/**
 * Set the minimum duration
 *
 * @api public
 */


Backoff.prototype.setMin = function (min) {
  this.ms = min;
};
/**
 * Set the maximum duration
 *
 * @api public
 */


Backoff.prototype.setMax = function (max) {
  this.max = max;
};
/**
 * Set the jitter
 *
 * @api public
 */


Backoff.prototype.setJitter = function (jitter) {
  this.jitter = jitter;
};

},{}],4:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function () {
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // Use a lookup table to find the index.

  var lookup = new Uint8Array(256);

  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function (arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
        i,
        len = bytes.length,
        base64 = "";

    for (i = 0; i < len; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
      base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
      base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode = function (base64) {
    var bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;

      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }

    return arraybuffer;
  };
})();

},{}],5:[function(require,module,exports){
'use strict';

exports.byteLength = byteLength;
exports.toByteArray = toByteArray;
exports.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
} // Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications


revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;

function getLens(b64) {
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  } // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42


  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
} // base64 is 4/3 + up to two characters of the original data


function byteLength(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars

  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

  for (var i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  return arr;
}

function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}

function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];

  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }

  return output.join('');
}

function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3
  // go through the array every three bytes, we'll deal with trailing stuff later

  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  } // pad the end with zeros, but make sure to not forget the extra bytes


  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }

  return parts.join('');
}

},{}],6:[function(require,module,exports){
/**
 * Create a blob builder even when vendor prefixes exist
 */
var BlobBuilder = typeof BlobBuilder !== 'undefined' ? BlobBuilder : typeof WebKitBlobBuilder !== 'undefined' ? WebKitBlobBuilder : typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : false;
/**
 * Check if Blob constructor is supported
 */

var blobSupported = function () {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch (e) {
    return false;
  }
}();
/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */


var blobSupportsArrayBufferView = blobSupported && function () {
  try {
    var b = new Blob([new Uint8Array([1, 2])]);
    return b.size === 2;
  } catch (e) {
    return false;
  }
}();
/**
 * Check if BlobBuilder is supported
 */


var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;
/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  return ary.map(function (chunk) {
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer; // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer

      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      return buf;
    }

    return chunk;
  });
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};
  var bb = new BlobBuilder();
  mapArrayBufferViews(ary).forEach(function (part) {
    bb.append(part);
  });
  return options.type ? bb.getBlob(options.type) : bb.getBlob();
}

;

function BlobConstructor(ary, options) {
  return new Blob(mapArrayBufferViews(ary), options || {});
}

;

if (typeof Blob !== 'undefined') {
  BlobBuilderConstructor.prototype = Blob.prototype;
  BlobConstructor.prototype = Blob.prototype;
}

module.exports = function () {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
}();

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

/* eslint-disable no-proto */
'use strict';

var base64 = require('base64-js');

var ieee754 = require('ieee754');

exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.INSPECT_MAX_BYTES = 50;
var K_MAX_LENGTH = 0x7fffffff;
exports.kMaxLength = K_MAX_LENGTH;
/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */

Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
  console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}

function typedArraySupport() {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1);
    arr.__proto__ = {
      __proto__: Uint8Array.prototype,
      foo: function () {
        return 42;
      }
    };
    return arr.foo() === 42;
  } catch (e) {
    return false;
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.buffer;
  }
});
Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.byteOffset;
  }
});

function createBuffer(length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  } // Return an augmented `Uint8Array` instance


  var buf = new Uint8Array(length);
  buf.__proto__ = Buffer.prototype;
  return buf;
}
/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */


function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError('The "string" argument must be of type string. Received type number');
    }

    return allocUnsafe(arg);
  }

  return from(arg, encodingOrOffset, length);
} // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97


if (typeof Symbol !== 'undefined' && Symbol.species != null && Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  });
}

Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset);
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value);
  }

  if (value == null) {
    throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
  }

  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof value === 'number') {
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  }

  var valueOf = value.valueOf && value.valueOf();

  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length);
  }

  var b = fromObject(value);
  if (b) return b;

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
}
/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/


Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
}; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148


Buffer.prototype.__proto__ = Uint8Array.prototype;
Buffer.__proto__ = Uint8Array;

function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number');
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
  }
}

function alloc(size, fill, encoding) {
  assertSize(size);

  if (size <= 0) {
    return createBuffer(size);
  }

  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  }

  return createBuffer(size);
}
/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/


Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding);
};

function allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */


Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */


Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size);
};

function fromString(string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }

  var length = byteLength(string, encoding) | 0;
  var buf = createBuffer(length);
  var actual = buf.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual);
  }

  return buf;
}

function fromArrayLike(array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  var buf = createBuffer(length);

  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255;
  }

  return buf;
}

function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds');
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds');
  }

  var buf;

  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array);
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset);
  } else {
    buf = new Uint8Array(array, byteOffset, length);
  } // Return an augmented `Uint8Array` instance


  buf.__proto__ = Buffer.prototype;
  return buf;
}

function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0;
    var buf = createBuffer(len);

    if (buf.length === 0) {
      return buf;
    }

    obj.copy(buf, 0, 0, len);
    return buf;
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0);
    }

    return fromArrayLike(obj);
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}

function checked(length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
  }

  return length | 0;
}

function SlowBuffer(length) {
  if (+length != length) {
    // eslint-disable-line eqeqeq
    length = 0;
  }

  return Buffer.alloc(+length);
}

Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};

Buffer.compare = function compare(a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);

  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  }

  if (a === b) return 0;
  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};

Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true;

    default:
      return false;
  }
};

Buffer.concat = function concat(list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }

  if (list.length === 0) {
    return Buffer.alloc(0);
  }

  var i;

  if (length === undefined) {
    length = 0;

    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;

  for (i = 0; i < list.length; ++i) {
    var buf = list[i];

    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf);
    }

    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    buf.copy(buffer, pos);
    pos += buf.length;
  }

  return buffer;
};

function byteLength(string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length;
  }

  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength;
  }

  if (typeof string !== 'string') {
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + typeof string);
  }

  var len = string.length;
  var mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion

  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len;

      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length;

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2;

      case 'hex':
        return len >>> 1;

      case 'base64':
        return base64ToBytes(string).length;

      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
        }

        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}

Buffer.byteLength = byteLength;

function slowToString(encoding, start, end) {
  var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.
  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

  if (start === undefined || start < 0) {
    start = 0;
  } // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.


  if (start > this.length) {
    return '';
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return '';
  } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return '';
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end);

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end);

      case 'ascii':
        return asciiSlice(this, start, end);

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end);

      case 'base64':
        return base64Slice(this, start, end);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
} // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154


Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
  var len = this.length;

  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits');
  }

  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }

  return this;
};

Buffer.prototype.swap32 = function swap32() {
  var len = this.length;

  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits');
  }

  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }

  return this;
};

Buffer.prototype.swap64 = function swap64() {
  var len = this.length;

  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits');
  }

  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }

  return this;
};

Buffer.prototype.toString = function toString() {
  var length = this.length;
  if (length === 0) return '';
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};

Buffer.prototype.inspect = function inspect() {
  var str = '';
  var max = exports.INSPECT_MAX_BYTES;
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
  if (this.length > max) str += ' ... ';
  return '<Buffer ' + str + '>';
};

Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength);
  }

  if (!Buffer.isBuffer(target)) {
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target);
  }

  if (start === undefined) {
    start = 0;
  }

  if (end === undefined) {
    end = target ? target.length : 0;
  }

  if (thisStart === undefined) {
    thisStart = 0;
  }

  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index');
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }

  if (thisStart >= thisEnd) {
    return -1;
  }

  if (start >= end) {
    return 1;
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
}; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf


function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1; // Normalize byteOffset

  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }

  byteOffset = +byteOffset; // Coerce to Number.

  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : buffer.length - 1;
  } // Normalize byteOffset: negative offsets start from the end of the buffer


  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

  if (byteOffset >= buffer.length) {
    if (dir) return -1;else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;else return -1;
  } // Normalize val


  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  } // Finally, search either indexOf (if dir is true) or lastIndexOf


  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1;
    }

    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]

    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }

    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }

  throw new TypeError('val must be string, number or Buffer');
}

function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();

    if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }

      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read(buf, i) {
    if (indexSize === 1) {
      return buf[i];
    } else {
      return buf.readUInt16BE(i * indexSize);
    }
  }

  var i;

  if (dir) {
    var foundIndex = -1;

    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

    for (i = byteOffset; i >= 0; i--) {
      var found = true;

      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break;
        }
      }

      if (found) return i;
    }
  }

  return -1;
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;

  if (!length) {
    length = remaining;
  } else {
    length = Number(length);

    if (length > remaining) {
      length = remaining;
    }
  }

  var strLen = string.length;

  if (length > strLen / 2) {
    length = strLen / 2;
  }

  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (numberIsNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }

  return i;
}

function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}

function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}

function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}

function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}

function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}

Buffer.prototype.write = function write(string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0; // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0; // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0;

    if (isFinite(length)) {
      length = length >>> 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  } else {
    throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds');
  }

  if (!encoding) encoding = 'utf8';
  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length);

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length);

      case 'ascii':
        return asciiWrite(this, string, offset, length);

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length);

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON() {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};

function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf);
  } else {
    return base64.fromByteArray(buf.slice(start, end));
  }
}

function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;

  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }

          break;

        case 2:
          secondByte = buf[i + 1];

          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }

      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res);
} // Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety


var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;

  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
  } // Decode in chunks to avoid "call stack size exceeded".


  var res = '';
  var i = 0;

  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }

  return res;
}

function asciiSlice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }

  return ret;
}

function latin1Slice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }

  return ret;
}

function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = '';

  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }

  return out;
}

function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';

  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }

  return res;
}

Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;
  var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance

  newBuf.__proto__ = Buffer.prototype;
  return newBuf;
};
/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */


function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}

Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val;
};

Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;

  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val;
};

Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};

Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};

Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};

Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};

Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};

Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];

  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return this[offset];
  return (0xff - this[offset] + 1) * -1;
};

Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};

Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};

Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, true, 23, 4);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, false, 23, 4);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, true, 52, 8);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, false, 52, 8);
};

function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
}

Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset + 3] = value >>> 24;
  this[offset + 2] = value >>> 16;
  this[offset + 1] = value >>> 8;
  this[offset] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  this[offset + 2] = value >>> 16;
  this[offset + 3] = value >>> 24;
  return offset + 4;
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
  if (offset < 0) throw new RangeError('Index out of range');
}

function writeFloat(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  ieee754.write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}

Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};

function writeDouble(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  ieee754.write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
}; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds');
  }

  if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
  if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

  if (end > this.length) end = this.length;

  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end);
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  }

  return len;
}; // Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])


Buffer.prototype.fill = function fill(val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string');
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }

    if (val.length === 1) {
      var code = val.charCodeAt(0);

      if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code;
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  } // Invalid ranges are not set to a default, so can range check early.


  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index');
  }

  if (end <= start) {
    return this;
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;

  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
    var len = bytes.length;

    if (len === 0) {
      throw new TypeError('The value "' + val + '" is invalid for argument "value"');
    }

    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this;
}; // HELPER FUNCTIONS
// ================


var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

function base64clean(str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]; // Node strips out invalid characters like \n and \t from the string, base64-js does not

  str = str.trim().replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

  if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

  while (str.length % 4 !== 0) {
    str = str + '=';
  }

  return str;
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i); // is surrogate component

    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } // valid lead


        leadSurrogate = codePoint;
        continue;
      } // 2 leads in a row


      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      } // valid surrogate pair


      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null; // encode utf8

    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return bytes;
}

function asciiToBytes(str) {
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }

  return byteArray;
}

function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray;
}

function base64ToBytes(str) {
  return base64.toByteArray(base64clean(str));
}

function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }

  return i;
} // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166


function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}

function numberIsNaN(obj) {
  // For IE11 support
  return obj !== obj; // eslint-disable-line no-self-compare
}

},{"base64-js":5,"ieee754":107}],9:[function(require,module,exports){
"use strict";
/*
 * Access point for npm.
 */

const CanvasSequence = require('./src/CanvasSequence.js');

const CanvasBlueprint = require('./src/CanvasBlueprint.js');

module.exports = {
  CanvasSequence,
  CanvasBlueprint
};

},{"./src/CanvasBlueprint.js":11,"./src/CanvasSequence.js":12}],10:[function(require,module,exports){
/*
 * Author: Michael van der Kamp
 * Date: July/August, 2018
 * 
 * This file defines the low level 'CanvasAtom' for use by a CanvasSequence.
 *
 * A CanvasAtom is a unit of execution in a CanvasSequence. It comes in two
 * flavours: one for describing a method call, one for describing a property
 * assignment.
 */
'use strict';
/**
 * The types of CanvasAtoms that are available.
 *
 * @enum {string}
 * @readonly
 * @lends CanvasAtom
 */

require("core-js/modules/web.dom-collections.iterator");

const TYPES = {
  /** @const */
  METHOD: 'method',

  /** @const */
  PROPERTY: 'property'
};
/**
 * Internal common constructor definition for Canvas Atoms.
 */

class Atom {
  /**
   * @param {string} inst - The canvas context instruction.
   * @param {mixed[]} args - The arguments to the instruction.
   */
  constructor(inst, args) {
    /**
     * The canvas context instruction.
     *
     * @private
     * @type {string}
     */
    this.inst = inst;
    /**
     * The arguments to the instruction.
     *
     * @private
     * @type {mixed[]}
     */

    this.args = args;
  }

}
/**
 * A MethodCanvasAtom is used for canvas context methods. The arguments will be
 * treated as an actual array, all of which will be passed to the method when
 * the atom is executed.
 *
 * @extends Atom
 */


class MethodCanvasAtom extends Atom {
  constructor(inst, args) {
    super(inst, args);
    /**
     * The type of atom.
     *
     * @private
     * @type {string}
     */

    this.type = TYPES.METHOD;
  }
  /**
   * Execute the atom on the given context.
   *
   * @param {CanvasRenderingContext2D} context
   */


  execute(context) {
    context[this.inst](...this.args);
  }

}
/**
 * A PropertyCanvasAtom is used for canvas context properties (a.k.a. fields).
 * Only the first argument will be used, and will be the value assigned to the
 * field.
 *
 * @extends Atom
 */


class PropertyCanvasAtom extends Atom {
  constructor(inst, args) {
    super(inst, args);
    this.type = TYPES.PROPERTY;
  }
  /**
   * Execute the atom on the given context.
   *
   * @param {CanvasRenderingContext2D} context
   */


  execute(context) {
    context[this.inst] = this.args[0];
  }

}
/*
 * This object is for demultiplexing types in the CanvasAtom constructor.
 * Defined outside the constructor so it doesn't need to be redefined every
 * time a new atom is constructed. Defined outside the class so that it is not
 * externally exposed.
 */


const atomOf = {
  [TYPES.METHOD]: MethodCanvasAtom,
  [TYPES.PROPERTY]: PropertyCanvasAtom
};
/**
 * The exposed CanvasAtom class. Results in the instantiation of either a
 * MethodCanvasAtom or a PropertyCanvasAtom, depending on the given type.
 */

class CanvasAtom {
  /**
   * @param {string} type - Either CanvasAtom.METHOD or CanvasAtom.PROPERTY.
   * @param {string} inst - The canvas context instruction.
   * @param {mixed[]} args - The arguments to the instruction.
   */
  constructor(type, inst, ...args) {
    return new atomOf[type](inst, args);
  }

}
/*
 * Define the types once locally, but make them available externally as
 * immutable properties on the class.
 */


Object.entries(TYPES).forEach(([p, v]) => {
  Object.defineProperty(CanvasAtom, p, {
    value: v,
    configurable: false,
    enumerable: true,
    writable: false
  });
});
module.exports = CanvasAtom;

},{"core-js/modules/web.dom-collections.iterator":90}],11:[function(require,module,exports){
/*
 * Author: Michael van der Kamp
 * Date: July/August, 2018
 * 
 * Thie file provides the definition of the CanvasBlueprint class.
 *
 * A CanvasBlueprint is similar to a plain CanvasSequence, except that it
 * accepts tag strings as arguments, and before it can be executed it  needs to
 * be 'built' with an object defining which values should replace the tags.
 */
'use strict';

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.string.replace");

require("core-js/modules/web.dom-collections.iterator");

const CanvasSequence = require('./CanvasSequence.js'); // Mark properties as intended for internal use.


const symbols = Object.freeze({
  sequence: Symbol.for('sequence'),
  push: Symbol.for('push')
});
/**
 * Replace tags in the given string with correlated value in values.
 *
 * Rules:
 * - Strings not surrounded by curly braces {} will be returned.
 * - Strings surrounded by curly braces but not corresponding to a property on
 *   'values' will result in a string without the curly braces being returned.
 * - Strings surrounded by curly braces, with the inner string corresponding to
 *   a property on 'values' will result in the corresponding value being
 *   returned.
 *
 * @inner
 * @private
 *
 * @param {string} str
 * @param {object} values
 *
 * @return {string|mixed} Either the original string if no replacement was
 * performed, or the appropriate value.
 */

function replaceTags(str, values) {
  const tag = str.replace(/^{|}$/g, '');

  if (tag !== str) {
    return values.hasOwnProperty(tag) ? values[tag] : tag;
  }

  return str;
}
/**
 * A CanvasBlueprint is a rebuildable CanvasSequence. It accepts tagged
 * arguments. When built, tags will be replaced using properties from a provided
 * object.
 *
 * @extends CanvasSequence
 */


class CanvasBlueprint extends CanvasSequence {
  /** Build the blueprint using the provided values.
   *
   * Rules: 
   * - Strings not surrounded by curly braces {} will be returned.
   * - Strings surrounded by curly braces but not corresponding to a property on
   *   'values' will result in a string without the curly braces being returned.
   * - Strings surrounded by curly braces, with the inner string corresponding
   *   to a property on 'values' will result in the corresponding value being
   *   returned.
   *
   * @param {object} values - The values with which to construct the sequence.
   *
   * @return {CanvasSequence} The constructed sequence.
   */
  build(values = {}) {
    const seq = new CanvasSequence();
    this[symbols.sequence].forEach(({
      type,
      inst,
      args
    }) => {
      const realArgs = args.map(v => {
        return typeof v === 'string' ? replaceTags(v, values) : v;
      });
      seq[symbols.push](type, inst, ...realArgs);
    });
    return seq;
  }
  /**
   * CanvasBlueprints cannot be directly executed!
   *
   * @throws TypeError
   */


  execute() {
    throw new TypeError('Cannot execute a blueprint.');
  }

}

module.exports = CanvasBlueprint;

},{"./CanvasSequence.js":12,"core-js/modules/es.string.replace":88,"core-js/modules/es.symbol.description":89,"core-js/modules/web.dom-collections.iterator":90}],12:[function(require,module,exports){
/*
 * Author: Michael van der Kamp
 * Date: July/August, 2018
 * 
 * This file provides the definition of the CanvasSequence class.
 */
'use strict';

require("core-js/modules/es.symbol.description");

require("core-js/modules/web.dom-collections.iterator");

const CanvasAtom = require('./CanvasAtom.js');

const locals = Object.freeze({
  METHODS: ['arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip', 'closePath', 'drawFocusIfNeeded', 'drawImage', 'ellipse', 'fill', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'putImageData', 'quadraticCurveTo', 'rect', 'resetTransform', 'restore', 'rotate', 'save', 'scale', 'setLineDash', 'setTransform', 'stroke', 'strokeRect', 'strokeText', 'transform', 'translate'],
  PROPERTIES: ['fillStyle', 'filter', 'font', 'globalAlpha', 'globalCompositeOperation', 'imageSmoothingEnabled', 'lineCap', 'lineDashOffset', 'lineJoin', 'lineWidth', 'miterLimit', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY', 'strokeStyle', 'textAlign', 'textBaseline']
}); // Mark properties as intended for internal use.

const symbols = Object.freeze({
  sequence: Symbol.for('sequence'),
  push: Symbol.for('push'),
  fromJSON: Symbol.for('fromJSON')
});
/**
 * A CanvasSequence is a linear collection of CanvasAtoms, capable of being
 * executed on a CanvasRenderingContext2D.
 */

class CanvasSequence {
  /**
   * @param {CanvasSequence} [data=null] - An unrevived (i.e. freshly
   * transmitted) CanvasSequence. If present, the constructor revives the
   * sequence. Note that an already revived CanvasSequence cannot be used as the
   * argument here.
   */
  constructor(data = null) {
    /**
     * The CanvasAtoms that form the sequence.
     *
     * @private
     * @type {CanvasAtom[]}
     */
    this[symbols.sequence] = []; // If data is present, assume it is a CanvasSequence that needs reviving.

    if (data) this[symbols.fromJSON](data);
  }
  /**
   * Revive the sequence from transmitted JSON data.
   *
   * @private
   * @param {CanvasSequence} [data={}]
   */


  [symbols.fromJSON](data = {}) {
    data.sequence.forEach(({
      type,
      inst,
      args
    }) => {
      this[symbols.push](type, inst, ...args);
    });
  }
  /**
   * Push a new CanvasAtom onto the end of the sequence.
   *
   * @private
   * @param {...mixed} args - The arguments to the CanvasAtom constructor.
   */


  [symbols.push](...args) {
    this[symbols.sequence].push(new CanvasAtom(...args));
  }
  /**
   * Execute the sequence on the given context.
   *
   * @param {CanvasRenderingContext2D} context
   */


  execute(context) {
    context.save();
    this[symbols.sequence].forEach(a => a.execute(context));
    context.restore();
  }
  /**
   * Export a JSON serialized version of the sequence, ready for transmission.
   *
   * @return {CanvasSequence} In JSON serialized form.
   */


  toJSON() {
    return {
      sequence: this[symbols.sequence]
    };
  }

}

locals.METHODS.forEach(m => {
  Object.defineProperty(CanvasSequence.prototype, m, {
    value: function pushMethodCall(...args) {
      this[symbols.push](CanvasAtom.METHOD, m, ...args);
    },
    writable: false,
    enumerable: true,
    configurable: false
  });
});
locals.PROPERTIES.forEach(p => {
  Object.defineProperty(CanvasSequence.prototype, p, {
    get() {
      throw "Invalid canvas sequencer interaction, cannot get ".concat(p, ".");
    },

    set(v) {
      this[symbols.push](CanvasAtom.PROPERTY, p, v);
    },

    enumerable: true,
    configurable: false
  });
});
module.exports = CanvasSequence;

},{"./CanvasAtom.js":10,"core-js/modules/es.symbol.description":89,"core-js/modules/web.dom-collections.iterator":90}],13:[function(require,module,exports){
/**
 * Slice reference.
 */
var slice = [].slice;
/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function (obj, fn) {
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function () {
    return fn.apply(obj, args.concat(slice.call(arguments)));
  };
};

},{}],14:[function(require,module,exports){
/**
 * Expose `Emitter`.
 */
if (typeof module !== 'undefined') {
  module.exports = Emitter;
}
/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */


function Emitter(obj) {
  if (obj) return mixin(obj);
}

;
/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }

  return obj;
}
/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};
/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};
/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */


Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {}; // all

  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  } // specific event


  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this; // remove all handlers

  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  } // remove specific handler


  var cb;

  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];

    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  return this;
};
/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */


Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1),
      callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);

    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};
/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */


Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};
/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */


Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};

},{}],15:[function(require,module,exports){
module.exports = function (a, b) {
  var fn = function () {};

  fn.prototype = b.prototype;
  a.prototype = new fn();
  a.prototype.constructor = a;
};

},{}],16:[function(require,module,exports){
var UNSCOPABLES = require('../internals/well-known-symbol')('unscopables');

var create = require('../internals/object-create');

var hide = require('../internals/hide');

var ArrayPrototype = Array.prototype; // Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables

if (ArrayPrototype[UNSCOPABLES] == undefined) {
  hide(ArrayPrototype, UNSCOPABLES, create(null));
} // add a key to Array.prototype[@@unscopables]


module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

},{"../internals/hide":38,"../internals/object-create":51,"../internals/well-known-symbol":84}],17:[function(require,module,exports){
'use strict';

var codePointAt = require('../internals/string-at'); // `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex


module.exports = function (S, index, unicode) {
  return index + (unicode ? codePointAt(S, index, true).length : 1);
};

},{"../internals/string-at":72}],18:[function(require,module,exports){
var isObject = require('../internals/is-object');

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  }

  return it;
};

},{"../internals/is-object":44}],19:[function(require,module,exports){
var toIndexedObject = require('../internals/to-indexed-object');

var toLength = require('../internals/to-length');

var toAbsoluteIndex = require('../internals/to-absolute-index'); // `Array.prototype.{ indexOf, includes }` methods implementation
// false -> Array#indexOf
// https://tc39.github.io/ecma262/#sec-array.prototype.indexof
// true  -> Array#includes
// https://tc39.github.io/ecma262/#sec-array.prototype.includes


module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value; // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare

    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++]; // eslint-disable-next-line no-self-compare

      if (value != value) return true; // Array#indexOf ignores holes, Array#includes - not
    } else for (; length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    }
    return !IS_INCLUDES && -1;
  };
};

},{"../internals/to-absolute-index":75,"../internals/to-indexed-object":76,"../internals/to-length":78}],20:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],21:[function(require,module,exports){
var has = require('../internals/has');

var ownKeys = require('../internals/own-keys');

var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');

var definePropertyModule = require('../internals/object-define-property');

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

},{"../internals/has":36,"../internals/object-define-property":53,"../internals/object-get-own-property-descriptor":54,"../internals/own-keys":62}],22:[function(require,module,exports){
var MATCH = require('../internals/well-known-symbol')('match');

module.exports = function (METHOD_NAME) {
  var regexp = /./;

  try {
    '/./'[METHOD_NAME](regexp);
  } catch (e) {
    try {
      regexp[MATCH] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (f) {
      /* empty */
    }
  }

  return false;
};

},{"../internals/well-known-symbol":84}],23:[function(require,module,exports){
module.exports = !require('../internals/fails')(function () {
  function F() {
    /* empty */
  }

  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

},{"../internals/fails":32}],24:[function(require,module,exports){
'use strict';

var IteratorPrototype = require('../internals/iterators-core').IteratorPrototype;

var create = require('../internals/object-create');

var createPropertyDescriptor = require('../internals/create-property-descriptor');

var setToStringTag = require('../internals/set-to-string-tag');

var Iterators = require('../internals/iterators');

var returnThis = function () {
  return this;
};

module.exports = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, {
    next: createPropertyDescriptor(1, next)
  });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};

},{"../internals/create-property-descriptor":25,"../internals/iterators":48,"../internals/iterators-core":47,"../internals/object-create":51,"../internals/set-to-string-tag":69}],25:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],26:[function(require,module,exports){
'use strict';

var $export = require('../internals/export');

var createIteratorConstructor = require('../internals/create-iterator-constructor');

var getPrototypeOf = require('../internals/object-get-prototype-of');

var setPrototypeOf = require('../internals/object-set-prototype-of');

var setToStringTag = require('../internals/set-to-string-tag');

var hide = require('../internals/hide');

var redefine = require('../internals/redefine');

var IS_PURE = require('../internals/is-pure');

var ITERATOR = require('../internals/well-known-symbol')('iterator');

var Iterators = require('../internals/iterators');

var IteratorsCore = require('../internals/iterators-core');

var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () {
  return this;
};

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];

    switch (KIND) {
      case KEYS:
        return function keys() {
          return new IteratorConstructor(this, KIND);
        };

      case VALUES:
        return function values() {
          return new IteratorConstructor(this, KIND);
        };

      case ENTRIES:
        return function entries() {
          return new IteratorConstructor(this, KIND);
        };
    }

    return function () {
      return new IteratorConstructor(this);
    };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR] || IterablePrototype['@@iterator'] || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY; // fix native

  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));

    if (IteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (typeof CurrentIteratorPrototype[ITERATOR] != 'function') {
          hide(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      } // Set @@toStringTag to native iterators


      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  } // fix Array#{values, @@iterator}.name in V8 / FF


  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;

    defaultIterator = function values() {
      return nativeIterator.call(this);
    };
  } // define iterator


  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    hide(IterablePrototype, ITERATOR, defaultIterator);
  }

  Iterators[NAME] = defaultIterator; // export additional methods

  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else $export({
      target: NAME,
      proto: true,
      forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME
    }, methods);
  }

  return methods;
};

},{"../internals/create-iterator-constructor":24,"../internals/export":31,"../internals/hide":38,"../internals/is-pure":45,"../internals/iterators":48,"../internals/iterators-core":47,"../internals/object-get-prototype-of":57,"../internals/object-set-prototype-of":61,"../internals/redefine":63,"../internals/set-to-string-tag":69,"../internals/well-known-symbol":84}],27:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('../internals/fails')(function () {
  return Object.defineProperty({}, 'a', {
    get: function () {
      return 7;
    }
  }).a != 7;
});

},{"../internals/fails":32}],28:[function(require,module,exports){
var isObject = require('../internals/is-object');

var document = require('../internals/global').document; // typeof document.createElement is 'object' in old IE


var exist = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return exist ? document.createElement(it) : {};
};

},{"../internals/global":35,"../internals/is-object":44}],29:[function(require,module,exports){
// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

},{}],30:[function(require,module,exports){
// IE8- don't enum bug keys
module.exports = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

},{}],31:[function(require,module,exports){
var global = require('../internals/global');

var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;

var hide = require('../internals/hide');

var redefine = require('../internals/redefine');

var setGlobal = require('../internals/set-global');

var copyConstructorProperties = require('../internals/copy-constructor-properties');

var isForced = require('../internals/is-forced');
/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/


module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;

  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }

  if (target) for (key in source) {
    sourceProperty = source[key];

    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];

    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced); // contained in target

    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    } // add a flag to not completely full polyfills


    if (options.sham || targetProperty && targetProperty.sham) {
      hide(sourceProperty, 'sham', true);
    } // extend global


    redefine(target, key, sourceProperty, options);
  }
};

},{"../internals/copy-constructor-properties":21,"../internals/global":35,"../internals/hide":38,"../internals/is-forced":43,"../internals/object-get-own-property-descriptor":54,"../internals/redefine":63,"../internals/set-global":68}],32:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],33:[function(require,module,exports){
'use strict';

var hide = require('../internals/hide');

var redefine = require('../internals/redefine');

var fails = require('../internals/fails');

var wellKnownSymbol = require('../internals/well-known-symbol');

var regexpExec = require('../internals/regexp-exec');

var SPECIES = wellKnownSymbol('species');
var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;

  re.exec = function () {
    var result = [];
    result.groups = {
      a: '7'
    };
    return result;
  };

  return ''.replace(re, '$<a>') !== '7';
}); // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper

var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  var re = /(?:)/;
  var originalExec = re.exec;

  re.exec = function () {
    return originalExec.apply(this, arguments);
  };

  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

module.exports = function (KEY, length, exec, sham) {
  var SYMBOL = wellKnownSymbol(KEY);
  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};

    O[SYMBOL] = function () {
      return 7;
    };

    return ''[KEY](O) != 7;
  });
  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    re.exec = function () {
      execCalled = true;
      return null;
    };

    if (KEY === 'split') {
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};

      re.constructor[SPECIES] = function () {
        return re;
      };
    }

    re[SYMBOL]('');
    return !execCalled;
  });

  if (!DELEGATES_TO_SYMBOL || !DELEGATES_TO_EXEC || KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS || KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      if (regexp.exec === regexpExec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return {
            done: true,
            value: nativeRegExpMethod.call(regexp, str, arg2)
          };
        }

        return {
          done: true,
          value: nativeMethod.call(str, regexp, arg2)
        };
      }

      return {
        done: false
      };
    });
    var stringMethod = methods[0];
    var regexMethod = methods[1];
    redefine(String.prototype, KEY, stringMethod);
    redefine(RegExp.prototype, SYMBOL, length == 2 // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
    // 21.2.5.11 RegExp.prototype[@@split](string, limit)
    ? function (string, arg) {
      return regexMethod.call(string, this, arg);
    } // 21.2.5.6 RegExp.prototype[@@match](string)
    // 21.2.5.9 RegExp.prototype[@@search](string)
    : function (string) {
      return regexMethod.call(string, this);
    });
    if (sham) hide(RegExp.prototype[SYMBOL], 'sham', true);
  }
};

},{"../internals/fails":32,"../internals/hide":38,"../internals/redefine":63,"../internals/regexp-exec":65,"../internals/well-known-symbol":84}],34:[function(require,module,exports){
module.exports = require('../internals/shared')('native-function-to-string', Function.toString);

},{"../internals/shared":71}],35:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports = typeof window == 'object' && window && window.Math == Math ? window : typeof self == 'object' && self && self.Math == Math ? self // eslint-disable-next-line no-new-func
: Function('return this')();

},{}],36:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;

module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],37:[function(require,module,exports){
module.exports = {};

},{}],38:[function(require,module,exports){
var definePropertyModule = require('../internals/object-define-property');

var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = require('../internals/descriptors') ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"../internals/create-property-descriptor":25,"../internals/descriptors":27,"../internals/object-define-property":53}],39:[function(require,module,exports){
var document = require('../internals/global').document;

module.exports = document && document.documentElement;

},{"../internals/global":35}],40:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('../internals/descriptors') && !require('../internals/fails')(function () {
  return Object.defineProperty(require('../internals/document-create-element')('div'), 'a', {
    get: function () {
      return 7;
    }
  }).a != 7;
});

},{"../internals/descriptors":27,"../internals/document-create-element":28,"../internals/fails":32}],41:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var fails = require('../internals/fails');

var classof = require('../internals/classof-raw');

var split = ''.split;
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

},{"../internals/classof-raw":20,"../internals/fails":32}],42:[function(require,module,exports){
var NATIVE_WEAK_MAP = require('../internals/native-weak-map');

var isObject = require('../internals/is-object');

var hide = require('../internals/hide');

var objectHas = require('../internals/has');

var sharedKey = require('../internals/shared-key');

var hiddenKeys = require('../internals/hidden-keys');

var WeakMap = require('../internals/global').WeakMap;

var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;

    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    }

    return state;
  };
};

if (NATIVE_WEAK_MAP) {
  var store = new WeakMap();
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;

  set = function (it, metadata) {
    wmset.call(store, it, metadata);
    return metadata;
  };

  get = function (it) {
    return wmget.call(store, it) || {};
  };

  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;

  set = function (it, metadata) {
    hide(it, STATE, metadata);
    return metadata;
  };

  get = function (it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };

  has = function (it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/global":35,"../internals/has":36,"../internals/hidden-keys":37,"../internals/hide":38,"../internals/is-object":44,"../internals/native-weak-map":50,"../internals/shared-key":70}],43:[function(require,module,exports){
var fails = require('../internals/fails');

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true : value == NATIVE ? false : typeof detection == 'function' ? fails(detection) : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';
module.exports = isForced;

},{"../internals/fails":32}],44:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],45:[function(require,module,exports){
module.exports = false;

},{}],46:[function(require,module,exports){
var isObject = require('../internals/is-object');

var classof = require('../internals/classof-raw');

var MATCH = require('../internals/well-known-symbol')('match'); // `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp


module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) == 'RegExp');
};

},{"../internals/classof-raw":20,"../internals/is-object":44,"../internals/well-known-symbol":84}],47:[function(require,module,exports){
'use strict';

var getPrototypeOf = require('../internals/object-get-prototype-of');

var hide = require('../internals/hide');

var has = require('../internals/has');

var IS_PURE = require('../internals/is-pure');

var ITERATOR = require('../internals/well-known-symbol')('iterator');

var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () {
  return this;
}; // `%IteratorPrototype%` object
// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object


var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

if ([].keys) {
  arrayIterator = [].keys(); // Safari 8 has buggy iterators w/o `next`

  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

if (IteratorPrototype == undefined) IteratorPrototype = {}; // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()

if (!IS_PURE && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

},{"../internals/has":36,"../internals/hide":38,"../internals/is-pure":45,"../internals/object-get-prototype-of":57,"../internals/well-known-symbol":84}],48:[function(require,module,exports){
module.exports = {};

},{}],49:[function(require,module,exports){
// Chrome 38 Symbol has incorrect toString conversion
module.exports = !require('../internals/fails')(function () {
  // eslint-disable-next-line no-undef
  String(Symbol());
});

},{"../internals/fails":32}],50:[function(require,module,exports){
var nativeFunctionToString = require('../internals/function-to-string');

var WeakMap = require('../internals/global').WeakMap;

module.exports = typeof WeakMap === 'function' && /native code/.test(nativeFunctionToString.call(WeakMap));

},{"../internals/function-to-string":34,"../internals/global":35}],51:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('../internals/an-object');

var defineProperties = require('../internals/object-define-properties');

var enumBugKeys = require('../internals/enum-bug-keys');

var html = require('../internals/html');

var documentCreateElement = require('../internals/document-create-element');

var IE_PROTO = require('../internals/shared-key')('IE_PROTO');

var PROTOTYPE = 'prototype';

var Empty = function () {
  /* empty */
}; // Create object with fake `null` prototype: use iframe Object with cleared prototype


var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var length = enumBugKeys.length;
  var lt = '<';
  var script = 'script';
  var gt = '>';
  var js = 'java' + script + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = String(js);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;

  while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];

  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;

  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null; // add "__proto__" for Object.getPrototypeOf polyfill

    result[IE_PROTO] = O;
  } else result = createDict();

  return Properties === undefined ? result : defineProperties(result, Properties);
};

require('../internals/hidden-keys')[IE_PROTO] = true;

},{"../internals/an-object":18,"../internals/document-create-element":28,"../internals/enum-bug-keys":30,"../internals/hidden-keys":37,"../internals/html":39,"../internals/object-define-properties":52,"../internals/shared-key":70}],52:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');

var definePropertyModule = require('../internals/object-define-property');

var anObject = require('../internals/an-object');

var objectKeys = require('../internals/object-keys');

module.exports = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var i = 0;
  var key;

  while (length > i) definePropertyModule.f(O, key = keys[i++], Properties[key]);

  return O;
};

},{"../internals/an-object":18,"../internals/descriptors":27,"../internals/object-define-property":53,"../internals/object-keys":59}],53:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');

var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

var anObject = require('../internals/an-object');

var toPrimitive = require('../internals/to-primitive');

var nativeDefineProperty = Object.defineProperty;
exports.f = DESCRIPTORS ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (e) {
    /* empty */
  }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"../internals/an-object":18,"../internals/descriptors":27,"../internals/ie8-dom-define":40,"../internals/to-primitive":80}],54:[function(require,module,exports){
var DESCRIPTORS = require('../internals/descriptors');

var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');

var createPropertyDescriptor = require('../internals/create-property-descriptor');

var toIndexedObject = require('../internals/to-indexed-object');

var toPrimitive = require('../internals/to-primitive');

var has = require('../internals/has');

var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
exports.f = DESCRIPTORS ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (e) {
    /* empty */
  }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

},{"../internals/create-property-descriptor":25,"../internals/descriptors":27,"../internals/has":36,"../internals/ie8-dom-define":40,"../internals/object-property-is-enumerable":60,"../internals/to-indexed-object":76,"../internals/to-primitive":80}],55:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var internalObjectKeys = require('../internals/object-keys-internal');

var hiddenKeys = require('../internals/enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

},{"../internals/enum-bug-keys":30,"../internals/object-keys-internal":58}],56:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],57:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('../internals/has');

var toObject = require('../internals/to-object');

var IE_PROTO = require('../internals/shared-key')('IE_PROTO');

var CORRECT_PROTOTYPE_GETTER = require('../internals/correct-prototype-getter');

var ObjectPrototype = Object.prototype;
module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];

  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  }

  return O instanceof Object ? ObjectPrototype : null;
};

},{"../internals/correct-prototype-getter":23,"../internals/has":36,"../internals/shared-key":70,"../internals/to-object":79}],58:[function(require,module,exports){
var has = require('../internals/has');

var toIndexedObject = require('../internals/to-indexed-object');

var arrayIndexOf = require('../internals/array-includes')(false);

var hiddenKeys = require('../internals/hidden-keys');

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;

  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key); // Don't enum bug & hidden keys


  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }

  return result;
};

},{"../internals/array-includes":19,"../internals/has":36,"../internals/hidden-keys":37,"../internals/to-indexed-object":76}],59:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var internalObjectKeys = require('../internals/object-keys-internal');

var enumBugKeys = require('../internals/enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};

},{"../internals/enum-bug-keys":30,"../internals/object-keys-internal":58}],60:[function(require,module,exports){
'use strict';

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // Nashorn ~ JDK8 bug

var NASHORN_BUG = nativeGetOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({
  1: 2
}, 1);
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = nativeGetOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

},{}],61:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.

/* eslint-disable no-proto */
var validateSetPrototypeOfArguments = require('../internals/validate-set-prototype-of-arguments');

module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  // eslint-disable-line
  var correctSetter = false;
  var test = {};
  var setter;

  try {
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    correctSetter = test instanceof Array;
  } catch (e) {
    /* empty */
  }

  return function setPrototypeOf(O, proto) {
    validateSetPrototypeOfArguments(O, proto);
    if (correctSetter) setter.call(O, proto);else O.__proto__ = proto;
    return O;
  };
}() : undefined);

},{"../internals/validate-set-prototype-of-arguments":82}],62:[function(require,module,exports){
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');

var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');

var anObject = require('../internals/an-object');

var Reflect = require('../internals/global').Reflect; // all object keys, includes non-enumerable and symbols


module.exports = Reflect && Reflect.ownKeys || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

},{"../internals/an-object":18,"../internals/global":35,"../internals/object-get-own-property-names":55,"../internals/object-get-own-property-symbols":56}],63:[function(require,module,exports){
var global = require('../internals/global');

var hide = require('../internals/hide');

var has = require('../internals/has');

var setGlobal = require('../internals/set-global');

var nativeFunctionToString = require('../internals/function-to-string');

var InternalStateModule = require('../internals/internal-state');

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(nativeFunctionToString).split('toString');

require('../internals/shared')('inspectSource', function (it) {
  return nativeFunctionToString.call(it);
});

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;

  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }

  if (O === global) {
    if (simple) O[key] = value;else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }

  if (simple) O[key] = value;else hide(O, key, value); // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || nativeFunctionToString.call(this);
});

},{"../internals/function-to-string":34,"../internals/global":35,"../internals/has":36,"../internals/hide":38,"../internals/internal-state":42,"../internals/set-global":68,"../internals/shared":71}],64:[function(require,module,exports){
var classof = require('./classof-raw');

var regexpExec = require('./regexp-exec'); // `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec


module.exports = function (R, S) {
  var exec = R.exec;

  if (typeof exec === 'function') {
    var result = exec.call(R, S);

    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }

    return result;
  }

  if (classof(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};

},{"./classof-raw":20,"./regexp-exec":65}],65:[function(require,module,exports){
'use strict';

var regexpFlags = require('./regexp-flags');

var nativeExec = RegExp.prototype.exec; // This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.

var nativeReplace = String.prototype.replace;
var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
}(); // nonparticipating capturing group, copied from es5-shim's String#split patch.


var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;
var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
    }

    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;
    match = nativeExec.call(re, str);

    if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }

    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

module.exports = patchedExec;

},{"./regexp-flags":66}],66:[function(require,module,exports){
'use strict';

var anObject = require('../internals/an-object'); // `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags


module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

},{"../internals/an-object":18}],67:[function(require,module,exports){
// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

},{}],68:[function(require,module,exports){
var global = require('../internals/global');

var hide = require('../internals/hide');

module.exports = function (key, value) {
  try {
    hide(global, key, value);
  } catch (e) {
    global[key] = value;
  }

  return value;
};

},{"../internals/global":35,"../internals/hide":38}],69:[function(require,module,exports){
var defineProperty = require('../internals/object-define-property').f;

var has = require('../internals/has');

var TO_STRING_TAG = require('../internals/well-known-symbol')('toStringTag');

module.exports = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty(it, TO_STRING_TAG, {
      configurable: true,
      value: TAG
    });
  }
};

},{"../internals/has":36,"../internals/object-define-property":53,"../internals/well-known-symbol":84}],70:[function(require,module,exports){
var shared = require('../internals/shared')('keys');

var uid = require('../internals/uid');

module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"../internals/shared":71,"../internals/uid":81}],71:[function(require,module,exports){
var global = require('../internals/global');

var setGlobal = require('../internals/set-global');

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});
(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.0.0',
  mode: require('../internals/is-pure') ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});

},{"../internals/global":35,"../internals/is-pure":45,"../internals/set-global":68}],72:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var requireObjectCoercible = require('../internals/require-object-coercible'); // CONVERT_TO_STRING: true  -> String#at
// CONVERT_TO_STRING: false -> String#codePointAt


module.exports = function (that, pos, CONVERT_TO_STRING) {
  var S = String(requireObjectCoercible(that));
  var position = toInteger(pos);
  var size = S.length;
  var first, second;
  if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
  first = S.charCodeAt(position);
  return first < 0xd800 || first > 0xdbff || position + 1 === size || (second = S.charCodeAt(position + 1)) < 0xdc00 || second > 0xdfff ? CONVERT_TO_STRING ? S.charAt(position) : first : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xd800 << 10) + (second - 0xdc00) + 0x10000;
};

},{"../internals/require-object-coercible":67,"../internals/to-integer":77}],73:[function(require,module,exports){
'use strict';

var toInteger = require('../internals/to-integer');

var requireObjectCoercible = require('../internals/require-object-coercible'); // `String.prototype.repeat` method implementation
// https://tc39.github.io/ecma262/#sec-string.prototype.repeat


module.exports = ''.repeat || function repeat(count) {
  var str = String(requireObjectCoercible(this));
  var result = '';
  var n = toInteger(count);
  if (n < 0 || n == Infinity) throw RangeError('Wrong number of repetitions');

  for (; n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str;

  return result;
};

},{"../internals/require-object-coercible":67,"../internals/to-integer":77}],74:[function(require,module,exports){
var classof = require('../internals/classof-raw'); // `thisNumberValue` abstract operation
// https://tc39.github.io/ecma262/#sec-thisnumbervalue


module.exports = function (value) {
  if (typeof value != 'number' && classof(value) != 'Number') {
    throw TypeError('Incorrect invocation');
  }

  return +value;
};

},{"../internals/classof-raw":20}],75:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var max = Math.max;
var min = Math.min; // Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).

module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

},{"../internals/to-integer":77}],76:[function(require,module,exports){
// toObject with fallback for non-array-like ES3 strings
var IndexedObject = require('../internals/indexed-object');

var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

},{"../internals/indexed-object":41,"../internals/require-object-coercible":67}],77:[function(require,module,exports){
var ceil = Math.ceil;
var floor = Math.floor; // `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger

module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

},{}],78:[function(require,module,exports){
var toInteger = require('../internals/to-integer');

var min = Math.min; // `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength

module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"../internals/to-integer":77}],79:[function(require,module,exports){
var requireObjectCoercible = require('../internals/require-object-coercible'); // `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject


module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};

},{"../internals/require-object-coercible":67}],80:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('../internals/is-object'); // instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string


module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"../internals/is-object":44}],81:[function(require,module,exports){
var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + postfix).toString(36));
};

},{}],82:[function(require,module,exports){
var isObject = require('../internals/is-object');

var anObject = require('../internals/an-object');

module.exports = function (O, proto) {
  anObject(O);

  if (!isObject(proto) && proto !== null) {
    throw TypeError("Can't set " + String(proto) + ' as a prototype');
  }
};

},{"../internals/an-object":18,"../internals/is-object":44}],83:[function(require,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = require('../internals/is-regexp');

var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (that, searchString, NAME) {
  if (isRegExp(searchString)) {
    throw TypeError('String.prototype.' + NAME + " doesn't accept regex");
  }

  return String(requireObjectCoercible(that));
};

},{"../internals/is-regexp":46,"../internals/require-object-coercible":67}],84:[function(require,module,exports){
var store = require('../internals/shared')('wks');

var uid = require('../internals/uid');

var Symbol = require('../internals/global').Symbol;

var NATIVE_SYMBOL = require('../internals/native-symbol');

module.exports = function (name) {
  return store[name] || (store[name] = NATIVE_SYMBOL && Symbol[name] || (NATIVE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

},{"../internals/global":35,"../internals/native-symbol":49,"../internals/shared":71,"../internals/uid":81}],85:[function(require,module,exports){
'use strict';

var toIndexedObject = require('../internals/to-indexed-object');

var addToUnscopables = require('../internals/add-to-unscopables');

var Iterators = require('../internals/iterators');

var InternalStateModule = require('../internals/internal-state');

var defineIterator = require('../internals/define-iterator');

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR); // `Array.prototype.entries` method
// https://tc39.github.io/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.github.io/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.github.io/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.github.io/ecma262/#sec-createarrayiterator

module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated),
    // target
    index: 0,
    // next index
    kind: kind // kind

  }); // `%ArrayIteratorPrototype%.next` method
  // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;

  if (!target || index >= target.length) {
    state.target = undefined;
    return {
      value: undefined,
      done: true
    };
  }

  if (kind == 'keys') return {
    value: index,
    done: false
  };
  if (kind == 'values') return {
    value: target[index],
    done: false
  };
  return {
    value: [index, target[index]],
    done: false
  };
}, 'values'); // argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
// https://tc39.github.io/ecma262/#sec-createmappedargumentsobject

Iterators.Arguments = Iterators.Array; // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"../internals/add-to-unscopables":16,"../internals/define-iterator":26,"../internals/internal-state":42,"../internals/iterators":48,"../internals/to-indexed-object":76}],86:[function(require,module,exports){
'use strict';

var toInteger = require('../internals/to-integer');

var thisNumberValue = require('../internals/this-number-value');

var repeat = require('../internals/string-repeat');

var nativeToFixed = 1.0.toFixed;
var floor = Math.floor;
var data = [0, 0, 0, 0, 0, 0];

var multiply = function (n, c) {
  var i = -1;
  var c2 = c;

  while (++i < 6) {
    c2 += n * data[i];
    data[i] = c2 % 1e7;
    c2 = floor(c2 / 1e7);
  }
};

var divide = function (n) {
  var i = 6;
  var c = 0;

  while (--i >= 0) {
    c += data[i];
    data[i] = floor(c / n);
    c = c % n * 1e7;
  }
};

var numToString = function () {
  var i = 6;
  var s = '';

  while (--i >= 0) {
    if (s !== '' || i === 0 || data[i] !== 0) {
      var t = String(data[i]);
      s = s === '' ? t : s + repeat.call('0', 7 - t.length) + t;
    }
  }

  return s;
};

var pow = function (x, n, acc) {
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};

var log = function (x) {
  var n = 0;
  var x2 = x;

  while (x2 >= 4096) {
    n += 12;
    x2 /= 4096;
  }

  while (x2 >= 2) {
    n += 1;
    x2 /= 2;
  }

  return n;
}; // `Number.prototype.toFixed` method
// https://tc39.github.io/ecma262/#sec-number.prototype.tofixed


require('../internals/export')({
  target: 'Number',
  proto: true,
  forced: nativeToFixed && (0.00008.toFixed(3) !== '0.000' || 0.9.toFixed(0) !== '1' || 1.255.toFixed(2) !== '1.25' || 1000000000000000128.0.toFixed(0) !== '1000000000000000128') || !require('../internals/fails')(function () {
    // V8 ~ Android 4.3-
    nativeToFixed.call({});
  })
}, {
  toFixed: function toFixed(fractionDigits) {
    var x = thisNumberValue(this);
    var f = toInteger(fractionDigits);
    var s = '';
    var m = '0';
    var e, z, j, k;
    if (f < 0 || f > 20) throw RangeError('Incorrect fraction digits'); // eslint-disable-next-line no-self-compare

    if (x != x) return 'NaN';
    if (x <= -1e21 || x >= 1e21) return String(x);

    if (x < 0) {
      s = '-';
      x = -x;
    }

    if (x > 1e-21) {
      e = log(x * pow(2, 69, 1)) - 69;
      z = e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;

      if (e > 0) {
        multiply(0, z);
        j = f;

        while (j >= 7) {
          multiply(1e7, 0);
          j -= 7;
        }

        multiply(pow(10, j, 1), 0);
        j = e - 1;

        while (j >= 23) {
          divide(1 << 23);
          j -= 23;
        }

        divide(1 << j);
        multiply(1, 1);
        divide(2);
        m = numToString();
      } else {
        multiply(0, z);
        multiply(1 << -e, 0);
        m = numToString() + repeat.call('0', f);
      }
    }

    if (f > 0) {
      k = m.length;
      m = s + (k <= f ? '0.' + repeat.call('0', f - k) + m : m.slice(0, k - f) + '.' + m.slice(k - f));
    } else {
      m = s + m;
    }

    return m;
  }
});

},{"../internals/export":31,"../internals/fails":32,"../internals/string-repeat":73,"../internals/this-number-value":74,"../internals/to-integer":77}],87:[function(require,module,exports){
'use strict';

var validateArguments = require('../internals/validate-string-method-arguments');

var INCLUDES = 'includes';

var CORRECT_IS_REGEXP_LOGIC = require('../internals/correct-is-regexp-logic')(INCLUDES); // `String.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-string.prototype.includes


require('../internals/export')({
  target: 'String',
  proto: true,
  forced: !CORRECT_IS_REGEXP_LOGIC
}, {
  includes: function includes(searchString
  /* , position = 0 */
  ) {
    return !!~validateArguments(this, searchString, INCLUDES).indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
  }
});

},{"../internals/correct-is-regexp-logic":22,"../internals/export":31,"../internals/validate-string-method-arguments":83}],88:[function(require,module,exports){
'use strict';

var anObject = require('../internals/an-object');

var toObject = require('../internals/to-object');

var toLength = require('../internals/to-length');

var toInteger = require('../internals/to-integer');

var requireObjectCoercible = require('../internals/require-object-coercible');

var advanceStringIndex = require('../internals/advance-string-index');

var regExpExec = require('../internals/regexp-exec-abstract');

var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var SUBSTITUTION_SYMBOLS = /\$([$&`']|\d\d?|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&`']|\d\d?)/g;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
}; // @@replace logic


require('../internals/fix-regexp-well-known-symbol-logic')('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
  return [// `String.prototype.replace` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.replace
  function replace(searchValue, replaceValue) {
    var O = requireObjectCoercible(this);
    var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
    return replacer !== undefined ? replacer.call(searchValue, O, replaceValue) : nativeReplace.call(String(O), searchValue, replaceValue);
  }, // `RegExp.prototype[@@replace]` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
  function (regexp, replaceValue) {
    var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
    if (res.done) return res.value;
    var rx = anObject(regexp);
    var S = String(this);
    var functionalReplace = typeof replaceValue === 'function';
    if (!functionalReplace) replaceValue = String(replaceValue);
    var global = rx.global;

    if (global) {
      var fullUnicode = rx.unicode;
      rx.lastIndex = 0;
    }

    var results = [];

    while (true) {
      var result = regExpExec(rx, S);
      if (result === null) break;
      results.push(result);
      if (!global) break;
      var matchStr = String(result[0]);
      if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
    }

    var accumulatedResult = '';
    var nextSourcePosition = 0;

    for (var i = 0; i < results.length; i++) {
      result = results[i];
      var matched = String(result[0]);
      var position = max(min(toInteger(result.index), S.length), 0);
      var captures = []; // NOTE: This is equivalent to
      //   captures = result.slice(1).map(maybeToString)
      // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
      // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
      // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.

      for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));

      var namedCaptures = result.groups;

      if (functionalReplace) {
        var replacerArgs = [matched].concat(captures, position, S);
        if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
        var replacement = String(replaceValue.apply(undefined, replacerArgs));
      } else {
        replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
      }

      if (position >= nextSourcePosition) {
        accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
        nextSourcePosition = position + matched.length;
      }
    }

    return accumulatedResult + S.slice(nextSourcePosition);
  }]; // https://tc39.github.io/ecma262/#sec-getsubstitution

  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;

    if (namedCaptures !== undefined) {
      namedCaptures = toObject(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }

    return nativeReplace.call(replacement, symbols, function (match, ch) {
      var capture;

      switch (ch.charAt(0)) {
        case '$':
          return '$';

        case '&':
          return matched;

        case '`':
          return str.slice(0, position);

        case "'":
          return str.slice(tailPos);

        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;

        default:
          // \d\d?
          var n = +ch;
          if (n === 0) return match;

          if (n > m) {
            var f = floor(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }

          capture = captures[n - 1];
      }

      return capture === undefined ? '' : capture;
    });
  }
});

},{"../internals/advance-string-index":17,"../internals/an-object":18,"../internals/fix-regexp-well-known-symbol-logic":33,"../internals/regexp-exec-abstract":64,"../internals/require-object-coercible":67,"../internals/to-integer":77,"../internals/to-length":78,"../internals/to-object":79}],89:[function(require,module,exports){
// `Symbol.prototype.description` getter
// https://tc39.github.io/ecma262/#sec-symbol.prototype.description
'use strict';

var DESCRIPTORS = require('../internals/descriptors');

var has = require('../internals/has');

var isObject = require('../internals/is-object');

var defineProperty = require('../internals/object-define-property').f;

var copyConstructorProperties = require('../internals/copy-constructor-properties');

var NativeSymbol = require('../internals/global').Symbol;

if (DESCRIPTORS && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) || // Safari 12 bug
NativeSymbol().description !== undefined)) {
  var EmptyStringDescriptionStore = {}; // wrap Symbol constructor for correct work with undefined description

  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
    var result = this instanceof SymbolWrapper ? new NativeSymbol(description) // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
    : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };

  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
  symbolPrototype.constructor = SymbolWrapper;
  var symbolToString = symbolPrototype.toString;
  var native = String(NativeSymbol('test')) == 'Symbol(test)';
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  defineProperty(symbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = isObject(this) ? this.valueOf() : this;
      var string = symbolToString.call(symbol);
      if (has(EmptyStringDescriptionStore, symbol)) return '';
      var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  require('../internals/export')({
    global: true,
    forced: true
  }, {
    Symbol: SymbolWrapper
  });
}

},{"../internals/copy-constructor-properties":21,"../internals/descriptors":27,"../internals/export":31,"../internals/global":35,"../internals/has":36,"../internals/is-object":44,"../internals/object-define-property":53}],90:[function(require,module,exports){
var DOMIterables = require('../internals/dom-iterables');

var ArrayIteratorMethods = require('../modules/es.array.iterator');

var global = require('../internals/global');

var hide = require('../internals/hide');

var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');
var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var ArrayValues = ArrayIteratorMethods.values;

for (var COLLECTION_NAME in DOMIterables) {
  var Collection = global[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;

  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      hide(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (e) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    if (!CollectionPrototype[TO_STRING_TAG]) hide(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        hide(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (e) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
}

},{"../internals/dom-iterables":29,"../internals/global":35,"../internals/hide":38,"../internals/well-known-symbol":84,"../modules/es.array.iterator":85}],91:[function(require,module,exports){
module.exports = require('./socket');
/**
 * Exports parser
 *
 * @api public
 *
 */

module.exports.parser = require('engine.io-parser');

},{"./socket":92,"engine.io-parser":102}],92:[function(require,module,exports){
/**
 * Module dependencies.
 */
var transports = require('./transports/index');

var Emitter = require('component-emitter');

var debug = require('debug')('engine.io-client:socket');

var index = require('indexof');

var parser = require('engine.io-parser');

var parseuri = require('parseuri');

var parseqs = require('parseqs');
/**
 * Module exports.
 */


module.exports = Socket;
/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts) {
  if (!(this instanceof Socket)) return new Socket(uri, opts);
  opts = opts || {};

  if (uri && 'object' === typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure : typeof location !== 'undefined' && 'https:' === location.protocol;

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname || (typeof location !== 'undefined' ? location.hostname : 'localhost');
  this.port = opts.port || (typeof location !== 'undefined' && location.port ? location.port : this.secure ? 443 : 80);
  this.query = opts.query || {};
  if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.transportOptions = opts.transportOptions || {};
  this.readyState = '';
  this.writeBuffer = [];
  this.prevBufferLen = 0;
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? opts.perMessageDeflate || {} : false;
  if (true === this.perMessageDeflate) this.perMessageDeflate = {};

  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  } // SSL options for Node.js client


  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
  this.forceNode = !!opts.forceNode; // detect ReactNative environment

  this.isReactNative = typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative'; // other options for Node.js or ReactNative client

  if (typeof self === 'undefined' || this.isReactNative) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }

    if (opts.localAddress) {
      this.localAddress = opts.localAddress;
    }
  } // set on handshake


  this.id = null;
  this.upgrades = null;
  this.pingInterval = null;
  this.pingTimeout = null; // set on heartbeat

  this.pingIntervalTimer = null;
  this.pingTimeoutTimer = null;
  this.open();
}

Socket.priorWebsocketSuccess = false;
/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);
/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.transports = require('./transports/index');
Socket.parser = require('engine.io-parser');
/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query); // append engine.io protocol identifier

  query.EIO = parser.protocol; // transport name

  query.transport = name; // per-transport options

  var options = this.transportOptions[name] || {}; // session id if we already have one

  if (this.id) query.sid = this.id;
  var transport = new transports[name]({
    query: query,
    socket: this,
    agent: options.agent || this.agent,
    hostname: options.hostname || this.hostname,
    port: options.port || this.port,
    secure: options.secure || this.secure,
    path: options.path || this.path,
    forceJSONP: options.forceJSONP || this.forceJSONP,
    jsonp: options.jsonp || this.jsonp,
    forceBase64: options.forceBase64 || this.forceBase64,
    enablesXDR: options.enablesXDR || this.enablesXDR,
    timestampRequests: options.timestampRequests || this.timestampRequests,
    timestampParam: options.timestampParam || this.timestampParam,
    policyPort: options.policyPort || this.policyPort,
    pfx: options.pfx || this.pfx,
    key: options.key || this.key,
    passphrase: options.passphrase || this.passphrase,
    cert: options.cert || this.cert,
    ca: options.ca || this.ca,
    ciphers: options.ciphers || this.ciphers,
    rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
    perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
    extraHeaders: options.extraHeaders || this.extraHeaders,
    forceNode: options.forceNode || this.forceNode,
    localAddress: options.localAddress || this.localAddress,
    requestTimeout: options.requestTimeout || this.requestTimeout,
    protocols: options.protocols || void 0,
    isReactNative: this.isReactNative
  });
  return transport;
};

function clone(obj) {
  var o = {};

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }

  return o;
}
/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */


Socket.prototype.open = function () {
  var transport;

  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function () {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }

  this.readyState = 'opening'; // Retry with the next transport if the transport is disabled (jsonp: false)

  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};
/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */


Socket.prototype.setTransport = function (transport) {
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  } // set up transport


  this.transport = transport; // set up transport listeners

  transport.on('drain', function () {
    self.onDrain();
  }).on('packet', function (packet) {
    self.onPacket(packet);
  }).on('error', function (e) {
    self.onError(e);
  }).on('close', function () {
    self.onClose('transport close');
  });
};
/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */


Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, {
    probe: 1
  });
  var failed = false;
  var self = this;
  Socket.priorWebsocketSuccess = false;

  function onTransportOpen() {
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }

    if (failed) return;
    debug('probe transport "%s" opened', name);
    transport.send([{
      type: 'ping',
      data: 'probe'
    }]);
    transport.once('packet', function (msg) {
      if (failed) return;

      if ('pong' === msg.type && 'probe' === msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' === transport.name;
        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' === self.readyState) return;
          debug('changing transport and sending upgrade packet');
          cleanup();
          self.setTransport(transport);
          transport.send([{
            type: 'upgrade'
          }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport() {
    if (failed) return; // Any callback called by transport should be ignored since now

    failed = true;
    cleanup();
    transport.close();
    transport = null;
  } // Handle any error that happens while probing


  function onerror(err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;
    freezeTransport();
    debug('probe transport "%s" failed because of error: %s', name, err);
    self.emit('upgradeError', error);
  }

  function onTransportClose() {
    onerror('transport closed');
  } // When the socket is closed while we're probing


  function onclose() {
    onerror('socket closed');
  } // When the socket is upgraded while we're probing


  function onupgrade(to) {
    if (transport && to.name !== transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  } // Remove all listeners on the transport and on self


  function cleanup() {
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);
  this.once('close', onclose);
  this.once('upgrading', onupgrade);
  transport.open();
};
/**
 * Called when connection is deemed open.
 *
 * @api public
 */


Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
  this.emit('open');
  this.flush(); // we check for `readyState` in case an `open`
  // listener already closed the socket

  if ('open' === this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');

    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};
/**
 * Handles a packet.
 *
 * @api private
 */


Socket.prototype.onPacket = function (packet) {
  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
    this.emit('packet', packet); // Socket is live - any packet counts

    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(JSON.parse(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};
/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */


Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen(); // In case open handler closes socket

  if ('closed' === this.readyState) return;
  this.setPing(); // Prolong liveness of socket on heartbeat

  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};
/**
 * Resets ping timeout.
 *
 * @api private
 */


Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' === self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || self.pingInterval + self.pingTimeout);
};
/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */


Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};
/**
* Sends a ping packet.
*
* @api private
*/


Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function () {
    self.emit('ping');
  });
};
/**
 * Called on `drain` event
 *
 * @api private
 */


Socket.prototype.onDrain = function () {
  this.writeBuffer.splice(0, this.prevBufferLen); // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`

  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};
/**
 * Flush write buffers.
 *
 * @api private
 */


Socket.prototype.flush = function () {
  if ('closed' !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer); // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`

    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};
/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */


Socket.prototype.write = Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};
/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */


Socket.prototype.sendPacket = function (type, data, options, fn) {
  if ('function' === typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' === typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' === this.readyState || 'closed' === this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;
  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};
/**
 * Closes the connection.
 *
 * @api private
 */


Socket.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.readyState = 'closing';
    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function () {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close() {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose() {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade() {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};
/**
 * Called upon transport error
 *
 * @api private
 */


Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};
/**
 * Called upon transport close.
 *
 * @api private
 */


Socket.prototype.onClose = function (reason, desc) {
  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this; // clear timers

    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer); // stop event from firing again for transport

    this.transport.removeAllListeners('close'); // ensure transport won't stay open

    this.transport.close(); // ignore further transport communication

    this.transport.removeAllListeners(); // set ready state

    this.readyState = 'closed'; // clear session id

    this.id = null; // emit close event

    this.emit('close', reason, desc); // clean buffers after, so users can still
    // grab the buffers on `close` event

    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};
/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */


Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];

  for (var i = 0, j = upgrades.length; i < j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }

  return filteredUpgrades;
};

},{"./transport":93,"./transports/index":94,"component-emitter":14,"debug":100,"engine.io-parser":102,"indexof":108,"parseqs":111,"parseuri":112}],93:[function(require,module,exports){
/**
 * Module dependencies.
 */
var parser = require('engine.io-parser');

var Emitter = require('component-emitter');
/**
 * Module exports.
 */


module.exports = Transport;
/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport(opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR; // SSL options for Node.js client

  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;
  this.forceNode = opts.forceNode; // results of ReactNative environment detection

  this.isReactNative = opts.isReactNative; // other options for Node.js client

  this.extraHeaders = opts.extraHeaders;
  this.localAddress = opts.localAddress;
}
/**
 * Mix in `Emitter`.
 */


Emitter(Transport.prototype);
/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};
/**
 * Opens the transport.
 *
 * @api public
 */


Transport.prototype.open = function () {
  if ('closed' === this.readyState || '' === this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};
/**
 * Closes the transport.
 *
 * @api private
 */


Transport.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};
/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */


Transport.prototype.send = function (packets) {
  if ('open' === this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};
/**
 * Called upon open
 *
 * @api private
 */


Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};
/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */


Transport.prototype.onData = function (data) {
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};
/**
 * Called with a decoded packet.
 */


Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};
/**
 * Called upon close.
 *
 * @api private
 */


Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":14,"engine.io-parser":102}],94:[function(require,module,exports){
/**
 * Module dependencies
 */
var XMLHttpRequest = require('xmlhttprequest-ssl');

var XHR = require('./polling-xhr');

var JSONP = require('./polling-jsonp');

var websocket = require('./websocket');
/**
 * Export transports.
 */


exports.polling = polling;
exports.websocket = websocket;
/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts) {
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (typeof location !== 'undefined') {
    var isSSL = 'https:' === location.protocol;
    var port = location.port; // some user agents have empty `location.port`

    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

},{"./polling-jsonp":95,"./polling-xhr":96,"./websocket":98,"xmlhttprequest-ssl":99}],95:[function(require,module,exports){
(function (global){
/**
 * Module requirements.
 */
var Polling = require('./polling');

var inherit = require('component-inherit');
/**
 * Module exports.
 */


module.exports = JSONPPolling;
/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;
/**
 * Global JSONP callbacks.
 */

var callbacks;
/**
 * Noop.
 */

function empty() {}
/**
 * Until https://github.com/tc39/proposal-global is shipped.
 */


function glob() {
  return typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {};
}
/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */


function JSONPPolling(opts) {
  Polling.call(this, opts);
  this.query = this.query || {}; // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution

  if (!callbacks) {
    // we need to consider multiple engines in the same page
    var global = glob();
    callbacks = global.___eio = global.___eio || [];
  } // callback identifier


  this.index = callbacks.length; // add callback to jsonp global

  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  }); // append to query string

  this.query.j = this.index; // prevent spurious errors from being emitted when the window is unloaded

  if (typeof addEventListener === 'function') {
    addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}
/**
 * Inherits from Polling.
 */


inherit(JSONPPolling, Polling);
/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;
/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};
/**
 * Starts a poll cycle.
 *
 * @api private
 */


JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();

  script.onerror = function (e) {
    self.onError('jsonp poll error', e);
  };

  var insertAt = document.getElementsByTagName('script')[0];

  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  } else {
    (document.head || document.body).appendChild(script);
  }

  this.script = script;
  var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};
/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */


JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;
    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);
    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete() {
    initIframe();
    fn();
  }

  function initIframe() {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;
    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe(); // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side

  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch (e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function () {
      if (self.iframe.readyState === 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":97,"component-inherit":15}],96:[function(require,module,exports){
/* global attachEvent */

/**
 * Module requirements.
 */
var XMLHttpRequest = require('xmlhttprequest-ssl');

var Polling = require('./polling');

var Emitter = require('component-emitter');

var inherit = require('component-inherit');

var debug = require('debug')('engine.io-client:polling-xhr');
/**
 * Module exports.
 */


module.exports = XHR;
module.exports.Request = Request;
/**
 * Empty function
 */

function empty() {}
/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */


function XHR(opts) {
  Polling.call(this, opts);
  this.requestTimeout = opts.requestTimeout;
  this.extraHeaders = opts.extraHeaders;

  if (typeof location !== 'undefined') {
    var isSSL = 'https:' === location.protocol;
    var port = location.port; // some user agents have empty `location.port`

    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = typeof location !== 'undefined' && opts.hostname !== location.hostname || port !== opts.port;
    this.xs = opts.secure !== isSSL;
  }
}
/**
 * Inherits from Polling.
 */


inherit(XHR, Polling);
/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;
/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function (opts) {
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR; // SSL options for Node.js client

  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  opts.requestTimeout = this.requestTimeout; // other options for Node.js client

  opts.extraHeaders = this.extraHeaders;
  return new Request(opts);
};
/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */


XHR.prototype.doWrite = function (data, fn) {
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({
    method: 'POST',
    data: data,
    isBinary: isBinary
  });
  var self = this;
  req.on('success', fn);
  req.on('error', function (err) {
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};
/**
 * Starts a poll cycle.
 *
 * @api private
 */


XHR.prototype.doPoll = function () {
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function (data) {
    self.onData(data);
  });
  req.on('error', function (err) {
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};
/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */


function Request(opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined !== opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;
  this.requestTimeout = opts.requestTimeout; // SSL options for Node.js client

  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized; // other options for Node.js client

  this.extraHeaders = opts.extraHeaders;
  this.create();
}
/**
 * Mix in `Emitter`.
 */


Emitter(Request.prototype);
/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function () {
  var opts = {
    agent: this.agent,
    xdomain: this.xd,
    xscheme: this.xs,
    enablesXDR: this.enablesXDR
  }; // SSL options for Node.js client

  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);

    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);

        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}

    if ('POST' === this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    try {
      xhr.setRequestHeader('Accept', '*/*');
    } catch (e) {} // ie6 check


    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.requestTimeout) {
      xhr.timeout = this.requestTimeout;
    }

    if (this.hasXDR()) {
      xhr.onload = function () {
        self.onLoad();
      };

      xhr.onerror = function () {
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 2) {
          try {
            var contentType = xhr.getResponseHeader('Content-Type');

            if (self.supportsBinary && contentType === 'application/octet-stream') {
              xhr.responseType = 'arraybuffer';
            }
          } catch (e) {}
        }

        if (4 !== xhr.readyState) return;

        if (200 === xhr.status || 1223 === xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function () {
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function () {
      self.onError(e);
    }, 0);
    return;
  }

  if (typeof document !== 'undefined') {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};
/**
 * Called upon successful response.
 *
 * @api private
 */


Request.prototype.onSuccess = function () {
  this.emit('success');
  this.cleanup();
};
/**
 * Called if we have data.
 *
 * @api private
 */


Request.prototype.onData = function (data) {
  this.emit('data', data);
  this.onSuccess();
};
/**
 * Called upon error.
 *
 * @api private
 */


Request.prototype.onError = function (err) {
  this.emit('error', err);
  this.cleanup(true);
};
/**
 * Cleans up house.
 *
 * @api private
 */


Request.prototype.cleanup = function (fromError) {
  if ('undefined' === typeof this.xhr || null === this.xhr) {
    return;
  } // xmlhttprequest


  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch (e) {}
  }

  if (typeof document !== 'undefined') {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};
/**
 * Called upon load.
 *
 * @api private
 */


Request.prototype.onLoad = function () {
  var data;

  try {
    var contentType;

    try {
      contentType = this.xhr.getResponseHeader('Content-Type');
    } catch (e) {}

    if (contentType === 'application/octet-stream') {
      data = this.xhr.response || this.xhr.responseText;
    } else {
      data = this.xhr.responseText;
    }
  } catch (e) {
    this.onError(e);
  }

  if (null != data) {
    this.onData(data);
  }
};
/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */


Request.prototype.hasXDR = function () {
  return typeof XDomainRequest !== 'undefined' && !this.xs && this.enablesXDR;
};
/**
 * Aborts the request.
 *
 * @api public
 */


Request.prototype.abort = function () {
  this.cleanup();
};
/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */


Request.requestsCount = 0;
Request.requests = {};

if (typeof document !== 'undefined') {
  if (typeof attachEvent === 'function') {
    attachEvent('onunload', unloadHandler);
  } else if (typeof addEventListener === 'function') {
    var terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
    addEventListener(terminationEvent, unloadHandler, false);
  }
}

function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

},{"./polling":97,"component-emitter":14,"component-inherit":15,"debug":100,"xmlhttprequest-ssl":99}],97:[function(require,module,exports){
/**
 * Module dependencies.
 */
var Transport = require('../transport');

var parseqs = require('parseqs');

var parser = require('engine.io-parser');

var inherit = require('component-inherit');

var yeast = require('yeast');

var debug = require('debug')('engine.io-client:polling');
/**
 * Module exports.
 */


module.exports = Polling;
/**
 * Is XHR2 supported?
 */

var hasXHR2 = function () {
  var XMLHttpRequest = require('xmlhttprequest-ssl');

  var xhr = new XMLHttpRequest({
    xdomain: false
  });
  return null != xhr.responseType;
}();
/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */


function Polling(opts) {
  var forceBase64 = opts && opts.forceBase64;

  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }

  Transport.call(this, opts);
}
/**
 * Inherits from Transport.
 */


inherit(Polling, Transport);
/**
 * Transport name.
 */

Polling.prototype.name = 'polling';
/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function () {
  this.poll();
};
/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */


Polling.prototype.pause = function (onPause) {
  var self = this;
  this.readyState = 'pausing';

  function pause() {
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function () {
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function () {
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};
/**
 * Starts polling cycle.
 *
 * @api public
 */


Polling.prototype.poll = function () {
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};
/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */


Polling.prototype.onData = function (data) {
  var self = this;
  debug('polling got data %s', data);

  var callback = function (packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' === self.readyState) {
      self.onOpen();
    } // if its a close packet, we close the ongoing requests


    if ('close' === packet.type) {
      self.onClose();
      return false;
    } // otherwise bypass onData and handle the message


    self.onPacket(packet);
  }; // decode payload


  parser.decodePayload(data, this.socket.binaryType, callback); // if an event did not trigger closing

  if ('closed' !== this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' === this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};
/**
 * For polling, send a close packet.
 *
 * @api private
 */


Polling.prototype.doClose = function () {
  var self = this;

  function close() {
    debug('writing close packet');
    self.write([{
      type: 'close'
    }]);
  }

  if ('open' === this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};
/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */


Polling.prototype.write = function (packets) {
  var self = this;
  this.writable = false;

  var callbackfn = function () {
    self.writable = true;
    self.emit('drain');
  };

  parser.encodePayload(packets, this.supportsBinary, function (data) {
    self.doWrite(data, callbackfn);
  });
};
/**
 * Generates uri for connection.
 *
 * @api private
 */


Polling.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = ''; // cache busting is forced

  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query); // avoid port if default for schema

  if (this.port && ('https' === schema && Number(this.port) !== 443 || 'http' === schema && Number(this.port) !== 80)) {
    port = ':' + this.port;
  } // prepend ? to query


  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":93,"component-inherit":15,"debug":100,"engine.io-parser":102,"parseqs":111,"xmlhttprequest-ssl":99,"yeast":146}],98:[function(require,module,exports){
(function (Buffer){
/**
 * Module dependencies.
 */
var Transport = require('../transport');

var parser = require('engine.io-parser');

var parseqs = require('parseqs');

var inherit = require('component-inherit');

var yeast = require('yeast');

var debug = require('debug')('engine.io-client:websocket');

var BrowserWebSocket, NodeWebSocket;

if (typeof self === 'undefined') {
  try {
    NodeWebSocket = require('ws');
  } catch (e) {}
} else {
  BrowserWebSocket = self.WebSocket || self.MozWebSocket;
}
/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or try to resolve WebSocket-compatible
 * interface exposed by `ws` for Node-like environment.
 */


var WebSocket = BrowserWebSocket || NodeWebSocket;
/**
 * Module exports.
 */

module.exports = WS;
/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts) {
  var forceBase64 = opts && opts.forceBase64;

  if (forceBase64) {
    this.supportsBinary = false;
  }

  this.perMessageDeflate = opts.perMessageDeflate;
  this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
  this.protocols = opts.protocols;

  if (!this.usingBrowserWebSocket) {
    WebSocket = NodeWebSocket;
  }

  Transport.call(this, opts);
}
/**
 * Inherits from Transport.
 */


inherit(WS, Transport);
/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';
/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;
/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var uri = this.uri();
  var protocols = this.protocols;
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  }; // SSL options for Node.js client

  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }

  if (this.localAddress) {
    opts.localAddress = this.localAddress;
  }

  try {
    this.ws = this.usingBrowserWebSocket && !this.isReactNative ? protocols ? new WebSocket(uri, protocols) : new WebSocket(uri) : new WebSocket(uri, protocols, opts);
  } catch (err) {
    return this.emit('error', err);
  }

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'nodebuffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};
/**
 * Adds event listeners to the socket
 *
 * @api private
 */


WS.prototype.addEventListeners = function () {
  var self = this;

  this.ws.onopen = function () {
    self.onOpen();
  };

  this.ws.onclose = function () {
    self.onClose();
  };

  this.ws.onmessage = function (ev) {
    self.onData(ev.data);
  };

  this.ws.onerror = function (e) {
    self.onError('websocket error', e);
  };
};
/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */


WS.prototype.write = function (packets) {
  var self = this;
  this.writable = false; // encodePacket efficient as it uses WS framing
  // no need for encodePayload

  var total = packets.length;

  for (var i = 0, l = total; i < l; i++) {
    (function (packet) {
      parser.encodePacket(packet, self.supportsBinary, function (data) {
        if (!self.usingBrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};

          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' === typeof data ? Buffer.byteLength(data) : data.length;

            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        } // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error


        try {
          if (self.usingBrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e) {
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done() {
    self.emit('flush'); // fake drain
    // defer to next tick to allow Socket to clear writeBuffer

    setTimeout(function () {
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};
/**
 * Called upon close
 *
 * @api private
 */


WS.prototype.onClose = function () {
  Transport.prototype.onClose.call(this);
};
/**
 * Closes socket.
 *
 * @api private
 */


WS.prototype.doClose = function () {
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};
/**
 * Generates uri for connection.
 *
 * @api private
 */


WS.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = ''; // avoid port if default for schema

  if (this.port && ('wss' === schema && Number(this.port) !== 443 || 'ws' === schema && Number(this.port) !== 80)) {
    port = ':' + this.port;
  } // append timestamp to URI


  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  } // communicate binary support capabilities


  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query); // prepend ? to query

  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};
/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */


WS.prototype.check = function () {
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

}).call(this,require("buffer").Buffer)
},{"../transport":93,"buffer":8,"component-inherit":15,"debug":100,"engine.io-parser":102,"parseqs":111,"ws":7,"yeast":146}],99:[function(require,module,exports){
// browser shim for xmlhttprequest module
var hasCORS = require('has-cors');

module.exports = function (opts) {
  var xdomain = opts.xdomain; // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx

  var xscheme = opts.xscheme; // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217

  var enablesXDR = opts.enablesXDR; // XMLHttpRequest can be disabled on IE

  try {
    if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {} // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example


  try {
    if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) {}

  if (!xdomain) {
    try {
      return new self[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
    } catch (e) {}
  }
};

},{"has-cors":106}],100:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */
exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome && 'undefined' != typeof chrome.storage ? chrome.storage.local : localstorage();
/**
 * Colors.
 */

exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  } // Internet Explorer and Edge do not support colors.


  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  } // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632


  return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
  typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
  // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
}
/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */


exports.formatters.j = function (v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};
/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */


function formatArgs(args) {
  var useColors = this.useColors;
  args[0] = (useColors ? '%c' : '') + this.namespace + (useColors ? ' %c' : ' ') + args[0] + (useColors ? '%c ' : ' ') + '+' + exports.humanize(this.diff);
  if (!useColors) return;
  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit'); // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into

  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function (match) {
    if ('%%' === match) return;
    index++;

    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });
  args.splice(lastC, 0, c);
}
/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */


function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
}
/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */


function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch (e) {}
}
/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */


function load() {
  var r;

  try {
    r = exports.storage.debug;
  } catch (e) {} // If debug isn't set in LS, and we're in Electron, try to load $DEBUG


  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}
/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */


exports.enable(load());
/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":101,"_process":113}],101:[function(require,module,exports){
/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */
exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');
/**
 * Active `debug` instances.
 */

exports.instances = [];
/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];
/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};
/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0,
      i;

  for (i in namespace) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}
/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */


function createDebug(namespace) {
  var prevTime;

  function debug() {
    // disabled?
    if (!debug.enabled) return;
    var self = debug; // set `diff` timestamp

    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr; // turn the `arguments` into a proper Array

    var args = new Array(arguments.length);

    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    } // apply any `formatters` transformations


    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];

      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val); // now we need to remove `args[index]` since it's inlined in the `format`

        args.splice(index, 1);
        index--;
      }

      return match;
    }); // apply env-specific formatting (colors, etc.)

    exports.formatArgs.call(self, args);
    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);
  debug.destroy = destroy; // env-specific initialization logic for debug instances

  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  exports.instances.push(debug);
  return debug;
}

function destroy() {
  var index = exports.instances.indexOf(this);

  if (index !== -1) {
    exports.instances.splice(index, 1);
    return true;
  } else {
    return false;
  }
}
/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */


function enable(namespaces) {
  exports.save(namespaces);
  exports.names = [];
  exports.skips = [];
  var i;
  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings

    namespaces = split[i].replace(/\*/g, '.*?');

    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }

  for (i = 0; i < exports.instances.length; i++) {
    var instance = exports.instances[i];
    instance.enabled = exports.enabled(instance.namespace);
  }
}
/**
 * Disable debug output.
 *
 * @api public
 */


function disable() {
  exports.enable('');
}
/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */


function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }

  var i, len;

  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }

  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }

  return false;
}
/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */


function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":110}],102:[function(require,module,exports){
/**
 * Module dependencies.
 */
var keys = require('./keys');

var hasBinary = require('has-binary2');

var sliceBuffer = require('arraybuffer.slice');

var after = require('after');

var utf8 = require('./utf8');

var base64encoder;

if (typeof ArrayBuffer !== 'undefined') {
  base64encoder = require('base64-arraybuffer');
}
/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */


var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */

var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);
/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */

var dontSendBlobs = isAndroid || isPhantomJS;
/**
 * Current protocol version.
 */

exports.protocol = 3;
/**
 * Packet types.
 */

var packets = exports.packets = {
  open: 0 // non-ws
  ,
  close: 1 // non-ws
  ,
  ping: 2,
  pong: 3,
  message: 4,
  upgrade: 5,
  noop: 6
};
var packetslist = keys(packets);
/**
 * Premade error packet.
 */

var err = {
  type: 'error',
  data: 'parser error'
};
/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = require('blob');
/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */


exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if (typeof utf8encode === 'function') {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = packet.data === undefined ? undefined : packet.data.buffer || packet.data;

  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  } // might be an object with { base64: true, data: dataAsBase64String }


  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  } // Sending data as a utf-8 string


  var encoded = packets[packet.type]; // data fragment is optional

  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data), {
      strict: false
    }) : String(packet.data);
  }

  return callback('' + encoded);
};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}
/**
 * Encode packet helpers for binary types
 */


function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);
  resultBuffer[0] = packets[packet.type];

  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i + 1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();

  fr.onload = function () {
    exports.encodePacket({
      type: packet.type,
      data: fr.result
    }, supportsBinary, true, callback);
  };

  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);
  return callback(blob);
}
/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */


exports.encodeBase64Packet = function (packet, callback) {
  var message = 'b' + exports.packets[packet.type];

  if (typeof Blob !== 'undefined' && packet.data instanceof Blob) {
    var fr = new FileReader();

    fr.onload = function () {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };

    return fr.readAsDataURL(packet.data);
  }

  var b64data;

  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);

    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }

    b64data = String.fromCharCode.apply(null, basic);
  }

  message += btoa(b64data);
  return callback(message);
};
/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */


exports.decodePacket = function (data, binaryType, utf8decode) {
  if (data === undefined) {
    return err;
  } // String data


  if (typeof data === 'string') {
    if (data.charAt(0) === 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      data = tryDecode(data);

      if (data === false) {
        return err;
      }
    }

    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return {
        type: packetslist[type],
        data: data.substring(1)
      };
    } else {
      return {
        type: packetslist[type]
      };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);

  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }

  return {
    type: packetslist[type],
    data: rest
  };
};

function tryDecode(data) {
  try {
    data = utf8.decode(data, {
      strict: false
    });
  } catch (e) {
    return false;
  }

  return data;
}
/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */


exports.decodeBase64Packet = function (msg, binaryType) {
  var type = packetslist[msg.charAt(0)];

  if (!base64encoder) {
    return {
      type: type,
      data: {
        base64: true,
        data: msg.substr(1)
      }
    };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return {
    type: type,
    data: data
  };
};
/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */


exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, false, function (message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function (err, results) {
    return callback(results.join(''));
  });
};
/**
 * Async array map using after
 */


function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function (i, el, cb) {
    each(el, function (error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}
/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */


exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data !== 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;

  if (data === '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = '',
      n,
      msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (chr !== ':') {
      length += chr;
      continue;
    }

    if (length === '' || length != (n = Number(length))) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    msg = data.substr(i + 1, n);

    if (length != msg.length) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    if (msg.length) {
      packet = exports.decodePacket(msg, binaryType, false);

      if (err.type === packet.type && err.data === packet.data) {
        // parser error in individual packet - ignoring payload
        return callback(err, 0, 1);
      }

      var ret = callback(packet, i + n, l);
      if (false === ret) return;
    } // advance cursor


    i += n;
    length = '';
  }

  if (length !== '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }
};
/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */


exports.encodePayloadAsArrayBuffer = function (packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function (data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function (err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function (acc, p) {
      var len;

      if (typeof p === 'string') {
        len = p.length;
      } else {
        len = p.byteLength;
      }

      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);
    var resultArray = new Uint8Array(totalLength);
    var bufferIndex = 0;
    encodedPackets.forEach(function (p) {
      var isString = typeof p === 'string';
      var ab = p;

      if (isString) {
        var view = new Uint8Array(p.length);

        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }

        ab = view.buffer;
      }

      if (isString) {
        // not true binary
        resultArray[bufferIndex++] = 0;
      } else {
        // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();

      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }

      resultArray[bufferIndex++] = 255;
      var view = new Uint8Array(ab);

      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });
    return callback(resultArray.buffer);
  });
};
/**
 * Encode as Blob
 */


exports.encodePayloadAsBlob = function (packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function (encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;

      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);

        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }

        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = encoded instanceof ArrayBuffer ? encoded.byteLength : encoded.size;
      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);

      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }

      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function (err, results) {
    return callback(new Blob(results));
  });
};
/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */


exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1;; i++) {
      if (tailArray[i] === 255) break; // 310 = char length of Number.MAX_VALUE

      if (msgLength.length > 310) {
        return callback(err, 0, 1);
      }

      msgLength += tailArray[i];
    }

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);
    var msg = sliceBuffer(bufferTail, 0, msgLength);

    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';

        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function (buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

},{"./keys":103,"./utf8":104,"after":1,"arraybuffer.slice":2,"base64-arraybuffer":4,"blob":6,"has-binary2":105}],103:[function(require,module,exports){
/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */
module.exports = Object.keys || function keys(obj) {
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }

  return arr;
};

},{}],104:[function(require,module,exports){
/*! https://mths.be/utf8js v2.1.2 by @mathias */
var stringFromCharCode = String.fromCharCode; // Taken from https://mths.be/punycode

function ucs2decode(string) {
  var output = [];
  var counter = 0;
  var length = string.length;
  var value;
  var extra;

  while (counter < length) {
    value = string.charCodeAt(counter++);

    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // high surrogate, and there is a next character
      extra = string.charCodeAt(counter++);

      if ((extra & 0xFC00) == 0xDC00) {
        // low surrogate
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // unmatched surrogate; only append this code unit, in case the next
        // code unit is the high surrogate of a surrogate pair
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }

  return output;
} // Taken from https://mths.be/punycode


function ucs2encode(array) {
  var length = array.length;
  var index = -1;
  var value;
  var output = '';

  while (++index < length) {
    value = array[index];

    if (value > 0xFFFF) {
      value -= 0x10000;
      output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
      value = 0xDC00 | value & 0x3FF;
    }

    output += stringFromCharCode(value);
  }

  return output;
}

function checkScalarValue(codePoint, strict) {
  if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
    if (strict) {
      throw Error('Lone surrogate U+' + codePoint.toString(16).toUpperCase() + ' is not a scalar value');
    }

    return false;
  }

  return true;
}
/*--------------------------------------------------------------------------*/


function createByte(codePoint, shift) {
  return stringFromCharCode(codePoint >> shift & 0x3F | 0x80);
}

function encodeCodePoint(codePoint, strict) {
  if ((codePoint & 0xFFFFFF80) == 0) {
    // 1-byte sequence
    return stringFromCharCode(codePoint);
  }

  var symbol = '';

  if ((codePoint & 0xFFFFF800) == 0) {
    // 2-byte sequence
    symbol = stringFromCharCode(codePoint >> 6 & 0x1F | 0xC0);
  } else if ((codePoint & 0xFFFF0000) == 0) {
    // 3-byte sequence
    if (!checkScalarValue(codePoint, strict)) {
      codePoint = 0xFFFD;
    }

    symbol = stringFromCharCode(codePoint >> 12 & 0x0F | 0xE0);
    symbol += createByte(codePoint, 6);
  } else if ((codePoint & 0xFFE00000) == 0) {
    // 4-byte sequence
    symbol = stringFromCharCode(codePoint >> 18 & 0x07 | 0xF0);
    symbol += createByte(codePoint, 12);
    symbol += createByte(codePoint, 6);
  }

  symbol += stringFromCharCode(codePoint & 0x3F | 0x80);
  return symbol;
}

function utf8encode(string, opts) {
  opts = opts || {};
  var strict = false !== opts.strict;
  var codePoints = ucs2decode(string);
  var length = codePoints.length;
  var index = -1;
  var codePoint;
  var byteString = '';

  while (++index < length) {
    codePoint = codePoints[index];
    byteString += encodeCodePoint(codePoint, strict);
  }

  return byteString;
}
/*--------------------------------------------------------------------------*/


function readContinuationByte() {
  if (byteIndex >= byteCount) {
    throw Error('Invalid byte index');
  }

  var continuationByte = byteArray[byteIndex] & 0xFF;
  byteIndex++;

  if ((continuationByte & 0xC0) == 0x80) {
    return continuationByte & 0x3F;
  } // If we end up here, it’s not a continuation byte


  throw Error('Invalid continuation byte');
}

function decodeSymbol(strict) {
  var byte1;
  var byte2;
  var byte3;
  var byte4;
  var codePoint;

  if (byteIndex > byteCount) {
    throw Error('Invalid byte index');
  }

  if (byteIndex == byteCount) {
    return false;
  } // Read first byte


  byte1 = byteArray[byteIndex] & 0xFF;
  byteIndex++; // 1-byte sequence (no continuation bytes)

  if ((byte1 & 0x80) == 0) {
    return byte1;
  } // 2-byte sequence


  if ((byte1 & 0xE0) == 0xC0) {
    byte2 = readContinuationByte();
    codePoint = (byte1 & 0x1F) << 6 | byte2;

    if (codePoint >= 0x80) {
      return codePoint;
    } else {
      throw Error('Invalid continuation byte');
    }
  } // 3-byte sequence (may include unpaired surrogates)


  if ((byte1 & 0xF0) == 0xE0) {
    byte2 = readContinuationByte();
    byte3 = readContinuationByte();
    codePoint = (byte1 & 0x0F) << 12 | byte2 << 6 | byte3;

    if (codePoint >= 0x0800) {
      return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
    } else {
      throw Error('Invalid continuation byte');
    }
  } // 4-byte sequence


  if ((byte1 & 0xF8) == 0xF0) {
    byte2 = readContinuationByte();
    byte3 = readContinuationByte();
    byte4 = readContinuationByte();
    codePoint = (byte1 & 0x07) << 0x12 | byte2 << 0x0C | byte3 << 0x06 | byte4;

    if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
      return codePoint;
    }
  }

  throw Error('Invalid UTF-8 detected');
}

var byteArray;
var byteCount;
var byteIndex;

function utf8decode(byteString, opts) {
  opts = opts || {};
  var strict = false !== opts.strict;
  byteArray = ucs2decode(byteString);
  byteCount = byteArray.length;
  byteIndex = 0;
  var codePoints = [];
  var tmp;

  while ((tmp = decodeSymbol(strict)) !== false) {
    codePoints.push(tmp);
  }

  return ucs2encode(codePoints);
}

module.exports = {
  version: '2.1.2',
  encode: utf8encode,
  decode: utf8decode
};

},{}],105:[function(require,module,exports){
(function (Buffer){
/* global Blob File */

/*
 * Module requirements.
 */
var isArray = require('isarray');

var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === 'function' || typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]';
var withNativeFile = typeof File === 'function' || typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]';
/**
 * Module exports.
 */

module.exports = hasBinary;
/**
 * Checks for binary data.
 *
 * Supports Buffer, ArrayBuffer, Blob and File.
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (isArray(obj)) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }

    return false;
  }

  if (typeof Buffer === 'function' && Buffer.isBuffer && Buffer.isBuffer(obj) || typeof ArrayBuffer === 'function' && obj instanceof ArrayBuffer || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File) {
    return true;
  } // see: https://github.com/Automattic/has-binary/pull/4


  if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }

  return false;
}

}).call(this,require("buffer").Buffer)
},{"buffer":8,"isarray":109}],106:[function(require,module,exports){
/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */
try {
  module.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],107:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);

    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }

    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }

    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = e << mLen | m;
  eLen += mLen;

  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
};

},{}],108:[function(require,module,exports){
var indexOf = [].indexOf;

module.exports = function (arr, obj) {
  if (indexOf) return arr.indexOf(obj);

  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }

  return -1;
};

},{}],109:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],110:[function(require,module,exports){
/**
 * Helpers.
 */
var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;
/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;

  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }

  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};
/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */


function parse(str) {
  str = String(str);

  if (str.length > 100) {
    return;
  }

  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);

  if (!match) {
    return;
  }

  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();

  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;

    case 'days':
    case 'day':
    case 'd':
      return n * d;

    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;

    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;

    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;

    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;

    default:
      return undefined;
  }
}
/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */


function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }

  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }

  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }

  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }

  return ms + 'ms';
}
/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */


function fmtLong(ms) {
  return plural(ms, d, 'day') || plural(ms, h, 'hour') || plural(ms, m, 'minute') || plural(ms, s, 'second') || ms + ' ms';
}
/**
 * Pluralization helper.
 */


function plural(ms, n, name) {
  if (ms < n) {
    return;
  }

  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }

  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],111:[function(require,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */
exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};
/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */


exports.decode = function (qs) {
  var qry = {};
  var pairs = qs.split('&');

  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return qry;
};

},{}],112:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */
var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

module.exports = function parseuri(str) {
  var src = str,
      b = str.indexOf('['),
      e = str.indexOf(']');

  if (b != -1 && e != -1) {
    str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
  }

  var m = re.exec(str || ''),
      uri = {},
      i = 14;

  while (i--) {
    uri[parts[i]] = m[i] || '';
  }

  if (b != -1 && e != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
    uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
    uri.ipv6uri = true;
  }

  return uri;
};

},{}],113:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};

},{}],114:[function(require,module,exports){
/**
 * Module dependencies.
 */
var url = require('./url');

var parser = require('socket.io-parser');

var Manager = require('./manager');

var debug = require('debug')('socket.io-client');
/**
 * Module exports.
 */


module.exports = exports = lookup;
/**
 * Managers cache.
 */

var cache = exports.managers = {};
/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup(uri, opts) {
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};
  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] || false === opts.multiplex || sameNamespace;
  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }

    io = cache[id];
  }

  if (parsed.query && !opts.query) {
    opts.query = parsed.query;
  }

  return io.socket(parsed.path, opts);
}
/**
 * Protocol version.
 *
 * @api public
 */


exports.protocol = parser.protocol;
/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;
/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = require('./manager');
exports.Socket = require('./socket');

},{"./manager":115,"./socket":117,"./url":118,"debug":119,"socket.io-parser":122}],115:[function(require,module,exports){
/**
 * Module dependencies.
 */
var eio = require('engine.io-client');

var Socket = require('./socket');

var Emitter = require('component-emitter');

var parser = require('socket.io-parser');

var on = require('./on');

var bind = require('component-bind');

var debug = require('debug')('socket.io-client:manager');

var indexOf = require('indexof');

var Backoff = require('backo2');
/**
 * IE6+ hasOwnProperty
 */


var has = Object.prototype.hasOwnProperty;
/**
 * Module exports
 */

module.exports = Manager;
/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager(uri, opts) {
  if (!(this instanceof Manager)) return new Manager(uri, opts);

  if (uri && 'object' === typeof uri) {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};
  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];

  var _parser = opts.parser || parser;

  this.encoder = new _parser.Encoder();
  this.decoder = new _parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}
/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */


Manager.prototype.emitAll = function () {
  this.emit.apply(this, arguments);

  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};
/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */


Manager.prototype.updateSocketIds = function () {
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.generateId(nsp);
    }
  }
};
/**
 * generate `socket.id` for the given `nsp`
 *
 * @param {String} nsp
 * @return {String}
 * @api private
 */


Manager.prototype.generateId = function (nsp) {
  return (nsp === '/' ? '' : nsp + '#') + this.engine.id;
};
/**
 * Mix in `Emitter`.
 */


Emitter(Manager.prototype);
/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function (v) {
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};
/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */


Manager.prototype.reconnectionAttempts = function (v) {
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};
/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */


Manager.prototype.reconnectionDelay = function (v) {
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function (v) {
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};
/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */


Manager.prototype.reconnectionDelayMax = function (v) {
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};
/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */


Manager.prototype.timeout = function (v) {
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};
/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */


Manager.prototype.maybeReconnectOnOpen = function () {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};
/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */


Manager.prototype.open = Manager.prototype.connect = function (fn, opts) {
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;
  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false; // emit `open`

  var openSub = on(socket, 'open', function () {
    self.onopen();
    fn && fn();
  }); // emit `connect_error`

  var errorSub = on(socket, 'error', function (data) {
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);

    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  }); // emit `connect_timeout`

  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout); // set timer

    var timer = setTimeout(function () {
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);
    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);
  return this;
};
/**
 * Called upon transport open.
 *
 * @api private
 */


Manager.prototype.onopen = function () {
  debug('open'); // clear old subs

  this.cleanup(); // mark as open

  this.readyState = 'open';
  this.emit('open'); // add new subs

  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};
/**
 * Called upon a ping.
 *
 * @api private
 */


Manager.prototype.onping = function () {
  this.lastPing = new Date();
  this.emitAll('ping');
};
/**
 * Called upon a packet.
 *
 * @api private
 */


Manager.prototype.onpong = function () {
  this.emitAll('pong', new Date() - this.lastPing);
};
/**
 * Called with data.
 *
 * @api private
 */


Manager.prototype.ondata = function (data) {
  this.decoder.add(data);
};
/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */


Manager.prototype.ondecoded = function (packet) {
  this.emit('packet', packet);
};
/**
 * Called upon socket error.
 *
 * @api private
 */


Manager.prototype.onerror = function (err) {
  debug('error', err);
  this.emitAll('error', err);
};
/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */


Manager.prototype.socket = function (nsp, opts) {
  var socket = this.nsps[nsp];

  if (!socket) {
    socket = new Socket(this, nsp, opts);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function () {
      socket.id = self.generateId(nsp);
    });

    if (this.autoConnect) {
      // manually call here since connecting event is fired before listening
      onConnecting();
    }
  }

  function onConnecting() {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};
/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */


Manager.prototype.destroy = function (socket) {
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;
  this.close();
};
/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */


Manager.prototype.packet = function (packet) {
  debug('writing packet %j', packet);
  var self = this;
  if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function (encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }

      self.encoding = false;
      self.processPacketQueue();
    });
  } else {
    // add packet to the queue
    self.packetBuffer.push(packet);
  }
};
/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */


Manager.prototype.processPacketQueue = function () {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};
/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */


Manager.prototype.cleanup = function () {
  debug('cleanup');
  var subsLength = this.subs.length;

  for (var i = 0; i < subsLength; i++) {
    var sub = this.subs.shift();
    sub.destroy();
  }

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;
  this.decoder.destroy();
};
/**
 * Close the current socket.
 *
 * @api private
 */


Manager.prototype.close = Manager.prototype.disconnect = function () {
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;

  if ('opening' === this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }

  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};
/**
 * Called upon engine close.
 *
 * @api private
 */


Manager.prototype.onclose = function (reason) {
  debug('onclose');
  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};
/**
 * Attempt a reconnection.
 *
 * @api private
 */


Manager.prototype.reconnect = function () {
  if (this.reconnecting || this.skipReconnect) return this;
  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);
    this.reconnecting = true;
    var timer = setTimeout(function () {
      if (self.skipReconnect) return;
      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts); // check again for the case socket closed in above events

      if (self.skipReconnect) return;
      self.open(function (err) {
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);
    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }
};
/**
 * Called upon successful reconnect.
 *
 * @api private
 */


Manager.prototype.onreconnect = function () {
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":116,"./socket":117,"backo2":3,"component-bind":13,"component-emitter":14,"debug":119,"engine.io-client":91,"indexof":108,"socket.io-parser":122}],116:[function(require,module,exports){
/**
 * Module exports.
 */
module.exports = on;
/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on(obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function () {
      obj.removeListener(ev, fn);
    }
  };
}

},{}],117:[function(require,module,exports){
/**
 * Module dependencies.
 */
var parser = require('socket.io-parser');

var Emitter = require('component-emitter');

var toArray = require('to-array');

var on = require('./on');

var bind = require('component-bind');

var debug = require('debug')('socket.io-client:socket');

var parseqs = require('parseqs');

var hasBin = require('has-binary2');
/**
 * Module exports.
 */


module.exports = exports = Socket;
/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};
/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;
/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket(io, nsp, opts) {
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat

  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  this.flags = {};

  if (opts && opts.query) {
    this.query = opts.query;
  }

  if (this.io.autoConnect) this.open();
}
/**
 * Mix in `Emitter`.
 */


Emitter(Socket.prototype);
/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function () {
  if (this.subs) return;
  var io = this.io;
  this.subs = [on(io, 'open', bind(this, 'onopen')), on(io, 'packet', bind(this, 'onpacket')), on(io, 'close', bind(this, 'onclose'))];
};
/**
 * "Opens" the socket.
 *
 * @api public
 */


Socket.prototype.open = Socket.prototype.connect = function () {
  if (this.connected) return this;
  this.subEvents();
  this.io.open(); // ensure open

  if ('open' === this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};
/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */


Socket.prototype.send = function () {
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};
/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */


Socket.prototype.emit = function (ev) {
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var packet = {
    type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
    data: args
  };
  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress; // event ack callback

  if ('function' === typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  this.flags = {};
  return this;
};
/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */


Socket.prototype.packet = function (packet) {
  packet.nsp = this.nsp;
  this.io.packet(packet);
};
/**
 * Called upon engine `open`.
 *
 * @api private
 */


Socket.prototype.onopen = function () {
  debug('transport is open - connecting'); // write connect packet if necessary

  if ('/' !== this.nsp) {
    if (this.query) {
      var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
      debug('sending connect packet with query %s', query);
      this.packet({
        type: parser.CONNECT,
        query: query
      });
    } else {
      this.packet({
        type: parser.CONNECT
      });
    }
  }
};
/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */


Socket.prototype.onclose = function (reason) {
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};
/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */


Socket.prototype.onpacket = function (packet) {
  var sameNamespace = packet.nsp === this.nsp;
  var rootNamespaceError = packet.type === parser.ERROR && packet.nsp === '/';
  if (!sameNamespace && !rootNamespaceError) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};
/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */


Socket.prototype.onevent = function (packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};
/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */


Socket.prototype.ack = function (id) {
  var self = this;
  var sent = false;
  return function () {
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);
    self.packet({
      type: hasBin(args) ? parser.BINARY_ACK : parser.ACK,
      id: id,
      data: args
    });
  };
};
/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */


Socket.prototype.onack = function (packet) {
  var ack = this.acks[packet.id];

  if ('function' === typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};
/**
 * Called upon server connect.
 *
 * @api private
 */


Socket.prototype.onconnect = function () {
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};
/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */


Socket.prototype.emitBuffered = function () {
  var i;

  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }

  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }

  this.sendBuffer = [];
};
/**
 * Called upon server disconnect.
 *
 * @api private
 */


Socket.prototype.ondisconnect = function () {
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};
/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */


Socket.prototype.destroy = function () {
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }

    this.subs = null;
  }

  this.io.destroy(this);
};
/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */


Socket.prototype.close = Socket.prototype.disconnect = function () {
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({
      type: parser.DISCONNECT
    });
  } // remove socket from pool


  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }

  return this;
};
/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */


Socket.prototype.compress = function (compress) {
  this.flags.compress = compress;
  return this;
};
/**
 * Sets the binary flag
 *
 * @param {Boolean} whether the emitted data contains binary
 * @return {Socket} self
 * @api public
 */


Socket.prototype.binary = function (binary) {
  this.flags.binary = binary;
  return this;
};

},{"./on":116,"component-bind":13,"component-emitter":14,"debug":119,"has-binary2":105,"parseqs":111,"socket.io-parser":122,"to-array":126}],118:[function(require,module,exports){
/**
 * Module dependencies.
 */
var parseuri = require('parseuri');

var debug = require('debug')('socket.io-client:url');
/**
 * Module exports.
 */


module.exports = url;
/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url(uri, loc) {
  var obj = uri; // default to window.location

  loc = loc || typeof location !== 'undefined' && location;
  if (null == uri) uri = loc.protocol + '//' + loc.host; // relative path support

  if ('string' === typeof uri) {
    if ('/' === uri.charAt(0)) {
      if ('/' === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);

      if ('undefined' !== typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    } // parse


    debug('parse %s', uri);
    obj = parseuri(uri);
  } // make sure we treat `localhost:80` and `localhost` equally


  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';
  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host; // define unique id

  obj.id = obj.protocol + '://' + host + ':' + obj.port; // define href

  obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : ':' + obj.port);
  return obj;
}

},{"debug":119,"parseuri":112}],119:[function(require,module,exports){
arguments[4][100][0].apply(exports,arguments)
},{"./debug":120,"_process":113,"dup":100}],120:[function(require,module,exports){
arguments[4][101][0].apply(exports,arguments)
},{"dup":101,"ms":110}],121:[function(require,module,exports){
/*global Blob,File*/

/**
 * Module requirements
 */
var isArray = require('isarray');

var isBuf = require('./is-buffer');

var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === 'function' || typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]';
var withNativeFile = typeof File === 'function' || typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]';
/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function (packet) {
  var buffers = [];
  var packetData = packet.data;
  var pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length; // number of binary 'attachments'

  return {
    packet: pack,
    buffers: buffers
  };
};

function _deconstructPacket(data, buffers) {
  if (!data) return data;

  if (isBuf(data)) {
    var placeholder = {
      _placeholder: true,
      num: buffers.length
    };
    buffers.push(data);
    return placeholder;
  } else if (isArray(data)) {
    var newData = new Array(data.length);

    for (var i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }

    return newData;
  } else if (typeof data === 'object' && !(data instanceof Date)) {
    var newData = {};

    for (var key in data) {
      newData[key] = _deconstructPacket(data[key], buffers);
    }

    return newData;
  }

  return data;
}
/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */


exports.reconstructPacket = function (packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  packet.attachments = undefined; // no longer useful

  return packet;
};

function _reconstructPacket(data, buffers) {
  if (!data) return data;

  if (data && data._placeholder) {
    return buffers[data.num]; // appropriate buffer (should be natural order anyway)
  } else if (isArray(data)) {
    for (var i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === 'object') {
    for (var key in data) {
      data[key] = _reconstructPacket(data[key], buffers);
    }
  }

  return data;
}
/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */


exports.removeBlobs = function (data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj; // convert any blob

    if (withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File) {
      pendingBlobs++; // async filereader

      var fileReader = new FileReader();

      fileReader.onload = function () {
        // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        } else {
          bloblessData = this.result;
        } // if nothing pending its callback time


        if (! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) {
      // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (typeof obj === 'object' && !isBuf(obj)) {
      // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;

  _removeBlobs(bloblessData);

  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

},{"./is-buffer":123,"isarray":109}],122:[function(require,module,exports){
/**
 * Module dependencies.
 */
var debug = require('debug')('socket.io-parser');

var Emitter = require('component-emitter');

var binary = require('./binary');

var isArray = require('isarray');

var isBuf = require('./is-buffer');
/**
 * Protocol version.
 *
 * @api public
 */


exports.protocol = 4;
/**
 * Packet types.
 *
 * @api public
 */

exports.types = ['CONNECT', 'DISCONNECT', 'EVENT', 'ACK', 'ERROR', 'BINARY_EVENT', 'BINARY_ACK'];
/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;
/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;
/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;
/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;
/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;
/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;
/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;
/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;
/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;
/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

var ERROR_PACKET = exports.ERROR + '"encode error"';
/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function (obj, callback) {
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    encodeAsBinary(obj, callback);
  } else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};
/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */


function encodeAsString(obj) {
  // first is type
  var str = '' + obj.type; // attachments if we have them

  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    str += obj.attachments + '-';
  } // if we have a namespace other than `/`
  // we append it followed by a comma `,`


  if (obj.nsp && '/' !== obj.nsp) {
    str += obj.nsp + ',';
  } // immediately followed by the id


  if (null != obj.id) {
    str += obj.id;
  } // json data


  if (null != obj.data) {
    var payload = tryStringify(obj.data);

    if (payload !== false) {
      str += payload;
    } else {
      return ERROR_PACKET;
    }
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

function tryStringify(str) {
  try {
    return JSON.stringify(str);
  } catch (e) {
    return false;
  }
}
/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */


function encodeAsBinary(obj, callback) {
  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;
    buffers.unshift(pack); // add packet info to beginning of data list

    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}
/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */


function Decoder() {
  this.reconstructor = null;
}
/**
 * Mix in `Emitter` with Decoder.
 */


Emitter(Decoder.prototype);
/**
 * Decodes an encoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function (obj) {
  var packet;

  if (typeof obj === 'string') {
    packet = decodeString(obj);

    if (exports.BINARY_EVENT === packet.type || exports.BINARY_ACK === packet.type) {
      // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet); // no attachments, labeled binary but no binary data to follow

      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else {
      // non-binary full packet
      this.emit('decoded', packet);
    }
  } else if (isBuf(obj) || obj.base64) {
    // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);

      if (packet) {
        // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  } else {
    throw new Error('Unknown type: ' + obj);
  }
};
/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */


function decodeString(str) {
  var i = 0; // look up type

  var p = {
    type: Number(str.charAt(0))
  };

  if (null == exports.types[p.type]) {
    return error('unknown packet type ' + p.type);
  } // look up attachments if type binary


  if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
    var buf = '';

    while (str.charAt(++i) !== '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }

    if (buf != Number(buf) || str.charAt(i) !== '-') {
      throw new Error('Illegal attachments');
    }

    p.attachments = Number(buf);
  } // look up namespace (if any)


  if ('/' === str.charAt(i + 1)) {
    p.nsp = '';

    while (++i) {
      var c = str.charAt(i);
      if (',' === c) break;
      p.nsp += c;
      if (i === str.length) break;
    }
  } else {
    p.nsp = '/';
  } // look up id


  var next = str.charAt(i + 1);

  if ('' !== next && Number(next) == next) {
    p.id = '';

    while (++i) {
      var c = str.charAt(i);

      if (null == c || Number(c) != c) {
        --i;
        break;
      }

      p.id += str.charAt(i);
      if (i === str.length) break;
    }

    p.id = Number(p.id);
  } // look up json data


  if (str.charAt(++i)) {
    var payload = tryParse(str.substr(i));
    var isPayloadValid = payload !== false && (p.type === exports.ERROR || isArray(payload));

    if (isPayloadValid) {
      p.data = payload;
    } else {
      return error('invalid payload');
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}
/**
 * Deallocates a parser's resources
 *
 * @api public
 */


Decoder.prototype.destroy = function () {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};
/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */


function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}
/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */


BinaryReconstructor.prototype.takeBinaryData = function (binData) {
  this.buffers.push(binData);

  if (this.buffers.length === this.reconPack.attachments) {
    // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }

  return null;
};
/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */


BinaryReconstructor.prototype.finishedReconstruction = function () {
  this.reconPack = null;
  this.buffers = [];
};

function error(msg) {
  return {
    type: exports.ERROR,
    data: 'parser error: ' + msg
  };
}

},{"./binary":121,"./is-buffer":123,"component-emitter":14,"debug":124,"isarray":109}],123:[function(require,module,exports){
(function (Buffer){
module.exports = isBuf;
var withNativeBuffer = typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function';
var withNativeArrayBuffer = typeof ArrayBuffer === 'function';

var isView = function (obj) {
  return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */


function isBuf(obj) {
  return withNativeBuffer && Buffer.isBuffer(obj) || withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj));
}

}).call(this,require("buffer").Buffer)
},{"buffer":8}],124:[function(require,module,exports){
arguments[4][100][0].apply(exports,arguments)
},{"./debug":125,"_process":113,"dup":100}],125:[function(require,module,exports){
arguments[4][101][0].apply(exports,arguments)
},{"dup":101,"ms":110}],126:[function(require,module,exports){
module.exports = toArray;

function toArray(list, index) {
  var array = [];
  index = index || 0;

  for (var i = index || 0; i < list.length; i++) {
    array[i - index] = list[i];
  }

  return array;
}

},{}],127:[function(require,module,exports){
/**
 * The global API interface for Westures. Exposes a constructor for the
 * {@link Region} and the generic {@link Gesture} class for user gestures to
 * implement, as well as the {@link Point2D} class, which may be useful.
 *
 * @namespace westures-core
 */
'use strict';

const Gesture = require('./src/Gesture.js');

const Point2D = require('./src/Point2D.js');

const Region = require('./src/Region.js');

const Smoothable = require('./src/Smoothable.js');

module.exports = {
  Gesture,
  Point2D,
  Region,
  Smoothable
};

},{"./src/Gesture.js":129,"./src/Point2D.js":132,"./src/Region.js":134,"./src/Smoothable.js":135}],128:[function(require,module,exports){
/*
 * Contains the Binding class.
 */
'use strict';
/**
 * A Binding associates a gesture with an element and a handler function that
 * will be called when the gesture is recognized.
 *
 * @private
 */

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

class Binding {
  /**
   * Constructor function for the Binding class.
   *
   * @param {Element} element - The element to which to associate the gesture.
   * @param {westures-core.Gesture} gesture - A instance of the Gesture type.
   * @param {Function} handler - The function handler to execute when a gesture
   *    is recognized on the associated element.
   */
  constructor(element, gesture, handler) {
    /**
     * The element to which to associate the gesture.
     *
     * @private
     * @type {Element}
     */
    this.element = element;
    /**
     * The gesture to associate with the given element.
     *
     * @private
     * @type {Gesture}
     */

    this.gesture = gesture;
    /**
     * The function handler to execute when the gesture is recognized on the
     * associated element.
     *
     * @private
     * @type {Function}
     */

    this.handler = handler;
  }
  /**
   * Evalutes the given gesture hook, and dispatches any data that is produced.
   *
   * @private
   *
   * @param {string} hook - which gesture hook to call, must be one of 'start',
   *    'move', or 'end'.
   * @param {State} state - The current State instance.
   */


  evaluateHook(hook, state) {
    const data = this.gesture[hook](state);

    if (data) {
      this.handler(_objectSpread({
        centroid: state.centroid,
        event: state.event,
        phase: hook,
        radius: state.radius,
        type: this.gesture.type,
        target: this.element
      }, data));
    }
  }

}

module.exports = Binding;

},{}],129:[function(require,module,exports){
/*
 * Contains the {@link Gesture} class
 */
'use strict';

let nextGestureNum = 0;
/**
 * The Gesture class that all gestures inherit from.
 *
 * @memberof westures-core
 */

class Gesture {
  /**
   * Constructor function for the Gesture class.
   *
   * @param {string} type - The name of the gesture.
   */
  constructor(type) {
    if (typeof type !== 'string') {
      throw new TypeError('Gestures require a string type');
    }
    /**
     * The name of the gesture. (e.g. 'pan' or 'tap' or 'pinch').
     *
     * @type {string}
     */


    this.type = type;
    /**
     * The unique identifier for each gesture. This allows for distinctions
     * across instances of Gestures that are created on the fly (e.g.
     * gesture-tap-1, gesture-tap-2).
     *
     * @type {string}
     */

    this.id = "gesture-".concat(this.type, "-").concat(nextGestureNum++);
  }
  /**
   * Event hook for the start phase of a gesture.
   *
   * @param {State} state - The input state object of the current region.
   *
   * @return {?Object} Gesture is considered recognized if an Object is
   *    returned.
   */


  start() {
    return null;
  }
  /**
   * Event hook for the move phase of a gesture.
   *
   * @param {State} state - The input state object of the current region.
   *
   * @return {?Object} Gesture is considered recognized if an Object is
   *    returned.
   */


  move() {
    return null;
  }
  /**
   * Event hook for the end phase of a gesture.
   *
   * @param {State} state - The input state object of the current region.
   *
   * @return {?Object} Gesture is considered recognized if an Object is
   *    returned.
   */


  end() {
    return null;
  }
  /**
   * Event hook for when an input is cancelled.
   *
   * @param {State} state - The input state object of the current region.
   *
   * @return {?Object} Gesture is considered recognized if an Object is
   *    returned.
   */


  cancel() {
    return null;
  }

}

module.exports = Gesture;

},{}],130:[function(require,module,exports){
/*
 * Contains the {@link Input} class
 */
'use strict';

require("core-js/modules/web.dom-collections.iterator");

const PointerData = require('./PointerData.js');
/**
 * In case event.composedPath() is not available.
 *
 * @private
 *
 * @param {Event} event
 *
 * @return {Element[]} The elements along the composed path of the event.
 */


function getPropagationPath(event) {
  if (typeof event.composedPath === 'function') {
    return event.composedPath();
  }

  const path = [];

  for (let node = event.target; node !== document; node = node.parentNode) {
    path.push(node);
  }

  path.push(document);
  path.push(window);
  return path;
}
/**
 * A WeakSet is used so that references will be garbage collected when the
 * element they point to is removed from the page.
 *
 * @private
 * @return {WeakSet.<Element>} The Elements in the path of the given event.
 */


function getElementsInPath(event) {
  return new WeakSet(getPropagationPath(event));
}
/**
 * Tracks a single input and contains information about the current, previous,
 * and initial events. Contains the progress of each Input and its associated
 * gestures.
 *
 * @hideconstructor
 */


class Input {
  /**
   * Constructor function for the Input class.
   *
   * @param {(PointerEvent | MouseEvent | TouchEvent)} event - The input event
   *    which will initialize this Input object.
   * @param {number} identifier - The identifier for this input, so that it can
   *    be located in subsequent Event objects.
   */
  constructor(event, identifier) {
    const currentData = new PointerData(event, identifier);
    /**
     * The set of elements along the original event's propagation path at the
     * time it was dispatched.
     *
     * @private
     * @type {WeakSet.<Element>}
     */

    this.initialElements = getElementsInPath(event);
    /**
     * Holds the initial data from the mousedown / touchstart / pointerdown that
     * began this input.
     *
     * @type {PointerData}
     */

    this.initial = currentData;
    /**
     * Holds the most current pointer data for this Input.
     *
     * @type {PointerData}
     */

    this.current = currentData;
    /**
     * Holds the previous pointer data for this Input.
     *
     * @type {PointerData}
     */

    this.previous = currentData;
    /**
     * The identifier for the pointer / touch / mouse button associated with
     * this input.
     *
     * @type {number}
     */

    this.identifier = identifier;
    /**
     * Stores internal state between events for each gesture based off of the
     * gesture's id.
     *
     * @private
     * @type {Object}
     */

    this.progress = {};
  }
  /**
   * The phase of the input: 'start' or 'move' or 'end'
   *
   * @type {string}
   */


  get phase() {
    return this.current.type;
  }
  /**
   * The timestamp of the initiating event for this input.
   *
   * @type {number}
   */


  get startTime() {
    return this.initial.time;
  }
  /**
   * @param {string} id - The ID of the gesture whose progress is sought.
   *
   * @return {Object} The progress of the gesture.
   */


  getProgressOfGesture(id) {
    if (!this.progress[id]) {
      this.progress[id] = {};
    }

    return this.progress[id];
  }
  /**
   * @return {number} The distance between the initiating event for this input
   *    and its current event.
   */


  totalDistance() {
    return this.initial.distanceTo(this.current);
  }
  /**
   * Saves the given raw event in PointerData form as the current data for this
   * input, pushing the old current data into the previous slot, and tossing
   * out the old previous data.
   *
   * @private
   *
   * @param {Event} event - The event object to wrap with a PointerData.
   */


  update(event) {
    this.previous = this.current;
    this.current = new PointerData(event, this.identifier);
  }
  /**
   * Determines if this PointerData was inside the given element at the time it
   * was dispatched.
   *
   * @private
   *
   * @param {Element} element
   *
   * @return {boolean} true if the Input began inside the element, false
   *    otherwise.
   */


  wasInitiallyInside(element) {
    return this.initialElements.has(element);
  }

}

module.exports = Input;

},{"./PointerData.js":133,"core-js/modules/web.dom-collections.iterator":90}],131:[function(require,module,exports){
/*
 * Contains the PHASE object, which translates event names to phases
 * (a.k.a. hooks).
 */
'use strict';
/**
 * Normalizes window events to be either of type start, move, or end.
 *
 * @private
 * @enum {string}
 */

const PHASE = Object.freeze({
  mousedown: 'start',
  touchstart: 'start',
  pointerdown: 'start',
  mousemove: 'move',
  touchmove: 'move',
  pointermove: 'move',
  mouseup: 'end',
  touchend: 'end',
  pointerup: 'end',
  touchcancel: 'cancel',
  pointercancel: 'cancel'
});
module.exports = PHASE;

},{}],132:[function(require,module,exports){
/*
 * Contains the {@link Point2D} class.
 */
'use strict';
/**
 * The Point2D class stores and operates on 2-dimensional points, represented as
 * x and y coordinates.
 *
 * @memberof westures-core
 */

class Point2D {
  /**
   * Constructor function for the Point2D class.
   *
   * @param {number} [ x=0 ] - The x coordinate of the point.
   * @param {number} [ y=0 ] - The y coordinate of the point.
   */
  constructor(x = 0, y = 0) {
    /**
     * The x coordinate of the point.
     *
     * @type {number}
     */
    this.x = x;
    /**
     * The y coordinate of the point.
     *
     * @type {number}
     */

    this.y = y;
  }
  /**
   * Calculates the angle between this point and the given point.
   *
   * @param {!westures-core.Point2D} point - Projected point for calculating the
   * angle.
   *
   * @return {number} Radians along the unit circle where the projected
   * point lies.
   */


  angleTo(point) {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }
  /**
   * Determine the average distance from this point to the provided array of
   * points.
   *
   * @param {!westures-core.Point2D[]} points - the Point2D objects to calculate
   *    the average distance to.
   *
   * @return {number} The average distance from this point to the provided
   *    points.
   */


  averageDistanceTo(points) {
    return this.totalDistanceTo(points) / points.length;
  }
  /**
   * Clone this point.
   *
   * @return {westures-core.Point2D} A new Point2D, identical to this point.
   */


  clone() {
    return new Point2D(this.x, this.y);
  }
  /**
   * Calculates the distance between two points.
   *
   * @param {!westures-core.Point2D} point - Point to which the distance is
   * calculated.
   *
   * @return {number} The distance between the two points, a.k.a. the
   *    hypoteneuse.
   */


  distanceTo(point) {
    return Math.hypot(point.x - this.x, point.y - this.y);
  }
  /**
   * Subtract the given point from this point.
   *
   * @param {!westures-core.Point2D} point - Point to subtract from this point.
   *
   * @return {westures-core.Point2D} A new Point2D, which is the result of (this
   * - point).
   */


  minus(point) {
    return new Point2D(this.x - point.x, this.y - point.y);
  }
  /**
   * Return the summation of this point to the given point.
   *
   * @param {!westures-core.Point2D} point - Point to add to this point.
   *
   * @return {westures-core.Point2D} A new Point2D, which is the addition of the
   * two points.
   */


  plus(point) {
    return new Point2D(this.x + point.x, this.y + point.y);
  }
  /**
   * Calculates the total distance from this point to an array of points.
   *
   * @param {!westures-core.Point2D[]} points - The array of Point2D objects to
   *    calculate the total distance to.
   *
   * @return {number} The total distance from this point to the provided points.
   */


  totalDistanceTo(points) {
    return points.reduce((d, p) => d + this.distanceTo(p), 0);
  }
  /**
   * Calculates the centroid of a list of points.
   *
   * @param {westures-core.Point2D[]} points - The array of Point2D objects for
   * which to calculate the centroid.
   *
   * @return {westures-core.Point2D} The centroid of the provided points.
   */


  static centroid(points = []) {
    if (points.length === 0) return null;
    const total = Point2D.sum(points);
    return new Point2D(total.x / points.length, total.y / points.length);
  }
  /**
   * Calculates the sum of the given points.
   *
   * @param {westures-core.Point2D[]} points - The Point2D objects to sum up.
   *
   * @return {westures-core.Point2D} A new Point2D representing the sum of the
   * given points.
   */


  static sum(points = []) {
    return points.reduce((total, pt) => total.plus(pt), new Point2D(0, 0));
  }

}

module.exports = Point2D;

},{}],133:[function(require,module,exports){
/*
 * Contains the {@link PointerData} class
 */
'use strict';

const Point2D = require('./Point2D.js');

const PHASE = require('./PHASE.js');
/**
 * @private
 * @return {Event} The Event object which corresponds to the given identifier.
 *    Contains clientX, clientY values.
 */


function getEventObject(event, identifier) {
  if (event.changedTouches) {
    return Array.from(event.changedTouches).find(t => {
      return t.identifier === identifier;
    });
  }

  return event;
}
/**
 * Low-level storage of pointer data based on incoming data from an interaction
 * event.
 *
 * @hideconstructor
 */


class PointerData {
  /**
   * @constructor
   *
   * @param {Event} event - The event object being wrapped.
   * @param {number} identifier - The index of touch if applicable
   */
  constructor(event, identifier) {
    /**
     * The original event object.
     *
     * @type {Event}
     */
    this.originalEvent = event;
    /**
     * The type or 'phase' of this batch of pointer data. 'start' or 'move' or
     * 'end'.
     *
     * @type {string}
     */

    this.type = PHASE[event.type];
    /**
     * The timestamp of the event in milliseconds elapsed since January 1, 1970,
     * 00:00:00 UTC.
     *
     * @type {number}
     */

    this.time = Date.now();
    const eventObj = getEventObject(event, identifier);
    /**
     * The (x,y) coordinate of the event, wrapped in a Point2D.
     *
     * @type {westures-core.Point2D}
     */

    this.point = new Point2D(eventObj.clientX, eventObj.clientY);
  }
  /**
   * Calculates the angle between this event and the given event.
   *
   * @param {PointerData} pdata
   *
   * @return {number} Radians measurement between this event and the given
   *    event's points.
   */


  angleTo(pdata) {
    return this.point.angleTo(pdata.point);
  }
  /**
   * Calculates the distance between two PointerDatas.
   *
   * @param {PointerData} pdata
   *
   * @return {number} The distance between the two points, a.k.a. the
   *    hypoteneuse.
   */


  distanceTo(pdata) {
    return this.point.distanceTo(pdata.point);
  }

}

module.exports = PointerData;

},{"./PHASE.js":131,"./Point2D.js":132}],134:[function(require,module,exports){
/*
 * Contains the {@link Region} class
 */
'use strict';

const Binding = require('./Binding.js');

const State = require('./State.js');

const PHASE = require('./PHASE.js');

const POINTER_EVENTS = ['pointerdown', 'pointermove', 'pointerup'];
const MOUSE_EVENTS = ['mousedown', 'mousemove', 'mouseup'];
const TOUCH_EVENTS = ['touchstart', 'touchmove', 'touchend'];
const CANCEL_EVENTS = ['pointercancel', 'touchcancel'];
/**
 * Allows the user to specify the control region which will listen for user
 * input events.
 *
 * @memberof westures-core
 */

class Region {
  /**
   * Constructor function for the Region class.
   *
   * @param {Element} element - The element which should listen to input events.
   * @param {boolean} capture - Whether the region uses the capture phase of
   *    input events. If false, uses the bubbling phase.
   * @param {boolean} preventDefault - Whether the default browser functionality
   *    should be disabled. This option should most likely be ignored. Here
   *    there by dragons if set to false.
   */
  constructor(element, capture = false, preventDefault = true) {
    /**
     * The list of relations between elements, their gestures, and the handlers.
     *
     * @private
     * @type {Binding[]}
     */
    this.bindings = [];
    /**
     * The list of active bindings for the current input session.
     *
     * @private
     * @type {Binding[]}
     */

    this.activeBindings = [];
    /**
     * Whether an input session is currently active.
     *
     * @private
     * @type {boolean}
     */

    this.isWaiting = true;
    /**
     * The element being bound to.
     *
     * @private
     * @type {Element}
     */

    this.element = element;
    /**
     * Whether the region listens for captures or bubbles.
     *
     * @private
     * @type {boolean}
     */

    this.capture = capture;
    /**
     * Whether the default browser functionality should be disabled. This option
     * should most likely be ignored. Here there by dragons if set to false.
     *
     * @private
     * @type {boolean}
     */

    this.preventDefault = preventDefault;
    /**
     * The internal state object for a Region.  Keeps track of inputs.
     *
     * @private
     * @type {State}
     */

    this.state = new State(this.element); // Begin operating immediately.

    this.activate();
  }
  /**
   * Activates the region by adding event listeners for all appropriate input
   * events to the region's element.
   *
   * @private
   */


  activate() {
    /*
     * Having to listen to both mouse and touch events is annoying, but
     * necessary due to conflicting standards and browser implementations.
     * Pointer is a fallback for now instead of the primary, until I figure out
     * all the details to do with pointer-events and touch-action and their
     * cross browser compatibility.
     *
     * Listening to both mouse and touch comes with the difficulty that
     * preventDefault() must be called to prevent both events from iterating
     * through the system. However I have left it as an option to the end user,
     * which defaults to calling preventDefault(), in case there's a use-case I
     * haven't considered or am not aware of.
     *
     * It is also a good idea to keep regions small in large pages.
     *
     * See:
     *  https://www.html5rocks.com/en/mobile/touchandmouse/
     *  https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
     *  https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
     */
    let eventNames = [];

    if (window.TouchEvent || window.MouseEvent) {
      eventNames = MOUSE_EVENTS.concat(TOUCH_EVENTS);
    } else {
      eventNames = POINTER_EVENTS;
    } // Bind detected browser events to the region element.


    const arbiter = this.arbitrate.bind(this);
    eventNames.forEach(eventName => {
      this.element.addEventListener(eventName, arbiter, {
        capture: this.capture,
        once: false,
        passive: false
      });
    });
    ['blur'].concat(CANCEL_EVENTS).forEach(eventname => {
      window.addEventListener(eventname, e => {
        e.preventDefault();
        this.state = new State(this.element);
        this.resetActiveBindings();
      });
    });
  }
  /**
   * Resets the active bindings.
   *
   * @private
   */


  resetActiveBindings() {
    this.activeBindings = [];
    this.isWaiting = true;
  }
  /**
   * Selects the bindings that are active for the current input sequence.
   *
   * @private
   */


  updateActiveBindings() {
    if (this.isWaiting && this.state.inputs.length > 0) {
      const input = this.state.inputs[0];
      this.activeBindings = this.bindings.filter(b => {
        return input.wasInitiallyInside(b.element);
      });
      this.isWaiting = false;
    }
  }
  /**
   * Evaluates whether the current input session has completed.
   *
   * @private
   */


  pruneActiveBindings() {
    if (this.state.hasNoActiveInputs()) {
      this.resetActiveBindings();
    }
  }
  /**
   * All input events flow through this function. It makes sure that the input
   * state is maintained, determines which bindings to analyze based on the
   * initial position of the inputs, calls the relevant gesture hooks, and
   * dispatches gesture data.
   *
   * @private
   * @param {Event} event - The event emitted from the window object.
   */


  arbitrate(event) {
    this.state.updateAllInputs(event);
    this.updateActiveBindings();

    if (this.activeBindings.length > 0) {
      if (this.preventDefault) event.preventDefault();
      this.activeBindings.forEach(binding => {
        binding.evaluateHook(PHASE[event.type], this.state);
      });
    }

    this.state.clearEndedInputs();
    this.pruneActiveBindings();
  }
  /**
   * Bind an element to a gesture with an associated handler.
   *
   * @param {Element} element - The element object.
   * @param {westures-core.Gesture} gesture - Gesture type with which to bind.
   * @param {Function} handler - The function to execute when a gesture is
   *    recognized.
   */


  addGesture(element, gesture, handler) {
    this.bindings.push(new Binding(element, gesture, handler));
  }
  /**
   * Retrieves Bindings by their associated element.
   *
   * @private
   *
   * @param {Element} element - The element for which to find bindings.
   *
   * @return {Binding[]} Bindings to which the element is bound.
   */


  getBindingsByElement(element) {
    return this.bindings.filter(b => b.element === element);
  }
  /**
   * Unbinds an element from either the specified gesture or all if no gesture
   * is specified.
   *
   * @param {Element} element - The element to unbind.
   * @param {westures-core.Gesture} [ gesture ] - The gesture to unbind. If
   * undefined, will unbind all Bindings associated with the given element.
   */


  removeGestures(element, gesture) {
    this.getBindingsByElement(element).forEach(b => {
      if (gesture == null || b.gesture === gesture) {
        this.bindings.splice(this.bindings.indexOf(b), 1);
      }
    });
  }

}

module.exports = Region;

},{"./Binding.js":128,"./PHASE.js":131,"./State.js":136}],135:[function(require,module,exports){
/*
 * Contains the abstract Pinch class.
 */
'use strict';

require("core-js/modules/es.symbol.description");

const stagedEmit = Symbol('stagedEmit');
const smooth = Symbol('smooth');
/**
 * A Smoothable gesture is one that emits on 'move' events. It provides a
 * 'smoothing' option through its constructor, and will apply smoothing before
 * emitting. There will be a tiny, ~1/60th of a second delay to emits, as well
 * as a slight amount of drift over gestures sustained for a long period of
 * time.
 *
 * For a gesture to make use of smoothing, it must return `this.emit(data,
 * field)` from the `move` phase, instead of returning the data directly. If the
 * data being smoothed is not a simple number, it must also override the
 * `smoothingAverage(a, b)` method. Also you will probably want to call
 * `super.restart()` at some point in the `start`, `end`, and `cancel` phases.
 *
 * @memberof westures-core
 * @mixin
 */

const Smoothable = superclass => class Smoothable extends superclass {
  /**
   * @param {string} name - The name of the gesture.
   * @param {Object} [options]
   * @param {boolean} [options.smoothing=true] Whether to apply smoothing to
   * emitted data.
   */
  constructor(name, options = {}) {
    super(name, options);
    /**
     * The function through which emits are passed.
     *
     * @private
     * @type {function}
     */

    this.emit = null;

    if (options.hasOwnProperty('smoothing') && !options.smoothing) {
      this.emit = data => data;
    } else {
      this.emit = this[smooth].bind(this);
    }
    /**
     * Stage the emitted data once.
     *
     * @private
     * @type {object}
     */


    this[stagedEmit] = null;
  }
  /**
   * Restart the Smoothable gesture.
   *
   * @private
   * @memberof module:westures-core.Smoothable
   */


  restart() {
    this[stagedEmit] = null;
  }
  /**
   * Smooth out the outgoing data.
   *
   * @private
   * @memberof module:westures-core.Smoothable
   *
   * @param {object} next - The next batch of data to emit.
   * @param {string] field - The field to which smoothing should be applied.
   *
   * @return {?object}
   */


  [smooth](next, field) {
    let result = null;

    if (this[stagedEmit]) {
      result = this[stagedEmit];
      const avg = this.smoothingAverage(result[field], next[field]);
      result[field] = avg;
      next[field] = avg;
    }

    this[stagedEmit] = next;
    return result;
  }
  /**
   * Average out two values, as part of the smoothing algorithm.
   *
   * @private
   * @memberof module:westures-core.Smoothable
   *
   * @param {number} a
   * @param {number} b
   *
   * @return {number} The average of 'a' and 'b'
   */


  smoothingAverage(a, b) {
    return (a + b) / 2;
  }

};

module.exports = Smoothable;

},{"core-js/modules/es.symbol.description":89}],136:[function(require,module,exports){
/*
 * Contains the {@link State} class
 */
'use strict';

require("core-js/modules/es.symbol.description");

require("core-js/modules/web.dom-collections.iterator");

const Input = require('./Input.js');

const PHASE = require('./PHASE.js');

const Point2D = require('./Point2D.js');

const symbols = Object.freeze({
  inputs: Symbol.for('inputs')
});
/*
 * Set of helper functions for updating inputs based on type of input.
 * Must be called with a bound 'this', via bind(), or call(), or apply().
 *
 * @private
 */

const update_fns = {
  TouchEvent: function TouchEvent(event) {
    Array.from(event.changedTouches).forEach(touch => {
      this.updateInput(event, touch.identifier);
    });
  },
  PointerEvent: function PointerEvent(event) {
    this.updateInput(event, event.pointerId);
  },
  MouseEvent: function MouseEvent(event) {
    if (event.button === 0) {
      this.updateInput(event, event.button);
    }
  }
};
/**
 * Keeps track of currently active and ending input points on the interactive
 * surface.
 *
 * @hideconstructor
 */

class State {
  /**
   * Constructor for the State class.
   */
  constructor(element) {
    /**
     * Keep a reference to the element for the associated region.
     *
     * @private
     * @type {Element}
     */
    this.element = element;
    /**
     * Keeps track of the current Input objects.
     *
     * @private
     * @type {Map}
     */

    this[symbols.inputs] = new Map();
    /**
     * All currently valid inputs, including those that have ended.
     *
     * @type {Input[]}
     */

    this.inputs = [];
    /**
     * The array of currently active inputs, sourced from the current Input
     * objects. "Active" is defined as not being in the 'end' phase.
     *
     * @type {Input[]}
     */

    this.active = [];
    /**
     * The array of latest point data for the currently active inputs, sourced
     * from this.active.
     *
     * @type {westures-core.Point2D[]}
     */

    this.activePoints = [];
    /**
     * The centroid of the currently active points.
     *
     * @type {westures-core.Point2D}
     */

    this.centroid = {};
    /**
     * The latest event that the state processed.
     *
     * @type {Event}
     */

    this.event = null;
  }
  /**
   * Deletes all inputs that are in the 'end' phase.
   *
   * @private
   */


  clearEndedInputs() {
    this[symbols.inputs].forEach((v, k) => {
      if (v.phase === 'end') this[symbols.inputs].delete(k);
    });
  }
  /**
   * @param {string} phase - One of 'start', 'move', or 'end'.
   *
   * @return {Input[]} Inputs in the given phase.
   */


  getInputsInPhase(phase) {
    return this.inputs.filter(i => i.phase === phase);
  }
  /**
   * @param {string} phase - One of 'start', 'move', or 'end'.
   *
   * @return {Input[]} Inputs <b>not</b> in the given phase.
   */


  getInputsNotInPhase(phase) {
    return this.inputs.filter(i => i.phase !== phase);
  }
  /**
   * @private
   * @return {boolean} True if there are no active inputs. False otherwise.
   */


  hasNoActiveInputs() {
    return this[symbols.inputs].size === 0;
  }
  /**
   * Update the input with the given identifier using the given event.
   *
   * @private
   *
   * @param {Event} event - The event being captured.
   * @param {number} identifier - The identifier of the input to update.
   */


  updateInput(event, identifier) {
    switch (PHASE[event.type]) {
      case 'start':
        this[symbols.inputs].set(identifier, new Input(event, identifier));

        try {
          this.element.setPointerCapture(identifier);
        } catch (e) {
          null;
        }

        break;

      case 'end':
        try {
          this.element.releasePointerCapture(identifier);
        } catch (e) {
          null;
        }

      case 'move':
      case 'cancel':
        if (this[symbols.inputs].has(identifier)) {
          this[symbols.inputs].get(identifier).update(event);
        }

        break;

      default:
        console.warn("Unrecognized event type: ".concat(event.type));
    }
  }
  /**
   * Updates the inputs with new information based upon a new event being fired.
   *
   * @private
   * @param {Event} event - The event being captured.
   */


  updateAllInputs(event) {
    update_fns[event.constructor.name].call(this, event);
    this.updateFields(event);
  }
  /**
   * Updates the convenience fields.
   *
   * @private
   * @param {Event} event - Event with which to update the convenience fields.
   */


  updateFields(event = null) {
    this.inputs = Array.from(this[symbols.inputs].values());
    this.active = this.getInputsNotInPhase('end');
    this.activePoints = this.active.map(i => i.current.point);
    this.centroid = Point2D.centroid(this.activePoints);
    this.radius = this.activePoints.reduce((acc, cur) => {
      const dist = cur.distanceTo(this.centroid);
      return dist > acc ? dist : acc;
    }, 0);
    if (event) this.event = event;
  }

}

module.exports = State;

},{"./Input.js":130,"./PHASE.js":131,"./Point2D.js":132,"core-js/modules/es.symbol.description":89,"core-js/modules/web.dom-collections.iterator":90}],137:[function(require,module,exports){
/**
 * The API interface for Westures. Defines a number of gestures on top of the
 * engine provided by {@link
 * https://mvanderkamp.github.io/westures-core/index.html|westures-core}.
 *
 * @namespace westures 
 */
'use strict';

const {
  Gesture,
  Point2D,
  Region,
  Smoothable
} = require('westures-core');

const Pan = require('./src/Pan.js');

const Pinch = require('./src/Pinch.js');

const Rotate = require('./src/Rotate.js');

const Swipe = require('./src/Swipe.js');

const Swivel = require('./src/Swivel.js');

const Tap = require('./src/Tap.js');

const Track = require('./src/Track.js');

module.exports = {
  Gesture,
  Point2D,
  Region,
  Smoothable,
  Pan,
  Pinch,
  Rotate,
  Swipe,
  Swivel,
  Tap,
  Track
};
/**
 * Here are the return "types" of the gestures that are included in this
 * package.
 *
 * @namespace ReturnTypes
 */

/**
 * The base Gesture class which all other classes extend.
 *
 * @see {@link
 * https://mvanderkamp.github.io/westures-core/westures-core.Gesture.html|
 * westures-core.Gesture}
 *
 * @class Gesture
 * @memberof westures
 */

/**
 * The Region class, which is the entry point for the Westures system, through
 * which you bind handlers with gestures and elements.
 *
 * @see {@link
 * https://mvanderkamp.github.io/westures-core/westures-core.Region.html|
 * westures-core.Region}
 *
 * @class Region
 * @memberof westures
 */

/**
 * Provides some basic operations on two-dimensional points.
 *
 * @see {@link
 * https://mvanderkamp.github.io/westures-core/westures-core.Point2D.html|
 * westures-core.Point2D}
 *
 * @class Point2D
 * @memberof westures
 */

/**
 * Allows the enabling of smoothing on Gestures that use this mixin.
 *
 * @see {@link
 * https://mvanderkamp.github.io/westures-core/westures-core.Smoothable.html|
 * westures-core.Smoothable}
 *
 * @mixin Smoothable
 * @memberof westures
 */

/**
 * The base data that is included for all emitted gestures.
 *
 * @typedef {Object} BaseData
 *
 * @property {westures-core.Point2D} centroid - The centroid of the input
 * points.
 * @property {Event} event - The input event which caused the gesture to be
 * recognized.
 * @property {string} phase - 'start', 'move', or 'end'.
 * @property {number} radius - The distance of the furthest input to the
 * centroid.
 * @property {string} type - The name of the gesture as specified by its
 * designer.
 * @property {Element} target - The bound target of the gesture.
 *
 * @memberof ReturnTypes
 */

},{"./src/Pan.js":138,"./src/Pinch.js":139,"./src/Rotate.js":140,"./src/Swipe.js":141,"./src/Swivel.js":142,"./src/Tap.js":143,"./src/Track.js":144,"westures-core":127}],138:[function(require,module,exports){
/*
 * Contains the Pan class.
 */
'use strict';

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const {
  Gesture,
  Point2D,
  Smoothable
} = require('westures-core');
/**
 * Data returned when a Pan is recognized.
 *
 * @typedef {Object} PanData
 * @mixes ReturnTypes.BaseData
 *
 * @property {westures.Point2D} translation - The change vector from the last
 * emit.
 *
 * @memberof ReturnTypes
 */

/**
 * A Pan is defined as a normal movement in any direction.
 *
 * @extends westures.Gesture
 * @mixes westures.Smoothable
 * @see ReturnTypes.PanData
 * @memberof westures
 */


class Pan extends Smoothable(Gesture) {
  /**
   * @param {Object} [options]
   * @param {string} [options.muteKey=undefined] - If this key is pressed, this
   *    gesture will be muted (i.e. not recognized). One of 'altKey', 'ctrlKey',
   *    'shiftKey', or 'metaKey'.
   */
  constructor(options = {}) {
    super('pan', options);

    const settings = _objectSpread({}, Pan.DEFAULTS, options);
    /**
     * Don't emit any data if this key is pressed.
     *
     * @private
     * @type {string}
     */


    this.muteKey = settings.muteKey;
    /**
     * The minimum number of inputs that must be active for a Pinch to be
     * recognized.
     *
     * @private
     * @type {number}
     */

    this.minInputs = settings.minInputs;
    /**
     * The previous point location.
     *
     * @private
     * @type {module:westures.Point2D}
     */

    this.previous = null;
  }
  /**
   * Resets the gesture's progress by saving the current centroid of the active
   * inputs. To be called whenever the number of inputs changes.
   *
   * @private
   * @param {State} state - The state object received by a hook.
   */


  restart(state) {
    if (state.active.length >= this.minInputs) {
      this.previous = state.centroid;
    }

    super.restart();
  }
  /**
   * Event hook for the start of a Pan. Records the current centroid of
   * the inputs.
   *
   * @private
   * @param {State} state - current input state.
   */


  start(state) {
    this.restart(state);
  }
  /**
   * Event hook for the move of a Pan.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.PanData} <tt>null</tt> if the gesture was muted or
   * otherwise not recognized.
   */


  move(state) {
    if (state.active.length < this.minInputs) {
      return null;
    }

    if (this.muteKey && state.event[this.muteKey]) {
      this.restart(state);
      return null;
    }

    const translation = state.centroid.minus(this.previous);
    this.previous = state.centroid;
    return this.emit({
      translation
    }, 'translation');
  }
  /**
   * Event hook for the end of a Pan. Records the current centroid of
   * the inputs.
   *
   * @private
   * @param {State} state - current input state.
   */


  end(state) {
    this.restart(state);
  }
  /**
   * Event hook for the cancel of a Pan. Resets the current centroid of
   * the inputs.
   *
   * @private
   * @param {State} state - current input state.
   */


  cancel(state) {
    this.restart(state);
  }
  /*
   * Averages out two points.
   *
   * @override
   */


  smoothingAverage(a, b) {
    return new Point2D((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

}

Pan.DEFAULTS = Object.freeze({
  minInputs: 1,
  smoothing: false
});
module.exports = Pan;

},{"westures-core":127}],139:[function(require,module,exports){
/*
 * Contains the abstract Pinch class.
 */
'use strict';

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const {
  Gesture,
  Smoothable
} = require('westures-core');
/**
 * Data returned when a Pinch is recognized.
 *
 * @typedef {Object} PinchData
 * @mixes ReturnTypes.BaseData
 *
 * @property {number} distance - The average distance from an active input to
 *    the centroid.
 * @property {number} scale - The proportional change in distance since last
 * emit.
 *
 * @memberof ReturnTypes
 */

/**
 * A Pinch is defined as two or more inputs moving either together or apart.
 *
 * @extends westures.Gesture
 * @mixes westures.Smoothable
 * @see ReturnTypes.PinchData
 * @memberof westures
 */


class Pinch extends Smoothable(Gesture) {
  /**
   * @param {Object} [options]
   * @param {number} [options.minInputs=2] The minimum number of inputs that
   * must be active for a Pinch to be recognized.
   */
  constructor(options = {}) {
    super('pinch', options);

    const settings = _objectSpread({}, Pinch.DEFAULTS, options);
    /**
     * The minimum number of inputs that must be active for a Pinch to be
     * recognized.
     *
     * @private
     * @type {number}
     */


    this.minInputs = settings.minInputs;
    /**
     * The previous distance.
     *
     * @private
     * @type {number}
     */

    this.previous = 0;
  }
  /**
   * Initializes the gesture progress and stores it in the first input for
   * reference events.
   *
   * @private
   * @param {State} state - current input state.
   */


  restart(state) {
    if (state.active.length >= this.minInputs) {
      const distance = state.centroid.averageDistanceTo(state.activePoints);
      this.previous = distance;
    }

    super.restart();
  }
  /**
   * Event hook for the start of a Pinch.
   *
   * @private
   * @param {State} state - current input state.
   */


  start(state) {
    this.restart(state);
  }
  /**
   * Event hook for the move of a Pinch.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.PinchData} <tt>null</tt> if not recognized.
   */


  move(state) {
    if (state.active.length < this.minInputs) return null;
    const distance = state.centroid.averageDistanceTo(state.activePoints);
    const scale = distance / this.previous;
    this.previous = distance;
    return this.emit({
      distance,
      scale
    }, 'scale');
  }
  /**
   * Event hook for the end of a Pinch.
   *
   * @private
   * @param {State} input status object
   */


  end(state) {
    this.restart(state);
  }
  /**
   * Event hook for the cancel of a Pinch.
   *
   * @private
   * @param {State} input status object
   */


  cancel(state) {
    this.restart(state);
  }

}

Pinch.DEFAULTS = Object.freeze({
  minInputs: 2,
  smoothing: true
});
module.exports = Pinch;

},{"westures-core":127}],140:[function(require,module,exports){
/*
 * Contains the Rotate class.
 */
'use strict';

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const {
  Gesture,
  Smoothable
} = require('westures-core');

const angularMinus = require('./angularMinus.js');
/**
 * Data returned when a Rotate is recognized.
 *
 * @typedef {Object} RotateData
 * @mixes ReturnTypes.BaseData
 *
 * @property {number} rotation - In radians, the change in angle since last
 * emit.
 *
 * @memberof ReturnTypes
 */

/**
 * A Rotate is defined as two inputs moving with a changing angle between them.
 *
 * @extends westures.Gesture
 * @mixes westures.Smoothable
 * @see ReturnTypes.RotateData
 * @memberof westures
 */


class Rotate extends Smoothable(Gesture) {
  /**
   * @param {Object} [options]
   * @param {number} [options.minInputs=2] The minimum number of inputs that
   * must be active for a Rotate to be recognized.
   * @param {boolean} [options.smoothing=true] Whether to apply smoothing to
   * emitted data.
   */
  constructor(options = {}) {
    super('rotate', options);

    const settings = _objectSpread({}, Rotate.DEFAULTS, options);
    /**
     * The minimum number of inputs that must be active for a Pinch to be
     * recognized.
     *
     * @private
     * @type {number}
     */


    this.minInputs = settings.minInputs;
    /**
     * Track the previously emitted rotation angle.
     *
     * @private
     * @type {number[]}
     */

    this.previousAngles = [];
  }
  /**
   * Store individual angle progress on each input, return average angle change.
   *
   * @private
   * @param {State} state - current input state.
   */


  getAngle(state) {
    if (state.active.length < this.minInputs) return null;
    let angle = 0;
    const stagedAngles = [];
    state.active.forEach((input, idx) => {
      const currentAngle = state.centroid.angleTo(input.current.point);
      angle += angularMinus(currentAngle, this.previousAngles[idx]);
      stagedAngles[idx] = currentAngle;
    });
    angle /= state.active.length;
    this.previousAngles = stagedAngles;
    return angle;
  }
  /**
   * Restart the gesture;
   *
   * @private
   * @param {State} state - current input state.
   */


  restart(state) {
    this.previousAngles = [];
    this.getAngle(state);
    super.restart();
  }
  /**
   * Event hook for the start of a gesture.
   *
   * @private
   * @param {State} state - current input state.
   */


  start(state) {
    this.restart(state);
  }
  /**
   * Event hook for the move of a Rotate gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.RotateData} <tt>null</tt> if this event did not occur
   */


  move(state) {
    const rotation = this.getAngle(state);

    if (rotation) {
      return this.emit({
        rotation
      }, 'rotation');
    }

    return null;
  }
  /**
   * Event hook for the end of a gesture.
   *
   * @private
   * @param {State} state - current input state.
   */


  end(state) {
    this.restart(state);
  }
  /**
   * Event hook for the cancel of a gesture.
   *
   * @private
   * @param {State} state - current input state.
   */


  cancel(state) {
    this.restart(state);
  }

}

Rotate.DEFAULTS = Object.freeze({
  minInputs: 2,
  smoothing: true
});
module.exports = Rotate;

},{"./angularMinus.js":145,"westures-core":127}],141:[function(require,module,exports){
/*
 * Contains the Swipe class.
 */
'use strict';

const {
  Gesture
} = require('westures-core');

const REQUIRED_INPUTS = 1;
const PROGRESS_STACK_SIZE = 7;
const MS_THRESHOLD = 300;
/**
 * Data returned when a Swipe is recognized.
 *
 * @typedef {Object} SwipeData
 * @mixes ReturnTypes.BaseData
 *
 * @property {number} velocity - The velocity of the swipe.
 * @property {number} direction - In radians, the direction of the swipe.
 * @property {westures.Point2D} point - The point at which the swipe ended.
 * @property {number} time - The epoch time, in ms, when the swipe ended.
 *
 * @memberof ReturnTypes
 */

/**
 * Calculates the angle of movement along a series of moves.
 *
 * @private
 * @inner
 * @memberof module:westures.Swipe
 * @see {@link https://en.wikipedia.org/wiki/Mean_of_circular_quantities}
 *
 * @param {{time: number, point: module:westures-core.Point2D}} moves - The
 * moves list to process.
 * @param {number} vlim - The number of moves to process.
 *
 * @return {number} The angle of the movement.
 */

function calc_angle(moves, vlim) {
  const point = moves[vlim].point;
  let sin = 0;
  let cos = 0;

  for (let i = 0; i < vlim; ++i) {
    const angle = moves[i].point.angleTo(point);
    sin += Math.sin(angle);
    cos += Math.cos(angle);
  }

  sin /= vlim;
  cos /= vlim;
  return Math.atan2(sin, cos);
}
/**
 * Local helper function for calculating the velocity between two timestamped
 * points.
 *
 * @private
 * @inner
 * @memberof module:westures.Swipe
 *
 * @param {object} start
 * @param {westures.Point2D} start.point
 * @param {number} start.time
 * @param {object} end
 * @param {westures.Point2D} end.point
 * @param {number} end.time
 *
 * @return {number} velocity from start to end point.
 */


function velocity(start, end) {
  const distance = end.point.distanceTo(start.point);
  const time = end.time - start.time + 1;
  return distance / time;
}
/**
 * Calculates the veloctiy of movement through a series of moves.
 *
 * @private
 * @inner
 * @memberof module:westures.Swipe
 *
 * @param {{time: number, point: module:westures-core.Point2D}} moves - The
 * moves list to process.
 * @param {number} vlim - The number of moves to process.
 *
 * @return {number} The velocity of the moves.
 */


function calc_velocity(moves, vlim) {
  let max = 0;

  for (let i = 0; i < vlim; ++i) {
    const current = velocity(moves[i], moves[i + 1]);
    if (current > max) max = current;
  }

  return max;
}
/**
 * A swipe is defined as input(s) moving in the same direction in an relatively
 * increasing velocity and leaving the screen at some point before it drops
 * below it's escape velocity.
 *
 * @extends westures.Gesture
 * @see ReturnTypes.SwipeData
 * @memberof westures
 */


class Swipe extends Gesture {
  /**
   * Constructor function for the Swipe class.
   */
  constructor() {
    super('swipe');
    /**
     * Moves list.
     *
     * @private
     * @type {object[]}
     */

    this.moves = [];
    /**
     * Data to emit when all points have ended.
     *
     * @private
     * @type {ReturnTypes.SwipeData}
     */

    this.saved = null;
  }
  /**
   * Refresh the swipe state.
   *
   * @private
   */


  refresh() {
    this.moves = [];
    this.saved = null;
  }
  /**
   * Event hook for the start of a gesture. Resets the swipe state.
   *
   * @private
   * @param {State} state - current input state.
   */


  start() {
    this.refresh();
  }
  /**
   * Event hook for the move of a gesture. Captures an input's x/y coordinates
   * and the time of it's event on a stack.
   *
   * @private
   * @param {State} state - current input state.
   */


  move(state) {
    if (state.active.length >= REQUIRED_INPUTS) {
      this.moves.push({
        time: Date.now(),
        point: state.centroid
      });

      if (this.moves.length > PROGRESS_STACK_SIZE) {
        this.moves.splice(0, this.moves.length - PROGRESS_STACK_SIZE);
      }
    }
  }
  /**
   * Determines if the input's history validates a swipe motion.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.SwipeData} <tt>null</tt> if the gesture is not
   * recognized.
   */


  end(state) {
    const result = this.getResult();
    this.moves = [];

    if (state.active.length > 0) {
      this.saved = result;
      return null;
    }

    this.saved = null;
    return this.validate(result);
  }
  /**
   * Event hook for the cancel phase of a Swipe.
   *
   * @private
   * @param {State} state - current input state.
   */


  cancel() {
    this.refresh();
  }
  /**
   * Get the swipe result.
   *
   * @private
   */


  getResult() {
    if (this.moves.length < PROGRESS_STACK_SIZE) {
      return this.saved;
    }

    const vlim = PROGRESS_STACK_SIZE - 1;
    const {
      point,
      time
    } = this.moves[vlim];
    const velocity = calc_velocity(this.moves, vlim);
    const direction = calc_angle(this.moves, vlim);
    const centroid = point;
    return {
      point,
      velocity,
      direction,
      time,
      centroid
    };
  }
  /**
   * Validates that an emit should occur with the given data.
   *
   * @private
   * @param {?ReturnTypes.SwipeData} data
   */


  validate(data) {
    if (data == null) return null;
    return Date.now() - data.time > MS_THRESHOLD ? null : data;
  }

}

module.exports = Swipe;

},{"westures-core":127}],142:[function(require,module,exports){
/*
 * Contains the Rotate class.
 */
'use strict';

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const {
  Gesture,
  Point2D,
  Smoothable
} = require('westures-core');

const angularMinus = require('./angularMinus.js');
/**
 * Data returned when a Swivel is recognized.
 *
 * @typedef {Object} SwivelData
 * @mixes ReturnTypes.BaseData
 *
 * @property {number} rotation - In radians, the change in angle since last
 * emit.
 * @property {westures.Point2D} pivot - The pivot point.
 *
 * @memberof ReturnTypes
 */

/**
 * A Swivel is a single input rotating around a fixed point. The fixed point is
 * determined by the input's location at its 'start' phase.
 *
 * @extends westures.Gesture
 * @mixes westures.Smoothable
 * @see ReturnTypes.SwivelData
 * @memberof westures
 */


class Swivel extends Smoothable(Gesture) {
  /**
   * Constructor for the Swivel class.
   *
   * @param {Object} [options]
   * @param {number} [options.deadzoneRadius=10] - The radius in pixels around
   * the start point in which to do nothing.
   * @param {string} [options.enableKey=null] - One of 'altKey', 'ctrlKey',
   * 'metaKey', or 'shiftKey'. If set, gesture will only be recognized while
   * this key is down.
   * @param {number} [options.minInputs=1] - The minimum number of inputs that
   * must be active for a Swivel to be recognized.
   * @param {Element} [options.pivotCenter] - If set, the swivel's pivot point
   * will be set to the center of the given pivotCenter element. Otherwise, the
   * pivot will be the location of the first contact point.
   */
  constructor(options = {}) {
    super('swivel', options);

    const settings = _objectSpread({}, Swivel.DEFAULTS, options);
    /**
     * The radius around the start point in which to do nothing.
     *
     * @private
     * @type {number}
     */


    this.deadzoneRadius = settings.deadzoneRadius;
    /**
     * If this is set, gesture will only respond to events where this property
     * is truthy. Should be one of 'ctrlKey', 'altKey', or 'shiftKey'.
     *
     * @private
     * @type {string}
     */

    this.enableKey = settings.enableKey;
    /**
     * The minimum number of inputs that must be active for a Swivel to be
     * recognized.
     *
     * @private
     * @type {number}
     */

    this.minInputs = settings.minInputs;
    /**
     * If this is set, the swivel will use the center of the element as its
     * pivot point. Unreliable if the element is moved during a swivel gesture.
     *
     * @private
     * @type {Element}
     */

    this.pivotCenter = settings.pivotCenter;
    /**
     * The pivot point of the swivel.
     *
     * @private
     * @type {module:westures.Point2D}
     */

    this.pivot = null;
    /**
     * The previous angle.
     *
     * @private
     * @type {number}
     */

    this.previous = 0;
    /**
     * Whether the swivel is active.
     *
     * @private
     * @type {boolean}
     */

    this.isActive = false;
  }
  /**
   * Returns whether this gesture is currently enabled.
   *
   * @private
   * @param {Event} event - The state's current input event.
   * @return {boolean} true if the gesture is enabled, false otherwise.
   */


  enabled(event) {
    return !this.enableKey || event[this.enableKey];
  }
  /**
   * Restart the given progress object using the given input object.
   *
   * @private
   * @param {State} state - current input state.
   */


  restart(state) {
    this.isActive = true;

    if (this.pivotCenter) {
      const rect = this.pivotCenter.getBoundingClientRect();
      this.pivot = new Point2D(rect.left + rect.width / 2, rect.top + rect.height / 2);
      this.previous = this.pivot.angleTo(state.centroid);
    } else {
      this.pivot = state.centroid;
      this.previous = 0;
    }

    super.restart();
  }
  /**
   * Refresh the gesture.
   *
   * @private
   * @param {module:westures.Input[]} inputs - Input list to process.
   * @param {State} state - current input state.
   */


  refresh(inputs, state) {
    if (inputs.length >= this.minInputs && this.enabled(state.event)) {
      this.restart(state);
    }
  }
  /**
   * Event hook for the start of a Swivel gesture.
   *
   * @private
   * @param {State} state - current input state.
   */


  start(state) {
    this.refresh(state.getInputsInPhase('start'), state);
  }
  /**
   * Determine the data to emit. To be called once valid state for a swivel has
   * been assured, except for deadzone.
   *
   * @private
   * @param {State} state - current input state.
   * @return {?Returns.SwivelData} Data to emit.
   */


  calculateOutput(state) {
    const pivot = this.pivot;
    const angle = pivot.angleTo(state.centroid);
    const rotation = angularMinus(angle, this.previous);
    /*
     * Updating the previous angle regardless of emit prevents sudden flips when
     * the user exits the deadzone circle.
     */

    this.previous = angle;

    if (pivot.distanceTo(state.centroid) > this.deadzoneRadius) {
      return {
        rotation,
        pivot
      };
    }

    return null;
  }
  /**
   * Event hook for the move of a Swivel gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.SwivelData} <tt>null</tt> if the gesture is not
   * recognized.
   */


  move(state) {
    if (state.active.length < this.minInputs) return null;

    if (this.enabled(state.event)) {
      if (this.isActive) {
        const output = this.calculateOutput(state);
        return output ? this.emit(output, 'rotation') : null;
      } // The enableKey was just pressed again.


      this.refresh(state.active, state);
    } else {
      // The enableKey was released, therefore pivot point is now invalid.
      this.isActive = false;
    }

    return null;
  }
  /**
   * Event hook for the end of a Swivel.
   *
   * @private
   * @param {State} state - current input state.
   */


  end(state) {
    this.refresh(state.active, state);
  }
  /**
   * Event hook for the cancel of a Swivel.
   *
   * @private
   * @param {State} state - current input state.
   */


  cancel(state) {
    this.end(state);
  }

}
/**
 * The default options for a Swivel gesture.
 */


Swivel.DEFAULTS = Object.freeze({
  deadzoneRadius: 15,
  enableKey: null,
  minInputs: 1,
  pivotCenter: false
});
module.exports = Swivel;

},{"./angularMinus.js":145,"westures-core":127}],143:[function(require,module,exports){
/*
 * Contains the Tap class.
 */
'use strict';

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const {
  Gesture,
  Point2D
} = require('westures-core');

const defaults = Object.freeze({
  MIN_DELAY_MS: 0,
  MAX_DELAY_MS: 300,
  NUM_INPUTS: 1,
  MOVE_PX_TOLERANCE: 10
});
/**
 * Data returned when a Tap is recognized.
 *
 * @typedef {Object} TapData
 * @mixes ReturnTypes.BaseData
 *
 * @property {number} x - x coordinate of tap point.
 * @property {number} y - y coordinate of tap point.
 *
 * @memberof ReturnTypes
 */

/**
 * A Tap is defined as a touchstart to touchend event in quick succession.
 *
 * @extends westures.Gesture
 * @see ReturnTypes.TapData
 * @memberof westures
 */

class Tap extends Gesture {
  /**
   * Constructor function for the Tap class.
   *
   * @param {Object} [options] - The options object.
   * @param {number} [options.minDelay=0] - The minimum delay between a
   *    touchstart and touchend can be configured in milliseconds.
   * @param {number} [options.maxDelay=300] - The maximum delay between a
   *    touchstart and touchend can be configured in milliseconds.
   * @param {number} [options.numInputs=1] - Number of inputs for Tap gesture.
   * @param {number} [options.tolerance=10] - The tolerance in pixels a user can
   *    move.
   */
  constructor(options = {}) {
    super('tap');
    /**
     * The minimum amount between a touchstart and a touchend can be configured
     * in milliseconds. The minimum delay starts to count down when the expected
     * number of inputs are on the screen, and ends when ALL inputs are off the
     * screen.
     *
     * @private
     * @type {number}
     */

    this.minDelay = options.minDelay || defaults.MIN_DELAY_MS;
    /**
     * The maximum delay between a touchstart and touchend can be configured in
     * milliseconds. The maximum delay starts to count down when the expected
     * number of inputs are on the screen, and ends when ALL inputs are off the
     * screen.
     *
     * @private
     * @type {number}
     */

    this.maxDelay = options.maxDelay || defaults.MAX_DELAY_MS;
    /**
     * The number of inputs to trigger a Tap can be variable, and the maximum
     * number being a factor of the browser.
     *
     * @private
     * @type {number}
     */

    this.numInputs = options.numInputs || defaults.NUM_INPUTS;
    /**
     * A move tolerance in pixels allows some slop between a user's start to end
     * events. This allows the Tap gesture to be triggered more easily.
     *
     * @private
     * @type {number}
     */

    this.tolerance = options.tolerance || defaults.MOVE_PX_TOLERANCE;
    /**
     * An array of inputs that have ended recently.
     *
     * @private
     * @type {Input[]}
     */

    this.ended = [];
  }
  /**
   * Event hook for the end of a gesture.  Determines if this the tap event can
   * be fired if the delay and tolerance constraints are met.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.TapData} <tt>null</tt> if the gesture is not to be
   * emitted, Object with information otherwise.
   */


  end(state) {
    const now = Date.now();
    this.ended = this.ended.concat(state.getInputsInPhase('end')).filter(input => {
      const tdiff = now - input.startTime;
      return tdiff <= this.maxDelay && tdiff >= this.minDelay;
    });

    if (this.ended.length !== this.numInputs || this.ended.some(i => i.totalDistance() > this.tolerance)) {
      return null;
    }

    const centroid = Point2D.centroid(this.ended.map(i => i.current.point));
    this.ended = [];
    return _objectSpread({
      centroid
    }, centroid);
  }

}

module.exports = Tap;

},{"westures-core":127}],144:[function(require,module,exports){
/*
 * Contains the Track class.
 */
'use strict';

require("core-js/modules/es.string.includes");

const {
  Gesture
} = require('westures-core');
/**
 * Data returned when a Track is recognized.
 *
 * @typedef {Object} TrackData
 * @mixes ReturnTypes.BaseData
 *
 * @property {westures.Point2D[]} active - Points currently in 'start' or 'move'
 *    phase.
 * @property {westures.Point2D} centroid - centroid of currently active points.
 *
 * @memberof ReturnTypes
 */

/**
 * A Track gesture forwards a list of active points and their centroid on each
 * of the selected phases.
 *
 * @extends westures.Gesture
 * @see ReturnTypes.TrackData
 * @memberof westures
 */


class Track extends Gesture {
  /**
   * Constructor for the Track class.
   *
   * @param {string[]} [phases=[]] Phases to recognize. Entries can be any or
   *    all of 'start', 'move', 'end', and 'cancel'.
   */
  constructor(phases = []) {
    super('track');
    this.trackStart = phases.includes('start');
    this.trackMove = phases.includes('move');
    this.trackEnd = phases.includes('end');
    this.trackCancel = phases.includes('cancel');
  }
  /**
   * @private
   * @param {State} state - current input state.
   * @return {ReturnTypes.TrackData}
   */


  data({
    activePoints,
    centroid
  }) {
    return {
      active: activePoints,
      centroid
    };
  }
  /**
   * Event hook for the start of a Track gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.TrackData} <tt>null</tt> if not recognized.
   */


  start(state) {
    return this.trackStart ? this.data(state) : null;
  }
  /**
   * Event hook for the move of a Track gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.TrackData} <tt>null</tt> if not recognized.
   */


  move(state) {
    return this.trackMove ? this.data(state) : null;
  }
  /**
   * Event hook for the end of a Track gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.TrackData} <tt>null</tt> if not recognized.
   */


  end(state) {
    return this.trackEnd ? this.data(state) : null;
  }
  /**
   * Event hook for the cancel of a Track gesture.
   *
   * @param {State} state - current input state.
   * @return {?ReturnTypes.TrackData} <tt>null</tt> if not recognized.
   */


  cancel(state) {
    return this.trackCancel ? this.data(state) : null;
  }

}

module.exports = Track;

},{"core-js/modules/es.string.includes":87,"westures-core":127}],145:[function(require,module,exports){
/*
 * Constains the angularMinus() function
 */
'use strict';

const PI2 = 2 * Math.PI;
/**
 * Helper function to regulate angular differences, so they don't jump from 0 to
 * 2*PI or vice versa.
 *
 * @private
 * @param {number} a - Angle in radians.
 * @param {number} b - Angle in radians.
 * @return {number} c, given by: c = a - b such that || < PI
 */

function angularMinus(a, b = 0) {
  let diff = a - b;

  if (diff < -Math.PI) {
    diff += PI2;
  } else if (diff > Math.PI) {
    diff -= PI2;
  }

  return diff;
}

module.exports = angularMinus;

},{}],146:[function(require,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
    length = 64,
    map = {},
    seed = 0,
    i = 0,
    prev;
/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */

function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}
/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */


function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}
/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */


function yeast() {
  var now = encode(+new Date());
  if (now !== prev) return seed = 0, prev = now;
  return now + '.' + encode(seed++);
} //
// Map each character to its index.
//


for (; i < length; i++) map[alphabet[i]] = i; //
// Expose the `yeast`, `encode` and `decode` functions.
//


yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],147:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 * Date: July 2018 - Jan 2019
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */

/**
 * This file defines the entry point for the client side of a WAMS application.
 *
 * @module client
 */
'use strict';

const ClientController = require('./client/ClientController.js');

const ClientModel = require('./client/ClientModel.js');

const ClientView = require('./client/ClientView.js');

window.addEventListener('load', function run() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const model = new ClientModel();
  const view = new ClientView(context);
  const ctrl = new ClientController(canvas, view, model);
  model.view = view;
  view.model = model;
  ctrl.connect();
}, {
  capture: false,
  once: true,
  passive: true
});

},{"./client/ClientController.js":148,"./client/ClientModel.js":152,"./client/ClientView.js":153}],148:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 * Date: July 2018 - January 2019
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */
'use strict';

require("core-js/modules/es.symbol.description");

require("core-js/modules/web.dom-collections.iterator");

const io = require('socket.io-client');

const {
  constants,
  DataReporter,
  TouchReporter,
  IdStamper,
  Message,
  NOP
} = require('../shared.js');

const Interactor = require('./Interactor.js');

const STAMPER = new IdStamper();
const FRAME_RATE = 1000 / 60; // Symbols to identify these methods as intended only for internal use

const symbols = Object.freeze({
  attachListeners: Symbol('attachListeners'),
  render: Symbol('render'),
  startRender: Symbol('startRender')
});
/**
 * The ClientController coordinates communication with the wams server. It sends
 * messages based on user interaction with the canvas and receives messages from
 * the server detailing changes to post to the view.
 *
 * @memberof module:client
 */

class ClientController {
  /**
   * @param {HTMLCanvasElement} canvas - The underlying CanvasElement object,
   * (not the context), which will fill the page.
   * @param {module:client.ClientView} view - The view that will handle
   * rendering duties.
   * @param {module:client.ClientModel} model - The client-side copy of the
   * server's model.
   */
  constructor(canvas, view, model) {
    /**
     * The HTMLCanvasElement object is stored by the ClientController so that it
     * is able to respond to user events triggered on the canvas. The view only
     * needs to know about the canvas drawing context.
     *
     * @type {HTMLCanvasElement}
     */
    this.canvas = canvas;
    /**
     * From socket.io, the socket provides a channel of communication with the
     * server.
     *
     * @type {Socket}
     * @see {@link https://socket.io/docs/client-api/}
     */

    this.socket = null;
    /**
     * The ClientModel is a client-side copy of the workspace model, kept up to
     * date by the controller.
     *
     * @type {module:client.ClientModel}
     */

    this.model = model;
    /**
     * The ClientView handles the final rendering of the model, as informed by
     * the controller.
     *
     * @type {module:client.ClientView}
     */

    this.view = view;
    /**
     * Tracks whether a render has been scheduled for the next render frame.
     *
     * @type {boolean}
     */

    this.renderScheduled = false;
    /*
     * For proper function, we need to make sure that the canvas is as large as
     * it can be at all times, and that at all times we know how big the canvas
     * is.
     */

    this.resizeCanvasToFillWindow();
  }
  /**
   * Attaches listeners to messages received over the socket connection. All
   * received messages at this layer should be those conforming to the Message /
   * Reporter protocol.
   *
   * This internal routine should be called as part of socket establishment.
   */


  [symbols.attachListeners]() {
    const listeners = {
      // For the server to inform about changes to the model
      [Message.ADD_ELEMENT]: data => this.handle('addElement', data),
      [Message.ADD_IMAGE]: data => this.handle('addImage', data),
      [Message.ADD_ITEM]: data => this.handle('addItem', data),
      [Message.ADD_SHADOW]: data => this.handle('addShadow', data),
      [Message.RM_ITEM]: data => this.handle('removeItem', data),
      [Message.RM_SHADOW]: data => this.handle('removeShadow', data),
      [Message.UD_ITEM]: data => this.handle('updateItem', data),
      [Message.UD_SHADOW]: data => this.handle('updateShadow', data),
      [Message.UD_VIEW]: data => this.handle('updateView', data),
      // For hopefully occasional extra adjustments to objects in the model.
      [Message.RM_ATTRS]: ({
        data
      }) => this.handle('removeAttributes', data),
      [Message.SET_ATTRS]: ({
        data
      }) => this.handle('setAttributes', data),
      [Message.SET_IMAGE]: ({
        data
      }) => this.handle('setImage', data),
      [Message.SET_RENDER]: ({
        data
      }) => this.handle('setRender', data),
      // Connection establishment related (disconnect, initial setup)
      [Message.INITIALIZE]: data => this.setup(data),
      [Message.LAYOUT]: NOP,
      // User event related
      [Message.CLICK]: NOP,
      [Message.RESIZE]: NOP,
      [Message.SWIPE]: NOP,
      [Message.TRACK]: NOP,
      [Message.TRANSFORM]: NOP,
      // Multi-device gesture related
      [Message.POINTER]: NOP,
      [Message.BLUR]: NOP,
      // TODO: This could be more... elegant...
      [Message.FULL]: () => {
        document.body.innerHTML = 'WAMS is full! :(';
      }
    };
    Object.entries(listeners).forEach(([p, v]) => this.socket.on(p, v)); // Keep the view size up to date.

    window.addEventListener('resize', this.resize.bind(this), false);
    /*
     * As no automatic draw loop is used, (there are no animations), need to
     * know when to re-render in response to an image loading.
     */

    const schedule_fn = this.scheduleRender.bind(this);
    document.addEventListener(Message.IMG_LOAD, schedule_fn);
  }
  /**
   * Establishes a socket.io connection with the server, using the global WAMS
   * namespace. Connections should be non-persistent over disconnects, (i.e., no
   * reconnections), as this was the cause of many bugs.
   *
   * This internal routine should be called automatically upon ClientController
   * instantiation.
   */


  connect() {
    this.socket = io.connect(constants.NS_WAMS, {
      autoConnect: false,
      reconnection: false
    });
    this[symbols.attachListeners]();
    this[symbols.startRender]();
    this.socket.connect();
  }
  /**
   * Renders a frame.
   */


  [symbols.render]() {
    if (this.renderScheduled) {
      this.view.draw();
      this.renderScheduled = false;
    }
  }
  /**
   * Initializes the render loop.
   */


  [symbols.startRender]() {
    const render_fn = this[symbols.render].bind(this);
    window.setInterval(render_fn, FRAME_RATE);
  }
  /**
   * Generates a function for forwarding the given message to the server.
   *
   * @see {@link module:shared.Message}
   *
   * @param {string} message - The type of message to forward. One of the static
   * members of the Message class.
   *
   * @return {Function} A function bound to this instance for forwarding data to
   * the server with the given message type label.
   */


  forward(message) {
    function do_forward(data) {
      const dreport = new DataReporter({
        data
      });
      new Message(message, dreport).emitWith(this.socket);
    }

    return do_forward.bind(this);
  }
  /**
   * Passes messages to the View, and schedules a render.
   *
   * @see {@link module:shared.Message}
   *
   * @param {string} message - The name of a ClientView method to run.
   * @param {...*} data - The argument to pass to the ClientView method.
   */


  handle(message, data) {
    this.model[message](data, this);
    this.scheduleRender();
  }
  /**
   * For responding to window resizing by the user. Resizes the canvas to fit
   * the new window size, and reports the change to the server so it can be
   * reflected in the model.
   */


  resize() {
    this.resizeCanvasToFillWindow();
    new Message(Message.RESIZE, this.view).emitWith(this.socket);
    this.view.draw();
  }
  /**
   * Stretches the canvas to fit the available window space, and updates the
   * view accordingly.
   */


  resizeCanvasToFillWindow() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.view.resizeToFillWindow();
  }
  /**
   * Schedules a render for the next frame interval.
   */


  scheduleRender() {
    this.renderScheduled = true;
  }
  /**
   * As this object will be instantiated on page load, and will generate a view
   * before communication lines with the server have been opened, the view will
   * not reflect the model automatically. This function responds to a message
   * from the server which contains the current state of the model, and forwards
   * this data to the view so that it can correctly render the model.
   *
   * @param {module:shared.FullStateReporter} data - All the information
   * necessary to initially synchronize this client's model with the server's
   * model.
   */


  setup(data) {
    STAMPER.cloneId(this.view, data.id);
    this.canvas.style.backgroundColor = data.color;
    this.model.setup(data);
    this.setupInteractor(data.useServerGestures); // Need to tell the model what the view looks like once setup is complete.

    new Message(Message.LAYOUT, this.view).emitWith(this.socket);
  }
  /**
   * The Interactor is a level of abstraction between the ClientController and
   * the gesture recognition library such that libraries can be swapped out
   * more easily, if need be. At least in theory. All the ClientController
   * needs to provide is handler functions for responding to the recognized
   * gestures.
   *
   * @param {boolean} [useServerGestures=false] Whether to use server-side
   * gestures. Default is to use client-side gestures.
   */


  setupInteractor(useServerGestures = false) {
    if (useServerGestures) {
      this.setupInputForwarding();
    } else {
      new Interactor({
        swipe: this.forward(Message.SWIPE),
        tap: this.forward(Message.CLICK),
        track: this.forward(Message.TRACK),
        transform: this.forward(Message.TRANSFORM)
      });
    }
  }
  /**
   * Set up input event forwarding.
   */


  setupInputForwarding() {
    if (window.MouseEvent || window.TouchEvent) {
      this.forwardTouchEvents();
      this.forwardMouseEvents();
    } else {
      this.forwardPointerEvents();
    }

    this.forwardBlurEvents();
  }
  /**
   * Forward the given events, by using the given callback.
   *
   * @param {string[]} eventnames
   * @param {function} callback
   */


  forwardEvents(eventnames, callback) {
    eventnames.forEach(eventname => {
      window.addEventListener(eventname, callback, {
        capture: true,
        once: false,
        passive: false
      });
    });
  }
  /**
   * Forward blur and cancel events.
   */


  forwardBlurEvents() {
    this.forwardEvents(['touchcancel', 'pointercancel', 'blur'], event => {
      event.preventDefault();
      const breport = new DataReporter();
      new Message(Message.BLUR, breport).emitWith(this.socket);
    });
  }
  /**
   * Forward pointer events.
   */


  forwardPointerEvents() {
    this.forwardEvents(['pointerdown', 'pointermove', 'pointerup'], event => {
      event.preventDefault();
      const treport = new TouchReporter(event);
      treport.changedTouches = [{
        identifier: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY
      }];
      new Message(Message.POINTER, treport).emitWith(this.socket);
    });
  }
  /**
   * Forward mouse events.
   */


  forwardMouseEvents() {
    this.forwardEvents(['mousedown', 'mousemove', 'mouseup'], event => {
      event.preventDefault();

      if (event.button === 0) {
        const treport = new TouchReporter(event);
        treport.changedTouches = [{
          identifier: 0,
          clientX: event.clientX,
          clientY: event.clientY
        }];
        new Message(Message.POINTER, treport).emitWith(this.socket);
      }
    });
  }
  /**
   * Forward touch events.
   */


  forwardTouchEvents() {
    this.forwardEvents(['touchstart', 'touchmove', 'touchend'], event => {
      event.preventDefault();
      const treport = new TouchReporter(event);
      treport.changedTouches = Array.from(event.changedTouches).map(touch => {
        return {
          identifier: touch.identifier,
          clientX: touch.clientX,
          clientY: touch.clientY
        };
      });
      new Message(Message.POINTER, treport).emitWith(this.socket);
    });
  }

}

module.exports = ClientController;

},{"../shared.js":157,"./Interactor.js":154,"core-js/modules/es.symbol.description":89,"core-js/modules/web.dom-collections.iterator":90,"socket.io-client":114}],149:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 */
'use strict';

require("core-js/modules/web.dom-collections.iterator");

const {
  Point2D,
  IdStamper,
  WamsElement
} = require('../shared.js');

const STAMPER = new IdStamper();
/**
 * The ClientElement class exposes the draw() funcitonality of wams elements.
 *
 * @extends module:shared.WamsElement
 * @memberof module:client
 */

class ClientElement extends WamsElement {
  /**
   * @param {module:shared.WamsElement} data - The data from the server
   * describing this item. Only properties explicity listed in the array passed
   * to the ReporterFactory when the WamsElement class was defined will be
   * accepted.
   */
  constructor(data) {
    super(data);
    /**
     * The DOM element.
     *
     * @type {Element}
     */

    this.element = document.createElement(data.tagname);
    this.element.classList.add('wams-element');
    this.element.width = this.width;
    this.element.height = this.height;
    this.element.style.width = "".concat(this.width, "px");
    this.element.style.height = "".concat(this.height, "px");
    document.body.appendChild(this.element);

    if (data.hasOwnProperty('attributes')) {
      this.setAttributes(data.attributes);
    }
    /**
     * Id to make the items uniquely identifiable.
     *
     * @name id
     * @type {number}
     * @constant
     * @instance
     * @memberof module:client.ClientElement
     */


    STAMPER.cloneId(this, data.id);
  }
  /**
   * Render the element. Really just updates the rotation and transformation
   * matrix.
   *
   * @param {CanvasRenderingContext2D} context
   * @param {module:client.ClientView} view
   */


  draw(context, view) {
    const tl = new Point2D(this.x - view.x, this.y - view.y).divideBy(this.scale).rotate(this.rotation);
    const rotate = "rotate(".concat(view.rotation - this.rotation, "rad) ");
    const scale = "scale(".concat(this.scale * view.scale, ") ");
    const translate = "translate(".concat(tl.x, "px, ").concat(tl.y, "px) ");
    this.element.style.transform = scale + rotate + translate;
  }
  /**
   * Sets attributes for the element.
   *
   * @param {object} attributes
   */


  setAttributes(attributes) {
    this.attributes = attributes;
    Object.entries(attributes).forEach(([k, v]) => {
      this.element[k] = v;
    });
  }
  /**
   * Removes attributes from the element.
   *
   * @param {string[]} attributes
   */


  removeAttributes(attributes) {
    attributes.forEach(attr => {
      delete this.attributes[attr];
      this.element[attr] = null;
    });
  }

}

module.exports = ClientElement;

},{"../shared.js":157,"core-js/modules/web.dom-collections.iterator":90}],150:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 */
'use strict';

const {
  IdStamper,
  WamsImage,
  Message
} = require('../shared.js');

const STAMPER = new IdStamper();
/**
 * Abstraction of the requisite logic for generating an image object which will
 * load the appropriate image and report when it has finished loading the image
 * so that it can be displayed.
 *
 * @inner
 * @memberof module:client.ClientImage
 *
 * @param {string} src - Image source path.
 *
 * @returns {?Image}
 */

function createImage(src) {
  if (src) {
    const img = new Image();
    img.src = src;
    img.loaded = false;
    img.addEventListener('load', () => {
      img.loaded = true;
      document.dispatchEvent(new CustomEvent(Message.IMG_LOAD));
    }, {
      once: true
    });
    return img;
  }

  return {};
}
/**
 * The ClientImage class exposes the draw() funcitonality of wams items.
 *
 * @extends module:shared.WamsImage
 * @memberof module:client
 */


class ClientImage extends WamsImage {
  /**
   * @param {module:shared.Item} data - The data from the server describing this
   * item. Only properties explicity listed in the array passed to the
   * ReporterFactory when the Item class was defined will be accepted.
   */
  constructor(data) {
    super(data);
    /**
     * The image to render.
     *
     * @type {Image}
     */

    this.image = {};
    if (data.src) this.setImage(data.src);
    /**
     * Id to make the items uniquely identifiable.
     *
     * @name id
     * @type {number}
     * @constant
     * @instance
     * @memberof module:client.ClientImage
     */

    STAMPER.cloneId(this, data.id);
  }
  /**
   * Render the image onto the given context.
   *
   * @param {CanvasRenderingContext2D} context
   */


  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(-this.rotation);
    context.scale(this.scale, this.scale);

    if (this.image.loaded) {
      context.drawImage(this.image, 0, 0, this.width, this.height);
    } else {
      context.fillStyle = 'darkgrey';
      context.fillRect(0, 0, this.width, this.height);
    }

    context.restore();
  }
  /**
   * Sets the image path and loads the image.
   *
   * @param {string} path - The image's source path
   */


  setImage(path) {
    this.src = path;
    this.image = createImage(path);
  }

}

module.exports = ClientImage;

},{"../shared.js":157}],151:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */
'use strict';

const {
  IdStamper,
  Item
} = require('../shared.js');

const {
  CanvasSequence
} = require('canvas-sequencer');

const STAMPER = new IdStamper();
/**
 * The ClientItem class exposes the draw() funcitonality of wams items.
 *
 * @extends module:shared.Item
 * @memberof module:client
 */

class ClientItem extends Item {
  /**
   * @param {module:shared.Item} data - The data from the server describing this
   * item. Only properties explicity listed in the array passed to the
   * ReporterFactory when the Item class was defined will be accepted.
   */
  constructor(data) {
    super(data);
    /**
     * The actual render.
     *
     * @type {CanvasSequence}
     */

    this.render = null;
    if (data.sequence) this.setRender(data.sequence);
    /**
     * Id to make the items uniquely identifiable.
     *
     * @name id
     * @type {number}
     * @constant
     * @instance
     * @memberof module:client.ClientItem
     */

    STAMPER.cloneId(this, data.id);
  }
  /**
   * Render the item onto the given context.
   *
   * @param {CanvasRenderingContext2D} context
   */


  draw(context) {
    if (this.render) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(-this.rotation);
      context.scale(this.scale, this.scale);
      this.render.execute(context);
      context.restore();
    }
  }
  /**
   * Set the item's canvas rendering sequence.
   *
   * @param {CanvasSequence} sequence - Raw, unrevived CanvasSequence.
   */


  setRender(sequence) {
    this.render = new CanvasSequence(sequence);
  }

}

module.exports = ClientItem;

},{"../shared.js":157,"canvas-sequencer":9}],152:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */
'use strict';

require("core-js/modules/web.dom-collections.iterator");

const ClientElement = require('./ClientElement.js');

const ClientImage = require('./ClientImage.js');

const ClientItem = require('./ClientItem.js');

const ShadowView = require('./ShadowView.js');

const {
  removeById
} = require('../shared.js');

const REQUIRED_DATA = Object.freeze(['id', 'items', 'views']);
/**
 * The ClientModel is a client-side copy of those aspects of the model that are
 * necessary for rendering the view for the user.
 *
 * @memberof module:client
 */

class ClientModel {
  constructor() {
    /**
     * All the items in the model, which may all need rendering at some point.
     * Kept up to date via the ClientController.
     *
     * @type {Map.<module:client.ClientItem>}
     */
    this.items = new Map();
    /**
     * An ordered list of the items, so that the render order can accurately
     * match the order on the server, and be adjusted likewise.
     *
     * @type {module:client.ClientItem[]}
     */

    this.itemOrder = [];
    /**
     * The shadows are all the other views that are currently active. They are
     * tracked in full and an outline for each is rendered.
     *
     * @type {Map.<module:client.ShadowView>}
     */

    this.shadows = new Map();
    /**
     * The view data for this user.
     *
     * @type {module:client.ClientView}
     */

    this.view = null;
  }
  /**
   * Generate and store an item of the given type.
   *
   * @param {function} class_fn
   * @param {object} values
   */


  addObject(class_fn, values) {
    const object = new class_fn(values);
    this.itemOrder.push(object);
    this.items.set(object.id, object);
  }
  /**
   * Generate and store an Element with the given values.
   *
   * @param {module:shared.WamsElement} values - State of the new Element
   */


  addElement(values) {
    this.addObject(ClientElement, values);
  }
  /**
   * Generate and store an Image with the given values.
   *
   * @param {module:shared.WamsImage} values - State of the new image.
   */


  addImage(values) {
    this.addObject(ClientImage, values);
  }
  /**
   * Generate and store an Item with the given values.
   *
   * @param {module:shared.Item} values - State of the new Item.
   */


  addItem(values) {
    this.addObject(ClientItem, values);
  }
  /**
   * Generate and store a 'shadow view' to track another active view.
   *
   * @param {module:shared.View} values - State of the new View.
   */


  addShadow(values) {
    const shadow = new ShadowView(values);
    this.shadows.set(shadow.id, shadow);
  }
  /**
   * Removes the given item.
   *
   * @param {module:shared.Item} item - The Item to remove.
   *
   * @return {boolean} true if removal was successful, false otherwise.
   */


  removeItem(item) {
    const obj = this.items.get(item.id);

    if (obj.hasOwnProperty('tagname')) {
      document.body.removeChild(obj.element);
    }

    this.items.delete(item.id);
    return removeById(this.itemOrder, item);
  }
  /**
   * Removes the given 'shadow' view.
   *
   * @param {module:shared.View} shadow - The 'shadow' view to remove.
   *
   * @return {boolean} true if removal was successful, false otherwise.
   */


  removeShadow(shadow) {
    return this.shadows.delete(shadow.id);
  }
  /**
   * Set up the internal copy of the model according to the data provided by the
   * server.
   *
   * @param {module:shared.FullStateReporter} data - The data from the server
   *       detailing the current state of the model.  See REQUIRED_DATA. If any
   *       is missing, something has gone terribly wrong, and an exception will
   *       be thrown.
   */


  setup(data) {
    REQUIRED_DATA.forEach(d => {
      if (!data.hasOwnProperty(d)) throw "setup requires: ".concat(d);
    });
    data.views.forEach(v => v.id !== this.view.id && this.addShadow(v));
    data.items.reverse().forEach(o => {
      if (o.hasOwnProperty('src')) {
        this.addImage(o);
      } else if (o.hasOwnProperty('tagname')) {
        this.addElement(o);
      } else {
        this.addItem(o);
      }
    });
  }
  /**
   * Call the given method with the given property of 'data' on the item with id
   * equal to data.id.
   *
   * @param {string} fn_name
   * @param {string} property
   * @param {object} data
   */


  setItemValue(fn_name, property, data) {
    if (this.items.has(data.id)) {
      this.items.get(data.id)[fn_name](data[property]);
    }
  }
  /**
   * Set the attributes for the appropriate item.
   *
   * @param {object} data
   */


  setAttributes(data) {
    this.setItemValue('setAttributes', 'attributes', data);
  }
  /**
   * Set the image for the appropriate item.
   *
   * @param {object} data
   */


  setImage(data) {
    this.setItemValue('setImage', 'src', data);
  }
  /**
   * Set the canvas rendering sequence for the appropriate item.
   *
   * @param {object} data
   */


  setRender(data) {
    this.setItemValue('setRender', 'sequence', data);
  }
  /**
   * Intended for use as an internal helper function, so that this functionality
   * does not need to be defined twice for both of the items and shadows arrays.
   *
   * @param {string} container - Name of the ClientView property defining the
   * array which contains the object to update.
   * @param {( module:shared.Item | module:shared.View )} data - Data with which
   * an object in the container will be updated.  Note that the object is
   * located using an 'id' field on this data object.
   */


  update(container, data) {
    if (this[container].has(data.id)) {
      this[container].get(data.id).assign(data);
    } else {
      console.warn("Unable to find in ".concat(container, ": id: "), data.id);
    }
  }
  /**
   * Update an item.
   *
   * @param {module:shared.Item} data - data from the server, has an 'id' field
   * with which the item will be located.
   */


  updateItem(data) {
    this.update('items', data);
  }
  /**
   * Update a 'shadow' view.
   *
   * @param {module:shared.View} data - data from the server, has an 'id' field
   * with which the view will be located.
   */


  updateShadow(data) {
    this.update('shadows', data);
  }
  /**
   * Update the view.
   *
   * @param {module:shared.View} data - data from the server, specficially
   * pertaining to this client's view.
   */


  updateView(data) {
    this.view.assign(data);
  }

}

module.exports = ClientModel;

},{"../shared.js":157,"./ClientElement.js":149,"./ClientImage.js":150,"./ClientItem.js":151,"./ShadowView.js":155,"core-js/modules/web.dom-collections.iterator":90}],153:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */
'use strict';

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.number.to-fixed");

const {
  View
} = require('../shared.js'); // Data fields to write for status indicator text.


const STATUS_KEYS = Object.freeze(['x', 'y', 'width', 'height', 'rotation', 'scale']); // Mark these methods as intended only for internal use.

const symbols = Object.freeze({
  align: Symbol('align'),
  drawItems: Symbol('drawItems'),
  drawShadows: Symbol('drawShadows'),
  drawStatus: Symbol('drawStatus'),
  wipe: Symbol('wipe')
});
/**
 * The ClientView is responsible for rendering the view. To do this, it keeps
 * track of its own position, scale, and orientation, as well as those values
 * for all items and all other views (which will be represented with outlines).
 *
 * @extends module:shared.View
 * @memberof module:client
 */

class ClientView extends View {
  /**
   * @param {CanvasRenderingContext2D} context - The canvas context in which to
   * render the model.
   */
  constructor(context) {
    super(ClientView.DEFAULTS);
    /**
     * The CanvasRenderingContext2D is required for drawing (rendering) to take
     * place.
     *
     * @type {CanvasRenderingContext2D}
     */

    this.context = context;
    /**
     * The model holds the information about items and shadows that need
     * rendering.
     *
     * @type {module:client.ClientModel}
     */

    this.model = null;
    /**
     * Id to make the views uniquely identifiable. Will be assigned when setup
     * message is received from server.
     *
     * @name id
     * @type {number}
     * @constant
     * @instance
     * @memberof module:client.ClientView
     */

    this.id = null;
  }
  /**
   * Positions the rendering context precisely, taking into account all
   * transformations, so that rendering can proceed correctly.
   */


  [symbols.align]() {
    /*
     * WARNING: It is crucially important that the instructions below occur
     * in *precisely* this order!
     */
    this.context.scale(this.scale, this.scale);
    this.context.rotate(this.rotation);
    this.context.translate(-this.x, -this.y);
  }
  /**
   * Renders all the items.
   */


  [symbols.drawItems]() {
    this.model.itemOrder.forEach(o => o.draw(this.context, this));
  }
  /**
   * Renders outlines of all the other views.
   */


  [symbols.drawShadows]() {
    this.model.shadows.forEach(v => v.draw(this.context));
  }
  /**
   * Renders text describing the status of the view to the upper left corner of
   * the view, to assist with debugging.
   */


  [symbols.drawStatus]() {
    const messages = STATUS_KEYS.map(k => "".concat(k, ": ").concat(this[k].toFixed(2))).concat(["# of Shadows: ".concat(this.model.shadows.size)]);
    let ty = 40;
    const tx = 20;
    this.context.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.font = '18px Georgia';
    messages.forEach(m => {
      this.context.fillText(m, tx, ty);
      ty += 20;
    });
    this.context.restore();
  }
  /**
   * Clears all previous renders, to ensure a clean slate for the upcoming
   * render.
   */


  [symbols.wipe]() {
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  /**
   * Fully render the current state of the system.
   */


  draw() {
    this.context.save();
    this[symbols.wipe]();
    this[symbols.align]();
    this[symbols.drawItems]();
    this[symbols.drawShadows]();
    this[symbols.drawStatus]();
    this.context.restore();
  }
  /**
   * Fill all available space in the window.
   */


  resizeToFillWindow() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

}

module.exports = ClientView;

},{"../shared.js":157,"core-js/modules/es.number.to-fixed":86,"core-js/modules/es.symbol.description":89}],154:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */
'use strict'; // const Westures = require('../../../westures');

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const Westures = require('westures');

const {
  NOP
} = require('../shared.js');

const Transform = require('./Transform.js');
/**
 * The Interactor class provides a layer of abstraction between the
 * ClientController and the code that processes user inputs.  Data from
 * recognized gestures is reported directly through to the handlers. The
 * handlers are initialized to NOPs so that the functions which call the
 * handlers don't need to check whether the handler exists.
 *
 * Currently, the Interactor makes use of the Westures library.
 *
 * @memberof module:client
 *
 * @see {@link https://mvanderkamp.github.io/westures/}
 */


class Interactor {
  /**
   * @param {Object} handlers - Object with keys as the names gestures and
   *    values as the corresponding function for handling that gesture when it
   *    is recognized.
   * @param {Function} [handlers.swipe=NOP]
   * @param {Function} [handlers.tap=NOP]
   * @param {Function} [handlers.track=NOP]
   * @param {Function} [handlers.transform=NOP]
   */
  constructor(handlers = {}) {
    /**
     * Object holding the handlers, so they can be dynamically referenced by
     * name.
     *
     * @type {Object}
     * @property {Function} [swipe=NOP]
     * @property {Function} [tap=NOP]
     * @property {Function} [track=NOP]
     * @property {Function} [transform=NOP]
     */
    this.handlers = _objectSpread({}, Interactor.DEFAULT_HANDLERS, handlers); // Begin listening activities immediately.

    this.bindRegions();
    window.addEventListener('wheel', this.wheel.bind(this), false);
  }
  /**
   * Westures uses Gesture objects, and expects those objects to be bound to an
   * element, along with a handler for responding to that gesture. This method
   * takes care of those activities.
   */


  bindRegions() {
    const swipe = new Westures.Swipe();
    const swivel = new Westures.Swivel({
      enableKey: 'ctrlKey'
    });
    const tap = new Westures.Tap();
    const track = new Westures.Track(['start', 'end']);
    const transform = new Transform();
    const region = new Westures.Region(document.body);
    region.addGesture(document.body, tap, this.forward('tap'));
    region.addGesture(document.body, swipe, this.forward('swipe'));
    region.addGesture(document.body, swivel, this.swivel());
    region.addGesture(document.body, transform, this.forward('transform'));
    region.addGesture(document.body, track, this.forward('track'));
  }
  /**
   * Send a swivel event through as a transformation.
   */


  swivel() {
    function do_swivel({
      rotation,
      pivot
    }) {
      this.handlers.transform({
        centroid: pivot,
        delta: {
          rotation
        }
      });
    }

    return do_swivel.bind(this);
  }
  /**
   * Generates a function that forwards the appropriate gesture and data.
   *
   * @param {string} gesture - name of a gesture to forward.
   *
   * @return {Function} Handler for westures that receives a data object and
   * forwards it according to the given gesture name.
   */


  forward(gesture) {
    function do_forward(data) {
      this.handlers[gesture](data);
    }

    return do_forward.bind(this);
  }
  /**
   * Treat scrollwheel events as zoom events.
   *
   * @param {WheelEvent} event - The wheel event from the window.
   */


  wheel(event) {
    event.preventDefault();
    const factor = event.ctrlKey ? 0.02 : 0.10;
    const scale = -(Math.sign(event.deltaY) * factor) + 1;
    const centroid = {
      x: event.clientX,
      y: event.clientY
    };
    this.handlers.transform({
      centroid,
      delta: {
        scale
      }
    });
  }

}
/**
 * The default handlers used by the Interactor.
 *
 * @type {object}
 */


Interactor.DEFAULT_HANDLERS = Object.freeze({
  swipe: NOP,
  tap: NOP,
  track: NOP,
  transform: NOP
});
module.exports = Interactor;

},{"../shared.js":157,"./Transform.js":156,"westures":137}],155:[function(require,module,exports){
/*
 * WAMS code to be executed in the client browser.
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 *
 * Original author: Jesse Rolheiser
 * Other revisions and supervision: Scott Bateman
 */

/*
 * SOME NOTES ABOUT CANVAS RENDERING:
 *  - Avoid using shadows. They appear to kill the framerate.
 */
'use strict';

require("core-js/modules/es.symbol.description");

const {
  colours,
  IdStamper,
  View
} = require('../shared.js');

const STAMPER = new IdStamper(); // Symbols to mark these methods as intended for internal use only.

const symbols = Object.freeze({
  align: Symbol('align'),
  style: Symbol('style'),
  outline: Symbol('outline'),
  marker: Symbol('marker')
});
/**
 * The ShadowView class exposes a simple draw() function which renders a shadowy
 * outline of the view onto the canvas.
 *
 * @extends module:shared.View
 * @memberof module:client
 */

class ShadowView extends View {
  /**
   * @param {module:shared.View} values - server-provided data describing this
   * view.
   */
  constructor(values) {
    super(values);
    STAMPER.cloneId(this, values.id);
  }
  /**
   * Render an outline of this view.
   *
   * @param {CanvasRenderingContext2D} context - context on which to draw.
   */


  draw(context) {
    /*
     * WARNING: It is *crucial* that this series of instructions be wrapped in
     * save() and restore().
     */
    context.save();
    this[symbols.align](context);
    this[symbols.style](context);
    this[symbols.outline](context);
    this[symbols.marker](context);
    context.restore();
  }
  /**
   * Aligns the drawing context so the outline will be rendered in the correct
   * location with the correct orientation.
   *
   * @param {CanvasRenderingContext2D} context - context on which to draw.
   */


  [symbols.align](context) {
    context.translate(this.x, this.y);
    context.rotate(-this.rotation);
    context.scale(1 / this.scale, 1 / this.scale);
  }
  /**
   * Applies styling to the drawing context.
   *
   * @param {CanvasRenderingContext2D} context - context on which to draw.
   */


  [symbols.style](context) {
    context.globalAlpha = 0.5;
    context.strokeStyle = colours[this.id % colours.length];
    context.fillStyle = context.strokeStyle;
    context.lineWidth = 5;
  }
  /**
   * Draws an outline of the view.
   */


  [symbols.outline](context) {
    context.strokeRect(0, 0, this.width, this.height);
  }
  /**
   * Draws a small triangle in the upper-left corner of the outline, so that
   * other views can quickly tell which way this view is oriented.
   *
   * @param {CanvasRenderingContext2D} context - context on which to draw.
   */


  [symbols.marker](context) {
    const base = context.lineWidth / 2;
    const height = 25;
    context.beginPath();
    context.moveTo(base, base);
    context.lineTo(base, height);
    context.lineTo(height, base);
    context.lineTo(base, base);
    context.fill();
  }

}

module.exports = ShadowView;

},{"../shared.js":157,"core-js/modules/es.symbol.description":89}],156:[function(require,module,exports){
/*
 * WAMS - An API for Multi-Surface Environments
 *
 * Author: Michael van der Kamp
 *  |-> Date: December 2018
 */
'use strict';

const Westures = require('westures');
/**
 * The Transform class is a custom Westures gestures that combines Pan, Rotate,
 * and Scale into one gesture so that the three gestures can be emitted
 * together, reducing jitter.
 *
 * @memberof module:client
 */


class Transform extends Westures.Gesture {
  constructor() {
    super('transform');
    /**
     * The Pinch gesture.
     *
     * @type {Pinch}
     */

    this.pinch = new Westures.Pinch();
    /**
     * The Rotate gesture.
     *
     * @type {Rotate}
     */

    this.rotate = new Westures.Rotate();
    /**
     * The Pan gesture.
     *
     * @type {Pan}
     */

    this.pan = new Westures.Pan({
      muteKey: 'ctrlKey'
    });
  }
  /**
   * Hook for the 'start' phase.
   *
   * @param {State} state
   */


  start(state) {
    this.pinch.start(state);
    this.rotate.start(state);
    this.pan.start(state);
  }
  /**
   * Hook for the 'move' phase.
   *
   * @param {State} state
   */


  move(state) {
    const result = {
      centroid: state.centroid,
      delta: {}
    };
    const pinch_data = this.pinch.move(state);
    const rotate_data = this.rotate.move(state);
    const pan_data = this.pan.move(state);
    let emit = false;

    if (pinch_data) {
      result.delta.scale = pinch_data.scale;
      emit = true;
    }

    if (rotate_data) {
      result.delta.rotation = rotate_data.rotation;
      emit = true;
    }

    if (pan_data) {
      result.delta.translation = pan_data.translation;
      emit = true;
    }

    return emit ? result : null;
  }
  /**
   * Hook for the 'end' phase.
   *
   * @param {State} state
   */


  end(state) {
    this.pinch.end(state);
    this.rotate.end(state);
    this.pan.end(state);
  }
  /**
   * Hook for the 'cancel' phase.
   *
   * @param {State} state
   */


  cancel(state) {
    this.pinch.cancel(state);
    this.rotate.cancel(state);
    this.pan.cancel(state);
  }

}

module.exports = Transform;

},{"westures":137}],157:[function(require,module,exports){
/*
 * Utilities for the WAMS application.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 */

/**
 * This module contains classes and functions intended for use by both the
 * client and the server, in order to provide a common interface.
 *
 * @module shared
 */
'use strict';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const IdStamper = require('./shared/IdStamper.js');

const Message = require('./shared/Message.js');

const Reporters = require('./shared/Reporters.js');

const Utils = require('./shared/utilities.js');

const Polygon2D = require('./shared/Polygon2D.js');

const Point2D = require('./shared/Point2D.js');

const Rectangle = require('./shared/Rectangle.js');
/**
 * This object stores a set of core constants for use by both the client and
 *  the server.
 *
 * @memberof module:shared
 * @enum {number}
 */


const constants = {
  // General constants
  ROTATE_0: 0,
  ROTATE_90: Math.PI / 2,
  ROTATE_180: Math.PI,
  ROTATE_270: Math.PI * 1.5,
  ROTATE_360: Math.PI * 2,
  // Namespaces

  /** @type {string} */
  NS_WAMS: '/wams'
};
/**
 * A list of colours, for use by the API for shadows, and by end-point apps too
 * if desired.
 *
 * @memberof module:shared
 * @type {string[]}
 */

const colours = ['saddlebrown', 'red', 'blue', 'lime', 'darkorange', 'purple', 'yellow', 'aqua', 'darkgreen', 'fuchsia'];
/*
 * Package up the module and freeze it for delivery.
 */

module.exports = Object.freeze(_objectSpread({
  colours,
  constants,
  IdStamper,
  Message,
  Point2D,
  Polygon2D,
  Rectangle
}, Reporters, Utils));

},{"./shared/IdStamper.js":158,"./shared/Message.js":159,"./shared/Point2D.js":160,"./shared/Polygon2D.js":161,"./shared/Rectangle.js":162,"./shared/Reporters.js":164,"./shared/utilities.js":165}],158:[function(require,module,exports){
/*
 * IdStamper utility for the WAMS application.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 *
 * I wrote this generator class to make Id generation more controlled.
 * The class has access to a private (local lexical scope) generator
 *  function and Symbol for generators, and exposes a pair of methods for
 *  stamping new Ids onto objects and cloning previously existing Ids onto
 *  objects.
 */
'use strict';

require("core-js/modules/es.symbol.description");

const {
  defineOwnImmutableEnumerableProperty
} = require('./utilities.js');
/**
 * Generator for integers from 0 to MAX_SAFE_INTEGER.
 *
 * @inner
 * @memberof module:shared.IdStamper
 * @generator
 * @returns {number} Unique integers.
 */


function* id_gen() {
  let next_id = 0;

  while (Number.isSafeInteger(next_id + 1)) yield ++next_id;
}
/**
 * Mark the class instance's generator as not intended for external use.
 *
 * @inner
 * @memberof module:shared.IdStamper
 * @type {Symbol}
 */


const gen = Symbol('gen');
/**
 * Class for stamping and cloning integer IDs. Stamped IDs are unique on a
 * per-IdStamper basis.
 *
 * @example
 * const stamper = new IdStamper();
 * const obj = {};
 * stamper.stampNewId(obj);
 * console.log(obj.id);  // an integer unique to Ids stamped by stamper
 * obj.id = 2;           // has no effect.
 * delete obj.id;        // false
 *
 * const danger = {};
 * stamper.cloneId(danger, obj.id); // Will work. 'danger' & 'obj' are
 *                                  // now both using the same Id.
 *
 * @memberof module:shared
 */

class IdStamper {
  constructor() {
    /**
     * A generator instance that yields unique integers.
     *
     * @type {Generator}
     */
    this[gen] = id_gen();
  }
  /**
   * Stamps an integer ID, unique to this IdStamper, onto the given object.
   *
   * All Ids produced by this method are guaranteed to be unique, on a
   * per-stamper basis. (Two uniquely constructed stampers can and will generate
   * identical Ids).
   *
   * @param {Object} obj - An object onto which an ID will be stamped.
   */


  stampNewId(obj) {
    defineOwnImmutableEnumerableProperty(obj, 'id', this[gen].next().value);
  }
  /**
   * Stamps a clone of the given ID onto the given object.
   *
   * @param {Object} obj - An object onto which an ID will be stamped.
   * @param {number} id - The ID to clone onto obj.
   */


  cloneId(obj, id) {
    if (Number.isSafeInteger(id)) {
      defineOwnImmutableEnumerableProperty(obj, 'id', id);
    }
  }

}

module.exports = IdStamper;

},{"./utilities.js":165,"core-js/modules/es.symbol.description":89}],159:[function(require,module,exports){
/*
 * Shared Message class for the WAMS application.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 *
 * The purpose of this class is to provide a funnel through which all messages
 * between client and server must pass. In concert with the Reporter interface,
 * it allows for a sanity check such that the correct sort of data is getting
 * passed back and forth.
 *
 * Unfortunately this does not provide a strict guarantee that informal and ad
 * hoc messages aren't getting emitted somewhere, so it is up to the programmer
 * to be disciplined and adhere to the Message / Reporter principle.
 */
'use strict';

require("core-js/modules/es.string.includes");

require("core-js/modules/web.dom-collections.iterator");

const {
  defineOwnImmutableEnumerableProperty
} = require('./utilities.js');
/**
 * TYPES is an explicit list of the types of messages that will be passed back
 * and forth. Messages not on this list should be ignored!
 *
 * @enum {string}
 * @readonly
 * @lends module:shared.Message
 */


const TYPES = {
  // For the server to inform about changes to the model

  /** @const */
  ADD_ELEMENT: 'wams-add-element',

  /** @const */
  ADD_IMAGE: 'wams-add-image',

  /** @const */
  ADD_ITEM: 'wams-add-item',

  /** @const */
  ADD_SHADOW: 'wams-add-shadow',

  /** @const */
  RM_ITEM: 'wams-remove-item',

  /** @const */
  RM_SHADOW: 'wams-remove-shadow',

  /** @const */
  UD_ITEM: 'wams-update-item',

  /** @const */
  UD_SHADOW: 'wams-update-shadow',

  /** @const */
  UD_VIEW: 'wams-update-view',
  // For hopefully occasional extra adjustments to objects in the model.

  /** @const */
  RM_ATTRS: 'wams-remove-attributes',

  /** @const */
  SET_ATTRS: 'wams-set-attributes',

  /** @const */
  SET_IMAGE: 'wams-set-image',

  /** @const */
  SET_RENDER: 'wams-set-render',
  // Connection establishment related (disconnect, initial setup)

  /** @const */
  INITIALIZE: 'wams-initialize',

  /** @const */
  LAYOUT: 'wams-layout',

  /** @const */
  FULL: 'wams-full',
  // User event related

  /** @const */
  CLICK: 'wams-click',

  /** @const */
  RESIZE: 'wams-resize',

  /** @const */
  SWIPE: 'wams-swipe',

  /** @const */
  TRACK: 'wams-track',

  /** @const */
  TRANSFORM: 'wams-transform',
  // Multi-device gesture related

  /** @const */
  POINTER: 'wams-pointer',

  /** @const */
  BLUR: 'wams-blur',
  // Page event related

  /** @const */
  IMG_LOAD: 'wams-image-loaded'
};
Object.freeze(TYPES);
const TYPE_VALUES = Object.freeze(Object.values(TYPES));
/**
 * The Message class provides a funnel through which data passed between the
 * client and server must flow.
 *
 * @memberof module:shared
 */

class Message {
  /**
   * If an invalid type is received, throws an exception. If an invalid reporter
   * is received, an exception will not be thrown until 'emitWith()' is called.
   *
   * @param {string} type - The message type. Must be one of the explicitly
   * listed message types available on the Message object.
   * @param {module:shared.Reporter} reporter - A Reporter instance, containing
   * the data to be emitted.
   */
  constructor(type, reporter) {
    if (!TYPE_VALUES.includes(type)) throw 'Invalid message type!';
    this.type = type;
    this.reporter = reporter;
  }
  /**
   * Emits the data contained in the reporter along the channel defined by
   * emitter.
   *
   * @param {Emitter} emitter - An object capable of emitting data packets. Must
   * have an 'emit()' function.
   */


  emitWith(emitter) {
    emitter.emit(this.type, this.reporter.report());
  }

}
/*
 * Only define the messages once, above, and now attach them to the Message
 * Class object for external reference.
 */


Object.entries(TYPES).forEach(([p, v]) => {
  defineOwnImmutableEnumerableProperty(Message, p, v);
});
module.exports = Message;

},{"./utilities.js":165,"core-js/modules/es.string.includes":87,"core-js/modules/web.dom-collections.iterator":90}],160:[function(require,module,exports){
/*
 * WAMS - An API for Multi-Surface Environments
 *
 * Author: Michael van der Kamp
 */
'use strict';
/**
 * Defines a set of basic operations on a point in a two dimensional space.
 *
 * @memberof module:shared
 */

class Point2D {
  /**
   * @param {number} x - x coordinate of the point.
   * @param {number} y - y coordinate of the point.
   */
  constructor(x = 0, y = 0) {
    /**
     * X coordinate of the point.
     *
     * @type {number}
     */
    this.x = x;
    /**
     * X coordinate of the point.
     *
     * @type {number}
     */

    this.y = y;
  }
  /**
   * Add the given point to this point.
   *
   * @param {module:gestures.Point2D} point - The point to add.
   */


  add({
    x = 0,
    y = 0
  }) {
    this.x += x;
    this.y += y;
    return this;
  }
  /**
   * Calculates the angle between this point and the given point.
   *
   * @param {!module:gestures.Point2D} point - Projected point for calculating
   * the angle.
   *
   * @return {number} Radians along the unit circle where the projected
   * point lies.
   */


  angleTo(point) {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }
  /**
   * Determine the average distance from this point to the provided array of
   * points.
   *
   * @param {!module:gestures.Point2D[]} points - the Point2D objects to
   *    calculate the average distance to.
   *
   * @return {number} The average distance from this point to the provided
   *    points.
   */


  averageDistanceTo(points) {
    return this.totalDistanceTo(points) / points.length;
  }
  /**
   * Clones this point.
   *
   * @returns {module:shared.Point2D} An exact clone of this point.
   */


  clone() {
    return new Point2D(this.x, this.y);
  }
  /**
   * Calculates the distance between two points.
   *
   * @param {!module:gestures.Point2D} point - Point to which the distance is
   * calculated.
   *
   * @return {number} The distance between the two points, a.k.a. the
   *    hypoteneuse.
   */


  distanceTo(point) {
    return Math.hypot(point.x - this.x, point.y - this.y);
  }
  /**
   * Divide the point's values by the given amount.
   *
   * @param {number} coefficient - divide x,y by this amount.
   *
   * @return {module:shared.Point2D} this
   */


  divideBy(coefficient = 1) {
    this.x /= coefficient;
    this.y /= coefficient;
    return this;
  }
  /**
   * Tests if a point is Left|On|Right of an infinite line. Assumes that the
   * given points are such that one is above and one is below this point. Note
   * that the semantics of left/right is based on the normal coordinate space,
   * not the y-axis-inverted coordinate space of images and the canvas.
   *
   * @see {@link http://geomalgorithms.com/a03-_inclusion.html}
   *
   * @param {module:shared.Point2D} p0 - first point of the line.
   * @param {module:shared.Point2D} p1 - second point of the line.
   *
   * @return {number} >0 if this point is left of the line through p0 and p1
   * @return {number} =0 if this point is on the line
   * @return {number} <0 if this point is right of the line
   */


  isLeftOf(p0, p1) {
    const dl = p1.minus(p0);
    const dp = this.minus(p0);
    return dl.x * dp.y - dl.y * dp.x;
  }
  /**
   * Subtracts the given point from this point to form a new point.
   *
   * @param {module:shared.Point2D} p - Point to subtract from this point.
   *
   * @return {module:shared.Point2D} A new point which is the simple subraction
   * of the given point from this point.
   */


  minus({
    x = 0,
    y = 0
  }) {
    return new Point2D(this.x - x, this.y - y);
  }
  /**
   * Multiply this point by the given point to form a new point.
   *
   * @param {number} coefficient - Amount by which to multiply the values in
   * this point.
   *
   * @return {module:shared.Point2D} Return a new point, the multiplation of
   * this point by the given amount.
   */


  multiplyBy(coefficient = 1) {
    this.x *= coefficient;
    this.y *= coefficient;
    return this;
  }
  /**
   * Rotate the point by theta radians.
   *
   * @param {number} theta - Amount of rotation to apply, in radians.
   *
   * @return {module:shared.Point2D} this
   */


  rotate(theta = 0) {
    const {
      x,
      y
    } = this;
    const cos_theta = Math.cos(theta);
    const sin_theta = Math.sin(theta);
    this.x = x * cos_theta - y * sin_theta;
    this.y = x * sin_theta + y * cos_theta;
    return this;
  }
  /**
   * Calculates the total distance from this point to an array of points.
   *
   * @param {!module:gestures.Point2D[]} points - The array of Point2D objects
   *    to calculate the total distance to.
   *
   * @return {number} The total distance from this point to the provided points.
   */


  totalDistanceTo(points) {
    return points.reduce((d, p) => d + this.distanceTo(p), 0);
  }
  /**
   * Calculates the midpoint of a list of points.
   *
   * @param {module:gestures.Point2D[]} points - The array of Point2D objects
   *    for which to calculate the midpoint
   *
   * @return {module:gestures.Point2D} The midpoint of the provided points.
   */


  static midpoint(points = []) {
    if (points.length === 0) return null;
    const total = Point2D.sum(points);
    return new Point2D(total.x / points.length, total.y / points.length);
  }
  /**
   * Calculates the sum of the given points.
   *
   * @param {module:gestures.Point2D[]} points - The Point2D objects to sum up.
   *
   * @return {module:gestures.Point2D} A new Point2D representing the sum of the
   * given points.
   */


  static sum(points = []) {
    return points.reduce((total, pt) => total.add(pt), new Point2D(0, 0));
  }

}

module.exports = Point2D;

},{}],161:[function(require,module,exports){
/*
 * WAMS - An API for Multi-Surface Environments
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 */
'use strict';

const Point2D = require('./Point2D.js');
/**
 * A polygon in two dimensions. Can be complex.
 *
 * @memberof module:shared
 * @implements {module:shared.Hitbox}
 */


class Polygon2D {
  /**
   * @param {module:shared.Point2D[]} points - The points that make up the
   * polygon, given in order (clockwise and counter-clockwise are both fine).
   */
  constructor(points) {
    if (points.length < 1) {
      throw new TypeError('A polygon requires at least one vertex.');
    }
    /**
     * A closed list of the points making up this polygon. "Closed" here means
     * that the first and last entries of the list are the same. Closing the
     * polygon in this manner is handled by the constructor.
     *
     * @type {module:shared.Point2D[]}
     */


    this.points = points.map(({
      x,
      y
    }) => new Point2D(x, y));
    /**
     * Store the centroid of the polygon for quick hit tests.
     *
     * @type {module:shared.Point2D[]}
     */

    this.centroid = Point2D.midpoint(this.points);
    /**
     * Save the maximum radius of the polygon for quick hit tests.
     *
     * @type {number}
     */

    this.radius = this.points.reduce((max, point) => {
      const curr = this.centroid.distanceTo(point);
      return max > curr ? max : curr;
    }); // Close the polygon.

    this.points.push(this.points[0].clone());
  }
  /**
   * Determines if a point is inside the polygon.
   *
   * Rules for deciding whether a point is inside the polygon:
   *  1. If it is clearly outside, return false.
   *  2. If it is clearly inside, return true.
   *  3. If it is on a left or bottom edge, return true.
   *  4. If it is on a right or top edge, return false.
   *  5. If it is on a lower-left vertex, return true.
   *  6. If it is on a lower-right, upper-left, or upper-right vertex, return
   *      false.
   *
   * Uses the winding number method for robust and efficient point-in-polygon
   * detection.
   * @see {@link http://geomalgorithms.com/a03-_inclusion.html}
   *
   * @param {module:shared.Point2D[]} p - Point to test.
   *
   * @return {boolean} true if the point is inside the polygon, false otherwise.
   */


  contains(p) {
    if (this.centroid.distanceTo(p) > this.radius) {
      return false;
    }

    return this.winding_number(p) !== 0;
  }
  /**
   * Winding number test for a point in a polygon
   *
   * @see {@link http://geomalgorithms.com/a03-_inclusion.html}
   *
   * @param {module:shared.Point2D[]} point - The point to test.
   *
   * @return {number} The winding number (=0 only when P is outside)
   */


  winding_number(p) {
    let wn = 0;
    const point = new Point2D(p.x, p.y);

    for (let i = 0; i < this.points.length - 1; ++i) {
      if (this.points[i].y <= point.y) {
        if (this.points[i + 1].y > point.y) {
          // Upward crossing
          if (point.isLeftOf(this.points[i], this.points[i + 1]) > 0) {
            ++wn;
          }
        }
      } else {
        if (this.points[i + 1].y <= point.y) {
          // Downward crossing
          if (point.isLeftOf(this.points[i], this.points[i + 1]) < 0) {
            --wn;
          }
        }
      }
    }

    return wn;
  }

}

module.exports = Polygon2D;

},{"./Point2D.js":160}],162:[function(require,module,exports){
/*
 * WAMS - An API for Multi-Surface Environments
 *
 * Author: Michael van der Kamp
 *  |-> Date: July/August 2018
 */
'use strict';
/**
 * A rectangular hitbox. Remember that this rectangle describes the item as if
 * its settings were x=0, y=0, scale=1, rotation=0.
 *
 * @memberof module:shared
 * @implements {module:shared.Hitbox}
 */

class Rectangle {
  /**
   * @param {number} width - The width of the rectangle.
   * @param {number} height - The height of the rectangle.
   * @param {number} [x=0] - The x offset of the rectangle.
   * @param {number} [y=0] - The y offset of the rectangle.
   */
  constructor(width, height, x = 0, y = 0) {
    /**
     * The width of the rectangle.
     *
     * @type {number}
     */
    this.width = width;
    /**
     * The height of the rectangle.
     *
     * @type {number}
     */

    this.height = height;
    /**
     * The x coordinate of the rectangle.
     *
     * @type {number}
     */

    this.x = x;
    /**
     * The y coordinate of the rectangle.
     *
     * @type {number}
     */

    this.y = y;
  }
  /**
   * Determines if a point is inside the rectangle.
   *
   * @param {module:shared.Point2D} point - The point to test.
   *
   * @return {boolean} true if the point is inside the rectangle, false
   * otherwise.
   */


  contains(point) {
    return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
  }

}

module.exports = Rectangle;

},{}],163:[function(require,module,exports){
/*
 * Builds Reporter classes for the WAMS application.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 */
'use strict';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const IdStamper = require('./IdStamper.js');

const STAMPER = new IdStamper();
/**
 * This factory can generate the basic classes that need to communicate
 *  property values between the client and server.
 *
 * @memberof module:shared
 * @param {object} coreProperties - It is the properties defined on this object,
 * properties, and only these properties, which will be report()ed by the
 * reporter. The values provided will be used as the defaults.
 */

function ReporterFactory(coreProperties) {
  const INITIALIZER = Object.freeze(_objectSpread({}, coreProperties));
  const KEYS = Object.freeze(Object.keys(INITIALIZER));
  /**
   * A Reporter regulates communication between client and server by enforcing a
   * strict set of rules over what data can be shared for the given class.
   *
   * @memberof module:shared
   */

  class Reporter {
    /**
     * @param {Object} data - data to store in the reporter. Only properties
     * with keys matching those provided in coreProperties and saved in KEYS
     * will be accepted.
     */
    constructor(data) {
      // Merge the defaults with all the own enumerable properties of 'data'
      // onto the new instance.
      Object.assign(this, INITIALIZER, data); // Special access for coreProperties existing anywhere up the prototype
      // chain of 'data'.

      this.assign(data);
    }
    /**
     * Save onto this Reporter instance the values in data which correspond to
     * properties named in KEYS.
     *
     * @param {Object} data - Data values to attempt to save.
     */


    assign(data = {}) {
      KEYS.forEach(p => {
        if (p in data) this[p] = data[p];
      });
    }
    /**
     * Provide a report of the data saved in this Reporter instance. Only those
     * instance properties which correspond to core properties will be reported.
     *
     * @return {Object} Contains the core properties of this Reporter instance.
     */


    report() {
      const data = {};
      KEYS.forEach(p => {
        data[p] = this[p];
      });
      STAMPER.cloneId(data, this.id);
      return data;
    }

  } // Expose the default settings onto the return class object.


  Reporter.DEFAULTS = Object.freeze(_objectSpread({}, coreProperties));
  return Reporter;
}

module.exports = ReporterFactory;

},{"./IdStamper.js":158}],164:[function(require,module,exports){
/*
 * Reporters for the WAMS application.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 */
'use strict';

const ReporterFactory = require('./ReporterFactory.js');
/**
 * This Item class provides a common interface between the client and the server
 * by which the Items can interact safely.
 *
 * @class Item
 * @memberof module:shared
 * @extends module:shared.Reporter
 */


const Item = ReporterFactory({
  /**
   * X coordinate of the Item.
   *
   * @name x
   * @type {number}
   * @default 0
   * @memberof module:shared.Item
   * @instance
   */
  x: 0,

  /**
   * Y coordinate of the Item.
   *
   * @name y
   * @type {number}
   * @default 0
   * @memberof module:shared.Item
   * @instance
   */
  y: 0,

  /**
   * Rotation of the Item.
   *
   * @name rotation
   * @type {number}
   * @default 0
   * @memberof module:shared.Item
   * @instance
   */
  rotation: 0,

  /**
   * Scale of the Item.
   *
   * @name scale
   * @type {number}
   * @default 1
   * @memberof module:shared.Item
   * @instance
   */
  scale: 1,

  /**
   * Type description of the Item.
   *
   * @name type
   * @type {string}
   * @default 'item/polygonal'
   * @memberof module:shared.Item
   * @instance
   */
  type: 'item/polygonal'
});
/**
 * This WamsElement class provides a common interface between the client and the
 * server by which the elements interact safely.
 *
 * @class WamsElement
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const WamsElement = ReporterFactory({
  /**
   * X coordinate of the WamsElement.
   *
   * @name x
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsElement
   * @instance
   */
  x: 0,

  /**
   * Y coordinate of the WamsElement.
   *
   * @name y
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsElement
   * @instance
   */
  y: 0,

  /**
   * Width of the WamsElement.
   *
   * @name width
   * @type {number}
   * @default 400
   * @memberof module:shared.WamsElement
   * @instance
   */
  width: 400,

  /**
   * Height of the WamsElement.
   *
   * @name height
   * @type {number}
   * @default 300
   * @memberof module:shared.WamsElement
   * @instance
   */
  height: 300,

  /**
   * Rotation of the WamsElement.
   *
   * @name rotation
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsElement
   * @instance
   */
  rotation: 0,

  /**
   * Scale of the WamsElement.
   *
   * @name scale
   * @type {number}
   * @default 1
   * @memberof module:shared.WamsElement
   * @instance
   */
  scale: 1,

  /**
   * Type description of the WamsElement.
   *
   * @name type
   * @type {string}
   * @default 'item/element'
   * @memberof module:shared.WamsElement
   * @instance
   */
  type: 'item/element',

  /**
   * Tag name of the WamsElement.
   *
   * @name tagname
   * @type {string}
   * @default 'div'
   * @memberof module:shared.WamsElement
   * @instance
   */
  tagname: 'div'
});
/**
 * This WamsImage class provides a common interface between the client and the
 * server by which the images can interact safely.
 *
 * @class WamsImage
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const WamsImage = ReporterFactory({
  /**
   * X coordinate of the WamsImage.
   *
   * @name x
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsImage
   * @instance
   */
  x: 0,

  /**
   * Y coordinate of the WamsImage.
   *
   * @name y
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsImage
   * @instance
   */
  y: 0,

  /**
   * Width of the WamsImage.
   *
   * @name width
   * @type {number}
   * @default 400
   * @memberof module:shared.WamsImage
   * @instance
   */
  width: 400,

  /**
   * Height of the WamsImage.
   *
   * @name height
   * @type {number}
   * @default 300
   * @memberof module:shared.WamsImage
   * @instance
   */
  height: 300,

  /**
   * Rotation of the WamsImage.
   *
   * @name rotation
   * @type {number}
   * @default 0
   * @memberof module:shared.WamsImage
   * @instance
   */
  rotation: 0,

  /**
   * Scale of the WamsImage.
   *
   * @name scale
   * @type {number}
   * @default 1
   * @memberof module:shared.WamsImage
   * @instance
   */
  scale: 1,

  /**
   * Type description of the WamsImage.
   *
   * @name type
   * @type {string}
   * @default 'item/image'
   * @memberof module:shared.WamsImage
   * @instance
   */
  type: 'item/image'
});
/**
 * This View class provides a common interface between the client and
 * the server by which the Views can interact safely.
 *
 * @class View
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const View = ReporterFactory({
  /**
   * X coordinate of the View.
   *
   * @name x
   * @type {number}
   * @default 0
   * @memberof module:shared.View
   * @instance
   */
  x: 0,

  /**
   * Y coordinate of the View.
   *
   * @name y
   * @type {number}
   * @default 0
   * @memberof module:shared.View
   * @instance
   */
  y: 0,

  /**
   * Width of the View.
   *
   * @name width
   * @type {number}
   * @default 1600
   * @memberof module:shared.View
   * @instance
   */
  width: 1600,

  /**
   * Height of the View.
   *
   * @name height
   * @type {number}
   * @default 900
   * @memberof module:shared.View
   * @instance
   */
  height: 900,

  /**
   * Type of object.
   *
   * @name type
   * @type {string}
   * @default 'view/background'
   * @memberof module:shared.View
   * @instance
   */
  type: 'view/background',

  /**
   * Scale of the View.
   *
   * @name scale
   * @type {number}
   * @default 1
   * @memberof module:shared.View
   * @instance
   */
  scale: 1,

  /**
   * Rotation of the View.
   *
   * @name rotation
   * @type {number}
   * @default 0
   * @memberof module:shared.View
   * @instance
   */
  rotation: 0
});
/**
 * This class allows generic Input data reporting between client and server.
 * Honestly it's a bit of a cheaty hack around the Message / Reporter protocol,
 * but it simplifies the code and makes things easier to maintain. And honestly
 * the Message / Reporter protocol is mostly focused on protecting Views and
 * Items anyway.
 *
 * @class DataReporter
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const DataReporter = ReporterFactory({
  /**
   * Generic data pass-through.
   *
   * @name data
   * @type {Object}
   * @default null
   * @memberof module:shared.DataReporter
   * @instance
   */
  data: null
});
/**
 * This class allows reporting of the full state of the model, for bringing
 * new clients up to speed (or potentially also for recovering a client, if
 * need be).
 *
 * @class FullStateReporter
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const FullStateReporter = ReporterFactory({
  /**
   * All currently active views.
   *
   * @name views
   * @type {View[]}
   * @default []
   * @memberof module:shared.FullStateReporter
   * @instance
   */
  views: [],

  /**
   * All current items.
   *
   * @name items
   * @type {Item[]}
   * @default []
   * @memberof module:shared.FullStateReporter
   * @instance
   */
  items: [],

  /**
   * The background colour of the workspace.
   *
   * @name color
   * @type {string}
   * @default '#dad1e3'
   * @memberof module:shared.FullStateReporter
   * @instance
   */
  color: '#dad1e3',

  /**
   * The id assigned to this view.
   *
   * @name id
   * @type {number}
   * @default null
   * @memberof module:shared.FullStateReporter
   * @instance
   */
  id: null,

  /**
   * Whether to use server-side gestures.
   *
   * @name useServerGestures
   * @type {boolean}
   * @default false
   * @memberof module:shared.FullStateReporter
   * @instance
   */
  useServerGestures: false
});
/**
 * Enables forwarding of TouchEvents from the client to the server.
 *
 * @class TouchReporter
 * @memberof module:shared
 * @extends module:shared.Reporter
 */

const TouchReporter = ReporterFactory({
  /**
   * The type of event. (e.g. 'pointerdown', 'pointermove', etc.)
   *
   * @name type
   * @type {string}
   * @default null
   * @memberof module:shared.TouchReporter
   * @instance
   */
  type: null,

  /**
   * Array of changed touches.
   *
   * @name changedTouches
   * @type {Touch[]}
   * @default []
   * @memberof module:shared.TouchReporter
   * @instance
   */
  changedTouches: [],

  /**
   * Whether the CTRL key was pressed at the time of the event.
   *
   * @name ctrlKey
   * @type {boolean}
   * @default false
   * @memberof module:shared.TouchReporter
   * @instance
   */
  ctrlKey: false,

  /**
   * Whether the ALT key was pressed at the time of the event.
   *
   * @name altKey
   * @type {boolean}
   * @default false
   * @memberof module:shared.TouchReporter
   * @instance
   */
  altKey: false,

  /**
   * Whether the SHIFT key was pressed at the time of the event.
   *
   * @name shiftKey
   * @type {boolean}
   * @default false
   * @memberof module:shared.TouchReporter
   * @instance
   */
  shiftKey: false,

  /**
   * Whether the META key was pressed at the time of the event.
   *
   * @name metaKey
   * @type {boolean}
   * @default false
   * @memberof module:shared.TouchReporter
   * @instance
   */
  metaKey: false
});
module.exports = {
  Item,
  View,
  DataReporter,
  FullStateReporter,
  TouchReporter,
  WamsElement,
  WamsImage
};

},{"./ReporterFactory.js":163}],165:[function(require,module,exports){
/*
 * Defines a set of general utilities for use across the project.
 *
 * Author: Michael van der Kamp
 * Date: July / August 2018
 */
'use strict';
/**
 * @namespace utilities
 * @memberof module:shared
 */

/**
 * Defines the given property on the given object with the given value, and sets
 * the property to unconfigurable, unwritable, but enumerable.
 *
 * @param {object} obj - The object on which the property will be defined.
 * @param {string} prop - The property to define on obj.
 * @param {any} val - The value to assign to the property.
 *
 * @memberof module:shared.utilities
 */

function defineOwnImmutableEnumerableProperty(obj, prop, val) {
  Object.defineProperty(obj, prop, {
    value: val,
    configurable: false,
    enumerable: true,
    writable: false
  });
}
/**
 * Plain, simple NOP definition. If there's a faster NOP, redefine it here.
 *
 * @memberof module:shared.utilities
 */


const NOP = () => {};
/**
 * Removes the given item from the given array, according to its Id.
 *
 * @memberof module:shared.utilities
 *
 * @param {Object[]} array - The array to modify.
 * @param {Object} item  - The item to remove from array according to its Id.
 *
 * @return {boolean} True if the item was found and removed, false otherwise.
 */


function removeById(array, item) {
  const idx = array.findIndex(o => o.id === item.id);

  if (idx >= 0) {
    array.splice(idx, 1);
    return true;
  }

  return false;
}

module.exports = Object.freeze({
  defineOwnImmutableEnumerableProperty,
  NOP,
  removeById
});

},{}]},{},[147])(147)
});
