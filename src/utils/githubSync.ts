const GITHUB_API = 'https://api.github.com'

export interface SyncResult {
  success: boolean
  error?: string
}

async function githubFetch(path: string, token: string, options?: RequestInit): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...options?.headers,
    },
  })
}

export async function pushToGithub(
  data: object,
  token: string,
  repo: string,
  filePath: string,
): Promise<SyncResult> {
  if (!token || !repo || !filePath) {
    return { success: false, error: 'Token, repo, and file path are required' }
  }

  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))

    // Try to get existing file to obtain SHA
    let sha: string | undefined
    const getRes = await githubFetch(`/repos/${repo}/contents/${filePath}`, token)
    if (getRes.ok) {
      const existing = await getRes.json()
      sha = existing.sha
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({ message: getRes.statusText }))
      return { success: false, error: err.message ?? 'Failed to check existing file' }
    }

    const res = await githubFetch(`/repos/${repo}/contents/${filePath}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Sync portfolio data ${new Date().toISOString().slice(0, 10)}`,
        content: encoded,
        sha,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return { success: false, error: err.message ?? 'Push failed' }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function pullFromGithub(
  token: string,
  repo: string,
  filePath: string,
): Promise<SyncResult & { data?: object }> {
  if (!token || !repo || !filePath) {
    return { success: false, error: 'Token, repo, and file path are required' }
  }

  try {
    const res = await githubFetch(`/repos/${repo}/contents/${filePath}`, token)

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: 'No synced data found on GitHub' }
      }
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return { success: false, error: err.message ?? 'Pull failed' }
    }

    const json = await res.json()
    const decoded = JSON.parse(decodeURIComponent(escape(atob(json.content))))
    return { success: true, data: decoded }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
