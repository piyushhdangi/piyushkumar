import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.ts';
import {
  createSession,
  destroySession,
  attachOptionalUser,
  requireAuth,
  requireRole,
} from '../middleware/auth.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  validateRegistrationInput,
  validateItemInput,
  validateClaimEligibility,
  filterItems,
  detectPotentialDuplicates,
} from '../../src/utils/campusLogic.ts';
import type {
  UserRole,
  ItemCategory,
  ItemType,
  ItemStatus,
  ClaimStatus,
} from '../../src/utils/campusLogic.ts';

export const apiRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'backend/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function saveBase64ImageIfPresent(imageData?: string | null): {
  valid: boolean;
  path?: string | null;
  error?: string;
} {
  if (!imageData) return { valid: true, path: null };
  // If already a relative asset path or URL, allow it
  if (imageData.startsWith('/src/assets/') || imageData.startsWith('/uploads/')) {
    return { valid: true, path: imageData };
  }
  const match = imageData.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) {
    return {
      valid: false,
      error: 'Invalid image format. Only JPEG, PNG, and WebP images are permitted.',
    };
  }
  const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const base64Payload = match[2];
  const buffer = Buffer.from(base64Payload, 'base64');
  const maxBytes = 4 * 1024 * 1024; // 4 MB limit
  if (buffer.byteLength > maxBytes) {
    return {
      valid: false,
      error: 'Uploaded image exceeds the 4MB maximum file size limit.',
    };
  }
  const fileName = `item_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const fullPath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(fullPath, buffer);
  return { valid: true, path: `/uploads/${fileName}` };
}

function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `campus_sid=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${isProd ? 'None; Secure' : 'Lax'}; Max-Age=${60 * 60 * 24 * 7}`
  );
}

// ============================================================================
// 1. AUTHENTICATION ROUTES
// ============================================================================

apiRouter.post('/auth/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, department, student_or_staff_id } = req.body || {};
    const settings = db.getSettings();
    const assignedRole: UserRole =
      role === 'staff' ? 'staff' : 'student'; // Prevent self-registration as admin

    const validation = validateRegistrationInput({
      name,
      email,
      password,
      role: assignedRole,
      requireEduDomain: settings.requireEduDomain,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this campus email already exists.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const createdUser = db.createUser({
      name,
      email,
      password_hash,
      role: assignedRole,
      department: department || (assignedRole === 'staff' ? 'Campus Operations' : 'Undergraduate Studies'),
      student_or_staff_id,
    });

    const token = createSession(createdUser.user_id);
    setSessionCookie(res, token);

    const { password_hash: _, ...safeUser } = createdUser;
    res.status(201).json({
      message: 'Registration successful.',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Error in POST /api/auth/register:', err);
    res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
});

apiRouter.post('/auth/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, portalRole } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'SPSU Email / Enrollment ID and password are required.' });
      return;
    }

    const user = db.findUserByEmail(String(email));
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid SPSU email, enrollment ID, or password.' });
      return;
    }

    const validPassword = await bcrypt.compare(String(password), user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid SPSU email, enrollment ID, or password.' });
      return;
    }

    if (portalRole === 'admin' && user.role !== 'admin') {
      res.status(403).json({
        error:
          'Access denied: This account does not have SPSU Administrator privileges. Please use the Student Login tab.',
      });
      return;
    }

    const token = createSession(user.user_id);
    setSessionCookie(res, token);

    const { password_hash: _, ...safeUser } = user;
    res.json({
      message: `Signed in as ${safeUser.name} (${safeUser.role.toUpperCase()}).`,
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Error in POST /api/auth/login:', err);
    res.status(500).json({ error: 'Sign in failed due to a server error.' });
  }
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  attachOptionalUser(req, res, () => {});
  if (req.sessionToken) {
    destroySession(req.sessionToken);
  }
  res.setHeader('Set-Cookie', 'campus_sid=; Path=/; HttpOnly; Max-Age=0');
  res.json({ message: 'Signed out successfully.' });
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  attachOptionalUser(req, res, () => {});
  res.json({
    user: req.user || null,
    settings: db.getSettings(),
  });
});

// ============================================================================
// 2. PUBLIC & USER STATISTICS + ITEMS ROUTES
// ============================================================================

apiRouter.get('/stats/overview', (req: AuthenticatedRequest, res: Response) => {
  attachOptionalUser(req, res, () => {});
  const allItems = db.getAllItems(false);
  const allClaims = db.getAllClaims();

  const totalLost = allItems.filter((i) => i.item_type === 'Lost').length;
  const totalFound = allItems.filter((i) => i.item_type === 'Found').length;
  const totalReturned = allItems.filter((i) => i.status === 'Returned').length;
  const totalMatched = allItems.filter((i) => i.status === 'Matched').length;
  const activeOpen = allItems.filter((i) => i.status === 'Open').length;
  const activeClaims = allClaims.filter((c) => c.claim_status === 'Pending').length;

  let userStats = null;
  if (req.user) {
    const userItems = allItems.filter((i) => i.user_id === req.user!.user_id);
    const userClaims = allClaims.filter((c) => c.claimant_id === req.user!.user_id);
    const incomingClaims = allClaims.filter((c) =>
      userItems.some((ui) => ui.item_id === c.item_id)
    );
    userStats = {
      myLostCount: userItems.filter((i) => i.item_type === 'Lost').length,
      myFoundCount: userItems.filter((i) => i.item_type === 'Found').length,
      myActiveClaims: userClaims.filter((c) => c.claim_status === 'Pending').length,
      myReturnedCount:
        userItems.filter((i) => i.status === 'Returned').length +
        userClaims.filter((c) => c.claim_status === 'Approved').length,
      incomingPendingClaims: incomingClaims.filter((c) => c.claim_status === 'Pending').length,
    };
  }

  res.json({
    campusStats: {
      totalReports: allItems.length,
      totalLost,
      totalFound,
      totalReturned,
      totalMatched,
      activeOpen,
      activeClaims,
      recoveryRate:
        allItems.length > 0
          ? Math.round(((totalReturned + totalMatched) / allItems.length) * 100)
          : 0,
    },
    userStats,
    recentHistory: db.getRecentStatusHistory(8),
  });
});

apiRouter.get('/items', (req: AuthenticatedRequest, res: Response) => {
  attachOptionalUser(req, res, () => {});
  const isAdmin = req.user?.role === 'admin';
  const allItems = db.getAllItems(isAdmin);

  const filtered = filterItems(allItems, {
    keyword: typeof req.query.keyword === 'string' ? req.query.keyword : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    location: typeof req.query.location === 'string' ? req.query.location : undefined,
    dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined,
    dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined,
    itemType: typeof req.query.itemType === 'string' ? req.query.itemType : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  });

  res.json({ items: filtered });
});

apiRouter.get('/items/:id', (req: AuthenticatedRequest, res: Response) => {
  attachOptionalUser(req, res, () => {});
  const itemId = Number(req.params.id);
  if (Number.isNaN(itemId)) {
    res.status(400).json({ error: 'Invalid item ID.' });
    return;
  }

  const rawItem = db.getItemById(itemId, true);
  if (!rawItem) {
    res.status(404).json({ error: 'Item report not found.' });
    return;
  }

  const isOwnerOrAdmin =
    req.user && (req.user.user_id === rawItem.user_id || req.user.role === 'admin');
  const item = db.getItemById(itemId, Boolean(isOwnerOrAdmin))!;
  const statusHistory = db.getStatusHistoryForItem(itemId);
  const claims = isOwnerOrAdmin
    ? db.getClaimsForItem(itemId)
    : req.user
    ? db.getClaimsForItem(itemId).filter((c) => c.claimant_id === req.user!.user_id)
    : [];

  res.json({
    item,
    statusHistory,
    claims,
  });
});

apiRouter.post('/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      item_type,
      location,
      report_date,
      image_data,
      identifying_details,
      verification_question,
    } = req.body || {};

    const validation = validateItemInput({
      title,
      description,
      category,
      item_type,
      location,
      report_date,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const imageUpload = saveBase64ImageIfPresent(image_data);
    if (!imageUpload.valid) {
      res.status(400).json({ error: imageUpload.error });
      return;
    }

    const created = db.createItem({
      title,
      description,
      category: category as ItemCategory,
      item_type: item_type as ItemType,
      location,
      report_date,
      image_path: imageUpload.path,
      identifying_details,
      verification_question,
      user_id: req.user!.user_id,
    });

    res.status(201).json({
      message: `${item_type} item report published successfully.`,
      item: created,
    });
  } catch (err) {
    console.error('Error in POST /api/items:', err);
    res.status(500).json({ error: 'Failed to create item report.' });
  }
});

apiRouter.put('/items/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const existing = db.getItemById(itemId, true);
    if (!existing) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    if (existing.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'You are only authorized to edit your own reports.' });
      return;
    }

    const {
      title,
      description,
      category,
      item_type,
      location,
      report_date,
      image_data,
      identifying_details,
      verification_question,
      status,
    } = req.body || {};

    const validation = validateItemInput({
      title: title ?? existing.title,
      description: description ?? existing.description,
      category: category ?? existing.category,
      item_type: item_type ?? existing.item_type,
      location: location ?? existing.location,
      report_date: report_date ?? existing.report_date,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    let nextImagePath = existing.image_path;
    if (image_data !== undefined) {
      if (image_data === null || image_data === '') {
        nextImagePath = null;
      } else {
        const uploaded = saveBase64ImageIfPresent(image_data);
        if (!uploaded.valid) {
          res.status(400).json({ error: uploaded.error });
          return;
        }
        nextImagePath = uploaded.path ?? existing.image_path;
      }
    }

    const updated = db.updateItem(
      itemId,
      {
        title,
        description,
        category,
        item_type,
        location,
        report_date,
        image_path: nextImagePath,
        identifying_details,
        verification_question,
        status,
      },
      req.user!.user_id,
      'Report details updated by owner.'
    );

    res.json({
      message: 'Item report updated successfully.',
      item: updated,
    });
  } catch (err) {
    console.error('Error in PUT /api/items/:id:', err);
    res.status(500).json({ error: 'Failed to update item report.' });
  }
});

apiRouter.delete('/items/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const itemId = Number(req.params.id);
  const existing = db.getItemById(itemId, true);
  if (!existing) {
    res.status(404).json({ error: 'Item report not found.' });
    return;
  }

  if (existing.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'You are only authorized to delete your own reports.' });
    return;
  }

  db.deleteItem(itemId);
  res.json({ message: 'Item report deleted successfully.' });
});

// ============================================================================
// 3. CLAIMS ROUTES
// ============================================================================

apiRouter.post('/claims', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { item_id, identifying_features, verification_note } = req.body || {};
    const numericItemId = Number(item_id);
    const item = db.getItemById(numericItemId, true);
    if (!item) {
      res.status(404).json({ error: 'Target item report not found.' });
      return;
    }

    const existingClaims = db.getClaimsForItem(numericItemId);
    const eligibility = validateClaimEligibility({
      item,
      claimantId: req.user!.user_id,
      identifyingFeatures: identifying_features,
      verificationNote: verification_note,
      existingClaimsForItem: existingClaims,
    });

    if (!eligibility.valid) {
      res.status(400).json({ error: eligibility.error });
      return;
    }

    const createdClaim = db.createClaim({
      item_id: numericItemId,
      claimant_id: req.user!.user_id,
      identifying_features,
      verification_note,
    });

    res.status(201).json({
      message: 'Ownership claim submitted for verification.',
      claim: createdClaim,
    });
  } catch (err) {
    console.error('Error in POST /api/claims:', err);
    res.status(500).json({ error: 'Failed to submit ownership claim.' });
  }
});

apiRouter.get('/claims/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const myClaims = db.getClaimsByUser(req.user!.user_id);
  const myItems = db.getAllItems(true).filter((i) => i.user_id === req.user!.user_id);
  const claimsOnMyItems = myItems.flatMap((item) => db.getClaimsForItem(item.item_id));

  res.json({
    submittedClaims: myClaims,
    receivedClaims: claimsOnMyItems,
  });
});

apiRouter.get('/claims/item/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const itemId = Number(req.params.itemId);
  const item = db.getItemById(itemId, true);
  if (!item) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  if (item.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
    res.status(403).json({
      error: 'Only the report author or a campus administrator can view all claims for this item.',
    });
    return;
  }

  res.json({
    claims: db.getClaimsForItem(itemId),
  });
});

apiRouter.patch('/claims/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const claimId = Number(req.params.id);
  const claim = db.getClaimById(claimId);
  if (!claim) {
    res.status(404).json({ error: 'Claim request not found.' });
    return;
  }

  const item = db.getItemById(claim.item_id, true);
  if (!item) {
    res.status(404).json({ error: 'Associated item not found.' });
    return;
  }

  // Only authorized item reporter or admin can approve/reject a claim
  if (item.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
    res.status(403).json({
      error: 'Only the authorized report owner or campus administrator can approve or reject claims.',
    });
    return;
  }

  const { status, reviewer_note, mark_item_returned } = req.body || {};
  const validStatuses: ClaimStatus[] = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid claim status.' });
    return;
  }

  const updated = db.updateClaimStatus(
    claimId,
    status,
    req.user!.user_id,
    reviewer_note,
    Boolean(mark_item_returned)
  );

  res.json({
    message: `Claim request marked as ${status}.`,
    claim: updated,
  });
});

// ============================================================================
// 4. ADMIN ROUTES
// ============================================================================

apiRouter.get(
  '/admin/dashboard',
  requireRole(['admin']),
  (_req: AuthenticatedRequest, res: Response) => {
    const users = db.getAllUsers();
    const items = db.getAllItems(true);
    const claims = db.getAllClaims();
    const statusHistory = db.getRecentStatusHistory(15);

    const duplicatePairs = items
      .map((item) => ({
        item,
        matches: detectPotentialDuplicates(item, items),
      }))
      .filter((entry) => entry.matches.length > 0 || entry.item.is_flagged_duplicate);

    res.json({
      metrics: {
        totalUsers: users.length,
        totalStudents: users.filter((u) => u.role === 'student').length,
        totalStaff: users.filter((u) => u.role === 'staff').length,
        totalAdmins: users.filter((u) => u.role === 'admin').length,
        totalItems: items.length,
        totalLost: items.filter((i) => i.item_type === 'Lost').length,
        totalFound: items.filter((i) => i.item_type === 'Found').length,
        openItems: items.filter((i) => i.status === 'Open').length,
        matchedItems: items.filter((i) => i.status === 'Matched').length,
        returnedItems: items.filter((i) => i.status === 'Returned').length,
        closedItems: items.filter((i) => i.status === 'Closed').length,
        pendingClaims: claims.filter((c) => c.claim_status === 'Pending').length,
        approvedClaims: claims.filter((c) => c.claim_status === 'Approved').length,
        rejectedClaims: claims.filter((c) => c.claim_status === 'Rejected').length,
        flaggedDuplicates: items.filter((i) => i.is_flagged_duplicate).length,
      },
      recentReports: items.slice(0, 8),
      claims,
      statusHistory,
      duplicateAlerts: duplicatePairs,
      settings: db.getSettings(),
    });
  }
);

apiRouter.get(
  '/admin/users',
  requireRole(['admin']),
  (_req: AuthenticatedRequest, res: Response) => {
    const users = db.getAllUsers();
    const items = db.getAllItems(true);
    const claims = db.getAllClaims();

    const enrichedUsers = users.map((u) => ({
      ...u,
      reports_count: items.filter((i) => i.user_id === u.user_id).length,
      claims_count: claims.filter((c) => c.claimant_id === u.user_id).length,
    }));

    res.json({ users: enrichedUsers });
  }
);

apiRouter.patch(
  '/admin/users/:id/role',
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const targetUserId = Number(req.params.id);
    const { role } = req.body || {};
    const validRoles: UserRole[] = ['student', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    const updated = db.updateUserRole(targetUserId, role);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { password_hash: _, ...safeUser } = updated;
    res.json({
      message: `Updated ${safeUser.name}'s role to ${role}.`,
      user: safeUser,
    });
  }
);

apiRouter.get(
  '/admin/reports',
  requireRole(['admin']),
  (_req: AuthenticatedRequest, res: Response) => {
    const items = db.getAllItems(true);
    res.json({ reports: items });
  }
);

apiRouter.patch(
  '/admin/items/:id/status',
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const itemId = Number(req.params.id);
    const { status, note, is_flagged_duplicate } = req.body || {};

    const validStatuses: ItemStatus[] = ['Open', 'Matched', 'Returned', 'Closed'];
    if (status !== undefined && !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid item status. Must be Open, Matched, Returned, or Closed.' });
      return;
    }

    const updated = db.updateItem(
      itemId,
      {
        status,
        is_flagged_duplicate,
      },
      req.user!.user_id,
      note || (status ? `Admin updated status to ${status}.` : undefined)
    );

    if (!updated) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    res.json({
      message: 'Item moderation status updated.',
      item: updated,
    });
  }
);

apiRouter.patch(
  '/admin/settings',
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { requireEduDomain } = req.body || {};
    const updated = db.updateSettings(Boolean(requireEduDomain));
    res.json({
      message: 'Campus registration policy updated.',
      settings: updated,
    });
  }
);

apiRouter.post(
  '/admin/reset-demo',
  requireRole(['admin']),
  (_req: AuthenticatedRequest, res: Response) => {
    db.resetToSeed();
    res.json({
      message: 'Database reset to initial campus demo seed state.',
    });
  }
);
