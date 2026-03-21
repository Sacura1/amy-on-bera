export type RaffleStatus = 'TNM' | 'LIVE' | 'DRAW_PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Raffle {
  id: number;
  title: string;
  prize_description: string;
  image_url: string;
  ticket_cost: number;
  status: RaffleStatus;
  countdown_hours: number;
  ends_at: string | null;
  total_tickets: number;
  unique_participants: number;
  total_points_committed: number;
  slot_id?: string;
  novelty_name?: string;
}
