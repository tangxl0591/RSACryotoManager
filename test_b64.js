const b1 = "AAACAGZDYCMNnPvh+5A94AnV7fCFV/+PO0CGQp";
const b2 = "AAIAAHqF8wPn6DCpKL+MupRgKBvOEHlVHwvPpA";
console.log("Correct:", Buffer.from(b1, 'base64').toString('hex'));
console.log("Incorrect:", Buffer.from(b2, 'base64').toString('hex'));
