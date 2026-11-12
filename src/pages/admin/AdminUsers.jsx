import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { AdminAPI } from '../../lib/adminApi';
import { PageLoader, PlanBadge, EmptyState } from '../../components/ui/Primitives';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate } from '../../lib/format';
import '../dashboard/Dashboard.css';

const PAGE_SIZE = 50;
const PLANS = ['free', 'pro', 'enterprise'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('');
  const [planModalUser, setPlanModalUser] = useState(null);
  const [newPlan, setNewPlan] = useState('free');
  const [savingPlan, setSavingPlan] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await AdminAPI.listUsers({
        page,
        limit: PAGE_SIZE,
        ...(planFilter ? { plan: planFilter } : {}),
      });
      setUsers(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, planFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPlanModal = (user) => {
    setPlanModalUser(user);
    setNewPlan(user.plan);
  };

  const handleSetPlan = async () => {
    setSavingPlan(true);
    try {
      await AdminAPI.setPlan(planModalUser.id, newPlan);
      toast.success(`${planModalUser.email} moved to ${newPlan}.`);
      setUsers((prev) => prev.map((u) => (u.id === planModalUser.id ? { ...u, plan: newPlan } : u)));
      setPlanModalUser(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update plan.'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await AdminAPI.deleteUser(deleteTarget.id);
      toast.success(`${deleteTarget.email} was soft-deleted.`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete user.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>All registered users via <code>GET /admin/users</code>. Soft-deleted users are excluded.</p>
        </div>
        <div className="page-header-actions">
          <select className="select" style={{ width: 160 }} value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}>
            <option value="">All plans</option>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading users…" />
      ) : users.length === 0 ? (
        <div className="card"><EmptyState title="No users found" description="Try a different plan filter or page." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Verified</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><PlanBadge plan={u.plan} /></td>
                  <td>
                    {u.is_verified ? (
                      <span className="badge badge-success"><ShieldCheck size={11} /> Verified</span>
                    ) : (
                      <span className="badge badge-warning"><ShieldOff size={11} /> Unverified</span>
                    )}
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => openPlanModal(u)}>Change plan</button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteTarget(u)} title="Delete user">
                        <Trash2 size={14} className="text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4" style={{ justifyContent: 'center' }}>
        <button className="btn btn-outline btn-sm btn-icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 13 }}>Page {page}</span>
        <button className="btn btn-outline btn-sm btn-icon" onClick={() => setPage((p) => p + 1)} disabled={users.length < PAGE_SIZE}>
          <ChevronRight size={15} />
        </button>
      </div>

      <Modal
        open={!!planModalUser}
        onClose={() => setPlanModalUser(null)}
        title={`Change plan — ${planModalUser?.email || ''}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setPlanModalUser(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSetPlan} disabled={savingPlan}>
              {savingPlan ? 'Saving…' : 'Save plan'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>New plan</label>
          <select className="select" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="hint">Calls POST /admin/users/{'{id}'}/set-plan — bypasses billing entirely.</span>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Soft-delete this user?"
        message={`This sets deleted_at on ${deleteTarget?.email}. It does not immediately purge their data.`}
        confirmLabel="Delete user"
        loading={deleting}
      />
    </div>
  );
}