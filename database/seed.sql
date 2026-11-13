# ============================================================================
# Smart Campus Lost & Found System (SPSU Udaipur) - MySQL Seed Data
# Demo Accounts:
#   Admin:   admin@spsu.ac.in         / Admin@123
#   Staff:   staff@spsu.ac.in         / Staff@123
#   Student: student@spsu.ac.in       / Student@123
#   Student: ananya.mewara@spsu.ac.in / Student@123
# ============================================================================

USE smart_campus_lost_found;

-- Insert Demo Users (bcrypt hashes for Admin@123, Staff@123, Student@123)
INSERT INTO Users (user_id, name, email, password_hash, role, department, student_or_staff_id, created_at) VALUES
(1, 'Dr. Rajeshwar Singh', 'admin@spsu.ac.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'SPSU Proctor & Security Office', 'SPSU-ADM-01', '2026-10-01 08:00:00'),
(2, 'Vikramaditya Rathore', 'staff@spsu.ac.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'SPSU Central Library', 'SPSU-STF-104', '2026-10-05 09:15:00'),
(3, 'Aarav Sharma', 'student@spsu.ac.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'School of Engineering (B.Tech CSE)', '22CSE1048', '2026-10-12 11:30:00'),
(4, 'Ananya Mewara', 'ananya.mewara@spsu.ac.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'School of Management (BBA)', '23BBA2019', '2026-10-15 14:20:00');

-- Insert 6 Realistic Demo Items
INSERT INTO Items (
  item_id, title, description, category, item_type, location, report_date,
  image_path, identifying_details, verification_question, status, is_flagged_duplicate, user_id, created_at
) VALUES
(
  1,
  'Lost College ID Card',
  'University student identification card inside a clear polycarbonate badge holder attached to a deep navy blue woven lanyard. Misplaced while studying on the 2nd floor reading room tables.',
  'ID & Cards',
  'Lost',
  'Central Library - 2nd Floor Reading Room',
  '2026-11-10',
  '/src/assets/images/campus_id_card_1794584854139.jpg',
  'Name printed is Eliza Reed, Environmental Science Class of 2026. Has a small silver clip on the top slot.',
  'What is the 8-digit Student ID number or major printed on the front of the card?',
  'Open',
  0,
  4,
  '2026-11-10 16:40:00'
),
(
  2,
  'Found Black Leather Wallet',
  'Minimalist black pebbled leather bifold wallet found on the stone courtyard bench outside the Engineering Block after the afternoon lectures. Turned in to the Central Library desk for safekeeping.',
  'Wallets & Bags',
  'Found',
  'Engineering Quad - Courtyard Bench B4',
  '2026-11-11',
  '/src/assets/images/black_leather_wallet_1794584854291.jpg',
  'Nomad brand embossed on the front corner. Contains transit card and library meal voucher inside.',
  'Which bank card issuer and what specific transit or campus pass is tucked in the right slot?',
  'Open',
  0,
  2,
  '2026-11-11 13:15:00'
),
(
  3,
  'Lost 65W USB-C Laptop Charger',
  'White Satechi 65W USB-C power adapter brick with a 2-meter braided white USB-C charging cable and grey velcro cable tie. Left plugged into the floor socket under row 4.',
  'Electronics',
  'Lost',
  'Science Lecture Hall 302',
  '2026-11-09',
  '/src/assets/images/laptop_charger_adapter_1794584854705.jpg',
  'Has a small blue dot sticker near the USB-C port to distinguish it during lab sessions.',
  'Is there any sticker or mark near the output port of the adapter brick?',
  'Matched',
  0,
  3,
  '2026-11-09 18:05:00'
),
(
  4,
  'Found Matte Navy Insulated Water Bottle',
  '32oz matte navy blue stainless steel insulated water bottle with a wide black carry loop cap. Found near the indoor basketball court bleachers after evening intramurals.',
  'Bottles & Gear',
  'Found',
  'Student Recreation Center - Court 2',
  '2026-11-08',
  '/src/assets/images/insulated_water_bottle_1794584856226.jpg',
  'Vertical HYDRO wordmark laser-etched near the base; minor scuff on the bottom rim.',
  'What brand name is etched near the base and are there any dents or markings on the bottom?',
  'Returned',
  0,
  1,
  '2026-11-08 19:50:00'
),
(
  5,
  'Lost Data Structures & Algorithms Lab Notebook',
  'Hardcover dotted-grid A4 engineering notebook with dark navy cover containing handwritten lecture notes, red-black tree diagrams, and graded lab sheets from Weeks 1 to 9.',
  'Books & Notes',
  'Lost',
  'Student Union Cafeteria - North Booths',
  '2026-11-12',
  NULL,
  'Inside front cover has course code CS-301 and phone extension written in black fineliner.',
  'What course code and section number are written inside the front cover?',
  'Open',
  0,
  3,
  '2026-11-12 14:10:00'
),
(
  6,
  'Found Dorm Keys & Blue RFID Access Fob',
  'Set of three brass keys (including Dorm 301 Yale key and Bike Lock key) plus a dark blue SALTO electronic RFID access fob on a brushed steel carabiner.',
  'Keys & Access',
  'Found',
  'North Residence Hall - Bike Rack Entrance',
  '2026-11-12',
  '/src/assets/images/campus_keys_fob_1794584857697.jpg',
  'Brushed steel spring carabiner with three brass keys and a blue SALTO access tag.',
  'What room number is stamped on the main brass key and what type of secondary key is attached?',
  'Open',
  0,
  2,
  '2026-11-12 08:45:00'
);

-- Insert Demo Claims
INSERT INTO Claims (
  claim_id, item_id, claimant_id, identifying_features, verification_note,
  claim_status, reviewer_note, reviewed_by, reviewed_at, created_at
) VALUES
(
  1,
  2,
  3,
  'Black pebbled Nomad leather bifold wallet with a Metro Campus Transit card and a $15 Cafeteria voucher in the right pocket.',
  'I lost it around 12:30 PM on Nov 11 while walking between Engineering Hall and the Library. My student ID receipt #8841 is folded in the bill compartment.',
  'Pending',
  NULL,
  NULL,
  NULL,
  '2026-11-11 17:30:00'
),
(
  2,
  4,
  4,
  'Matte navy 32oz HYDRO bottle with black loop cap and a small circular scuff on the bottom edge from my bike cage.',
  'Left it on the second row of the bleachers after the 6 PM badminton practice.',
  'Approved',
  'Verified scuff mark on bottom rim and student ID at Campus Security desk. Handed over.',
  1,
  '2026-11-09 10:15:00',
  '2026-11-08 21:00:00'
),
(
  3,
  6,
  4,
  'Carabiner with Dorm 301 key, small brass Abus bike lock key, and blue SALTO fob.',
  'Dropped near the North Residence bike rack while unlocking my commuter bike at 8:15 AM.',
  'Pending',
  NULL,
  NULL,
  NULL,
  '2026-11-12 11:20:00'
);

-- Insert Status History Records
INSERT INTO StatusHistory (history_id, item_id, old_status, new_status, note, updated_by, updated_at) VALUES
(1, 1, 'None', 'Open', 'Initial lost item report submitted by student.', 4, '2026-11-10 16:40:00'),
(2, 2, 'None', 'Open', 'Found wallet logged at Central Library desk.', 2, '2026-11-11 13:15:00'),
(3, 3, 'None', 'Open', 'Initial lost charger report submitted.', 3, '2026-11-09 18:05:00'),
(4, 3, 'Open', 'Matched', 'Matched with unclaimed white Satechi adapter turned in to Science Hall custodian.', 1, '2026-11-11 09:30:00'),
(5, 4, 'None', 'Open', 'Found bottle logged at Recreation Center.', 1, '2026-11-08 19:50:00'),
(6, 4, 'Open', 'Matched', 'Ownership claim #2 verified by Campus Security.', 1, '2026-11-09 10:00:00'),
(7, 4, 'Matched', 'Returned', 'Item physically returned to verified owner Maya Lin.', 1, '2026-11-09 10:15:00'),
(8, 5, 'None', 'Open', 'Initial lost notebook report submitted.', 3, '2026-11-12 14:10:00'),
(9, 6, 'None', 'Open', 'Found keys and RFID fob logged by staff.', 2, '2026-11-12 08:45:00');
