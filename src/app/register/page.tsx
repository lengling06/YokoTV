'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const { siteName } = useSite();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 前端验证
    if (!username.trim() || !password.trim() || !registrationCode.trim()) {
      setError('请填写所有必填项');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('用户名长度必须在3-20个字符之间');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('用户名只能包含字母、数字、下划线和短横线');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          registration_code: registrationCode.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 注册成功，显示成功状态
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?message=registration_success');
        }, 2000);
      } else {
        setError(data.error || '注册失败，请稍后重试');
      }
    } catch (err) {
      console.error('注册错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-8 bg-clip-text drop-shadow-sm'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='用户名'
            />
          </div>
          <div>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='密码'
            />
          </div>
          <div>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              required
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='确认密码'
            />
          </div>
          <div>
            <input
              id='registrationCode'
              type='text'
              value={registrationCode}
              onChange={(e) => setRegistrationCode(e.target.value)}
              required
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='注册码'
            />
          </div>
          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}
          <div>
            <button
              type='submit'
              disabled={loading || success}
              className={`inline-flex w-full justify-center rounded-lg py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${success
                  ? 'bg-green-500 hover:bg-green-500'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {success ? '注册成功！即将跳转...' : loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
        {success && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
            <div className="text-green-800 dark:text-green-200 font-medium">
              ✓ 注册成功！正在跳转到登录页面...
            </div>
          </div>
        )}

        <div className='text-center'>
          <a href='/login' className='text-sm text-green-600 hover:underline'>
            已有账户？去登录
          </a>
        </div>
      </div>
    </div>
  );
}
