import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { TransportForm } from '@/components/forms/TransportForm';

export default function NyTransport() {
  return (
    <>
      <Topbar aktiv="transport" />
      <main className="frame side">
        <Link href="/" className="brodkrumme">
          ← Oversigt
        </Link>
        <h1>Ny transport</h1>
        <TransportForm />
      </main>
    </>
  );
}
