export class ImpactDto {
  totalDonated: number;       // Total amount donated (euros)
  treesPlanted: number;
  coralRestored: number;
  pollinatorsHelped: number;
  co2Offset: number;          // Estimated kg CO2 offset
  subscriptionTier: string | null;
  donationCount: number;
  memberSince: string;        // ISO date string
}
