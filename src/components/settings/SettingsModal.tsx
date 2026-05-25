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
  const cloudEmail = useStore(s => s.cloudEmail)
  const cloudUserEmail = useStore(s => s.cloudUserEmail)
  const cloudUpdatedAt = useStore(s => s.cloudUpdatedAt)
  const cloudStatus = useStore(s => s.cloudStatus)
  const cloudError = useStore(s => s.cloudError)
  const setCloudEmail = useStore(s => s.setCloudEmail)
  const sendCloudMagicLink = useStore(s => s.sendCloudMagicLink)
  const signOutOfCloud = useStore(s => s.signOutOfCloud)
  const backupToCloud = useStore(s => s.backupToCloud)
  const restoreFromCloud = useStore(s => s.restoreFromCloud)

  const cloudBusy = ['loading', 'sending-link', 'backing-up', 'restoring'].includes(cloudStatus)

  function handleRestore() {
    const shouldMerge = window.confirm(
      'Restore cloud scenarios?\n\nOK: Merge cloud scenarios with local scenarios.\nCancel: Replace local scenarios with cloud backup.'
    )
    if (shouldMerge) {
      restoreFromCloud('merge')
    } else if (window.confirm('Replace all local scenarios with the cloud backup? This cannot be undone.')) {
      restoreFromCloud('replace')
    }
  }

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
          <h3 className="text-label-md uppercase text-slate-muted mb-2">Cloud Scenario Backup</h3>
          <div className="flex flex-col gap-3">
            <p className="text-body-xs text-slate-muted/80 leading-relaxed">
              Sign in with an email magic link to back up and restore all local scenarios with Supabase.
            </p>
            {cloudUserEmail ? (
              <div className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm text-slate-text">
                Signed in as <span className="font-medium">{cloudUserEmail}</span>
              </div>
            ) : (
              <Input
                label="Email"
                type="email"
                value={cloudEmail}
                onChange={e => setCloudEmail(e.target.value)}
                placeholder="you@example.com"
              />
            )}
            <div className="flex items-center gap-2 pt-1">
              {cloudUserEmail ? (
                <>
                  <Button variant="primary" size="sm" disabled={cloudBusy} onClick={backupToCloud}>
                    {cloudStatus === 'backing-up' ? 'Backing Up...' : 'Back Up to Cloud'}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={cloudBusy} onClick={handleRestore}>
                    {cloudStatus === 'restoring' ? 'Restoring...' : 'Restore from Cloud'}
                  </Button>
                  <Button variant="ghost" size="sm" disabled={cloudBusy} onClick={signOutOfCloud}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" disabled={!cloudEmail || cloudBusy} onClick={sendCloudMagicLink}>
                  {cloudStatus === 'sending-link' ? 'Sending...' : 'Send Magic Link'}
                </Button>
              )}
            </div>
            {cloudUpdatedAt && (
              <span className="text-label-md text-slate-muted">Last cloud backup: {new Date(cloudUpdatedAt).toLocaleString()}</span>
            )}
            {cloudStatus === 'success' && (
              <span className="text-label-md text-emerald-700">Done</span>
            )}
            {cloudStatus === 'error' && (
              <span className="text-label-md text-error truncate max-w-[420px]" title={cloudError ?? ''}>
                {cloudError}
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
