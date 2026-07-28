export interface ButcherAccount {
  id: string;
  name: string;
  role: 'Butcher' | 'Supervisor' | 'Admin';
  createdAt: string;
}

export interface ThawingItem {
  id: string;
  image: string; // Base64 or local placeholder URL
  name: string; // Nama bahan (e.g., Wagyu Ribeye)
  pricePerKg?: number; // Harga per Kg spesifik bahan (Rp)
  weightBeforeThawing: number; // Berat sebelum thawing (Kg)
  weightAfterThawing?: number; // Berat setelah thawing (Kg)
  plannedFabrication: string; // Rencana pabrikasi (e.g., Steak 200g, Slice 500g)
  status: 'thawing' | 'pabrikasi_ready' | 'pabrikasi_done';
  thawingStartTime: string; // ISO String
  thawingEndTime?: string; // ISO String
  butcherId: string;
  butcherName: string;
  createdAt: string;
  shrinkageThawing?: number; // Berat susut thawing (Kg)
  shrinkageThawingPercent?: number; // Persentase susut thawing (%)
}

export interface FabricationSegment {
  id: string;
  itemId: string; // Relasi ke ThawingItem
  itemName: string;
  segmentName: string; // Nama segmen (e.g., Segmen A - Prime Cut, Segmen B - Fat trim)
  targetWeight: number; // Rencana berat (Kg)
  actualWeight: number; // Berat realisasi (Kg)
  periodicShrinkage: number; // Total susut berkala yang diupdate (Kg)
  createdAt: string;
}

export interface DailyClosingReport {
  id: string;
  date: string; // YYYY-MM-DD
  totalThawingQty: number; // Jumlah bahan yang dithawing
  totalProcessedQty: number; // Jumlah yang sudah dipabrikasi
  totalWeightBeforeThawing: number; // Total berat awal
  totalWeightAfterThawing: number; // Total berat setelah thawing
  totalWeightAfterFabrication: number; // Total berat hasil segmen
  totalThawingLoss: number; // Total susut thawing
  totalFabricationLoss: number; // Total susut pabrikasi
  financialLossRupiah?: number; // Deprecated kerugian rupiah
  butcherInCharge: string;
  itemsProcessed: {
    id: string;
    name: string;
    pricePerKg?: number;
    weightBefore: number;
    weightAfter: number;
    finalWeight: number;
    thawingLossPercent: number;
    fabLossPercent: number;
    fabricatedSegments?: {
      segmentName: string;
      actualWeight: number;
      targetWeight?: number;
    }[];
  }[];
  isClosed: boolean;
  closedAt?: string;
}

export interface LossAlertConfig {
  safeThawingLossPercent: number; // Batas aman susut thawing (e.g. 4%)
  safeFabricationLossPercent: number; // Batas aman susut pabrikasi (e.g. 6%)
}
