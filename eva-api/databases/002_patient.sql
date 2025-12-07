-- ===================================
-- DENTAL CLINIC MIS - Seed Data Script
-- Executes after schema creation
-- ===================================

USE dental_clinic_mis;

-- Disable foreign key checks temporarily for bulk operations
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------
-- 1. SETUP VARIABLES
-- -----------------------------------

-- The hash below is for the password: "password"
-- Generated using standard Bcrypt (cost 10)
SET @default_pass = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
SET @now = NOW();

-- Retrieve Role IDs (Assumes Section 6 of schema was run)
SET @role_admin = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @role_dentist = (SELECT id FROM roles WHERE name = 'dentist' LIMIT 1);
SET @role_receptionist = (SELECT id FROM roles WHERE name = 'receptionist' LIMIT 1);
SET @role_patient = (SELECT id FROM roles WHERE name = 'patient' LIMIT 1);

-- -----------------------------------
-- 2. SEED USERS
-- -----------------------------------

-- 2.1 Create the Main Administrator
INSERT INTO users (
    email, password_hash, first_name, last_name, phone, 
    role_id, status, email_verified, email_verified_at, 
    created_at, updated_at
) VALUES (
    'admin@dental.com', 
    @default_pass, 
    'System', 
    'Admin', 
    '09000000001', 
    @role_admin, 
    'active', 
    TRUE, 
    @now, 
    @now, 
    @now
);

-- Capture Admin ID for 'created_by' fields
SET @admin_id = LAST_INSERT_ID();

-- 2.2 Create a Dentist (Dr. Smile)
INSERT INTO users (
    email, password_hash, first_name, last_name, phone, 
    role_id, status, email_verified, email_verified_at, 
    created_by, created_at, updated_at
) VALUES (
    'dr.smile@dental.com', 
    @default_pass, 
    'John', 
    'Smile', 
    '09000000002', 
    @role_dentist, 
    'active', 
    TRUE, 
    @now, 
    @admin_id,
    @now, 
    @now
);

SET @dentist_id = LAST_INSERT_ID();

-- 2.3 Create a Receptionist (Pam)
INSERT INTO users (
    email, password_hash, first_name, last_name, phone, 
    role_id, status, email_verified, email_verified_at, 
    created_by, created_at, updated_at
) VALUES (
    'reception@dental.com', 
    @default_pass, 
    'Pam', 
    'Beesly', 
    '09000000003', 
    @role_receptionist, 
    'active', 
    TRUE, 
    @now, 
    @admin_id,
    @now, 
    @now
);

SET @receptionist_id = LAST_INSERT_ID();

-- -----------------------------------
-- 3. SEED DENTIST SCHEDULE
-- -----------------------------------
-- Give Dr. Smile a schedule: Mon-Fri, 9 AM - 5 PM, Lunch 12-1
INSERT INTO dentist_schedules (
    dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_active
) VALUES 
(@dentist_id, 'monday',    '09:00:00', '17:00:00', '12:00:00', '13:00:00', TRUE),
(@dentist_id, 'tuesday',   '09:00:00', '17:00:00', '12:00:00', '13:00:00', TRUE),
(@dentist_id, 'wednesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00', TRUE),
(@dentist_id, 'thursday',  '09:00:00', '17:00:00', '12:00:00', '13:00:00', TRUE),
(@dentist_id, 'friday',    '09:00:00', '17:00:00', '12:00:00', '13:00:00', TRUE);

-- -----------------------------------
-- 4. SEED SAMPLE PATIENT
-- -----------------------------------
INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, 
    blood_type, email, phone, address_line1, city, 
    status, created_by, created_at
) VALUES (
    'PAT-2024-001', 
    'Michael', 
    'Scott', 
    '1980-03-15', 
    'male', 
    'O+', 
    'patient@dental.com', 
    '09000000004', 
    '123 Paper St.', 
    'Scranton', 
    'active', 
    @receptionist_id,
    @now
);

SET @patient_id = LAST_INSERT_ID();

-- -----------------------------------
-- 5. SEED SAMPLE APPOINTMENT
-- -----------------------------------
-- Create an appointment for tomorrow at 10 AM
INSERT INTO appointments (
    appointment_number, patient_id, dentist_id, 
    appointment_date, start_time, end_time, duration, 
    appointment_type, status, reason, created_by, created_at
) VALUES (
    'APT-1001', 
    @patient_id, 
    @dentist_id, 
    CURDATE() + INTERVAL 1 DAY, -- Tomorrow
    '10:00:00', 
    '11:00:00', 
    60, 
    'checkup', 
    'confirmed', 
    'Initial dental checkup and cleaning', 
    @receptionist_id,
    @now
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Output confirmation
SELECT '✅ Seed data inserted successfully!' as status,
       'Password for all users is: password' as credentials;

SELECT id, email, role_id FROM users;
