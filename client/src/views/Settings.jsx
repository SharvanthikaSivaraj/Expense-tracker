import { useState } from 'react';
import { changePassword, deleteMe, updateProfile } from '../api';
import { useAuth } from '../auth';

export default function Settings({ dark, onToggleTheme, onOpenPlan }) {
  const { user, setUser, logout } = useAuth();

  // profile
  const [name, setName] = useState(user.name);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileBusy, setProfileBusy] = useState(false);

  // password
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwBusy, setPwBusy] = useState(false);

  // delete account
  const [confirming, setConfirming] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setProfileBusy(true);
    try {
      setUser(await updateProfile(name.trim()));
      setProfileMsg({ type: 'ok', text: 'Profile updated' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pw.next !== pw.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwBusy(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'ok', text: 'Password updated' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwBusy(false);
    }
  }

  async function removeAccount(e) {
    e.preventDefault();
    setDeleteError('');
    setDeleteBusy(true);
    try {
      await deleteMe(deletePw);
      logout();
    } catch (err) {
      setDeleteError(err.message);
      setDeleteBusy(false);
    }
  }

  return (
    <div className="settings">
      <section className="panel">
        <h2>Profile</h2>
        <form className="form" onSubmit={saveProfile} noValidate>
          <div className="field">
            <label htmlFor="s-name">Name</label>
            <input id="s-name" className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-email">Email</label>
            <input id="s-email" className="text-input" value={user.email} disabled />
          </div>
          {profileMsg.text && (
            <div className={`banner ${profileMsg.type === 'ok' ? 'ok' : 'error'}`} role="status">{profileMsg.text}</div>
          )}
          <button type="submit" className="btn primary" disabled={profileBusy || name.trim() === user.name}>
            {profileBusy ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Password</h2>
        <form className="form" onSubmit={savePassword} noValidate>
          <div className="field">
            <label htmlFor="pw-current">Current password</label>
            <input id="pw-current" className="text-input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pw-new">New password</label>
            <input id="pw-new" className="text-input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <span className="muted hint">At least 8 characters, with a letter and a number.</span>
          </div>
          <div className="field">
            <label htmlFor="pw-confirm">Confirm new password</label>
            <input id="pw-confirm" className="text-input" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          {pwMsg.text && <div className={`banner ${pwMsg.type === 'ok' ? 'ok' : 'error'}`} role="status">{pwMsg.text}</div>}
          <button type="submit" className="btn primary" disabled={pwBusy || !pw.current || !pw.next}>
            {pwBusy ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Appearance</h2>
        <div className="setting-row">
          <div>
            <strong>Dark theme</strong>
            <p className="muted">Easier on the eyes in low light.</p>
          </div>
          <button
            type="button"
            className={`switch ${dark ? 'on' : ''}`}
            role="switch"
            aria-checked={dark}
            aria-label="Dark theme"
            onClick={onToggleTheme}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Budgets</h2>
        <div className="setting-row">
          <div>
            <strong>Monthly and category budgets</strong>
            <p className="muted">Set limits, track goals and bills in the Plan page.</p>
          </div>
          <button type="button" className="btn" onClick={onOpenPlan}>Open Plan</button>
        </div>
      </section>

      <section className="panel danger-zone">
        <h2>Account</h2>
        <div className="setting-row">
          <div>
            <strong>Log out</strong>
            <p className="muted">End your session on this device.</p>
          </div>
          <button type="button" className="btn" onClick={logout}>Log out</button>
        </div>
        <hr />
        {!confirming ? (
          <div className="setting-row">
            <div>
              <strong>Delete account</strong>
              <p className="muted">Permanently removes your account and all your transactions.</p>
            </div>
            <button type="button" className="btn danger" onClick={() => setConfirming(true)}>Delete</button>
          </div>
        ) : (
          <form className="form" onSubmit={removeAccount} noValidate>
            <p>This cannot be undone. Enter your password to confirm.</p>
            <input
              className="text-input"
              type="password"
              autoComplete="current-password"
              aria-label="Password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
            />
            {deleteError && <div className="banner error" role="alert">{deleteError}</div>}
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => { setConfirming(false); setDeletePw(''); setDeleteError(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn danger solid" disabled={deleteBusy || !deletePw}>
                {deleteBusy ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
