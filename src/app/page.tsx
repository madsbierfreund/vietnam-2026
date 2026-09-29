import { Topbar } from '@/components/Topbar';
import { Oversigt } from '@/components/Oversigt';
import { hentTrip } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Forside() {
  const { data, fejl } = await hentTrip();
  return (
    <>
      <Topbar aktiv="oversigt" />
      {fejl !== null ? (
        <main className="frame side">
          <p className="fejl">{fejl}</p>
        </main>
      ) : (
        <main>
          <Oversigt trip={data} />
        </main>
      )}
    </>
  );
}
