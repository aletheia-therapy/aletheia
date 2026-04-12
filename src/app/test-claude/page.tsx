'use client';

import { useState } from 'react';

export default function TestClaude() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testClaude = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/test-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.response);
      } else {
        setError(data.error || '發生錯誤');
      }
    } catch (err) {
      setError('無法連接到 API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Claude API 測試</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            發送訊息給 Claude：
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例如：你好，請自我介紹"
            className="w-full px-4 py-2 border rounded-lg mb-4"
            onKeyPress={(e) => e.key === 'Enter' && testClaude()}
          />
          <button
            onClick={testClaude}
            disabled={loading || !message}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '傳送中...' : '測試 Claude API'}
          </button>
        </div>

        {response && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2 text-gray-800">Claude 回應：</h3>
            <p className="whitespace-pre-wrap text-gray-900">{response}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2">錯誤：</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}