/* jshint browser: true */

var domify = require('domify')
var tap = require('tap-event')
var clickable = require('clickable')

require('emitter')(exports)

/**
 * Hide the menu when losing focus,
 * specifically outside the input and menu.
 * Note that we don't actually listen to the blur event
 * because the blur event sucks.
 */

exports._onblur = function () {
  var self = this
  var el = this.el
  var menu = this.menu

  document.addEventListener('click', hide, false)
  document.addEventListener('touchstart', hide, false)
  document.addEventListener('focus', hide, true)

  function hide(e) {
    // autocleanup if the element is removed from the document
    // apparently IE11 doesn't like `document.contains()`
    if (!document.body.contains(el)) {
      document.removeEventListener('click', hide, false)
      document.removeEventListener('touchstart', hide, false)
      document.removeEventListener('focus', hide, true)
      return
    }

    if (!clickable(e)) return

    // hide if focusing outside this element and menu
    var target = e.target
    if (target === el
      || target === menu
      || menu.contains(target)) return

    self.hide()
  }
}

/**
 * Setup highlighting and clicking options.
 */

exports._setupoptions = function () {
  var self = this
  var menu = this.menu

  // set an option when the user clicks it or taps it
  menu.addEventListener('touchstart', tap(click), false)
  menu.addEventListener('click', click, false)

  function click(e) {
    if (!clickable(e)) return
    stop(e)
    self.select(self.find(e.target))
  }

  // highlight the currently hovered option
  menu.addEventListener('mousemove', function (e) {
    self.highlight(self.find(e.target))
  })
}

/**
 * You MUST implement this yourself.
 *
 * autocomplete.query = function () {
 *   this.push({
 *     id: '',
 *     title: '',
 *   })
 * }
 *
 * If you don't use `this.push()`, then you should add
 * the options to the menu yourself.
 */

exports.query = function () {
  throw new Error('.query() not implemented!')
}

/**
 * Push a bunch of options.
 *
 * You can push a single item,
 * push an item each as an argument,
 * or push an array of items.
 */

exports.push = function (option) {
  // multiple arguments support
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) this.push(arguments[i])
    return
  } else if (Array.isArray(option)) {
    for (var i = 0; i < option.length; i++) this.push(option[i])
    return
  }

  // convert strings to valid options
  if (typeof option === 'string') {
    option = {
      id: option,
      title: option
    }
  }

  if (!option.id || !(option.title || option.name))
    throw new Error('each option needs a .id and .title/.name')

  var el = this.format(option)
  if (typeof el === 'string') el = domify(el)
  this.formatOption(option, el)
  this.options.push(option)
  this.menu.appendChild(el)
  return option
}

/**
 * Format an option either to a DOM element
 * or to an HTML string.
 *
 * You should overwrite this yourself.
 */

exports.format = function (option) {
  return '<div>'
    + (option.title || option.name || option.id)
    + '</div>'
}

/**
 * Get an option based on an id, element, option object, or index.
 */

exports.get = function (x) {
  if (x == null) return
  var options = this.options
  var option
  for (var i = 0; i < options.length; i++) {
    option = options[i]
    if (option === x
      || option.id === x
      || option.el === x
      || i === x)
      return option
  }
}

function stop(e) {
  e.preventDefault()
  e.stopPropagation()
}