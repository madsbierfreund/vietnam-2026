import { STATUSER, type Status } from '@/lib/types';

export function StatusSelect({ vaerdi }: { vaerdi: Status }) {
  return (
    <label className="felt">
      <span>Status</span>
      <select name="status" defaultValue={vaerdi}>
        {STATUSER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
