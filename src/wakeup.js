import {
  isWeChat, isQQ, isIos, isAndroid, isChrome, isAlipay, isDingTalk,
} from './env.js'
import { visibility } from './utils.js'

function openByLocation(url) {
  window.location.href = url
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
    const start = Date.now()

    function onSuccessDetected() {
      opened = true
      cleanup()
      resolve({ success: true, reason: 'visibility' })
    }
    const vEvent = visibility.visibilityChange
    if (vEvent) document.addEventListener(vEvent, function onVis() {
      if (document.hidden) {
        onSuccessDetected()
      }
    }, { once: true })

    window.addEventListener('blur', function onBlur() {
      setTimeout(() => {
        if (!opened && (document.hidden || Date.now() - start > 200)) {
          opened = true
          cleanup()
          resolve({ success: true, reason: 'blur' })
        }
      }, 50)
    }, { once: true })

    let timer = setTimeout(() => {
      if (!opened) {
        cleanup()
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
              if (isWeChat() || isQQ()) {
                showBrowserOpenTip()
              }
              else if (solution.downloadUrl) {
                openByLocation(solution.downloadUrl)
              }
            }, { solution, opts })
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
            if (!isWeChat() && !isQQ() && solution.downloadUrl) {
              openByLocation(solution.downloadUrl)
            }
          }
        }
        else {
          if (isWeChat() || isQQ()) {
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
          else if (solution.downloadUrl) {
            openByLocation(solution.downloadUrl)
          }
        }

        if (afterOpenDownload)
          try {
            afterOpenDownload()
          }
          // eslint-disable-next-line no-unused-vars
          catch (e) {
          // ignore
          }
        resolve({ success: false, reason: 'timeout' })
      }
    }, timeout)

    function cleanup() {
      try {
        clearTimeout(timer)
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // ignore
      }
      if (vEvent) {
        try {
          document.removeEventListener(vEvent, onSuccessDetected)
        }
        // eslint-disable-next-line no-unused-vars
        catch (e) {
          // ignore
        }
      }
      try {
        window.removeEventListener('blur', () => {})
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // ignore
      }
    }

    // ----------- 唤端逻辑 -----------
    try {
      const wakeUrl = solution.wakeupUrl || solution.wakeup_url || solution.wakeup || solution.scheme || ''
      const download = solution.downloadUrl || solution.download_url || solution.download
      const type = solution.type || ''
      console.log('tryWakeup', wakeUrl, download, type)
      // 微信或者QQ不走唤醒，直接提示用户使用浏览器打开
      if (isWeChat() || isQQ()) {
        if (proxyOpenDownload) {
          proxyOpenDownload(() => {
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
          }, { solution, opts })
        }
        else {
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
        return
      }

      // iOS universal link
      if (isIos() && wakeUrl && /^https?:\/\//.test(wakeUrl)) {
        openByLocation(wakeUrl)
      }
      // Android Chrome intent
      else if (isAndroid() && isChrome()) {
        const intentUrl = buildIntentURL(solution, download)
        if (intentUrl) openByLocation(intentUrl)
        else if (wakeUrl) openByIframe(wakeUrl)
      }
      // Alipay/DingTalk
      else if (isAlipay() && solution.alipayUrl) {
        openByLocation(solution.alipayUrl)
      }
      else if (isDingTalk() && solution.dingtalkUrl) {
        openByLocation(solution.dingtalkUrl)
      }
      // default scheme
      else if (wakeUrl) {
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(wakeUrl)) {
          if (/^https?:\/\//.test(wakeUrl)) openByLocation(wakeUrl)
          else openByIframe(wakeUrl)
        }
        else {
          openByLocation(wakeUrl)
        }
      }
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
      // ignore runtime open errors
    }
  })
}
