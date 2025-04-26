'use client';

import { useEffect, useState } from 'react';

interface D1StatusData {
  status: 'available' | 'not_available' | 'error';
  message: string;
  is_worker: boolean;
  tables?: string[];
  profile_count?: number;
  error?: string;
}

export function D1Status() {
  const [status, setStatus] = useState<D1StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkD1Status = async () => {
      try {
        const response = await fetch('/api/d1-status');
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching D1 status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkD1Status();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        <p className="text-gray-500">Checking D1 database status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-500">Error checking D1 status: {error}</p>
      </div>
    );
  }
  
  if (!status) {
    return (
      <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
        <p className="text-yellow-700">No status information available</p>
      </div>
    );
  }

  const isAvailable = status.status === 'available';
  
  return (
    <div className={`p-4 border rounded-md ${isAvailable ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <h3 className="text-lg font-medium mb-2">
        D1 Database Status
      </h3>
      
      <p className={isAvailable ? 'text-green-700' : 'text-yellow-700'}>
        {status.message}
      </p>
      
      {isAvailable && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Available Tables: {status.tables?.join(', ') || 'None'}
          </p>
          <p className="text-sm text-gray-600">
            User Profiles: {status.profile_count}
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Environment: {status.is_worker ? 'Cloudflare Worker' : 'Node.js/Other'}
      </p>
      
      {status.error && (
        <p className="text-xs text-red-500 mt-1">
          Error details: {status.error}
        </p>
      )}
    </div>
  );
} 