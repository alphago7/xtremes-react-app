'use client';

import { useEffect, useState } from 'react';

type ExtremeDataTestResponse = {
  data: Record<string, unknown>;
};

export default function TestPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/extreme-data')
      .then((res) => res.json() as Promise<ExtremeDataTestResponse>)
      .then((result) => {
        setData(result.data ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Data Test Page</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
