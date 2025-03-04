'use client';

import { useState, useEffect } from 'react';

interface StationStatus {
  name: string;
  hasApiData: boolean;
  hasDbData: boolean;
  created_at: string;
}

export default function StationUpdateStatus() {
  const [updateStatus, setUpdateStatus] = useState<StationStatus[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await fetch('/api/batchUploadLastHour');
        const data = await response.json();
        
        // Sort the data in reverse chronological order
        const sortedData = [...data.stationStatus].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setUpdateStatus(sortedData);
        setLastUpdateTime(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error checking updates:', error);
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (updateStatus.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Recent Station Updates</h3>
      <p className="text-sm text-gray-600 mb-2">
        Last checked: {lastUpdateTime}
      </p>
      <div className="text-xs text-gray-500 mb-2">
        ✓ indicates successful data update from both API and database
      </div>
      <ul className="space-y-1">
        {updateStatus.map((station, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <span className="text-green-600" title="Successfully updated">✓</span>
            <span>{station.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}