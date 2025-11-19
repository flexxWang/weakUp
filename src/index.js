_bindSelector(selector) {
    const handler = (ev) => {
      if (this.lazy && !this.solution) {
        this.start().then(() => this.wakeup({ action: 'click', elementId: ev.target.id, className: ev.target.className }))
      }
      else {
        this.wakeup({ action: 'click', elementId: ev.target.id, className: ev.target.className })
      }
    }
    if (typeof selector === 'string') {
      document.addEventListener('click', (e) => {
        let el = e.target.closest(selector)
        // 用于没有直接点击到目标元素的情况
        if (!el) {
          if(selector.startsWith('#')) {
            el = null
            selector = null
            return;
          }
          const targetSelector = document.querySelector(`#${selector}`)
          // 点击targetSelector 调用handler
          if (targetSelector) {
            handler(e)
          }
          el = null
          selector = null
          return
        }
        while (el && el !== document) {
          try {
            handler(e)
            break
          }

          catch (err) {
            /* ignore invalid selectors */ }
          el = el.parentNode
        }
      }, false)
    }
    else if (selector && selector.addEventListener) {
      selector.addEventListener('click', handler, false)
    }
  }