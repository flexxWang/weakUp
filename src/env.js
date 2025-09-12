// env.js

const UA = navigator.userAgent || ''

export const isWeChat = () => /micromessenger/i.test(UA)
export const isQQ = () => / QQ\/|MQQBrowser/i.test(UA) || /qq\//i.test(UA)
export const isQQBrowser = () => /qqbrowser/i.test(UA)
export const isQzone = () => /qzone\/.*_qz_/i.test(UA)
export const isDingTalk = () => /DINGTALK\/([\d.]+)/i.test(UA)
export const isAlipay = () => /AlipayClient|alipayclient/i.test(UA)
export const isIos = () => /iphone|ipad|ipod/i.test(UA)
export const isAndroid = () => /android/i.test(UA)
export const isChrome = () => /Chrome|CriOS/i.test(UA) && !/Edge/i.test(UA)
export const isSafari = () => /Safari/i.test(UA) && !/Chrome|CriOS/i.test(UA)
export const userAgent = UA

// export helper platform label like original
export function platformLabel() {
  if (isIos()) return 'ios'
  if (isAndroid()) return 'android'
  return 'unknown'
}
