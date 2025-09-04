'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

export default function TestDBPage() {
  const { user, loading: userLoading } = useUser();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualUserId, setManualUserId] = useState('88f695cc-d059-4dba-b3c2-2b379f0364a2');

  // Don't wait for user context - just show the page
  // if (userLoading) {
  //   return (
  //     <div className="p-8">
  //       <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
  //       <p>Loading user context...</p>
  //     </div>
  //   );
  // }

  const testSavedItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-saved-items');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testBookmark = async () => {
    const userIdToUse = user?.id || manualUserId;
    
    if (!userIdToUse) {
      setResult({ error: 'No user ID available. Please log in or enter a user ID.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userIdToUse,
          item_type: 'business',
          item_id: 1
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testBookmarkDirect = async () => {
    const userIdToUse = user?.id || manualUserId;
    
    if (!userIdToUse) {
      setResult({ error: 'No user ID available. Please log in or enter a user ID.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-bookmark-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userIdToUse,
          item_type: 'business',
          item_id: 1
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Current User Info:</h3>
        <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>UUID Valid:</strong> {user?.id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) ? 'Yes' : 'No' : 'N/A'}</p>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold">Manual User ID (for testing):</h3>
        <input
          type="text"
          value={manualUserId}
          onChange={(e) => setManualUserId(e.target.value)}
          className="w-full p-2 border rounded mt-2"
          placeholder="Enter user ID for testing"
        />
        <p className="text-sm text-gray-600 mt-1">This will be used if no user is logged in</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={testSavedItems}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Saved Items Table'}
        </button>
        
        <button
          onClick={testBookmark}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Bookmark API'}
        </button>
        
        <button
          onClick={testBookmarkDirect}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Bookmark Direct'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
