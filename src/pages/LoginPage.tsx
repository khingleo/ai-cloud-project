/**
 * MTN GHANA EBU — LOGIN / REGISTER PAGE
 *
 * Login and verification share the same card; verification replaces the form inline.
 *
 *  LOGIN FLOW
 *   "auth"  → Email-only card (Sign In tab)
 *   "otp"   → OTP verification form inside the auth card
 *
 *  REGISTER FLOW
 *   "auth"  → Registration form (Create Account tab)
 *   "otp"   → Same OTP verification page (slides in after account created)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck, LogIn, Loader2,
  Zap, Users, BarChart3, Network, ArrowRight,
  Cpu, Globe, Lock, Mail, ChevronLeft,
  CheckCircle2, AlertTriangle, UserPlus, Building2,
  Phone, RefreshCw, Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Static hero ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Users,     label: 'Customer 360°' },
  { icon: BarChart3, label: 'Revenue Analytics' },
  { icon: Network,   label: 'Network Config' },
  { icon: Cpu,       label: 'AI Assistant' },
  { icon: Globe,     label: 'Global Search' },
  { icon: Lock,      label: 'Role-Based Access' },
];

const WORKFLOW_STEPS = [
  'Customer', 'Lead', 'Opportunity', 'Presales',
  'Approval', 'Service Delivery', 'Active Service',
];

type Mode = 'login' | 'register';
type View = 'auth' | 'otp';   // which form is visible inside the auth card
const RESEND_COOLDOWN_SECONDS = 6;

// ─── OTP 6 boxes ──────────────────────────────────────────────────────────────
const OtpBoxes: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const refs   = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  const commit = (i: number, char: string) => {
    const next = [...digits];
    next[i] = char || ' ';
    onChange(next.join(''));
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; onChange(n.join('')); }
      else if (i > 0) refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p) {
      onChange(p.padEnd(6, ' ').slice(0, 6));
      refs.current[Math.min(p.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="grid w-full grid-cols-6 gap-1.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i] || ''}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => commit(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-full min-w-0 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2
            text-slate-900 lg:text-white focus:outline-none transition-all duration-150 caret-transparent
            disabled:opacity-30 select-none
            ${digits[i]
              ? 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-400/10 lg:bg-yellow-400/15 lg:border-yellow-400'
              : 'bg-slate-50 border-slate-300 focus:border-yellow-500 focus:bg-yellow-50 lg:bg-white/5 lg:border-white/15 lg:focus:border-yellow-400/70 lg:focus:bg-yellow-400/8'
            }`}
        />
      ))}
    </div>
  );
};

// ─── Hero left panel (reused on both views) ───────────────────────────────────
const HeroPanel: React.FC = () => (
  <div className="login-hero-enter hidden lg:flex lg:w-[55%] xl:w-[58%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">
    {/* Orbs */}
    <div className="pointer-events-none absolute inset-0">
      <div className="animate-orb-purple absolute -top-40 -left-40 w-[540px] h-[540px] rounded-full bg-purple-600/18 blur-3xl" />
      <div className="animate-orb-blue   absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full bg-blue-600/18 blur-3xl" />
      <div className="animate-brand-glow absolute top-1/2 left-1/2 w-[280px] h-[280px] rounded-full bg-yellow-400/6 blur-2xl" />
    </div>
    <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-35" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

    {/* Logo */}
    <div className="login-hero-brand-enter relative z-10 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-xl shadow-yellow-400/25 shrink-0">
        <ShieldCheck className="w-5 h-5 text-black" />
      </div>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-yellow-400 leading-none">MTN Ghana · EBU</p>
        <p className="text-[10px] text-slate-600 mt-0.5 leading-none">Enterprise Business Unit</p>
      </div>
    </div>

    {/* Headline */}
    <div className="login-hero-copy-enter relative z-10 space-y-8">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold">
          <Zap className="w-3.5 h-3.5" /> AI-Powered Cloud Repository
        </div>
        <h1 className="text-[2.6rem] xl:text-[3.1rem] font-extrabold text-white leading-[1.08] tracking-tight font-heading">
          Enterprise<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">
            Service & Customer
          </span><br />Management
        </h1>
        <p className="text-[13px] text-slate-400 leading-relaxed max-w-[400px]">
          A unified platform for MTN Ghana's Enterprise Business Unit — managing customers, subscriptions, billing, presales, approvals and network configurations from one secure repository.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className="glass-card-border flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
              <Icon className="w-3 h-3 text-yellow-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-300 leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">End-to-End Business Workflow</p>
        <div className="flex items-center flex-wrap gap-1.5">
          {WORKFLOW_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 rounded-lg bg-white/4 border border-white/7">{s}</span>
              {i < WORKFLOW_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>

    <p className="login-hero-footer-enter relative z-10 text-[11px] text-slate-700">© 2026 MTN Ghana · Enterprise Business Unit · All rights reserved</p>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { sendLoginOtp, verifyLoginOtp, sendSignupOtp, verifySignupOtp } = useAuth();

  // Which full view is showing
  const [view, setView]   = useState<View>('auth');
  const [mode, setMode]   = useState<Mode>('login');

  // Login fields
  const [loginEmail, setLoginEmail]     = useState('');

  // Register fields
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regDept, setRegDept]           = useState('');
  const [regPhone, setRegPhone]         = useState('');

  // OTP
  const [otp, setOtp]                   = useState('');
  const [otpEmail, setOtpEmail]         = useState('');   // which email OTP was sent to
  const [otpMode, setOtpMode]           = useState<Mode>('login'); // login or register OTP
  const [otpMsg, setOtpMsg]             = useState('');
  const [smtpWarn, setSmtpWarn]         = useState(false);

  // Shared
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [resend, setResend]             = useState(0);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const e = () => setError(null);

  const cooldownFromError = (message: string) => {
    const match = message.match(/after\s+(\d+)\s+seconds?/i);
    return match ? Math.max(1, Number(match[1])) : 0;
  };

  const switchMode = (m: Mode) => {
    setMode(m); setError(null); setOtp('');
    setLoginEmail('');
    setRegName(''); setRegEmail(''); setRegDept(''); setRegPhone('');
  };

  const goToOtp = (email: string, m: Mode, message: string, warn: boolean) => {
    setOtpEmail(email);
    setOtpMode(m);
    setOtpMsg(message);
    setSmtpWarn(warn);
    setOtp('');
    setError(null);
    setResend(RESEND_COOLDOWN_SECONDS);
    setView('otp');
  };

  const backToAuth = () => {
    setView('auth');
    setOtp('');
    setError(null);
  };

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault(); e();
    const em = loginEmail.trim().toLowerCase();
    if (!em.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    const result = await sendLoginOtp(em);
    setLoading(false);
    if (!result.success) {
      const message = result.error || 'Failed to send OTP.';
      setResend(cooldownFromError(message));
      setError(message);
      return;
    }
    goToOtp(em, 'login', result.message || '', !!result.smtpWarning);
  };

  // ── Register submit ───────────────────────────────────────────────────────
  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault(); e();
    if (!regName.trim()) { setError('Full name is required.'); return; }
    const em = regEmail.trim().toLowerCase();
    if (!em.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    const result = await sendSignupOtp({
      name: regName.trim(),
      email: em,
      department: regDept.trim() || 'Enterprise Business Unit',
      phone: regPhone.trim(),
    });
    setLoading(false);
    if (!result.success) {
      const message = result.error || 'Failed to send OTP.';
      setResend(cooldownFromError(message));
      setError(message);
      return;
    }
    goToOtp(em, 'register', result.message || '', !!result.smtpWarning);
  };

  // ── OTP verify ────────────────────────────────────────────────────────────
  const handleOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const code = otp.replace(/\D/g, '');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    e(); setLoading(true);
    let err: string | null = null;
    if (otpMode === 'login') {
      err = await verifyLoginOtp(otpEmail, code);
    } else {
      err = await verifySignupOtp({
        name: regName.trim(),
        email: otpEmail,
        code,
        department: regDept.trim() || 'Enterprise Business Unit',
        phone: regPhone.trim() || '+233 24 000 0000',
      });
    }
    setLoading(false);
    if (err) setError(err);
    // success → AuthContext sets user → App.tsx redirects
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resend > 0) return;
    e(); setLoading(true);
    const result = otpMode === 'login'
      ? await sendLoginOtp(otpEmail)
      : await sendSignupOtp({
          name: regName.trim(),
          email: otpEmail,
          department: regDept.trim() || 'Enterprise Business Unit',
          phone: regPhone.trim(),
        });
    setLoading(false);
    if (!result.success) {
      const message = result.error || 'Failed to resend.';
      setResend(cooldownFromError(message));
      setError(message);
      return;
    }
    setOtpMsg(result.message || '');
    setSmtpWarn(!!result.smtpWarning);
    setResend(RESEND_COOLDOWN_SECONDS);
    setOtp('');
  };

  const otpFilled = otp.replace(/\D/g, '').length === 6;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-50 lg:bg-[#090812] overflow-x-clip lg:overflow-hidden">
      <HeroPanel />

      {/* Right panel — clips children for slide transition */}
      <div className="flex-1 relative bg-slate-50 lg:bg-transparent overflow-x-clip lg:overflow-hidden">

        {/* ══════════════ AUTH VIEW (email+pwd / register) ══════════════ */}
        <div className="relative min-h-[100svh] lg:absolute lg:inset-0 lg:min-h-0 flex flex-col justify-center items-center px-3 py-6 sm:px-4 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-bl from-slate-900/40 via-transparent to-[#090812]/60 lg:block" />

          {/* Mobile logo */}
          <div className="login-mobile-brand-enter lg:hidden relative z-10 mb-6 text-center shrink-0">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-400 shadow-xl shadow-yellow-400/20 mb-3">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 font-heading lg:text-white">MTN Enterprise Hub</h1>
          </div>

          <div className="relative z-10 w-full max-w-[400px] space-y-4 shrink-0">

            {/* Mode tabs */}
            {view === 'auth' && <div className="login-tabs-enter flex gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-sm lg:rounded-2xl lg:bg-white/4 lg:border-white/8">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    mode === m ? 'bg-yellow-400 text-black shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  {m === 'login' ? <><LogIn className="w-3.5 h-3.5" /> Sign In</> : <><UserPlus className="w-3.5 h-3.5" /> Create Account</>}
                </button>
              ))}
            </div>}

            {/* Card */}
            <div className="login-card-enter rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-6 lg:glass-card-border lg:rounded-3xl lg:border-white/8 lg:bg-white/3 lg:p-8 lg:backdrop-blur-xl lg:shadow-2xl">

              {/* ── LOGIN FORM ── */}
              {view === 'auth' && mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="mb-5">
                    <h2 className="text-[18px] font-extrabold text-slate-900 font-heading lg:text-white">Welcome back</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sign in with your corporate email</p>
                  </div>

                  <InputField id="l-email" label="Corporate Email" type="email"
                    value={loginEmail} onChange={(v) => { setLoginEmail(v); e(); }}
                    placeholder="you@mtn.com.gh" autoFocus autoComplete="email"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  {error && <ErrorBanner message={error} />}

                  <Btn loading={loading} disabled={resend > 0}
                    label={resend > 0 ? `Try again in ${resend}s` : 'Send verification code'}
                    icon={<LogIn className="w-4 h-4" />} />
                  <p className="text-center text-[11px] text-slate-600 pt-1">
                    A verification code will be sent to your email.
                  </p>
                </form>
              )}

              {/* ── REGISTER FORM ── */}
              {view === 'auth' && mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="mb-4">
                    <h2 className="text-[18px] font-extrabold text-slate-900 font-heading lg:text-white">Create account</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">New accounts start with Staff access</p>
                  </div>

                  <InputField id="r-name" label="Full Name" value={regName}
                    onChange={(v) => { setRegName(v); e(); }}
                    placeholder="e.g. Kwame Mensah" autoFocus
                    icon={<Users className="w-4 h-4" />}
                  />
                  <InputField id="r-email" label="Corporate Email" type="email"
                    value={regEmail} onChange={(v) => { setRegEmail(v); e(); }}
                    placeholder="you@mtn.com.gh" autoComplete="email"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <InputField id="r-dept" label="Department (optional)"
                    value={regDept} onChange={setRegDept}
                    placeholder="e.g. Enterprise Sales"
                    icon={<Building2 className="w-4 h-4" />}
                  />
                  <InputField id="r-phone" label="Phone (optional)"
                    value={regPhone} onChange={setRegPhone}
                    placeholder="+233 24 000 0000"
                    icon={<Phone className="w-4 h-4" />}
                  />
                  {error && <ErrorBanner message={error} />}
                  <div className="pt-1">
                    <Btn loading={loading} disabled={resend > 0}
                      label={resend > 0 ? `Try again in ${resend}s` : 'Create Account & Send OTP'}
                      icon={<UserPlus className="w-4 h-4" />} />
                  </div>
                </form>
              )}

              {view === 'otp' && (
                <div className="space-y-5">
                  <button type="button" onClick={backToAuth}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition">
                    <ChevronLeft className="w-4 h-4" /> Back to {otpMode === 'login' ? 'sign in' : 'registration'}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 font-heading lg:text-white">Verify your identity</h2>
                      <p className="text-[11px] text-slate-400">
                        {otpMode === 'login' ? 'Two-factor authentication' : 'Email verification'}
                      </p>
                    </div>
                  </div>

                  {smtpWarn && otpMsg
                    ? <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-800 leading-relaxed lg:text-amber-300">{otpMsg}</p>
                      </div>
                    : <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                        <Inbox className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-800 lg:text-emerald-300">Code sent to your inbox</p>
                          <p className="text-[11px] text-emerald-700 truncate lg:text-emerald-400/70">{otpEmail}</p>
                        </div>
                      </div>
                  }

                  <form onSubmit={handleOtp} className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center">
                      Enter 6-digit code
                    </p>
                    <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
                    {error && <ErrorBanner message={error} />}
                    <button type="submit" disabled={loading || !otpFilled}
                      className="button-sheen-effect w-full flex items-center justify-center gap-2 py-3 rounded-xl
                        bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm transition-colors
                        shadow-lg shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                        : <><CheckCircle2 className="w-4 h-4" /> Verify & {otpMode === 'login' ? 'Sign In' : 'Activate Account'}</>
                      }
                    </button>
                  </form>

                  <div className="border-t border-slate-200 pt-4 flex items-center justify-between lg:border-white/6">
                    <p className="text-[11px] text-slate-500 lg:text-slate-600">Didn't receive the code?</p>
                    <button type="button" onClick={handleResend} disabled={resend > 0 || loading}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400
                        hover:text-yellow-600 disabled:text-slate-400 disabled:cursor-not-allowed transition lg:hover:text-yellow-300 lg:disabled:text-slate-600">
                      <RefreshCw className="w-3.5 h-3.5" />
                      {resend > 0 ? `Resend in ${resend}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="login-legal-enter text-center text-[10px] text-slate-500 lg:text-slate-700">
              © 2026 MTN Ghana · Enterprise Business Unit
            </p>
          </div>
        </div>

      </div>{/* end right panel */}
    </div>
  );
};

// ─── Reusable atoms ───────────────────────────────────────────────────────────

const InputField: React.FC<{
  id: string; label: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; required?: boolean;
  icon?: React.ReactNode; rightSlot?: React.ReactNode;
  autoComplete?: string;
}> = ({ id, label, type = 'text', value, onChange, placeholder, autoFocus, icon, rightSlot, autoComplete }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider lg:text-slate-400">
      {label}
    </label>
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 lg:text-slate-600">{icon}</div>}
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        autoFocus={autoFocus} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${rightSlot ? 'pr-11' : 'pr-4'} py-3 rounded-xl
          bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-yellow-400/35 focus:border-yellow-400/40 transition-all
          lg:bg-white/5 lg:border-white/10 lg:text-white lg:placeholder-slate-600`}
      />
      {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
  </div>
);

const Btn: React.FC<{ loading?: boolean; disabled?: boolean; label: string; icon?: React.ReactNode }> = ({
  loading, disabled, label, icon,
}) => (
  <button type="submit" disabled={loading || disabled}
    className="button-sheen-effect w-full flex items-center justify-center gap-2.5 py-3 rounded-xl
      bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm transition-colors
      shadow-lg shadow-yellow-400/15 disabled:opacity-55 disabled:cursor-not-allowed">
    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</> : <>{icon} {label}</>}
  </button>
);

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 lg:bg-rose-500/8 lg:border-rose-500/20">
    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
    <p className="text-[11px] text-rose-800 leading-relaxed lg:text-rose-300">{message}</p>
  </div>
);
