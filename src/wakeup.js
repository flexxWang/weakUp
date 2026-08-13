import {
  isWeChat, isQQ, isIos, isAndroid, isChrome, isAlipay, isDingTalk,
} from './env.js'
import { visibility } from './utils.js'

function openByLocation(url) {
  if (!url) return false
  try {
    const target = new URL(url, window.location.href).href
    const current = new URL(window.location.href).href
    if (target === current) return false
    window.location.href = target
    return true
  }
  // eslint-disable-next-line no-unused-vars
  catch (e) {
    // ignore invalid urls
    return false
  }
}
function isSameUrl(left, right) {
  if (!left || !right) return false
  try {
    return new URL(left, window.location.href).href === new URL(right, window.location.href).href
  }
  // eslint-disable-next-line no-unused-vars
  catch (e) {
    return left === right
  }
}
function isHttpUrl(url) {
  return /^https?:\/\//.test(url || '')
}
function isSchemeUrl(url) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url || '')
}
function isSameHttpPath(left, right) {
  if (!left || !right) return false
  try {
    const l = new URL(left, window.location.href)
    const r = new URL(right, window.location.href)
    return /^https?:$/.test(l.protocol) && /^https?:$/.test(r.protocol)
      && l.origin === r.origin
      && l.pathname === r.pathname
  }
  // eslint-disable-next-line no-unused-vars
  catch (e) {
    return false
  }
}
function resolveSolutionDownload(solution = {}) {
  return solution.downloadUrl || solution.download_url || solution.download || ''
}
function openByIframe(url) {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = url
  document.body.appendChild(iframe)
  setTimeout(() => {
    try {
      document.body.removeChild(iframe)
    }
    // eslint-disable-next-line no-unused-vars
    catch (_e) {
    // 忽略异常
    }
  }, 2000)
}
function buildIntentURL(solution, fallback) {
  try {
    if (!solution) return null
    const wake = solution.wakeupUrl || ''
    if (/^intent:/.test(wake)) return wake
    const m = wake.match(/^([a-zA-Z0-9.+-]+):\/\/(.*)/)
    const scheme = m ? m[1] : (solution.scheme ? solution.scheme.split('://')[0] : null)
    const hostPath = m ? m[2] : (solution.hostPath || '')
    const pkg = solution.package || ''
    const fb = encodeURIComponent(fallback || solution.downloadUrl || '')
    if (!scheme || !pkg) {
      return null
    }
    return `intent://${hostPath}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${fb};end`
  }
  // eslint-disable-next-line no-unused-vars
  catch (e) {
    return null
  }
}

function showBrowserOpenTip(customHtml) {
  if (document.getElementById('__um_open_in_browser_tip')) return
  const div = document.createElement('div')
  div.id = '__um_open_in_browser_tip'
  div.style.cssText = 'position:fixed;left:0;top:0;background:rgba(0,0,0,0.8);width:100%;height:100%;z-index:19910324;'
  const box = document.createElement('div')
  box.innerHTML = customHtml || '<div style="text-align:right; margin-top:2%; margin-right:5%;"><img style="width:90%; margin:0 auto;" src="//gw.alicdn.com/imgextra/i4/O1CN01UErd1C1xDN2zSmD5r_!!6000000006409-2-tps-1216-226.png"></div>'
  div.appendChild(box)
  document.body.appendChild(div)
  const btn = document.getElementById('__um_open_in_browser_ok')
  if (btn) btn.addEventListener('click', () => {
    try {
      document.body.removeChild(div)
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
      // ignore
    }
  })
}

/**
 * @description 尝试唤醒app
 * @param {Object} solution
 * @param {Object} opts
 * @param {number} opts.timeout
 * @param {function} opts.proxyOpenDownload
 * @param {function} opts.beforeOpenDownload
 * @param {function} opts.afterOpenDownload
 * @param {function} opts.useOpenInBrowerTips
 * @returns {Promise<{success: boolean, reason: string}>}
 */
export function tryWakeup(solution = {}, opts = {}) {
  const timeout = typeof opts.timeout === 'number' ? opts.timeout : 2000
  const proxyOpenDownload = typeof opts.proxyOpenDownload === 'function' ? opts.proxyOpenDownload : null
  const beforeOpenDownload = typeof opts.beforeOpenDownload === 'function' ? opts.beforeOpenDownload : null
  const afterOpenDownload = typeof opts.afterOpenDownload === 'function' ? opts.afterOpenDownload : null
  const useOpenInBrowerTips = opts.useOpenInBrowerTips

  return new Promise((resolve) => {
    let opened = false
    let settled = false
    let fallbackOpened = false
    let defaultFallbackOpened = false
    let timer = null
    let blurTimer = null
    const openedLocationUrls = new Set()
    const start = Date.now()
    const vEvent = visibility.visibilityChange

    function cleanup() {
      try {
        clearTimeout(timer)
        clearTimeout(blurTimer)
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // ignore
      }
      if (vEvent) {
        try {
          document.removeEventListener(vEvent, onVis)
        }
        // eslint-disable-next-line no-unused-vars
        catch (e) {
          // ignore
        }
      }
      try {
        window.removeEventListener('blur', onBlur)
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // ignore
      }
    }

    function settle(result) {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }

    function onSuccessDetected() {
      opened = true
      settle({ success: true, reason: 'visibility' })
    }

    function onVis() {
      if (document.hidden) {
        onSuccessDetected()
      }
    }

    function onBlur() {
      blurTimer = setTimeout(() => {
        if (!opened && (document.hidden || Date.now() - start > 200)) {
          opened = true
          settle({ success: true, reason: 'blur' })
        }
      }, 50)
    }

    function openLocationOnce(url) {
      if (!url) return false
      let target = url
      try {
        target = new URL(url, window.location.href).href
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // keep original url
      }
      if (openedLocationUrls.has(target)) return false
      openedLocationUrls.add(target)
      return openByLocation(target)
    }

    function showOpenInBrowserTip() {
      if (typeof useOpenInBrowerTips === 'function') {
        try {
          useOpenInBrowerTips()
        }
        // eslint-disable-next-line no-unused-vars
        catch (e) {
          showBrowserOpenTip()
        }
      }
      else {
        showBrowserOpenTip()
      }
    }

    function openDefaultFallback(download, wakeUrl) {
      if (defaultFallbackOpened) return
      defaultFallbackOpened = true
      if (isWeChat() || isQQ()) {
        showOpenInBrowserTip()
      }
      else if (download && !isSameUrl(download, wakeUrl) && !isSameHttpPath(download, wakeUrl)) {
        openLocationOnce(download)
      }
    }

    function openFallback(action) {
      if (fallbackOpened) return
      fallbackOpened = true
      action()
    }

    function runFallback(download, wakeUrl) {
      openFallback(() => {
        if (beforeOpenDownload) try {
          beforeOpenDownload()
        }
        // eslint-disable-next-line no-unused-vars
        catch (e) {
          // ignore
        }

        if (proxyOpenDownload) {
          try {
            proxyOpenDownload(() => {
              openDefaultFallback(download, wakeUrl)
            }, { solution, opts })
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
            openDefaultFallback(download, wakeUrl)
          }
        }
        else {
          openDefaultFallback(download, wakeUrl)
        }

        if (afterOpenDownload)
          try {
            afterOpenDownload()
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
          // ignore
          }
      })
    }

    try {
      if (vEvent) document.addEventListener(vEvent, onVis, { once: true })
      window.addEventListener('blur', onBlur, { once: true })
    }
    catch (error) {
      settle({ success: false, reason: 'error', error })
      return
    }

    timer = setTimeout(() => {
      if (!opened) {
        const wakeUrl = solution.wakeupUrl || solution.wakeup_url || solution.wakeup || solution.scheme || ''
        const download = resolveSolutionDownload(solution)
        runFallback(download, wakeUrl)
        settle({ success: false, reason: 'timeout' })
      }
    }, timeout)

    // ----------- 唤端逻辑 -----------
    try {
      const wakeUrl = solution.wakeupUrl || solution.wakeup_url || solution.wakeup || solution.scheme || ''
      const download = resolveSolutionDownload(solution)
      const type = solution.type || ''
      console.log('tryWakeup', wakeUrl, download, type)
      // 微信或者QQ不走唤醒，直接提示用户使用浏览器打开
      if (isWeChat() || isQQ()) {
        runFallback(download, wakeUrl)
        return
      }

      // iOS universal link
      if (isIos() && wakeUrl && isHttpUrl(wakeUrl)) {
        openLocationOnce(wakeUrl)
      }
      // Android Chrome intent
      else if (isAndroid() && isChrome()) {
        const intentUrl = buildIntentURL(solution, download)
        if (intentUrl) openLocationOnce(intentUrl)
        else if (wakeUrl) openByIframe(wakeUrl)
      }
      // Alipay/DingTalk
      else if (isAlipay() && solution.alipayUrl) {
        openLocationOnce(solution.alipayUrl)
      }
      else if (isDingTalk() && solution.dingtalkUrl) {
        openLocationOnce(solution.dingtalkUrl)
      }
      // default scheme
      else if (wakeUrl) {
        if (isSchemeUrl(wakeUrl)) {
          if (isHttpUrl(wakeUrl)) openLocationOnce(wakeUrl)
          else openByIframe(wakeUrl)
        }
        else {
          openLocationOnce(wakeUrl)
        }
      }
    }
    catch (error) {
      settle({ success: false, reason: 'error', error })
    }
  })
}
