// Rækketyper — spejler supabase/migrations/20260929120000_init.sql.
// Datoer er 'YYYY-MM-DD'-strenge, tider 'HH:MM:SS' (som Postgres returnerer dem).

export type Status = 'idé' | 'valgt' | 'booket';
export type TransportKind = 'fly' | 'bil' | 'båd' | 'andet';
export type TimeOfDay = 'morgen' | 'formiddag' | 'eftermiddag' | 'aften';

export const STATUSER: Status[] = ['idé', 'valgt', 'booket'];
export const TRANSPORT_KINDS: TransportKind[] = ['fly', 'bil', 'båd', 'andet'];
export const TIDER_PAA_DAGEN: TimeOfDay[] = ['morgen', 'formiddag', 'eftermiddag', 'aften'];

export type Destination = {
  id: string;
  name: string;
  area: string;
  color: string;
  sort_order: number;
  created_at: string;
};

export type Stay = {
  id: string;
  destination_id: string;
  name: string;
  check_in: string;
  check_out: string;
  room_setup: string;
  description: string;
  website_url: string | null;
  extra_url: string | null;
  extra_url_label: string | null;
  price_dkk: number | null;
  price_note: string;
  cancellation_note: string;
  status: Status;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Transport = {
  id: string;
  date: string;
  departs_at: string | null;
  arrives_at: string | null;
  kind: TransportKind;
  from_place: string;
  to_place: string;
  carrier_and_number: string;
  description: string;
  price_dkk: number | null;
  status: Status;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  destination_id: string;
  title: string;
  description: string;
  url: string | null;
  date: string | null;
  time_of_day: TimeOfDay | null;
  price_dkk: number | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  destinations: Destination[];
  stays: Stay[];
  transport: Transport[];
  activities: Activity[];
};

// Det vi gemmer fra et Places-valg. Ingen manuel indtastning af koordinater.
export type PickedPlace = {
  name: string;
  lat: number;
  lng: number;
  google_place_id: string;
  google_maps_url: string | null;
};
