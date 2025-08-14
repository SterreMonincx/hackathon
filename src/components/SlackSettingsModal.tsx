import React, { useEffect, useState } from 'react';

interface SlackSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SlackSettingsModal: React.FC<SlackSettingsModalProps> = ({ open, onClose }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await fetch('/api/slack/config');
        const data = await resp.json();
        setRedirectUri(typeof data.redirectUri === 'string' ? data.redirectUri : 'https://aac34e6af4b7.ngrok-free.app/api/slack/oauth/callback');
      } catch {}
    })();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/slack/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, redirectUri }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Slack Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Slack Client ID</label>
            <input className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="1234567890.1234567890" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Slack Client Secret</label>
            <input className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="xoxb-..." />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Redirect URI</label>
            <input className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm" value={redirectUri} onChange={e => setRedirectUri(e.target.value)} placeholder="https://aac34e6af4b7.ngrok-free.app/api/slack/oauth/callback" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-gray-200">Cancel</button>
          <button disabled={saving} onClick={save} className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default SlackSettingsModal;


