import { platformLabel } from './env.js'
import { handleClipboard } from './clipboard.js'
import { tryWakeup } from './wakeup.js'

export class ULink {
  constructor(opts = {}) {
    this.opts = opts || {}
    this.id = opts.id || ''
    this.data = opts.data || {}
    this.selector = opts.selector || null
    this.timeout = typeof opts.timeout === 'number' ? opts.timeout : 2000
    this.lazy = !!opts.lazy
    this.iosDeepLinksData = opts.iosDeepLinksData || null
    this.androidDeepLinksData = opts.androidDeepLinksData || null
    this.useOpenInBrowerTips = opts.useOpenInBrowerTips
    this.proxyOpenDownload = opts.proxyOpenDownload
    this.beforeOpenDownload = opts.beforeOpenDownload
    this.afterOpenDownload = opts.afterOpenDownload
    this.solution = null
    this._readyCallbacks = []
    if (!this.lazy) {
      this.start()
    }
    if (this.selector) this._bindSelector(this.selector)
  }

  start() {
    console.log('CustomULink start', this.opts)
    const platform = platformLabel()
    const jsonData = platform === 'ios'
      ? this.iosDeepLinksData
      : this.androidDeepLinksData
    return new Promise((resolve, reject) => {
      if (jsonData) {
        const currentLinkData = jsonData.find(item => item.linkId === this.id)
        const solution = { ...currentLinkData }
        // 拼接 opts.data 到 wakeupUrl
        if (solution.wakeupUrl && this.data && Object.keys(this.data).length > 0) {
          const url = new URL(solution.wakeupUrl)
          Object.entries(this.data).forEach(([key, value]) => {
            url.searchParams.set(key, value)
          })
          solution.wakeupUrl = url.toString()
        }

        this.solution = solution
        console.log('found link data', this.solution)

        handleClipboard(this.opts, this.solution).catch(() => {})

        this._readyCallbacks.forEach((cb) => {
          try {
            cb(null, this.solution)
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
            // ignore
          }
        })
        this._readyCallbacks.length = 0
        resolve(this.solution)
      }
      else {
        this._readyCallbacks.forEach((cb) => {
          try {
            cb(new Error('init_failed'), null)
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
            // ignore
          }
        })
        this._readyCallbacks.length = 0
        reject(new Error('empty_data'))
      }
    })
  }

  ready(fn) {
    if (this.solution) {
      fn(null, this.solution)
    }
    else {
      this._readyCallbacks.push(fn)
    }
  }

  async wakeup(opts = {}) {
    const merged = Object.assign({}, {
      timeout: this.timeout,
      proxyOpenDownload: this.proxyOpenDownload,
      beforeOpenDownload: this.beforeOpenDownload,
      afterOpenDownload: this.afterOpenDownload,
      useOpenInBrowerTips: this.useOpenInBrowerTips,
    }, opts)

    if (!this.solution) {
      await this.start()
      return await tryWakeup(this.solution, merged)
    }
    return tryWakeup(this.solution, merged)
  }

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
      document.addEventListener('click', function (e) {
        let el = e.target.closest(selector)
        while (el && el !== document) {
          try {
            handler(e)
            break
          }
          // eslint-disable-next-line no-unused-vars
          catch (err) { /* ignore invalid selectors */ }
          el = el.parentNode
        }
      }, false)
    }
    else if (selector && selector.addEventListener) {
      selector.addEventListener('click', handler, false)
    }
  }
}

export function startULink(instances = []) {
  const objs = []
  if (!Array.isArray(instances)) instances = [instances]
  for (const cfg of instances) {
    const inst = new ULink(cfg)
    objs.push(inst)
  }
  return objs
}

export default {
  ULink,
  startULink,
}
