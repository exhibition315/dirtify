# Dirtify Proxy

A lightweight JavaScript utility to track changes in an object (and its nested objects) using ES6 Proxy. It indicates if an object is "dirty" (i.e., if any of its properties have been modified) and which specific fields were changed.

## Features

*   **Dirty Tracking**: Easily check if an object has been modified via an `isDirty` property.
*   **Field-Specific Changes**: Get a list of modified fields via a `dirtyFields` property.
*   **Nested Object Support**: Tracks changes within nested objects automatically.
*   **ES6 Proxy**: Leverages modern JavaScript Proxy for efficient and non-intrusive change detection.
*   **No Dependencies**: Pure JavaScript, no external libraries needed.

## Installation

```bash
npm install dirtify-proxy
# or
yarn add dirtify-proxy
```

## Usage

```javascript
import dirtify from 'dirtify-proxy';

const originalObject = {
  name: 'John Doe',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'Anytown',
  },
};

const dirtifiedObject = dirtify(originalObject);

console.log(dirtifiedObject.isDirty); // false
console.log(dirtifiedObject.dirtyFields); // {}

dirtifiedObject.age = 31;
console.log(dirtifiedObject.isDirty); // true
console.log(dirtifiedObject.dirtyFields); // { age: true }

dirtifiedObject.address.city = 'Newcity';
console.log(dirtifiedObject.isDirty); // true
console.log(dirtifiedObject.dirtyFields); // { age: true, address: true }

// To see changes within the nested 'address' object:
console.log(dirtifiedObject.address.isDirty); // true (Note: this will be true because the parent proxy is shared)
console.log(dirtifiedObject.address.dirtyFields); // { city: true } (More accurately, check dirtyFields on the parent for nested path)

// Important: 'isDirty' and 'dirtyFields' are special properties
// and cannot be directly set.
// dirtifiedObject.isDirty = false; // This will not change the internal state
```

## How it Works

`dirtify` wraps your object in an ES6 `Proxy`. When a property on the proxied object (or any of its nested objects that are also proxied) is set, the proxy intercepts the operation, marks the object instance as dirty, and records which field was modified.

## License

MIT