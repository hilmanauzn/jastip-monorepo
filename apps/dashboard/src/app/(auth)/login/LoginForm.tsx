"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button, Input } from "@jastip/ui";
import { useLogin } from "@jastip/api-client";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Sun,
  Moon,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  {
    email: "admin@jastip.com",
    password: "password123",
    role: "Super Admin",
    desc: "Kelola semua toko",
  },
  {
    email: "admin@toko-a.com",
    password: "password123",
    role: "Admin Toko A",
    desc: "Kelola Toko A",
  },
  {
    email: "staff@toko-a.com",
    password: "password123",
    role: "Staff Toko A",
    desc: "POS & Pesanan",
  },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { mutate: login, isPending, error: apiError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<
    (typeof demoAccounts)[0] | null
  >(null);
  const [isDark, setIsDark] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const saved = localStorage.getItem("dash-theme");
    if (saved) setIsDark(saved === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("dash-theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleDemoClick = (account: (typeof demoAccounts)[0]) => {
    setSelectedDemo(account);
    setValue("email", account.email);
    setValue("password", account.password);
    setFormError("");
  };

  const onSubmit = (data: LoginForm) => {
    setFormError("");
    login(data, {
      onSuccess: () => {
        router.push(redirect);
        router.refresh();
      },
      onError: (err: any) => {
        setFormError(
          err?.response?.data?.error || "Login gagal. Silakan coba lagi.",
        );
      },
    });
  };

  const errorMessage =
    formError ||
    (apiError instanceof Error ? apiError.message : String(apiError));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
    >
      <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-100 dark:bg-indigo-900/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jastip<span className="text-indigo-600">Admin</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Masuk untuk mengelola toko Anda
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <span className="h-4 w-4 flex-shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="admin@jastip.com"
                  className="pl-10 pr-4 py-2.5 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-4 py-2.5 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                />
                Ingat saya
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Lupa kata sandi?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-sm transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Masuk <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Belum punya akun?{" "}
                <Link
                  href="/auth/register"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Coba akun demo
            </span>
            <button
              onClick={() => setSelectedDemo(null)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Kosongkan
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoClick(account)}
                className={
                  selectedDemo?.email === account.email
                    ? "flex items-center gap-2 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors active:scale-95"
                    : "flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
                }
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {account.role}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {account.desc}
                  </p>
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {account.email.split("@")[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between px-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Ganti tema"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Jastip
          </p>
        </div>
      </div>
    </motion.div>
  );
}
