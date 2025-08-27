'use client';

import { Check, Copy, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { RegistrationCode } from '@/lib/types';

// 统一按钮样式，与管理页面保持一致
const buttonStyles = {
  primary: 'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success: 'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  danger: 'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors',
  secondary: 'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  roundedSuccess: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200 transition-colors',
  roundedDanger: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 dark:text-gray-200 transition-colors',
};

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [count, setCount] = useState(1);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const fetchCodes = async () => {
    const res = await fetch('/api/admin/registration-codes');
    const data = await res.json();
    if (Array.isArray(data)) {
      setCodes(data);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async () => {
    await fetch('/api/admin/registration-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count }),
    });
    fetchCodes();
  };

  const handleUpdate = async (code: RegistrationCode) => {
    await fetch('/api/admin/registration-codes', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(code),
    });
    fetchCodes();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(text);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      // 复制失败，静默失败
    }
  };

  const toggleStatus = (code: RegistrationCode) => {
    const newStatus = code.status === 'disabled' ? 'unused' : 'disabled';
    handleUpdate({ ...code, status: newStatus });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'unused':
        return { text: '未使用', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'used':
        return { text: '已使用', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'disabled':
        return { text: '已禁用', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
      default:
        return { text: status, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };

  const handleDelete = async (code: string) => {
    await fetch('/api/admin/registration-codes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    fetchCodes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          生成注册码
        </h4>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleGenerate}
            className={buttonStyles.primary}
          >
            生成
          </button>
        </div>
      </div>
      <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[28rem] overflow-y-auto overflow-x-auto relative'>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">注册码</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">使用时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">使用者</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {codes.map((code) => {
              const statusDisplay = getStatusDisplay(code.status);
              return (
                <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {code.code.slice(0, 8)}...{code.code.slice(-8)}
                      </span>
                      <button
                        onClick={() => handleCopy(code.code)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="复制注册码"
                      >
                        {copySuccess === code.code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(code.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {code.used_at ? new Date(code.used_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {code.used_by_user_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {code.status !== 'used' && (
                        <button
                          onClick={() => toggleStatus(code)}
                          className={code.status === 'disabled' ? buttonStyles.roundedSuccess : buttonStyles.roundedSecondary}
                          title={code.status === 'disabled' ? '启用注册码' : '禁用注册码'}
                        >
                          {code.status === 'disabled' ? (
                            <><Check className="w-3 h-3 mr-1" />启用</>
                          ) : (
                            <><X className="w-3 h-3 mr-1" />禁用</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(code.code)}
                        className={buttonStyles.roundedDanger}
                        title="删除注册码"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}