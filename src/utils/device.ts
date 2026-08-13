function parseUA(ua: string) {
  let browser = 'Inconnu'
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const m = ua.match(/Chrome\/([\d.]+)/)
    browser = m ? `Chrome ${m[1]}` : 'Chrome'
  } else if (ua.includes('Firefox')) {
    const m = ua.match(/Firefox\/([\d.]+)/)
    browser = m ? `Firefox ${m[1]}` : 'Firefox'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const m = ua.match(/Version\/([\d.]+)/)
    browser = m ? `Safari ${m[1]}` : 'Safari'
  } else if (ua.includes('Edg')) {
    const m = ua.match(/Edg\/([\d.]+)/)
    browser = m ? `Edge ${m[1]}` : 'Edge'
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    const m = ua.match(/(?:OPR|Opera)\/([\d.]+)/)
    browser = m ? `Opera ${m[1]}` : 'Opera'
  }

  let os = 'Inconnu'
  if (ua.includes('Windows NT 11')) os = 'Windows 11'
  else if (ua.includes('Windows NT 10')) os = 'Windows 10'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8'
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7'
  else if (ua.includes('Mac OS X')) {
    const m = ua.match(/Mac OS X ([\d_]+)/)
    os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS'
  } else if (ua.includes('Android')) {
    const m = ua.match(/Android ([\d.]+)/)
    os = m ? `Android ${m[1]}` : 'Android'
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const m = ua.match(/OS ([\d_]+)/)
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'
  } else if (ua.includes('Linux')) os = 'Linux'

  return { browser, os }
}

async function getOSFromClientHints(): Promise<string | null> {
  try {
    const uaData = (navigator as any).userAgentData
    if (!uaData) return null
    const platform: string = uaData.platform
    if (platform === 'Windows') {
      const entropy = await uaData.getHighEntropyValues(['platformVersion'])
      const version = entropy.platformVersion as string
      if (version) {
        const major = parseFloat(version)
        if (major >= 13) return 'Windows 11'
        return 'Windows 10'
      }
    }
    if (platform === 'macOS') {
      const entropy = await uaData.getHighEntropyValues(['platformVersion'])
      const version = entropy.platformVersion as string
      return version ? `macOS ${version}` : 'macOS'
    }
    if (platform === 'Linux') return 'Linux'
    if (platform === 'Android') return 'Android'
    if (platform === 'iOS' || platform === 'iPhone' || platform === 'iPad') return 'iOS'
  } catch {}
  return null
}

export async function getDeviceInfo() {
  const ua = navigator.userAgent
  const info = parseUA(ua)

  // Override OS using modern Client Hints API (correctly detects Windows 11)
  const osFromHints = await getOSFromClientHints()
  if (osFromHints) info.os = osFromHints

  return info
}

export async function getPublicIP() {
  try {
    const res = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return data.ip as string
  } catch {
    return undefined
  }
}
