import { useState, useEffect } from 'react';

export const useLastApiCall = () => {
  const [lastApiCall, setLastApiCall] = useState<string | null>(null);

  const fetchLastApiCall = async () => {
    const response = await fetch('/api/getLastApiRun');
    const data = await response.json();
    setLastApiCall(data.lastApiCall);
    console.log("Last Api Call:", data);
    return data.lastApiCall;
  };

  useEffect(() => {
    fetchLastApiCall();
  }, []);

  return { lastApiCall, fetchLastApiCall };
};
