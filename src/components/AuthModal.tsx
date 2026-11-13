import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';
import type { UserRecord } from '../utils/campusLogic';

export type AuthModalTab = 'student-login' | 'admin-login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: AuthModalTab;
  onClose: () => void;
  user: Omit<UserRecord, 'password_hash'> | null;
  requireEduDomain: boolean;
  onAuthSuccess: (user: Omit<UserRecord, 'password_hash'>) => void;
  onLogoutSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'student-login',
  onClose,
  user,
  requireEduDomain,
  onAuthSuccess,
  onLogoutSuccess,
}) => {
  const [mode, setMode] = useState<AuthModalTab>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [department, setDepartment] = useState('');
  const [studentOrStaffId, setStudentOrStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialTab);
      setError(null);
      if (initialTab === 'admin-login') {
        setEmail('admin@spsu.ac.in');
        setPassword('Admin@123');
      } else if (initialTab === 'student-login') {
        setEmail('student@spsu.ac.in');
        setPassword('Student@123');
      } else {
        setEmail('');
        setPassword('');
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabSwitch = (nextTab: AuthModalTab) => {
    setMode(nextTab);
    setError(null);
    if (nextTab === 'admin-login') {
      setEmail('admin@spsu.ac.in');
      setPassword('Admin@123');
    } else if (nextTab === 'student-login') {
      setEmail('student@spsu.ac.in');
      setPassword('Student@123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleQuickDemoLogin = async (
    demoEmail: string,
    demoPass: string,
    portalRole?: 'student' | 'admin'
  ) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPass, portalRole);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'student-login') {
        const res = await api.login(email, password, 'student');
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'admin-login') {
        const res = await api.login(email, password, 'admin');
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          name,
          email,
          password,
          role,
          department: department || undefined,
          student_or_staff_id: studentOrStaffId || undefined,
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
      onLogoutSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="auth-modal-title" className="text-base font-bold text-slate-900">
              {user
                ? 'SPSU Campus Account & Session'
                : mode === 'admin-login'
                ? 'SPSU Administrator Login'
                : mode === 'student-login'
                ? 'SPSU Student & Staff Login'
                : 'New SPSU Student Registration'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {user
                ? 'Manage your active SPSU session or switch between Student and Admin roles'
                : mode === 'admin-login'
                ? 'Restricted to SPSU Proctor & Campus Security Administrators'
                : requireEduDomain
                ? 'Official SPSU email (@spsu.ac.in) or Enrollment ID'
                : 'Open registration enabled by administrator'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[84vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{user.name}</span>
                  <span className="text-xs font-mono-tabular text-cyan-700 font-semibold uppercase">
                    {user.role}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Email: {user.email}</p>
                  <p>Department: {user.department}</p>
                  {user.student_or_staff_id && (
                    <p className="font-mono-tabular">SPSU ID: {user.student_or_staff_id}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of Current Session
              </button>
            </div>
          ) : (
            <>
              {/* 3-Tab Segmented Selector: Student Login | Admin Login | Register */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('student-login')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'student-login'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('admin-login')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'admin-login'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin Login
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Credentials Hint Banner for Student / Admin Login */}
              {mode === 'student-login' && (
                <div className="p-3 rounded-lg bg-cyan-50/70 border border-cyan-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="text-slate-700">
                    <span className="font-semibold text-slate-900 block">
                      SPSU Student Credentials
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-600">
                      student@spsu.ac.in (or 22CSE1048) / Student@123
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('student@spsu.ac.in');
                      setPassword('Student@123');
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-cyan-300 text-cyan-800 font-semibold text-[11px] hover:bg-cyan-50 shrink-0 cursor-pointer"
                  >
                    Fill Demo
                  </button>
                </div>
              )}

              {mode === 'admin-login' && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="text-slate-700">
                    <span className="font-semibold text-slate-900 block">
                      SPSU Proctor Admin Credentials
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-600">
                      admin@spsu.ac.in (or SPSU-ADM-01) / Admin@123
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@spsu.ac.in');
                      setPassword('Admin@123');
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] hover:bg-amber-50 shrink-0 cursor-pointer"
                  >
                    Fill Admin
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <>
                    <div>
                      <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Piyush Sharma"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="auth-role" className="block text-xs font-semibold text-slate-700 mb-1">
                          SPSU Role
                        </label>
                        <select
                          id="auth-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as 'student' | 'staff')}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        >
                          <option value="student">Student</option>
                          <option value="staff">Faculty / Staff</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="auth-id" className="block text-xs font-semibold text-slate-700 mb-1">
                          Enrollment / Staff ID
                        </label>
                        <input
                          id="auth-id"
                          type="text"
                          value={studentOrStaffId}
                          onChange={(e) => setStudentOrStaffId(e.target.value)}
                          placeholder="e.g. 22CSE1048"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                        School / Department
                      </label>
                      <input
                        id="auth-dept"
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. School of Engineering (B.Tech CSE)"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    {mode === 'admin-login'
                      ? 'Admin Email or Proctor ID'
                      : mode === 'student-login'
                      ? 'SPSU Email or Enrollment No.'
                      : 'Official SPSU Email (@spsu.ac.in)'}
                  </label>
                  <input
                    id="auth-email"
                    type={mode === 'register' ? 'email' : 'text'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      mode === 'admin-login'
                        ? 'admin@spsu.ac.in or SPSU-ADM-01'
                        : 'student@spsu.ac.in or 22CSE1048'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'admin-login'
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : mode === 'admin-login'
                      ? 'Sign In as SPSU Administrator'
                      : mode === 'student-login'
                      ? 'Sign In to Student Portal'
                      : 'Register SPSU Student Account'}
                  </span>
                </button>
              </form>
            </>
          )}

          {/* Quick Role Switcher for Viva / Evaluation */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Instant One-Click Login (Student, Staff &amp; Admin)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('student@spsu.ac.in', 'Student@123', 'student')}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <GraduationCap className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>Student Login: Aarav Sharma (22CSE1048)</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  student@spsu.ac.in
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickDemoLogin('ananya.mewara@spsu.ac.in', 'Student@123', 'student')
                }
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <UserCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>Student Login: Ananya Mewara (23BBA2019)</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  ananya.mewara@spsu.ac.in
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('staff@spsu.ac.in', 'Staff@123')}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <Briefcase className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Staff Login: Vikramaditya Rathore (Library)</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  staff@spsu.ac.in
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('admin@spsu.ac.in', 'Admin@123', 'admin')}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-50/70 text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Admin Login: Dr. Rajeshwar Singh (Proctor)</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-amber-800">
                  admin@spsu.ac.in
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
