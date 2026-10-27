'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@jastip/ui';
import { useLogin } from '@jastip/api-client';
import { Mail, Lock, Eye, EyeOff, Building2, CheckCircle, AlertCircle, ArrowRight, Sparkles, ShoppingCart, CreditCard, Package, Shield, Sun, Moon, BarChart2, Users, Store } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  { email: 'staff@toko-a.com', password: 'password123', role: 'Staff Toko A', desc: 'POS Toko A', icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', accent: 'text-blue-500' },
  { email: 'staff@toko-b.com', password: 'password123', role: 'Staff Toko B', desc: 'POS Toko B', icon: ShoppingCart, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', accent: 'text-emerald-500' },
  { email: 'admin@toko-a.com', password: 'password123', role: 'Admin Toko A', desc: 'Kelola Toko A', icon: Building2, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', accent: 'text-purple-500' },
  { email: 'admin@toko-b.com', password: 'password123', role: 'Admin Toko B', desc: 'Kelola Toko B', icon: Building2, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', accent: 'text-amber-500' },
];

// POS Brand colors - inspired by Square, Toast, Lightspeed
const POS_COLORS = {
  primary: '#0D9488',      // Teal - Square-like
  primaryDark: '#0F766E',
  secondary: '#1E293B',    // Slate 800
  background: '#0F172A',   // Slate 950
  surface: '#1E293B',      // Slate 800
  surfaceHover: '#334155', // Slate 700
  border: '#334155',       // Slate 700
  text: '#F8FAFC',         // Slate 50
  textMuted: '#94A3B8',    // Slate 400
  success: '#10B981',      // Emerald 500
  warning: '#F59E0B',      // Amber 500
  error: '#EF4444',        // Red 500
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/pos';
  const { mutate: login, isPending, error: apiError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<typeof demoAccounts[0] | null>(null);
  const [isDark, setIsDark] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Persist theme preference
  useEffect(() => {
    const saved = localStorage.getItem('pos-theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('pos-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleDemoClick = (account: typeof demoAccounts[0]) => {
    setSelectedDemo(account);
    setValue('email', account.email);
    setValue('password', account.password);
    setFormError('');
  };

  const onSubmit = (data: LoginForm) => {
    setFormError('');
    login(data, {
      onSuccess: () => {
        router.push(redirect);
        router.refresh();
      },
      onError: (err: any) => {
        setFormError(err?.response?.data?.error || 'Login gagal. Silakan coba lagi.');
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const getTenantFromDomain = () => {
    if (typeof window === 'undefined') return 'Toko';
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'Toko A (Dev)';
    return hostname.split('.')[0].replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const tenantName = getTenantFromDomain();
  const tenantInitials = tenantName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Dynamic styles based on theme
  const styles = isDark ? {
    bg: POS_COLORS.background,
    cardBg: POS_COLORS.surface,
    cardBorder: POS_COLORS.border,
    surfaceHover: POS_COLORS.surfaceHover,
    inputBg: '#0F172A',
    inputBorder: POS_COLORS.border,
    text: POS_COLORS.text,
    textMuted: POS_COLORS.textMuted,
    accent: POS_COLORS.primary,
    accentHover: POS_COLORS.primaryDark,
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    surfaceHover: '#F1F5F9',
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    accent: POS_COLORS.primary,
    accentHover: POS_COLORS.primaryDark,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: styles.bg, color: styles.text }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${styles.accent}33 0%, transparent 70%)` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 1.5, delay: 0.2 } }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${styles.accent}22 0%, transparent 70%)` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 1.5, delay: 0.5 } }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${styles.accent}11 0%, transparent 70%)` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1, transition: { duration: 2, delay: 0.8 } }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Top bar - Theme toggle & Brand */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Jastip POS"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl"
              style={{ 
                background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.accentHover} 100%)`,
                boxShadow: `0 8px 32px -8px ${styles.accent}66`
              }}
            >
              <ShoppingCart className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <span className="text-xl font-bold tracking-tight" style={{ color: styles.text }}>Jastip POS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: styles.accent }}></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: styles.accent }}></span>
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ 
                  backgroundColor: `${styles.accent}20`,
                  color: styles.accent,
                  border: `1px solid ${styles.accent}30`
                }}>
                  {tenantName}
                </span>
              </div>
            </div>
          </Link>

          {/* Theme Toggle */}
          <motion.button
            onClick={() => setIsDark(!isDark)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl transition-all duration-200"
            style={{ 
              backgroundColor: isDark ? styles.surfaceHover : '#F1F5F9',
              border: `1px solid ${styles.cardBorder}`,
              color: styles.text
            }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: styles.text }}>Point of Sale</h1>
          <p className="mt-2 text-lg" style={{ color: styles.textMuted }}>Masuk untuk memulai transaksi</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={itemVariants} className="relative">
          <Card 
            className="backdrop-blur-xl border-0 overflow-hidden"
            style={{ 
              backgroundColor: `${styles.cardBg}CC`,
              border: `1px solid ${styles.cardBorder}`,
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                0 0 0 1px ${styles.cardBorder},
                inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'
              }`
            }}
          >
            <CardHeader className="pb-4 border-0" style={{ borderColor: styles.cardBorder }}>
              <CardTitle className="text-xl font-semibold" style={{ color: styles.text }}>Masuk ke POS</CardTitle>
              <CardDescription className="text-sm" style={{ color: styles.textMuted }}>Pilih akun demo atau gunakan kredensial sendiri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5" style={{ borderColor: styles.cardBorder }}>
              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {(formError || apiError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ 
                      backgroundColor: `${POS_COLORS.error}15`,
                      border: `1px solid ${POS_COLORS.error}30`,
                      color: POS_COLORS.error
                    }}
                    role="alert"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {formError || (apiError instanceof Error ? apiError.message : String(apiError || 'Login gagal'))}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <motion.div variants={itemVariants}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: styles.text }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: styles.textMuted }} />
                      <Input
                        type="email"
                        placeholder="staff@toko-a.com"
                        {...register('email')}
                        error={errors.email?.message}
                        disabled={isPending}
                        autoComplete="email"
                        className="pl-11 pr-4 transition-all duration-200"
                        style={{
                          backgroundColor: styles.inputBg,
                          borderColor: styles.inputBorder,
                          color: styles.text,
                        }}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs" style={{ color: POS_COLORS.error }}>{errors.email.message}</p>
                    )}
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={itemVariants}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: styles.text }}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: styles.textMuted }} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={isPending}
                        autoComplete="current-password"
                        className="pl-11 pr-12 transition-all duration-200"
                        style={{
                          backgroundColor: styles.inputBg,
                          borderColor: styles.inputBorder,
                          color: styles.text,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors"
                        style={{ color: styles.textMuted }}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs" style={{ color: POS_COLORS.error }}>{errors.password.message}</p>
                    )}
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full py-3.5 text-lg group relative overflow-hidden"
                    loading={isPending}
                    disabled={isPending}
                    style={{
                      backgroundColor: styles.accent,
                      borderColor: styles.accent,
                      color: '#FFFFFF',
                    }}
                  >
                    <span className="relative flex items-center justify-center gap-2 z-10">
                      <ShoppingCart className="h-5 w-5" />
                      Masuk ke POS
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="group-hover:opacity-100 opacity-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </span>
                    {/* Shine effect */}
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
                    />
                  </Button>
                </motion.div>
              </form>

              {/* Demo Accounts */}
              <motion.div variants={itemVariants} className="pt-2 border-t" style={{ borderColor: styles.cardBorder }}>
                <p className="text-center text-sm mb-4" style={{ color: styles.textMuted }}>Demo Accounts (klik untuk auto-fill)</p>
                <div className="grid grid-cols-2 gap-3" role="listbox" aria-label="Pilih akun demo">
                  {demoAccounts.map((account, index) => (
                    <motion.button
                      key={account.email}
                      onClick={() => handleDemoClick(account)}
                      disabled={isPending}
                      className={`
                        relative p-3 rounded-xl border-2 text-left transition-all duration-200
                        ${selectedDemo?.email === account.email
                          ? 'shadow-lg'
                          : ''}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      style={{
                        backgroundColor: selectedDemo?.email === account.email ? `${account.accent}10` : 'transparent',
                        borderColor: selectedDemo?.email === account.email ? account.accent : styles.cardBorder,
                        color: styles.text,
                        transitionDelay: `${index * 40}ms`,
                      }}
                      whileHover={{ y: -2, boxShadow: `0 12px 24px -8px ${account.accent}40` }}
                      whileTap={{ scale: 0.98 }}
                      role="option"
                      aria-selected={selectedDemo?.email === account.email}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${account.color} flex-shrink-0`}>
                          <account.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm" style={{ color: styles.text }}>{account.role}</p>
                          <p className="text-xs truncate" style={{ color: styles.textMuted }}>{account.desc}</p>
                          <p className="font-mono text-xs mt-1 truncate" style={{ color: styles.textMuted }}>{account.email}</p>
                        </div>
                        <AnimatePresence>
                          {selectedDemo?.email === account.email && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              className="absolute top-3 right-3"
                              style={{ color: account.accent }}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Features hint */}
              <motion.div variants={itemVariants} className="pt-2 border-t space-y-3" style={{ borderColor: styles.cardBorder }}>
                <p className="text-center text-xs uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>Fitur POS</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: ShoppingCart, label: 'Keranjang Cepat', accent: styles.accent },
                    { icon: CreditCard, label: 'Multi-payment', accent: POS_COLORS.success },
                    { icon: Package, label: 'Auto Jastip', accent: POS_COLORS.warning },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.label}
                      whileHover={{ y: -3, scale: 1.02 }}
                      className="p-3 rounded-xl text-center transition-all duration-200"
                      style={{ 
                        backgroundColor: isDark ? `${feature.accent}10` : `${feature.accent}05`,
                        border: `1px solid ${feature.accent}20`,
                        transitionDelay: `${i * 50}ms`,
                      }}
                    >
                      <feature.icon className="h-5 w-5 mx-auto mb-1" style={{ color: feature.accent }} />
                      <p className="text-xs font-medium" style={{ color: styles.text }}>{feature.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.p variants={itemVariants} className="mt-6 text-center text-sm" style={{ color: styles.textMuted }}>
            <span className="flex items-center justify-center gap-1" style={{ color: styles.accent }}>
              <Sparkles className="h-4 w-4" />
              Jastip POS v1.0
            </span>
            {' | Professional point of sale system'}
          </motion.p>
        </motion.div>
      </div>

      {/* Keyboard shortcut hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs"
        style={{ color: styles.textMuted }}
      >
        <kbd className="px-2 py-0.5 rounded bg-black/20 backdrop-blur text-[10px] font-mono">Tab</kbd>
        <span>navigate</span>
        <kbd className="px-2 py-0.5 rounded bg-black/20 backdrop-blur text-[10px] font-mono">Enter</kbd>
        <span>submit</span>
        <kbd className="px-2 py-0.5 rounded bg-black/20 backdrop-blur text-[10px] font-mono">Ctrl+K</kbd>
        <span>theme</span>
      </motion.div>
    </motion.div>
  );
}