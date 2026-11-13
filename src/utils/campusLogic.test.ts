import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskEmailAddress,
  validateCollegeEmail,
  validateRegistrationInput,
  validateItemInput,
  validateClaimEligibility,
  filterItems,
  detectPotentialDuplicates,
  type ItemRecord,
} from './campusLogic';

test('maskEmailAddress hides personal email details while preserving campus domain', () => {
  assert.equal(maskEmailAddress('student@spsu.ac.in'), 'st***t@spsu.ac.in');
  assert.equal(maskEmailAddress('ab@spsu.ac.in'), 'a***@spsu.ac.in');
});

test('validateCollegeEmail enforces academic email domains when enabled', () => {
  assert.equal(validateCollegeEmail('piyush@spsu.ac.in', true).valid, true);
  assert.equal(validateCollegeEmail('prof@spsu.ac.in', true).valid, true);
  assert.equal(validateCollegeEmail('random@gmail.com', true).valid, false);
  assert.equal(validateCollegeEmail('random@gmail.com', false).valid, true);
});

test('validateRegistrationInput validates name, email, and password length', () => {
  assert.equal(
    validateRegistrationInput({
      name: 'Aarav Sharma',
      email: 'aarav@campus.edu',
      password: 'Password123',
      role: 'student',
    }).valid,
    true
  );
  assert.equal(
    validateRegistrationInput({
      name: 'A',
      email: 'aarav@campus.edu',
      password: 'Password123',
    }).valid,
    false
  );
  assert.equal(
    validateRegistrationInput({
      name: 'Aarav Sharma',
      email: 'aarav@campus.edu',
      password: '123',
    }).valid,
    false
  );
});

test('validateItemInput checks required report fields', () => {
  assert.equal(
    validateItemInput({
      title: 'Lost Calculus Textbook',
      description: 'Stewart Calculus 8th edition hardcover left in lecture room 104.',
      category: 'Books & Notes',
      item_type: 'Lost',
      location: 'Science Hall 104',
      report_date: '2026-11-12',
    }).valid,
    true
  );
  assert.equal(
    validateItemInput({
      title: 'Hi',
      description: 'Short',
      category: 'Books & Notes',
      item_type: 'Lost',
      location: 'Lab',
      report_date: '2026-11-12',
    }).valid,
    false
  );
});

test('validateClaimEligibility blocks self-claiming, closed items, and duplicate claims', () => {
  const sampleItem = {
    item_id: 2,
    user_id: 2,
    status: 'Open' as const,
    item_type: 'Found' as const,
  };

  // Prevent claiming own item
  const selfClaim = validateClaimEligibility({
    item: sampleItem,
    claimantId: 2,
    identifyingFeatures: 'Black leather wallet with Nomad logo on cover',
    verificationNote: 'Contains my student transit pass and meal card',
  });
  assert.equal(selfClaim.valid, false);

  // Valid claim by different user
  const validClaim = validateClaimEligibility({
    item: sampleItem,
    claimantId: 3,
    identifyingFeatures: 'Black leather wallet with Nomad logo on cover',
    verificationNote: 'Contains my student transit pass and meal card',
  });
  assert.equal(validClaim.valid, true);

  // Block duplicate claim by same user
  const dupClaim = validateClaimEligibility({
    item: sampleItem,
    claimantId: 3,
    identifyingFeatures: 'Black leather wallet with Nomad logo on cover',
    verificationNote: 'Contains my student transit pass and meal card',
    existingClaimsForItem: [{ claimant_id: 3, claim_status: 'Pending' }],
  });
  assert.equal(dupClaim.valid, false);
});

test('filterItems and detectPotentialDuplicates accurately filter and match items', () => {
  const items: ItemRecord[] = [
    {
      item_id: 1,
      title: 'Lost College ID Card',
      description: 'Blue lanyard ID card',
      category: 'ID & Cards',
      item_type: 'Lost',
      location: 'Central Library',
      report_date: '2026-11-10',
      image_path: null,
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 4,
      created_at: '2026-11-10T10:00:00Z',
    },
    {
      item_id: 2,
      title: 'Found Black Leather Wallet',
      description: 'Found near engineering bench',
      category: 'Wallets & Bags',
      item_type: 'Found',
      location: 'Engineering Quad',
      report_date: '2026-11-11',
      image_path: null,
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 2,
      created_at: '2026-11-11T10:00:00Z',
    },
    {
      item_id: 7,
      title: 'Lost Student College Card',
      description: 'Misplaced ID card near library reading desk',
      category: 'ID & Cards',
      item_type: 'Lost',
      location: 'Central Library',
      report_date: '2026-11-12',
      image_path: null,
      status: 'Open',
      is_flagged_duplicate: false,
      user_id: 3,
      created_at: '2026-11-12T10:00:00Z',
    },
  ];

  assert.equal(filterItems(items, { itemType: 'Found' }).length, 1);
  assert.equal(filterItems(items, { category: 'ID & Cards', keyword: 'lanyard' }).length, 1);
  assert.equal(detectPotentialDuplicates(items[0], items).length, 1);
});
