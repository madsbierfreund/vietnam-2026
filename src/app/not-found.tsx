import Link from 'next/link';

export default function IkkeFundet() {
  return (
    <main className="frame side">
      <h1>Ikke fundet</h1>
      <p className="muted">Siden eller posten findes ikke (måske er den slettet).</p>
      <Link href="/">Til oversigten</Link>
    </main>
  );
}
