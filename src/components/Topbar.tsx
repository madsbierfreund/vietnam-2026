import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { hentAdgang } from '@/lib/adgang';

// Slank, sticky topbar. `aktiv` markerer den side man står på.
// "+ Hotel" og "+ Transport" vises kun for redaktører.
export async function Topbar({ aktiv }: { aktiv?: 'oversigt' | 'hotel' | 'transport' }) {
  const { kanRedigere } = await hentAdgang();
  const kl = (navn: string) => `navlink${aktiv === navn ? ' aktiv' : ''}`;
  return (
    <header className="topbar">
      <div className="frame topbar-inner">
        <Link href="/" className="topbar-title">
          Vietnam 2026
        </Link>
        <nav>
          <Link href="/" className={kl('oversigt')}>
            Oversigt
          </Link>
          {kanRedigere ? (
            <>
              <Link href="/hotel/ny" className={kl('hotel')}>
                + Hotel
              </Link>
              <Link href="/transport/ny" className={kl('transport')}>
                + Transport
              </Link>
            </>
          ) : null}
          <form action={logout}>
            <button type="submit" className="navlink">
              Log ud
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
