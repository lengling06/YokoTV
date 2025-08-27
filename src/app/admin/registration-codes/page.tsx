'use client';

import { useEffect, useState } from 'react';

import { RegistrationCode } from '@/lib/types';

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [count, setCount] = useState(1);

  const fetchCodes = async () => {
    const res = await fetch('/api/admin/registration-codes');
    const data = await res.json();
    setCodes(data);
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
    <div className="p-8">
      <h1 className="text-2xl font-bold">Registration Codes</h1>
      <div className="flex items-center my-4 space-x-4">
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10))}
          className="w-24 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleGenerate}
          className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md"
        >
          Generate
        </button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Code</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Created At</th>
            <th className="px-4 py-2 border-b">Used At</th>
            <th className="px-4 py-2 border-b">Used By</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <tr key={code.id}>
              <td className="px-4 py-2 border-b">{code.code}</td>
              <td className="px-4 py-2 border-b">
                <select
                  value={code.status}
                  onChange={(e) =>
                    handleUpdate({
                      ...code,
                      status: e.target.value as 'unused' | 'used' | 'disabled',
                    })
                  }
                  className="px-3 py-1 border rounded-md"
                >
                  <option value="unused">unused</option>
                  <option value="used">used</option>
                  <option value="disabled">disabled</option>
                </select>
              </td>
              <td className="px-4 py-2 border-b">{code.created_at}</td>
              <td className="px-4 py-2 border-b">{code.used_at}</td>
              <td className="px-4 py-2 border-b">{code.used_by_user_id}</td>
              <td className="px-4 py-2 border-b">
                <button
                  onClick={() => handleDelete(code.code)}
                  className="font-bold text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}