'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Search,
  UserPlus,
  RefreshCw,
  Edit2,
  Key,
  Ban,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  UserCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
} from 'lucide-react';
import { Role, UserStatus } from '@school-saas/shared';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
  linkedTeacher?: {
    employeeId: string;
    specialization: string | null;
  } | null;
}

interface UserStats {
  totalUsers: number;
  schoolAdmins: number;
  teachers: number;
  staff: number;
  activeUsers: number;
  suspendedUsers: number;
  activeRate: number;
}

export default function UsersPage() {
  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Data
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    schoolAdmins: 0,
    teachers: 0,
    staff: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    activeRate: 0,
  });

  // Loading & Feedback
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Add User Form State
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<Role>(Role.STAFF);

  // Edit User Form State
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<Role>(Role.STAFF);
  const [editStatus, setEditStatus] = useState<UserStatus>(UserStatus.ACTIVE);

  // Reset Password State
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Load User Metrics
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<UserStats>('/api/users/stats');
      if (res?.data) {
        setStats(res.data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Load Users List
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await api.get<any>(`/api/users?${params.toString()}`);
      if (res?.data) {
        setUsers(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
        setTotalRecords(res.data.meta?.total || 0);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addEmail.trim() || !addPassword) {
      setFormError('All fields are required');
      return;
    }
    if (addPassword.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post('/api/users', {
        firstName: addFirstName.trim(),
        lastName: addLastName.trim(),
        email: addEmail.toLowerCase().trim(),
        password: addPassword,
        role: addRole,
      });

      setIsAddModalOpen(false);
      loadUsers();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user account');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditModal = (user: StaffUser) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditRole(user.role);
    setEditStatus(user.status);
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormLoading(true);
    setFormError('');

    try {
      await api.patch(`/api/users/${selectedUser.id}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
        status: editStatus,
      });

      setIsEditModalOpen(false);
      loadUsers();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user account');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: StaffUser) => {
    setSelectedUser(user);
    setResetNewPassword('');
    setFormError('');
    setIsResetModalOpen(true);
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (resetNewPassword.length < 8) {
      setFormError('New password must be at least 8 characters long');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.patch(`/api/users/${selectedUser.id}/reset-password`, {
        newPassword: resetNewPassword,
      });

      setIsResetModalOpen(false);
      alert(`Password for ${selectedUser.email} has been reset successfully.`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to reset password');
    } finally {
      setFormLoading(false);
    }
  };

  // Deactivate User
  const handleDeactivateUser = async (user: StaffUser) => {
    if (!confirm(`Are you sure you want to deactivate account for ${user.fullName}?`)) return;

    try {
      await api.delete(`/api/users/${user.id}`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            <span>Users & Staff Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school staff accounts, role-based access permissions, and account credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadStats();
              loadUsers();
            }}
            title="Refresh Table"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setAddFirstName('');
              setAddLastName('');
              setAddEmail('');
              setAddPassword('');
              setAddRole(Role.STAFF);
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Accounts</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.totalUsers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* School Admins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">School Admins</span>
            <span className="text-2xl font-bold text-purple-600 mt-1 block">{stats.schoolAdmins}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Faculty */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Faculty Teachers</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{stats.teachers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Support Staff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Support Staff</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.staff}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Active Rate</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.activeRate}%</span>
            <span className="text-[11px] text-emerald-600 block">{stats.activeUsers} active</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value={Role.SCHOOL_ADMIN}>School Admin</option>
            <option value={Role.TEACHER}>Faculty Teacher</option>
            <option value={Role.STAFF}>Support Staff</option>
            <option value={Role.SUPER_ADMIN}>Super Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value={UserStatus.ACTIVE}>Active</option>
            <option value={UserStatus.INACTIVE}>Inactive</option>
            <option value={UserStatus.SUSPENDED}>Suspended</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Access</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Linked Profile</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span className="text-xs">Loading staff accounts...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No staff users found</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust search filters or add a new account.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block leading-tight">
                            {u.fullName}
                          </span>
                          <span className="text-xs text-slate-400 block mt-0.5">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {u.role === Role.SUPER_ADMIN && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Super Admin
                        </span>
                      )}
                      {u.role === Role.SCHOOL_ADMIN && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck className="w-3 h-3" />
                          School Admin
                        </span>
                      )}
                      {u.role === Role.TEACHER && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <UserCheck className="w-3 h-3" />
                          Faculty Teacher
                        </span>
                      )}
                      {u.role === Role.STAFF && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Users className="w-3 h-3" />
                          Support Staff
                        </span>
                      )}
                      {u.role === Role.PARENT && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Parent
                        </span>
                      )}
                      {u.role === Role.STUDENT && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Learner
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {u.status === UserStatus.ACTIVE && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      {u.status === UserStatus.INACTIVE && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      )}
                      {u.status === UserStatus.SUSPENDED && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          <AlertCircle className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Linked Teacher Profile */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {u.linkedTeacher ? (
                        <span>
                          EMP: <strong>{u.linkedTeacher.employeeId}</strong>
                          {u.linkedTeacher.specialization && ` (${u.linkedTeacher.specialization})`}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Edit Profile & Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenResetModal(u)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {u.role !== Role.SUPER_ADMIN && (
                          <button
                            onClick={() => handleDeactivateUser(u)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Deactivate Account"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords} accounts
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD STAFF USER ACCOUNT */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Add Staff Account</h3>
                  <p className="text-xs text-slate-500">Create staff or school admin login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria"
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Santos"
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. msantos@stjude.edu.ph"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staff Role *</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value={Role.STAFF}>Support Staff (Cashier, Admissions, Registrar)</option>
                  <option value={Role.TEACHER}>Faculty Teacher</option>
                  <option value={Role.SCHOOL_ADMIN}>School Administrator (Full Tenant Access)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER ROLE & STATUS */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Edit Staff Profile</h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value={Role.STAFF}>Support Staff (Cashier, Admissions, Registrar)</option>
                  <option value={Role.TEACHER}>Faculty Teacher</option>
                  <option value={Role.SCHOOL_ADMIN}>School Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value={UserStatus.ACTIVE}>Active</option>
                  <option value={UserStatus.INACTIVE}>Inactive</option>
                  <option value={UserStatus.SUSPENDED}>Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET PASSWORD */}
      {/* ========================================================================= */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500">{selectedUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter new password (min 8 chars)"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
