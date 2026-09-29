import { Topbar } from '@/components/Topbar';
import { Oversigt } from '@/components/Oversigt';
import { hentTrip } from '@/lib/data';
import { hentAdgang } from '@/lib/adgang';

export const dynamic = 'force-dynamic';

export default async function Forside() {
  const [{ data, fejl }, adgang] = await Promise.all([hentTrip(), hentAdgang()]);
  return (
    <>
      <Topbar aktiv="oversigt" />
      {fejl !== null ? (
        <main className="frame side">
          <p className="fejl">{fejl}</p>
        </main>
      ) : (
        <main>
          {adgang.fejl ? (
            <div className="frame" style={{ paddingTop: 'var(--sp-3)' }}>
              <p className="fejl">{adgang.fejl}</p>
            </div>
          ) : null}
          <Oversigt trip={data} kanRedigere={adgang.kanRedigere} />
        </main>
      )}
    </>
  );
}
