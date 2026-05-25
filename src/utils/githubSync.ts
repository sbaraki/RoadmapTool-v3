const GITHUB_API = 'https://api.github.com'
const GIST_FILENAME = 'portfolio-data.json'

export interface SyncResult {
  success: boolean
  error?: string
}

export interface SyncResultWithData extends SyncResult {
  data?: object
  gistId?: string
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

export async function pushToGist(
  data: object,
  token: string,
  gistId?: string,
): Promise<SyncResult & { gistId?: string }> {
  if (!token) {
    return { success: false, error: 'Token is required' }
  }

  try {
    const content = JSON.stringify(data, null, 2)
    const body: Record<string, unknown> = {
      description: `RAM Exhibition Portfolio — synced ${new Date().toLocaleString()}`,
      public: false,
      files: {
        [GIST_FILENAME]: { content },
      },
    }

    if (gistId) {
      const res = await githubFetch(`/gists/${gistId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        return { success: false, error: err.message ?? 'Push failed' }
      }
      return { success: true, gistId }
    } else {
      const res = await githubFetch('/gists', token, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        return { success: false, error: err.message ?? 'Failed to create gist' }
      }
      const gist = await res.json()
      return { success: true, gistId: gist.id }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function pullFromGist(
  token: string,
  gistId: string,
): Promise<SyncResultWithData> {
  if (!token || !gistId) {
    return { success: false, error: 'Token and gist ID are required' }
  }

  try {
    const res = await githubFetch(`/gists/${gistId}`, token)
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: 'Gist not found' }
      }
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return { success: false, error: err.message ?? 'Pull failed' }
    }

    const gist = await res.json()
    const file = gist.files?.[GIST_FILENAME]
    if (!file?.content) {
      return { success: false, error: `No ${GIST_FILENAME} found in gist` }
    }

    const parsed = JSON.parse(file.content)
    return { success: true, data: parsed, gistId }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
