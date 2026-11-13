import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import type {
  UserRecord,
  ItemRecord,
  ClaimRecord,
  StatusHistoryRecord,
  UserRole,
  ItemStatus,
  ClaimStatus,
  ItemCategory,
  ItemType,
} from '../../src/utils/campusLogic.ts';
import { maskEmailAddress } from '../../src/utils/campusLogic.ts';

export interface RelationalStore {
  storeVersion?: string;
  users: UserRecord[];
  items: ItemRecord[];
  claims: ClaimRecord[];
  statusHistory: StatusHistoryRecord[];
  settings: {
    requireEduDomain: boolean;
  };
  counters: {
    user_id: number;
    item_id: number;
    claim_id: number;
    history_id: number;
  };
}

const CURRENT_STORE_VERSION = 'spsu-v1';
const DATA_FILE_PATH = path.resolve(process.cwd(), 'backend/config/campus_db.json');

export function createInitialSeedStore(): RelationalStore {
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const staffHash = bcrypt.hashSync('Staff@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  const users: UserRecord[] = [
    {
      user_id: 1,
      name: 'Dr. Rajeshwar Singh',
      email: 'admin@spsu.ac.in',
      password_hash: adminHash,
      role: 'admin',
      department: 'SPSU Proctor & Security Office',
      student_or_staff_id: 'SPSU-ADM-01',
      created_at: '2026-10-01T08:00:00.000Z',
    },
    {
      user_id: 2,
      name: 'Vikramaditya Rathore',
      email: 'staff@spsu.ac.in',
      password_hash: staffHash,
      role: 'staff',
      department: 'SPSU Central Library',
      student_or_staff_id: 'SPSU-STF-104',
      created_at: '2026-10-05T09:15:00.000Z',
    },
    {
      user_id: 3,
      name: 'Aarav Sharma',
      email: 'student@spsu.ac.in',
      password_hash: studentHash,
      role: 'student',
      department: 'School of Engineering (B.Tech CSE)',
      student_or_staff_id: '22CSE1048',
      created_at: '2026-10-12T11:30:00.000Z',
    },
    {
      user_id: 4,
      name: 'Ananya Mewara',
      email: 'ananya.mewara@spsu.ac.in',
      password_hash: studentHash,
      role: 'student',
      department: 'School of Management (BBA)',
      student_or_staff_id: '23BBA2019',
      created_at: '2026-10-15T14:20:00.000Z',
    },
  ];

  const items: ItemRecord[] = [
    {
      item_id: 1,
      title: 'Lost SPSU Student ID Card',
      description:
        'University student identification card inside a clear polycarbonate badge holder attached to a deep navy blue lanyard. Misplaced while studying at the Central Library reading hall tables.',
      category: 'ID & Cards',
      item_type: 'Lost',
      location: 'SPSU Central Library - Reading Hall',
      report_date: '2026-11-10',
      image_path: '/src/assets/images/campus_id_card_1794584854139.jpg',
      identifying_details:
        'SPSU Smart ID card with barcode and metallic clip on top slot.',
      verification_question:
        'What is the enrollment number or branch printed on the front of the ID card?',
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 4,
      created_at: '2026-11-10T16:40:00.000Z',
    },
    {
      item_id: 2,
      title: 'Found Black Leather Wallet',
      description:
        'Minimalist black pebbled leather bifold wallet found on the stone courtyard bench outside School of Engineering Block A after the afternoon lectures. Turned in to the Central Library desk for safekeeping.',
      category: 'Wallets & Bags',
      item_type: 'Found',
      location: 'School of Engineering - Block A Courtyard',
      report_date: '2026-11-11',
      image_path: '/src/assets/images/black_leather_wallet_1794584854291.jpg',
      identifying_details:
        'Nomad brand embossed on the front corner. Contains bus pass and SPSU mess coupon inside.',
      verification_question:
        'Which bank card issuer and what specific campus pass is tucked in the right slot?',
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 2,
      created_at: '2026-11-11T13:15:00.000Z',
    },
    {
      item_id: 3,
      title: 'Lost 65W USB-C Laptop Charger',
      description:
        'White Satechi 65W USB-C power adapter brick with a 2-meter braided white USB-C charging cable and grey velcro cable tie. Left plugged into the floor socket under row 4.',
      category: 'Electronics',
      item_type: 'Lost',
      location: 'School of Management - Lecture Hall 204',
      report_date: '2026-11-09',
      image_path: '/src/assets/images/laptop_charger_adapter_1794584854705.jpg',
      identifying_details:
        'Has a small blue dot sticker near the USB-C port to distinguish it during lab sessions.',
      verification_question:
        'Is there any sticker or mark near the output port of the adapter brick?',
      status: 'Matched',
      is_flagged_duplicate: false,
      user_id: 3,
      created_at: '2026-11-09T18:05:00.000Z',
    },
    {
      item_id: 4,
      title: 'Found Matte Navy Insulated Water Bottle',
      description:
        '32oz matte navy blue stainless steel insulated water bottle with a wide black carry loop cap. Found near the SPSU Sports Complex indoor court bleachers after evening practice.',
      category: 'Bottles & Gear',
      item_type: 'Found',
      location: 'SPSU Sports Complex - Indoor Court',
      report_date: '2026-11-08',
      image_path: '/src/assets/images/insulated_water_bottle_1794584856226.jpg',
      identifying_details:
        'Vertical HYDRO wordmark laser-etched near the base; minor scuff on the bottom rim.',
      verification_question:
        'What brand name is etched near the base and are there any dents or markings on the bottom?',
      status: 'Returned',
      is_flagged_duplicate: false,
      user_id: 1,
      created_at: '2026-11-08T19:50:00.000Z',
    },
    {
      item_id: 5,
      title: 'Lost Data Structures & Algorithms Lab Notebook',
      description:
        'Hardcover dotted-grid A4 engineering notebook with dark navy cover containing handwritten lecture notes, red-black tree diagrams, and graded CSE lab sheets from Weeks 1 to 9.',
      category: 'Books & Notes',
      item_type: 'Lost',
      location: 'SPSU Main Cafeteria & Food Court',
      report_date: '2026-11-12',
      image_path: null,
      identifying_details:
        'Inside front cover has course code CS-301 and hostel room number written in black fineliner.',
      verification_question:
        'What course code and enrollment number are written inside the front cover?',
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 3,
      created_at: '2026-11-12T14:10:00.000Z',
    },
    {
      item_id: 6,
      title: 'Found Hostel Room Keys & Blue RFID Access Fob',
      description:
        'Set of three brass keys (including Hostel Room 301 Yale key and cycle lock key) plus a dark blue SALTO electronic RFID access fob on a brushed steel carabiner.',
      category: 'Keys & Access',
      item_type: 'Found',
      location: 'Boys Hostel - Block 1 Bike Rack Entrance',
      report_date: '2026-11-12',
      image_path: '/src/assets/images/campus_keys_fob_1794584857697.jpg',
      identifying_details:
        'Brushed steel spring carabiner with three brass keys and a blue SALTO access tag.',
      verification_question:
        'What room number is stamped on the main brass key and what type of secondary key is attached?',
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 2,
      created_at: '2026-11-12T08:45:00.000Z',
    },
  ];

  const claims: ClaimRecord[] = [
    {
      claim_id: 1,
      item_id: 2,
      claimant_id: 3,
      identifying_features:
        'Black pebbled Nomad leather bifold wallet with an Udaipur city transit card and an SPSU cafeteria voucher in the right pocket.',
      verification_note:
        'I lost it around 12:30 PM on Nov 11 while walking between School of Engineering Block A and the Central Library. My fee receipt #8841 is folded in the bill compartment.',
      claim_status: 'Pending',
      reviewer_note: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-11-11T17:30:00.000Z',
    },
    {
      claim_id: 2,
      item_id: 4,
      claimant_id: 4,
      identifying_features:
        'Matte navy 32oz HYDRO bottle with black loop cap and a small circular scuff on the bottom edge.',
      verification_note:
        'Left it on the second row of the bleachers at SPSU Sports Complex after the 6 PM badminton practice.',
      claim_status: 'Approved',
      reviewer_note:
        'Verified scuff mark on bottom rim and SPSU ID at Proctor Office desk. Handed over.',
      reviewed_by: 1,
      reviewed_at: '2026-11-09T10:15:00.000Z',
      created_at: '2026-11-08T21:00:00.000Z',
    },
    {
      claim_id: 3,
      item_id: 6,
      claimant_id: 4,
      identifying_features:
        'Carabiner with Room 301 key, small brass cycle lock key, and blue SALTO fob.',
      verification_note:
        'Dropped near the Hostel Block 1 bike rack at 8:15 AM before morning lecture.',
      claim_status: 'Pending',
      reviewer_note: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-11-12T11:20:00.000Z',
    },
  ];

  const statusHistory: StatusHistoryRecord[] = [
    {
      history_id: 1,
      item_id: 1,
      old_status: 'None',
      new_status: 'Open',
      note: 'Initial lost SPSU ID card report submitted by student.',
      updated_by: 4,
      updated_at: '2026-11-10T16:40:00.000Z',
    },
    {
      history_id: 2,
      item_id: 2,
      old_status: 'None',
      new_status: 'Open',
      note: 'Found wallet logged at SPSU Central Library desk.',
      updated_by: 2,
      updated_at: '2026-11-11T13:15:00.000Z',
    },
    {
      history_id: 3,
      item_id: 3,
      old_status: 'None',
      new_status: 'Open',
      note: 'Initial lost charger report submitted.',
      updated_by: 3,
      updated_at: '2026-11-09T18:05:00.000Z',
    },
    {
      history_id: 4,
      item_id: 3,
      old_status: 'Open',
      new_status: 'Matched',
      note: 'Matched with unclaimed white Satechi adapter turned in to Block A custodian.',
      updated_by: 1,
      updated_at: '2026-11-11T09:30:00.000Z',
    },
    {
      history_id: 5,
      item_id: 4,
      old_status: 'None',
      new_status: 'Open',
      note: 'Found bottle logged at SPSU Sports Complex.',
      updated_by: 1,
      updated_at: '2026-11-08T19:50:00.000Z',
    },
    {
      history_id: 6,
      item_id: 4,
      old_status: 'Open',
      new_status: 'Matched',
      note: 'Ownership claim #2 verified by SPSU Proctor Office.',
      updated_by: 1,
      updated_at: '2026-11-09T10:00:00.000Z',
    },
    {
      history_id: 7,
      item_id: 4,
      old_status: 'Matched',
      new_status: 'Returned',
      note: 'Item physically returned to verified owner Ananya Mewara.',
      updated_by: 1,
      updated_at: '2026-11-09T10:15:00.000Z',
    },
    {
      history_id: 8,
      item_id: 5,
      old_status: 'None',
      new_status: 'Open',
      note: 'Initial lost notebook report submitted.',
      updated_by: 3,
      updated_at: '2026-11-12T14:10:00.000Z',
    },
    {
      history_id: 9,
      item_id: 6,
      old_status: 'None',
      new_status: 'Open',
      note: 'Found hostel keys and RFID fob logged by staff.',
      updated_by: 2,
      updated_at: '2026-11-12T08:45:00.000Z',
    },
  ];

  return {
    storeVersion: CURRENT_STORE_VERSION,
    users,
    items,
    claims,
    statusHistory,
    settings: {
      requireEduDomain: process.env.ALLOW_ANY_EMAIL_DOMAIN !== 'true',
    },
    counters: {
      user_id: 4,
      item_id: 6,
      claim_id: 3,
      history_id: 9,
    },
  };
}

// Optional MySQL Pool for local MySQL Server environments
export const mysqlPool = process.env.MYSQL_HOST
  ? mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'smart_campus_lost_found',
      waitForConnections: true,
      connectionLimit: 10,
    })
  : null;

class DatabaseManager {
  private store: RelationalStore;

  constructor() {
    this.store = this.loadFromDisk();
  }

  private loadFromDisk(): RelationalStore {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as RelationalStore;
        if (
          parsed &&
          parsed.storeVersion === CURRENT_STORE_VERSION &&
          Array.isArray(parsed.users) &&
          Array.isArray(parsed.items)
        ) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading persisted store, initializing seed store:', err);
    }
    const initial = createInitialSeedStore();
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(data: RelationalStore = this.store): void {
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store to disk:', err);
    }
  }

  public resetToSeed(): RelationalStore {
    this.store = createInitialSeedStore();
    this.saveToDisk();
    return this.store;
  }

  public getSettings() {
    return this.store.settings;
  }

  public updateSettings(requireEduDomain: boolean) {
    this.store.settings.requireEduDomain = requireEduDomain;
    this.saveToDisk();
    return this.store.settings;
  }

  // Users Table Operations
  public findUserByEmail(identifier: string): UserRecord | undefined {
    const normalized = identifier.trim().toLowerCase();
    const aliasNormalized = normalized.endsWith('@campus.edu')
      ? normalized.replace('@campus.edu', '@spsu.ac.in')
      : normalized;
    return this.store.users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.email.toLowerCase() === aliasNormalized ||
        (u.student_or_staff_id && u.student_or_staff_id.toLowerCase() === normalized)
    );
  }

  public findUserById(userId: number): UserRecord | undefined {
    return this.store.users.find((u) => u.user_id === userId);
  }

  public getAllUsers(): Omit<UserRecord, 'password_hash'>[] {
    return this.store.users.map(({ password_hash: _, ...rest }) => rest);
  }

  public createUser(data: {
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    department?: string;
    student_or_staff_id?: string;
  }): UserRecord {
    const nextId = ++this.store.counters.user_id;
    const newUser: UserRecord = {
      user_id: nextId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password_hash: data.password_hash,
      role: data.role,
      department: (data.department || 'General Campus').trim(),
      student_or_staff_id: data.student_or_staff_id?.trim() || `CMP-${1000 + nextId}`,
      created_at: new Date().toISOString(),
    };
    this.store.users.push(newUser);
    this.saveToDisk();
    return newUser;
  }

  public updateUserRole(userId: number, role: UserRole): UserRecord | undefined {
    const user = this.store.users.find((u) => u.user_id === userId);
    if (!user) return undefined;
    user.role = role;
    this.saveToDisk();
    return user;
  }

  // Items Table Operations (with JOIN metadata and privacy masking)
  public enrichItem(item: ItemRecord, includePrivateDetails = false): ItemRecord {
    const reporter = this.findUserById(item.user_id);
    const claimCount = this.store.claims.filter((c) => c.item_id === item.item_id).length;
    return {
      ...item,
      identifying_details: includePrivateDetails ? item.identifying_details : undefined,
      reporter_name: reporter ? reporter.name : 'Campus Member',
      reporter_role: reporter ? reporter.role : 'student',
      reporter_department: reporter ? reporter.department : 'University Campus',
      reporter_masked_email: reporter ? maskEmailAddress(reporter.email) : 'member@***.edu',
      claim_count: claimCount,
    };
  }

  public getAllItems(includePrivateDetails = false): ItemRecord[] {
    return [...this.store.items]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((item) => this.enrichItem(item, includePrivateDetails));
  }

  public getItemById(itemId: number, includePrivateDetails = false): ItemRecord | undefined {
    const item = this.store.items.find((i) => i.item_id === itemId);
    if (!item) return undefined;
    return this.enrichItem(item, includePrivateDetails);
  }

  public createItem(data: {
    title: string;
    description: string;
    category: ItemCategory;
    item_type: ItemType;
    location: string;
    report_date: string;
    image_path?: string | null;
    identifying_details?: string | null;
    verification_question?: string | null;
    user_id: number;
  }): ItemRecord {
    const nextId = ++this.store.counters.item_id;
    const now = new Date().toISOString();
    const newItem: ItemRecord = {
      item_id: nextId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      item_type: data.item_type,
      location: data.location.trim(),
      report_date: data.report_date,
      image_path: data.image_path || null,
      identifying_details: data.identifying_details?.trim() || null,
      verification_question:
        data.verification_question?.trim() ||
        'Please describe any unique marks, serial numbers, or contents to verify ownership.',
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: data.user_id,
      created_at: now,
    };
    this.store.items.push(newItem);

    // Log initial status in StatusHistory
    const historyId = ++this.store.counters.history_id;
    this.store.statusHistory.push({
      history_id: historyId,
      item_id: nextId,
      old_status: 'None',
      new_status: 'Open',
      note: `Initial ${data.item_type.toLowerCase()} item report submitted.`,
      updated_by: data.user_id,
      updated_at: now,
    });

    this.saveToDisk();
    return this.enrichItem(newItem, true);
  }

  public updateItem(
    itemId: number,
    updates: Partial<{
      title: string;
      description: string;
      category: ItemCategory;
      item_type: ItemType;
      location: string;
      report_date: string;
      image_path: string | null;
      identifying_details: string | null;
      verification_question: string | null;
      status: ItemStatus;
      is_flagged_duplicate: boolean;
    }>,
    updatedByUserId: number,
    statusNote?: string
  ): ItemRecord | undefined {
    const item = this.store.items.find((i) => i.item_id === itemId);
    if (!item) return undefined;

    const oldStatus = item.status;
    if (updates.title !== undefined) item.title = updates.title.trim();
    if (updates.description !== undefined) item.description = updates.description.trim();
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.item_type !== undefined) item.item_type = updates.item_type;
    if (updates.location !== undefined) item.location = updates.location.trim();
    if (updates.report_date !== undefined) item.report_date = updates.report_date;
    if (updates.image_path !== undefined) item.image_path = updates.image_path;
    if (updates.identifying_details !== undefined) {
      item.identifying_details = updates.identifying_details?.trim() || null;
    }
    if (updates.verification_question !== undefined) {
      item.verification_question = updates.verification_question?.trim() || null;
    }
    if (updates.is_flagged_duplicate !== undefined) {
      item.is_flagged_duplicate = updates.is_flagged_duplicate;
    }

    if (updates.status !== undefined && updates.status !== oldStatus) {
      item.status = updates.status;
      const historyId = ++this.store.counters.history_id;
      this.store.statusHistory.push({
        history_id: historyId,
        item_id: itemId,
        old_status: oldStatus,
        new_status: updates.status,
        note: statusNote || `Status changed from ${oldStatus} to ${updates.status}.`,
        updated_by: updatedByUserId,
        updated_at: new Date().toISOString(),
      });
    }

    this.saveToDisk();
    return this.enrichItem(item, true);
  }

  public deleteItem(itemId: number): boolean {
    const idx = this.store.items.findIndex((i) => i.item_id === itemId);
    if (idx === -1) return false;
    this.store.items.splice(idx, 1);
    // Cascade delete claims and status history
    this.store.claims = this.store.claims.filter((c) => c.item_id !== itemId);
    this.store.statusHistory = this.store.statusHistory.filter((h) => h.item_id !== itemId);
    this.saveToDisk();
    return true;
  }

  // Claims Table Operations
  public enrichClaim(claim: ClaimRecord): ClaimRecord {
    const item = this.store.items.find((i) => i.item_id === claim.item_id);
    const claimant = this.findUserById(claim.claimant_id);
    return {
      ...claim,
      item_title: item?.title || 'Deleted Item',
      item_type: item?.item_type,
      item_category: item?.category,
      item_location: item?.location,
      item_status: item?.status,
      item_image_path: item?.image_path || null,
      claimant_name: claimant?.name || 'Campus Member',
      claimant_role: claimant?.role || 'student',
      claimant_department: claimant?.department || 'University Campus',
      claimant_masked_email: claimant ? maskEmailAddress(claimant.email) : 'member@***.edu',
    };
  }

  public getAllClaims(): ClaimRecord[] {
    return [...this.store.claims]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => this.enrichClaim(c));
  }

  public getClaimsByUser(claimantId: number): ClaimRecord[] {
    return this.store.claims
      .filter((c) => c.claimant_id === claimantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => this.enrichClaim(c));
  }

  public getClaimsForItem(itemId: number): ClaimRecord[] {
    return this.store.claims
      .filter((c) => c.item_id === itemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => this.enrichClaim(c));
  }

  public getClaimById(claimId: number): ClaimRecord | undefined {
    const claim = this.store.claims.find((c) => c.claim_id === claimId);
    return claim ? this.enrichClaim(claim) : undefined;
  }

  public createClaim(data: {
    item_id: number;
    claimant_id: number;
    identifying_features: string;
    verification_note: string;
  }): ClaimRecord {
    const nextId = ++this.store.counters.claim_id;
    const newClaim: ClaimRecord = {
      claim_id: nextId,
      item_id: data.item_id,
      claimant_id: data.claimant_id,
      identifying_features: data.identifying_features.trim(),
      verification_note: data.verification_note.trim(),
      claim_status: 'Pending',
      reviewer_note: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };
    this.store.claims.push(newClaim);
    this.saveToDisk();
    return this.enrichClaim(newClaim);
  }

  public updateClaimStatus(
    claimId: number,
    status: ClaimStatus,
    reviewerId: number,
    reviewerNote?: string,
    markItemReturned = false
  ): ClaimRecord | undefined {
    const claim = this.store.claims.find((c) => c.claim_id === claimId);
    if (!claim) return undefined;

    claim.claim_status = status;
    claim.reviewed_by = reviewerId;
    claim.reviewed_at = new Date().toISOString();
    if (reviewerNote !== undefined) {
      claim.reviewer_note = reviewerNote.trim() || null;
    }

    // If approved, update item status to Matched (or Returned if requested)
    if (status === 'Approved') {
      const targetItemStatus: ItemStatus = markItemReturned ? 'Returned' : 'Matched';
      this.updateItem(
        claim.item_id,
        { status: targetItemStatus },
        reviewerId,
        `Ownership claim #${claim.claim_id} approved (${targetItemStatus}).`
      );
      // Automatically reject other pending claims on the same item
      this.store.claims.forEach((other) => {
        if (other.item_id === claim.item_id && other.claim_id !== claim.claim_id && other.claim_status === 'Pending') {
          other.claim_status = 'Rejected';
          other.reviewed_by = reviewerId;
          other.reviewed_at = new Date().toISOString();
          other.reviewer_note = 'Another verified ownership claim was approved for this item.';
        }
      });
    }

    this.saveToDisk();
    return this.enrichClaim(claim);
  }

  // StatusHistory Operations
  public getStatusHistoryForItem(itemId: number): StatusHistoryRecord[] {
    return this.store.statusHistory
      .filter((h) => h.item_id === itemId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map((h) => {
        const user = this.findUserById(h.updated_by);
        return {
          ...h,
          updated_by_name: user?.name || 'System Admin',
          updated_by_role: user?.role || 'admin',
        };
      });
  }

  public getRecentStatusHistory(limit = 15): StatusHistoryRecord[] {
    return [...this.store.statusHistory]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit)
      .map((h) => {
        const user = this.findUserById(h.updated_by);
        return {
          ...h,
          updated_by_name: user?.name || 'System Admin',
          updated_by_role: user?.role || 'admin',
        };
      });
  }
}

export const db = new DatabaseManager();
