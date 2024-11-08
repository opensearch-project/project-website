/**
 * Animate scroll to top button in/off view
 */

(() => {
    let button = document.querySelector('.btn-scroll-top'),
      scrollOffset = 500
  
    if (button === null) return
  
    let offsetFromTop = parseInt(scrollOffset, 10),
      progress = button.querySelector('svg rect'),
      length = progress.getTotalLength()
  
    progress.style.strokeDasharray = length
    progress.style.strokeDashoffset = length
  
    const showProgress = () => {
      let scrollPosition = window.pageYOffset,
        scrollHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight,
        scrollPercent = scrollPosition / scrollHeight || 0,
        draw = length * scrollPercent
      progress.style.strokeDashoffset = length - draw
    }
  
    const handleScroll = () => {
      const toggleButtonVisibility = () => {
        if (window.pageYOffset > offsetFromTop) {
          button.classList.add('show')
        } else {
          button.classList.remove('show')
        }
      }
  
      const throttledToggleButtonVisibility = throttle(
        toggleButtonVisibility,
        100
      )
  
      throttledToggleButtonVisibility()
      showProgress()
    }
  
    const throttle = (callback, delay) => {
      let timeoutId = null
      return function () {
        if (timeoutId === null) {
          timeoutId = setTimeout(() => {
            callback.apply(null, arguments)
            timeoutId = null
          }, delay)
        }
      }
    }
  
    window.addEventListener('scroll', handleScroll)
  })()