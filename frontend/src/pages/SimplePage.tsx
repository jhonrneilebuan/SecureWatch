import { Card } from '../components/ui/card';

export function SimplePage({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Card>
  );
}
