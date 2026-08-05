/**
 * Browser-compatible assert shim for Kepler.gl
 * Node.js의 assert 모듈을 브라우저에서 사용 가능하게 하는 최소한의 polyfill입니다.
 * Kepler.gl 내부에서 (0, _assert["default"])(message) 형태로 호출되므로
 * default export가 함수여야 합니다.
 */
function assert(value, message) {
  if (!value) {
    throw new Error(message || 'Assertion failed');
  }
}

assert.ok = assert;
assert.equal = function (a, b, msg) {
  if (a != b) throw new Error(msg || `Expected ${a} == ${b}`);
};
assert.strictEqual = function (a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${a} === ${b}`);
};
assert.deepEqual = assert.ok;
assert.notEqual = function (a, b, msg) {
  if (a == b) throw new Error(msg || `Expected ${a} != ${b}`);
};

export default assert;
export { assert };
