const filterEl = document.getElementsByClassName("filter")[0]
const draculaColors = ['8be9fd', '50fa7b', 'ffb86c', 'ff79c6', 'bd93f9', 'f1fa8c']
const showAll = document.createElement("div")
showAll.innerText = 'ALL'
filterEl.appendChild(showAll)
showAll.addEventListener('click', event => {
  packIt.setLock(true)
  Array.from(packitEl.children).forEach(el => {
    el.dataset.packitIgnore = 'false'
    el.classList.remove('invisible')
    el.classList.add('visible')
  })
  packIt.setLock(false)
  packIt.pack()
})
draculaColors.forEach(color => {
  const colorEl = document.createElement("div")
  colorEl.style.background = '#' + color
  colorEl.dataset.color = '#' + color
  filterEl.appendChild(colorEl)
  colorEl.addEventListener('click', event => {
    packIt.setLock(true)
    Array.from(packitEl.children).forEach(el => {
      const filter = el.dataset.color != colorEl.dataset.color
      el.dataset.packitIgnore = filter
      el.classList.remove(!filter ? 'invisible' : 'visible')
      el.classList.add(filter ? 'invisible' : 'visible')
    })
    packIt.setLock(false)
    packIt.pack()
  })
})
const packitEl = document.getElementsByClassName("packit")[0]
// generate random elements
const randomInt = max => Math.floor(Math.random() * max)
const randomRGB = () => "rgb(" + [255, 255, 255].map(randomInt).join(", ") + ")"
const randomColor = () => '#' + draculaColors[randomInt(draculaColors.length)]
const blockSize = 32
for (let i = 1; i < 100; i++) {
  const el = document.createElement("div")
  const innerEl = document.createElement("div")
  packitEl.appendChild(el)
  el.appendChild(innerEl)
  el.style.width = blockSize * (randomInt(3) + 1) + "px"
  el.style.height = blockSize * (randomInt(3) + 1) + "px"
  el.dataset.color = randomColor()
  el.classList.add('smooth-move')
  innerEl.style.background = el.dataset.color
}
const packIt = new PackIt(packitEl)
document.getElementsByClassName('fixed-block')[0].style.opacity = 1

/* draggable */

const draggableX = () => {

  var container = packitEl
  var activeItem = null;

  var active = false;

  container.addEventListener("touchstart", dragStart, false);
  container.addEventListener("touchend", dragEnd, false);
  container.addEventListener("touchmove", drag, false);

  container.addEventListener("mousedown", dragStart, false);
  container.addEventListener("mouseup", dragEnd, false);
  container.addEventListener("mousemove", drag, false);

  function dragStart(e) {

    if (e.target !== e.currentTarget) {

      active = true;
      packIt.setLock(true)

      // this is the item we are interacting with
      activeItem = e.target.closest('.packit>div');
      activeItem.style['z-index'] = 1;

      if (activeItem !== null) {
        if (!activeItem.xOffset) {
          activeItem.xOffset = activeItem.offsetLeft - container.offsetLeft;
        }

        if (!activeItem.yOffset) {
          activeItem.yOffset = activeItem.offsetTop - container.offsetTop;
        }

        if (e.type === "touchstart") {
          activeItem.initialX = e.touches[0].clientX - activeItem.xOffset;
          activeItem.initialY = e.touches[0].clientY - activeItem.yOffset;
        } else {
          activeItem.initialX = e.clientX - activeItem.xOffset;
          activeItem.initialY = e.clientY - activeItem.yOffset;
        }
      }
    }
  }

  function dragEnd(e) {
    if (activeItem !== null) {
      const { left, top } = getFinalPosition(activeItem.currentX, activeItem.currentY, activeItem)
      activeItem.initialX = left;
      activeItem.initialY = top;
      activeItem.style['z-index'] = 0;
      activeItem.dataset.packitFixed = true
      activeItem.classList.remove("smooth-move")
      activeItem.style.left = left + "px"
      activeItem.style.top = top + "px"
      setTimeout(() => {
        activeItem.classList.add("smooth-move")
        packIt.setLock(false)
        packIt.pack()
        activeItem.dataset.packitFixed = false
        activeItem = null;
        active = false;
      }, .5)
    }
  }

  function drag(e) {
    if (active) {
      if (e.type === "touchmove") {
        e.preventDefault();

        activeItem.currentX = e.touches[0].clientX - activeItem.initialX;
        activeItem.currentY = e.touches[0].clientY - activeItem.initialY;
      } else {
        activeItem.currentX = e.clientX - activeItem.initialX;
        activeItem.currentY = e.clientY - activeItem.initialY;
      }

      activeItem.xOffset = activeItem.currentX;
      activeItem.yOffset = activeItem.currentY;

      setPosition(activeItem.currentX, activeItem.currentY, activeItem);
    }
  }

  function setPosition(xPos, yPos, el) {
    el.classList.remove("smooth-move")
    el.style.left = container.offsetLeft + xPos + "px"
    el.style.top = container.offsetTop + yPos + "px"
    el.classList.add("smooth-move")
  }

  function getFinalPosition(xPos, yPos, el) {
    const left = container.offsetLeft + xPos
    const top = container.offsetTop + yPos
    const style = window.getComputedStyle(el)
    const pixelToNumber = px => Number(px.slice(0, -2)) || 0
    const getPixels = prop => pixelToNumber(style[prop])
    const width = getPixels('width')
    const height = getPixels('height')
    const props = { left, top, width, height }
    const collissions = packIt.nodes.filter(node => packIt.collidesWith(node, props))
    const sorter = (a, b) => (b.top - a.top) * 10 + (b.left - a.left)
    const replaceWith = collissions.sort(sorter).pop()
    return replaceWith
  }

}

const initDraggable = () => {
  const draggable = new Draggable.Draggable(packitEl, {
    draggable: 'div',
    mirror: {
      constrainDimensions: true,
    },
  })
  draggable.on('drag:start', e => {
    const item = e.originalSource.closest('.packit > div')
    item.dataset.packitIgnore = true
    item.style.display = 'none !important'
  });
  draggable.on('drag:move', () => console.log('drag:move'));
  draggable.on('drag:stop', () => console.log('drag:stop'));
}

initDraggable()

Prism.plugins.NormalizeWhitespace.setDefaults(
  {
    'remove-trailing': true,
    'remove-indent': true,
    'left-trim': true,
    'right-trim': true,
    // 'break-lines': 10,
    // 'indent': 2,
    // 'remove-initial-line-feed': false,
    // 'tabs-to-spaces': 4,
    // 'spaces-to-tabs': 4
  });