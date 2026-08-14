import QRCode from 'qrcode'

export function verifyUrl(stamp) {
  return `${window.location.origin}/verify/${stamp}`
}

export async function makeQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 320,
    color: { dark: '#1B1F16', light: '#F7F2E7' }
  })
}
