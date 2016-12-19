module.exports = class Calculator {
  constructor () {
    this._stack = [ ]
  }
  enter (number) {
    this._stack.push(number)
  }
  add () {
    this._stack.push(this._stack.pop() + this._stack.pop())
  }
  get result () {
    return this._stack[this._stack.length - 1]
  }
}
