import { ButcherAccount, ThawingItem, FabricationSegment, DailyClosingReport, LossAlertConfig } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Default Accounts
const DEFAULT_ACCOUNTS: ButcherAccount[] = [
  { id: 'acc_1', name: 'Butcher Ahmad', role: 'Butcher', createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'acc_2', name: 'Butcher Budi', role: 'Butcher', createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString() },
  { id: 'acc_3', name: 'Supervisor Teguh', role: 'Supervisor', createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString() },
];

// Default configurations
const DEFAULT_CONFIG: LossAlertConfig = {
  safeThawingLossPercent: 4.0, // Batas aman 4%
  safeFabricationLossPercent: 6.0, // Batas aman 6%
};

// Seed sample data to make the app interactive immediately
const getInitialThawingItems = (): ThawingItem[] => {
  const now = new Date();
  
  return [
    {
      id: 'meat_1',
      name: 'Sapi Wagyu Ribeye MB5',
      pricePerKg: 350000,
      image: '',
      weightBeforeThawing: 12.5,
      weightAfterThawing: 12.0, // 0.5kg loss (4%)
      plannedFabrication: 'Portion Steak @200g, Fat Trim',
      status: 'pabrikasi_ready',
      thawingStartTime: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      thawingEndTime: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      butcherId: 'acc_1',
      butcherName: 'Butcher Ahmad',
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      shrinkageThawing: 0.5,
      shrinkageThawingPercent: 4.0
    },
    {
      id: 'meat_2',
      name: 'Daging Sapi Sirloin Australia',
      pricePerKg: 185000,
      image: '',
      weightBeforeThawing: 20.0,
      plannedFabrication: 'Sliced Thin @500g Pack',
      status: 'thawing',
      thawingStartTime: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString(), // 1.5 hours ago
      butcherId: 'acc_2',
      butcherName: 'Butcher Budi',
      createdAt: new Date(now.getTime() - 1.5 * 3600 * 1000).toISOString()
    },
    {
      id: 'meat_3',
      name: 'Daging Sandung Lamur (Brisket)',
      pricePerKg: 125000,
      image: '',
      weightBeforeThawing: 15.0,
      plannedFabrication: 'Smoked Brisket Block @2Kg',
      status: 'thawing',
      thawingStartTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      butcherId: 'acc_1',
      butcherName: 'Butcher Ahmad',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    }
  ];
};

const getInitialSegments = (): FabricationSegment[] => {
  return [
    {
      id: 'seg_1',
      itemId: 'meat_1',
      itemName: 'Sapi Wagyu Ribeye MB5',
      segmentName: 'Steak Ribeye Portion @200g',
      targetWeight: 10.0,
      actualWeight: 9.8,
      periodicShrinkage: 0.1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'seg_2',
      itemId: 'meat_1',
      itemName: 'Sapi Wagyu Ribeye MB5',
      segmentName: 'Fat Trim & Meat Scrap',
      targetWeight: 2.0,
      actualWeight: 1.8,
      periodicShrinkage: 0.05,
      createdAt: new Date().toISOString()
    }
  ];
};

const getInitialReports = (): DailyClosingReport[] => {
  const now = new Date();
  
  return [
    {
      id: 'rep_1',
      date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days ago
      totalThawingQty: 2,
      totalProcessedQty: 2,
      totalWeightBeforeThawing: 35.0,
      totalWeightAfterThawing: 33.6, // 1.4 Kg thawing loss (4%)
      totalWeightAfterFabrication: 31.5, // 2.1 Kg fab loss (6.25%)
      totalThawingLoss: 1.4,
      totalFabricationLoss: 2.1,
      butcherInCharge: 'Butcher Ahmad & Butcher Budi',
      itemsProcessed: [
        {
          id: 'hist_item_1',
          name: 'Sapi Ribeye Grade A',
          pricePerKg: 220000,
          weightBefore: 15.0,
          weightAfter: 14.4,
          finalWeight: 13.5,
          thawingLossPercent: 4.0,
          fabLossPercent: 6.25,
          fabricatedSegments: [
            { segmentName: 'Steak Ribeye Portion @200g', actualWeight: 11.5, targetWeight: 12.0 },
            { segmentName: 'Fat Trim & Scrap', actualWeight: 2.0, targetWeight: 2.0 },
          ],
        },
        {
          id: 'hist_item_2',
          name: 'Sapi Tenderloin Grade A',
          pricePerKg: 280000,
          weightBefore: 20.0,
          weightAfter: 19.2,
          finalWeight: 18.0,
          thawingLossPercent: 4.0,
          fabLossPercent: 6.25,
          fabricatedSegments: [
            { segmentName: 'Tenderloin Whole Roast', actualWeight: 15.0, targetWeight: 16.0 },
            { segmentName: 'Tetelan / Trim', actualWeight: 3.0, targetWeight: 3.0 },
          ],
        },
      ],
      isClosed: true,
      closedAt: new Date(now.getTime() - 1.9 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'rep_2',
      date: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], // Yesterday
      totalThawingQty: 3,
      totalProcessedQty: 3,
      totalWeightBeforeThawing: 50.0,
      totalWeightAfterThawing: 48.2, // 1.8 Kg thawing loss (3.6%)
      totalWeightAfterFabrication: 45.0, // 3.2 Kg fab loss (6.6%)
      totalThawingLoss: 1.8,
      totalFabricationLoss: 3.2,
      butcherInCharge: 'Butcher Ahmad',
      itemsProcessed: [
        {
          id: 'hist_item_3',
          name: 'Daging Sirloin US Prime',
          pricePerKg: 195000,
          weightBefore: 25.0,
          weightAfter: 24.1,
          finalWeight: 22.5,
          thawingLossPercent: 3.6,
          fabLossPercent: 6.64,
          fabricatedSegments: [
            { segmentName: 'Sirloin Steak Cut', actualWeight: 19.5, targetWeight: 20.0 },
            { segmentName: 'Fat Trim & Scrap', actualWeight: 3.0, targetWeight: 3.0 },
          ],
        },
        {
          id: 'hist_item_4',
          name: 'Shortplate Sapi US',
          pricePerKg: 140000,
          weightBefore: 25.0,
          weightAfter: 24.1,
          finalWeight: 22.5,
          thawingLossPercent: 3.6,
          fabLossPercent: 6.64,
          fabricatedSegments: [
            { segmentName: 'Sliced Thin 500g Pack', actualWeight: 20.0, targetWeight: 21.0 },
            { segmentName: 'Lemak / Waste', actualWeight: 2.5, targetWeight: 2.5 },
          ],
        },
      ],
      isClosed: true,
      closedAt: new Date(now.getTime() - 0.9 * 24 * 3600 * 1000).toISOString()
    }
  ];
};

// --- DATABASE CLOUD SYNC FOR SUPABASE ---
export interface AppDataPayload {
  accounts: ButcherAccount[];
  items: ThawingItem[];
  segments: FabricationSegment[];
  reports: DailyClosingReport[];
  lossConfig: LossAlertConfig;
}

export const syncAllDataToCloud = async (username: string, payload: AppDataPayload) => {
  const cleanUser = username.trim().toLowerCase();
  const storageKey = `butcher_app_data_${cleanUser}`;

  // 1. Save to local storage cache
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed writing to localStorage:', e);
  }

  // 2. Sync to Supabase Auth user_metadata & database table if available
  if (isSupabaseConfigured && supabase) {
    try {
      // Backup to user metadata
      await supabase.auth.updateUser({
        data: { butcher_data: payload },
      });

      // Try upserting to Supabase table 'butcher_app_data'
      await supabase
        .from('butcher_app_data')
        .upsert({
          username: cleanUser,
          data: payload,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('Supabase database sync warning:', err);
    }
  }
};

export const loadAllDataFromCloud = async (username: string): Promise<AppDataPayload | null> => {
  const cleanUser = username.trim().toLowerCase();
  const storageKey = `butcher_app_data_${cleanUser}`;

  let cloudData: AppDataPayload | null = null;

  // 1. Try fetching from Supabase table if available
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('butcher_app_data')
        .select('data')
        .eq('username', cleanUser)
        .single();

      if (!error && data?.data) {
        cloudData = data.data as AppDataPayload;
      } else {
        // Fallback to Supabase auth user_metadata
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.user_metadata?.butcher_data) {
          cloudData = userData.user.user_metadata.butcher_data as AppDataPayload;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local cache:', err);
    }
  }

  // 2. Fallback to localStorage user cache
  if (!cloudData) {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        cloudData = JSON.parse(raw);
      } catch (e) {
        console.error('Failed parsing local app data cache:', e);
      }
    }
  }

  return cloudData;
};

// --- TRADITIONAL LOCALSTORAGE HELPERS ---
export const getStoredAccounts = (): ButcherAccount[] => {
  const data = localStorage.getItem('butcher_accounts');
  if (!data) {
    localStorage.setItem('butcher_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  return JSON.parse(data);
};

export const saveAccounts = (accounts: ButcherAccount[]) => {
  localStorage.setItem('butcher_accounts', JSON.stringify(accounts));
};

export const getActiveAccount = (): ButcherAccount | null => {
  const activeId = localStorage.getItem('active_butcher_id');
  const accounts = getStoredAccounts();
  if (!activeId && accounts.length > 0) {
    localStorage.setItem('active_butcher_id', accounts[0].id);
    return accounts[0];
  }
  return accounts.find(a => a.id === activeId) || accounts[0] || null;
};

export const setActiveAccount = (id: string) => {
  localStorage.setItem('active_butcher_id', id);
};

export const getThawingItems = (): ThawingItem[] => {
  const data = localStorage.getItem('thawing_items');
  if (!data) {
    const items = getInitialThawingItems();
    localStorage.setItem('thawing_items', JSON.stringify(items));
    return items;
  }
  return JSON.parse(data);
};

export const saveThawingItems = (items: ThawingItem[]) => {
  localStorage.setItem('thawing_items', JSON.stringify(items));
};

export const getFabricationSegments = (): FabricationSegment[] => {
  const data = localStorage.getItem('fabrication_segments');
  if (!data) {
    const segments = getInitialSegments();
    localStorage.setItem('fabrication_segments', JSON.stringify(segments));
    return segments;
  }
  return JSON.parse(data);
};

export const saveFabricationSegments = (segments: FabricationSegment[]) => {
  localStorage.setItem('fabrication_segments', JSON.stringify(segments));
};

export const getDailyReports = (): DailyClosingReport[] => {
  const data = localStorage.getItem('daily_reports');
  if (!data) {
    const reports = getInitialReports();
    localStorage.setItem('daily_reports', JSON.stringify(reports));
    return reports;
  }
  return JSON.parse(data);
};

export const saveDailyReports = (reports: DailyClosingReport[]) => {
  localStorage.setItem('daily_reports', JSON.stringify(reports));
};

export const getLossConfig = (): LossAlertConfig => {
  const data = localStorage.getItem('loss_config');
  if (!data) {
    localStorage.setItem('loss_config', JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(data);
};

export const saveLossConfig = (config: LossAlertConfig) => {
  localStorage.setItem('loss_config', JSON.stringify(config));
};

// Reset database to default seed
export const resetDatabase = () => {
  localStorage.setItem('butcher_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
  localStorage.setItem('thawing_items', JSON.stringify(getInitialThawingItems()));
  localStorage.setItem('fabrication_segments', JSON.stringify(getInitialSegments()));
  localStorage.setItem('daily_reports', JSON.stringify(getInitialReports()));
  localStorage.setItem('loss_config', JSON.stringify(DEFAULT_CONFIG));
};


