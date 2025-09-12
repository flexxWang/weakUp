export function parseQuery(qs, decode = false) {
  const search = qs === undefined ? (location.search || '').replace(/^\?/, '') : qs.replace(/^\?/, '')
  const parts = search ? search.split('&') : []
  const ret = {}
  for (const p of parts) {
    if (!p) continue
    const [k, ...rest] = p.split('=')
    const v = rest.join('=')
    ret[k] = decode ? decodeURIComponent(v || '') : (v || '')
  }
  return ret
}

export function buildQuery(obj) {
  const arr = []
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
      arr.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(obj[k]))}`)
    }
  }
  return arr.length ? ('?' + arr.join('&')) : ''
}

export function postJSON(url, data = {}, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.timeout = timeout
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const status = xhr.status
          if (status >= 200 && status < 300) {
            const json = JSON.parse(xhr.responseText || '{}')
            resolve(json)
          }
          else {
            reject({ status: xhr.status, response: xhr.responseText })
          }
        }
        catch (err) {
          reject(err)
        }
      }
    }
    xhr.ontimeout = function () {
      reject(new Error('timeout'))
    }
    try {
      xhr.send(JSON.stringify(data))
    }
    catch (e) { reject(e) }
  })
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      try {
        document.execCommand('copy')
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        // ignore
      }
      document.body.removeChild(el)
    })
  }
  else {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    try {
      document.execCommand('copy')
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
      // ignore
    }
    document.body.removeChild(el)
    return Promise.resolve()
  }
}

// visibility helpers (detect page hidden events)
export const visibility = (() => {
  let hidden, visibilityChange
  if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  }
  else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  }
  else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }
  else {
    hidden = null
    visibilityChange = null
  }
  return { hidden, visibilityChange }
})()
