class PackIt {
  constructor(el) {
    this.el = el
    this.bindEvents()
    this.pack()
    this.locked = false
  }
  setLock(lock) {
    this.locked = !!lock
  }
  bindEvents() {
    this.el.addEventListener("DOMSubtreeModified", e => this.pack())
    window.addEventListener("resize", e => this.pack())
    if (window.ResizeObserver)
      new ResizeObserver(e => this.pack()).observe(this.el)
  }
  bindEventsForEl(el) {
    if (el.dataset.packitObserving) return
    if (window.ResizeObserver)
      new ResizeObserver(e => this.pack()).observe(el)
    el.dataset.packitObserving = true
  }
  pack() {
    if (this.locked) return;
    this.nodes = Array.from(this.el.children)
      .filter(node => String(node.dataset.packitFixed) == 'true')
      .filter(node => node.offsetParent != null)
      .filter(node => String(node.dataset.packitIgnore) != 'true')
      .map(node => {
        return {
          ...this.getCurrentPositionOf(node),
          ...this.getSizeOf(node),
          packitFixed: true,
        }
      })
    Array.from(this.el.children).forEach(el => this.bindEventsForEl(el))
    this.el.style.position = 'relative'
    Array.from(this.el.children)
      .filter(node => node.offsetParent != null)
      .filter(node => String(node.dataset.packitIgnore) != 'true')
      .filter(node => String(node.dataset.packitFixed) != 'true')
      .forEach(node => {
        const { left, top } = this.getPosition(node)
        node.style.position = 'absolute'
        node.style.left = left + 'px'
        node.style.top = top + 'px'
      })
    this.el.style.height = this.getElHeight() + 'px'
  }
  getElHeight() {
    if (!this.nodes.length) return 0
    const { top } = this.getPaddings(this.el)
    const tallest = this.getSortedNodes().pop()
    return tallest.height + tallest.top + top
  }
  pixelToNumber(px) {
    return Number(px.slice(0, -2)) || 0
  }
  getCurrentPositionOf(el) {
    const style = window.getComputedStyle(el)
    const getPixels = prop => this.pixelToNumber(style[prop])
    const left = getPixels('left')
    const top = getPixels('top')
    return { left, top }
  }
  getSizeOf(el) {
    const style = window.getComputedStyle(el)
    const getPixels = prop => this.pixelToNumber(style[prop])
    const sum = (left, right) => left + right
    const width = ['width', 'margin-left', 'margin-right'].map(getPixels).reduce(sum)
    const height = ['height', 'margin-top', 'margin-bottom'].map(getPixels).reduce(sum)
    return { width, height }
  }
  getInnerSizeOf(el) {
    const style = window.getComputedStyle(el)
    const getPixels = prop => this.pixelToNumber(style[prop])
    const width = getPixels('width')
    const height = getPixels('height')
    return { width, height }
  }
  getPaddings(el) {
    const style = window.getComputedStyle(el)
    const getPixels = prop => this.pixelToNumber(style[prop])
    const left = getPixels('padding-left')
    const top = getPixels('padding-top')
    return { left, top }
  }
  placeFirst(rect, left, top) {
    this.nodes.push({ left, top, ...rect })
    return { left, top }
  }
  getPosition(el) {
    const { width } = this.getInnerSizeOf(this.el)
    const { left, top } = this.getPaddings(this.el)
    const rect = this.getSizeOf(el)
    return this.nodes.filter(node => !node.packitFixed).length == 0 ?
      this.placeFirst(rect, left, top) :
      this.bestPossiblePosition(rect, width)
  }
  bestPossiblePosition(rect, width) {
    const possibilities = this.checkPossibilities(rect, width)
    const highest = this.getHighestMostLeft(possibilities)
    this.nodes.push(highest)
    return highest
  }
  getHighestMostLeft(possibilities) {
    const sorter = (a, b) => (b.top - a.top) * 10 + (b.left - a.left)
    return possibilities.sort(sorter).pop()
  }
  checkPossibilities(rect, width) {
    const possibilities = []
    this.nodes.forEach(node => {
      const horizontal = this.checkHorizontalPossibility(node, rect, width)
      const vertical = this.checkVerticalPossibility(node, rect, width)
      if (horizontal) possibilities.push(horizontal)
      if (vertical) possibilities.push(vertical)
    })
    return possibilities
  }
  checkHorizontalPossibility(node, rect, width) {
    const proposed = {
      left: node.left + node.width,
      top: node.top,
      ...rect
    }
    if (proposed.left + proposed.width <= width) {
      if (!this.collides(proposed)) {
        return proposed
      }
    }
  }
  checkVerticalPossibility(node, rect, width) {
    const proposed = {
      left: node.left,
      top: node.top + node.height,
      ...rect
    }
    if (proposed.left + proposed.width <= width) {
      if (!this.collides(proposed)) {
        return proposed
      }
    }
  }
  collidesWith(node, prop) {
    return !(
      prop.left + prop.width <= node.left ||
      node.left + node.width <= prop.left ||
      prop.top + prop.height <= node.top ||
      node.top + node.height <= prop.top)
  }
  collides(prop) {
    return this.nodes.some(node => this.collidesWith(node, prop))
  }
  getSortedNodes() {
    const sorter = (a, b) => a.top - b.top + a.height - b.height
    return this.nodes.sort(sorter)
  }
}