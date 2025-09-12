// clipboard.js
// 支持按友盟原先逻辑：当 init 返回 clipboardToken，根据 opts.useClipboard 决定是否拷贝

import { copyToClipboard } from './utils.js'

export async function handleClipboard(instanceOpts = {}, solution = {}) {
  // instanceOpts: user options per ULink instance (may provide useClipboard boolean or function)
  // solution: data returned from /deeplink/init, may contain clipboardToken
  try {
    if (!solution || !solution.clipboardToken) return null
    let token = null
    if (instanceOpts.useClipboard === true || typeof instanceOpts.useClipboard === 'undefined') {
      token = solution.clipboardToken
    }
    else if (typeof instanceOpts.useClipboard === 'function') {
      try {
        token = instanceOpts.useClipboard(solution.clipboardToken)
      }
      // eslint-disable-next-line no-unused-vars
      catch (e) {
        token = null
      }
    }
    if (token && typeof token === 'string' && token.length > 0) {
      // copy it
      await copyToClipboard(token)
      return token
    }
  }
  // eslint-disable-next-line no-unused-vars
  catch (e) {
    // swallow errors
  }
  return null
}
