export type UserRole = 'student' | 'staff' | 'admin';
export type ItemType = 'Lost' | 'Found';
export type ItemStatus = 'Open' | 'Matched' | 'Returned' | 'Closed';
export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected';

export type ItemCategory =
  | 'ID & Cards'
  | 'Wallets & Bags'
  | 'Electronics'
  | 'Keys & Access'
  | 'Books & Notes'
  | 'Bottles & Gear'
  | 'Apparel & Accessories'
  | 'Other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'ID & Cards',
  'Wallets & Bags',
  'Electronics',
  'Keys & Access',
  'Books & Notes',
  'Bottles & Gear',
  'Apparel & Accessories',
  'Other',
];

export const CAMPUS_LOCATIONS: string[] = [
  'SPSU Central Library - Reading Hall',
  'School of Engineering - Block A Courtyard',
  'School of Management - Lecture Hall 204',
  'SPSU Sports Complex - Indoor Court',
  'SPSU Main Cafeteria & Food Court',
  'Boys Hostel - Block 1 Bike Rack Entrance',
  'Girls Hostel - Visitors Lounge',
  'Computer Science Lab - Academic Block B',
  'SPSU Amphitheatre & Student Plaza',
  'Main Gate Security & Proctor Office',
];

export interface UserRecord {
  user_id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  department: string;
  student_or_staff_id?: string | null;
  created_at: string;
}

export interface ItemRecord {
  item_id: number;
  title: string;
  description: string;
  category: ItemCategory;
  item_type: ItemType;
  location: string;
  report_date: string;
  image_path: string | null;
  identifying_details?: string | null;
  verification_question?: string | null;
  status: ItemStatus;
  is_flagged_duplicate: boolean;
  user_id: number;
  reporter_name?: string;
  reporter_role?: UserRole;
  reporter_department?: string;
  reporter_masked_email?: string;
  claim_count?: number;
  created_at: string;
}

export interface ClaimRecord {
  claim_id: number;
  item_id: number;
  claimant_id: number;
  identifying_features: string;
  verification_note: string;
  claim_status: ClaimStatus;
  reviewer_note?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  item_title?: string;
  item_type?: ItemType;
  item_category?: ItemCategory;
  item_location?: string;
  item_status?: ItemStatus;
  item_image_path?: string | null;
  claimant_name?: string;
  claimant_role?: UserRole;
  claimant_department?: string;
  claimant_masked_email?: string;
}

export interface StatusHistoryRecord {
  history_id: number;
  item_id: number;
  old_status: 'None' | ItemStatus;
  new_status: ItemStatus;
  note?: string | null;
  updated_by: number;
  updated_by_name?: string;
  updated_by_role?: UserRole;
  updated_at: string;
}

export interface ItemFilterCriteria {
  keyword?: string;
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  itemType?: string;
  status?: string;
}

export function maskEmailAddress(email: string): string {
  if (!email || !email.includes('@')) return 'member@***.spsu.ac.in';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function validateCollegeEmail(
  email: string,
  requireEduDomain = true
): { valid: boolean; error?: string } {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (requireEduDomain) {
    const domain = trimmed.split('@')[1] || '';
    const isAcademic =
      domain === 'spsu.ac.in' ||
      domain.endsWith('.spsu.ac.in') ||
      domain.endsWith('.edu') ||
      domain.endsWith('.edu.in') ||
      domain.endsWith('.ac.in') ||
      domain.endsWith('.ac.uk') ||
      domain === 'campus.edu' ||
      domain === 'university.edu';
    if (!isAcademic) {
      return {
        valid: false,
        error: 'Please use an official SPSU email address (@spsu.ac.in) or academic domain (.ac.in / .edu).',
      };
    }
  }
  return { valid: true };
}

export function validateRegistrationInput(input: {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  requireEduDomain?: boolean;
}): { valid: boolean; error?: string } {
  const name = (input.name || '').trim();
  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Full name must be between 2 and 120 characters.' };
  }
  const emailCheck = validateCollegeEmail(input.email || '', input.requireEduDomain ?? true);
  if (!emailCheck.valid) {
    return emailCheck;
  }
  const password = input.password || '';
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long.' };
  }
  const validRoles: UserRole[] = ['student', 'staff', 'admin'];
  if (input.role && !validRoles.includes(input.role as UserRole)) {
    return { valid: false, error: 'Invalid user role selected.' };
  }
  return { valid: true };
}

export function validateItemInput(input: {
  title?: string;
  description?: string;
  category?: string;
  item_type?: string;
  location?: string;
  report_date?: string;
}): { valid: boolean; error?: string } {
  const title = (input.title || '').trim();
  if (title.length < 3 || title.length > 160) {
    return { valid: false, error: 'Item title must be between 3 and 160 characters.' };
  }
  const description = (input.description || '').trim();
  if (description.length < 10 || description.length > 2000) {
    return { valid: false, error: 'Item description must be at least 10 characters long.' };
  }
  if (!input.category || !ITEM_CATEGORIES.includes(input.category as ItemCategory)) {
    return { valid: false, error: 'Please select a valid item category.' };
  }
  if (input.item_type !== 'Lost' && input.item_type !== 'Found') {
    return { valid: false, error: 'Report type must be either Lost or Found.' };
  }
  const location = (input.location || '').trim();
  if (location.length < 3 || location.length > 160) {
    return { valid: false, error: 'Please provide a specific campus location.' };
  }
  const reportDate = (input.report_date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return { valid: false, error: 'Please provide a valid date in YYYY-MM-DD format.' };
  }
  return { valid: true };
}

export function validateClaimEligibility(params: {
  item: Pick<ItemRecord, 'item_id' | 'user_id' | 'status' | 'item_type'>;
  claimantId: number;
  identifyingFeatures?: string;
  verificationNote?: string;
  existingClaimsForItem?: Array<Pick<ClaimRecord, 'claimant_id' | 'claim_status'>>;
}): { valid: boolean; error?: string } {
  const { item, claimantId, identifyingFeatures, verificationNote, existingClaimsForItem = [] } = params;

  if (item.user_id === claimantId) {
    return { valid: false, error: 'You cannot submit an ownership claim on your own report.' };
  }
  if (item.status === 'Returned' || item.status === 'Closed') {
    return { valid: false, error: `This item is already marked as ${item.status} and is no longer accepting claims.` };
  }
  const duplicateClaim = existingClaimsForItem.find((c) => c.claimant_id === claimantId);
  if (duplicateClaim) {
    return { valid: false, error: 'You have already submitted a claim request for this item.' };
  }
  const features = (identifyingFeatures || '').trim();
  if (features.length < 10) {
    return { valid: false, error: 'Please describe the identifying features in at least 10 characters.' };
  }
  const note = (verificationNote || '').trim();
  if (note.length < 10) {
    return { valid: false, error: 'Please provide a detailed verification note (at least 10 characters).' };
  }
  return { valid: true };
}

export function filterItems(items: ItemRecord[], filters: ItemFilterCriteria): ItemRecord[] {
  const keyword = (filters.keyword || '').trim().toLowerCase();
  const category = filters.category && filters.category !== 'All' ? filters.category : '';
  const location = (filters.location || '').trim().toLowerCase();
  const itemType = filters.itemType && filters.itemType !== 'All' ? filters.itemType : '';
  const status = filters.status && filters.status !== 'All' ? filters.status : '';
  const dateFrom = filters.dateFrom || '';
  const dateTo = filters.dateTo || '';

  return items.filter((item) => {
    if (itemType && item.item_type !== itemType) return false;
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    if (location && !item.location.toLowerCase().includes(location)) return false;
    if (dateFrom && item.report_date < dateFrom) return false;
    if (dateTo && item.report_date > dateTo) return false;
    if (keyword) {
      const haystack = `${item.title} ${item.description} ${item.category} ${item.location} ${item.reporter_department || ''}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export function detectPotentialDuplicates(target: ItemRecord, allItems: ItemRecord[]): ItemRecord[] {
  const targetWords = target.title
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4);

  return allItems.filter((candidate) => {
    if (candidate.item_id === target.item_id) return false;
    if (candidate.category !== target.category) return false;
    if (candidate.item_type !== target.item_type) return false;
    const candidateTitle = candidate.title.toLowerCase();
    return targetWords.some((word) => candidateTitle.includes(word));
  });
}
