import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { IpReputation as IpReputationType } from '../types';

export function IpReputation() {
  const [result, setResult] = useState<IpReputationType | null>(null);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const ip = String(new FormData(event.currentTarget).get('ip'));
    try {
      const { data } = await api.get<IpReputationType>(`/lookups/ip/${ip}`);
      setResult(data);
    } catch {
      setError('Unable to check IP reputation. Verify API key/network or try another IP.');
    }
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="text-xl font-semibold">IP Reputation</h2>
      <form className="mt-4 flex gap-3" onSubmit={onSubmit}>
        <Input name="ip" placeholder="192.168.1.10" required />
        <Button>Check</Button>
      </form>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {result && (
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <p>IP: {result.ipAddress}</p>
          <p>Abuse Score: {result.abuseConfidenceScore}</p>
          <p>Country: {result.countryCode || 'Not configured'}</p>
          <p>ISP: {result.isp || 'Not configured'}</p>
          <p>Total Reports: {result.totalReports}</p>
          <p>Status: {result.isMalicious ? 'Malicious' : 'No reputation hit'}</p>
        </div>
      )}
    </Card>
  );
}
