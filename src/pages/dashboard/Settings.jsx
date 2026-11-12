import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, KeyRound, Trash2, User } from 'lucide-react';
import { UsersAPI, AuthAPI } from '../../lib/api';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PlanBadge } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate } from '../../lib/format';
import './Dashboard.css';

const SECTIONS = ['Profile', 'Security', 'Danger zone'];

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [section, setSection] = useState('Profile');

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await UsersAPI.update({ name });
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setChangingPw(true);
    try {
      await AuthAPI.changePassword({ current_password: currentPw, new_password: newPw });
      toast.success('Password changed.');
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change password.'));
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await UsersAPI.remove();
      toast.success('Account deleted. We\'re sorry to see you go.');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete account.'));
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Account settings</h1>
          <p>Manage your profile, security, and account preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <nav className="settings-nav">
          {SECTIONS.map((s) => (
            <button key={s} className={section === s ? 'active' : ''} onClick={() => setSection(s)}>{s}</button>
          ))}
        </nav>

        <div>
          {section === 'Profile' && (
            <form className="card card-pad" style={{ maxWidth: 480 }} onSubmit={handleSaveProfile}>
              <div className="flex items-center gap-3 mb-6">
                <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{(user?.name || '?').charAt(0).toUpperCase()}</div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{user?.name}</p>
                  <PlanBadge plan={user?.plan} />
                </div>
              </div>
              <div className="field">
                <label>Full name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Email address</label>
                <input className="input" value={user?.email} disabled />
                <span className="hint">Changing your email requires re-verification.</span>
              </div>
              <div className="field">
                <label>Member since</label>
                <input className="input" value={formatDate(user?.created_at)} disabled />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                <Save size={15} /> {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}

          {section === 'Security' && (
            <form className="card card-pad" style={{ maxWidth: 480 }} onSubmit={handleChangePassword}>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={17} className="text-primary" />
                <h3 style={{ fontSize: 15.5 }}>Change password</h3>
              </div>
              {user?.oauth_provider ? (
                <div className="alert alert-info">You signed up with Google — password changes aren't available for OAuth accounts.</div>
              ) : (
                <>
                  <div className="field">
                    <label>Current password</label>
                    <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>New password</label>
                    <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={changingPw}>
                    {changingPw ? 'Updating…' : 'Update password'}
                  </button>
                </>
              )}
            </form>
          )}

          {section === 'Danger zone' && (
            <div className="card card-pad" style={{ maxWidth: 480, borderColor: 'var(--color-danger)' }}>
              <div className="flex items-center gap-2 mb-3">
                <User size={17} className="text-danger" />
                <h3 style={{ fontSize: 15.5 }}>Delete account</h3>
              </div>
              <p style={{ fontSize: 13, marginBottom: 16 }}>
                This schedules your account, bots, projects, and documents for permanent deletion
                after a 30-day grace period. This cannot be undone.
              </p>
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={15} /> Delete my account
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        message="Your account will be soft-deleted immediately and permanently purged after 30 days. This cannot be undone."
        confirmLabel="Delete account"
        loading={deleting}
      />
    </div>
  );
}
