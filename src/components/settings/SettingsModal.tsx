import { useStore } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { PhaseTypeEditor } from './PhaseTypeEditor'
import { GalleryEditor } from './GalleryEditor'

export function SettingsModal() {
  const settingsOpen = useStore(s => s.settingsOpen)
  const setSettingsOpen = useStore(s => s.setSettingsOpen)
  const museumName = useStore(s => s.museumName)
  const setMuseumName = useStore(s => s.setMuseumName)
  const githubToken = useStore(s => s.githubToken)
  const githubGistId = useStore(s => s.githubGistId)
  const syncStatus = useStore(s => s.syncStatus)
  const syncError = useStore(s => s.syncError)
  const setGithubToken = useStore(s => s.setGithubToken)
  const setGithubGistId = useStore(s => s.setGithubGistId)
  const syncToGithub = useStore(s => s.syncToGithub)
  const pullFromGithub = useStore(s => s.pullFromGithub)

  return (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" wide>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-label-md uppercase text-slate-muted mb-2">Organization</h3>
          <Input
            label="Museum / Organization Name"
            value={museumName}
            onChange={e => setMuseumName(e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <PhaseTypeEditor />
        <GalleryEditor />

        <div className="border-t border-outline-variant pt-4">
          <h3 className="text-label-md uppercase text-slate-muted mb-2">GitHub Gist Sync</h3>
          <div className="flex flex-col gap-3">
            <p className="text-body-xs text-slate-muted/80 leading-relaxed">
              Create a <a className="text-secondary underline" href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">GitHub personal access token</a> with <code className="text-mono-data text-xs bg-surface-container px-1 rounded">gist</code> scope. The first push will create a secret gist automatically.
            </p>
            <Input
              label="Personal Access Token"
              type="password"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              placeholder="ghp_..."
            />
            {githubGistId && (
              <Input
                label="Gist ID"
                value={githubGistId}
                onChange={e => setGithubGistId(e.target.value)}
                placeholder="Auto-filled after first push"
              />
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                disabled={!githubToken || syncStatus === 'syncing' || syncStatus === 'pulling'}
                onClick={syncToGithub}
              >
                {syncStatus === 'syncing' ? 'Pushing...' : 'Push to Gist'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!githubToken || !githubGistId || syncStatus === 'syncing' || syncStatus === 'pulling'}
                onClick={pullFromGithub}
              >
                {syncStatus === 'pulling' ? 'Pulling...' : 'Pull from Gist'}
              </Button>
              {syncStatus === 'success' && (
                <span className="text-label-md text-emerald-700">Done</span>
              )}
              {syncStatus === 'error' && (
                <span className="text-label-md text-error truncate max-w-[300px]" title={syncError ?? ''}>
                  {syncError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
