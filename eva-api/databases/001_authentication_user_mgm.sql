-- ===================================
-- DENTAL CLINIC MIS - Complete Database Schema
-- MySQL 8.0+
-- Execute this file in order
-- ===================================

-- Drop existing database if exists (CAUTION: This will delete all data!)
-- DROP DATABASE IF EXISTS dental_clinic_mis;

-- Create database
CREATE DATABASE IF NOT EXISTS dental_clinic_mis 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE dental_clinic_mis;

-- ===================================
-- SECTION 1: USER MANAGEMENT & AUTHENTICATION
-- ===================================

-- Roles Table
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_name (name),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id BIGINT UNSIGNED NOT NULL,
    status ENUM('active', 'inactive', 'suspended', 'locked') NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_by BIGINT UNSIGNED,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_locked_until (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions Table
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resource_action (resource, action),
    INDEX idx_name (name),
    UNIQUE KEY unique_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    replaced_by_token VARCHAR(64),
    device_info VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked (revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password History Table
CREATE TABLE password_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login Attempts Table
CREATE TABLE login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SECTION 2: ADVANCED AUTHENTICATION
-- ===================================

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Magic Link Tokens
CREATE TABLE magic_link_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Two-Factor Backup Codes
CREATE TABLE two_factor_backup_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SECTION 3: AUDIT LOGGING
-- ===================================

-- Audit Logs Table
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT UNSIGNED,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_created_at (created_at),
    INDEX idx_entity_type_id (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SECTION 4: PATIENT MANAGEMENT
-- ===================================

-- Patients Table
CREATE TABLE patients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown') DEFAULT 'unknown',
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- Medical Information
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    
    -- Insurance
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    
    -- Status
    status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    deleted_by BIGINT UNSIGNED,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_number (patient_number),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_date_of_birth (date_of_birth),
    INDEX idx_name (last_name, first_name),
    FULLTEXT idx_search (first_name, last_name, email, phone, patient_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical History Table
CREATE TABLE medical_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    category ENUM('allergy', 'condition', 'medication', 'surgery', 'family_history', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    diagnosed_date DATE,
    status ENUM('active', 'resolved', 'managed') DEFAULT 'active',
    severity ENUM('low', 'medium', 'high', 'critical'),
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dental Records Table
CREATE TABLE dental_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    visit_date DATE NOT NULL,
    tooth_number VARCHAR(10),
    diagnosis TEXT NOT NULL,
    treatment_provided TEXT,
    treatment_plan TEXT,
    prescription TEXT,
    
    -- Vital Signs
    blood_pressure VARCHAR(20),
    pulse VARCHAR(20),
    temperature VARCHAR(20),
    
    -- Cost
    cost DECIMAL(10, 2),
    paid DECIMAL(10, 2),
    balance DECIMAL(10, 2),
    
    -- Staff
    dentist_id BIGINT UNSIGNED,
    hygienist_id BIGINT UNSIGNED,
    
    notes TEXT,
    next_visit_date DATE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (hygienist_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_visit_date (visit_date),
    INDEX idx_dentist_id (dentist_id),
    INDEX idx_next_visit (next_visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient Documents Table
CREATE TABLE patient_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('xray', 'photo', 'consent_form', 'insurance', 'prescription', 'lab_result', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED,
    mime_type VARCHAR(100),
    
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_document_type (document_type),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient Notes Table
CREATE TABLE patient_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    note_type ENUM('general', 'treatment', 'billing', 'insurance', 'follow_up', 'alert') NOT NULL DEFAULT 'general',
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_alert BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_note_type (note_type),
    INDEX idx_is_alert (is_alert),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Treatment Templates Table
CREATE TABLE treatment_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_cost DECIMAL(10, 2),
    estimated_duration INT,
    category VARCHAR(100),
    requires_multiple_visits BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_name (name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SECTION 5: APPOINTMENT SCHEDULING
-- ===================================

-- Appointments Table
CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    dentist_id BIGINT UNSIGNED NOT NULL,
    
    -- Scheduling
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INT NOT NULL,
    
    -- Type and Status
    appointment_type ENUM('checkup', 'cleaning', 'filling', 'extraction', 'root_canal', 'crown', 'emergency', 'consultation', 'follow_up', 'other') NOT NULL,
    status ENUM('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') NOT NULL DEFAULT 'scheduled',
    
    -- Details
    reason TEXT,
    notes TEXT,
    treatment_plan TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP NULL,
    
    -- Cancellation
    cancelled_at TIMESTAMP NULL,
    cancelled_by BIGINT UNSIGNED,
    cancellation_reason TEXT,
    
    -- Completion
    completed_at TIMESTAMP NULL,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_appointment_number (appointment_number),
    INDEX idx_patient_id (patient_id),
    INDEX idx_dentist_id (dentist_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_dentist_date (dentist_id, appointment_date),
    INDEX idx_patient_date (patient_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recurring Appointments Table
CREATE TABLE recurring_appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    dentist_id BIGINT UNSIGNED NOT NULL,
    
    -- Pattern
    recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom') NOT NULL,
    recurrence_interval INT NOT NULL DEFAULT 1,
    day_of_week VARCHAR(20),
    day_of_month INT,
    
    -- Time
    start_time TIME NOT NULL,
    duration INT NOT NULL,
    
    -- Range
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INT,
    
    -- Details
    appointment_type VARCHAR(50) NOT NULL,
    reason TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_dentist_id (dentist_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment Waitlist Table
CREATE TABLE appointment_waitlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    dentist_id BIGINT UNSIGNED,
    
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    appointment_type VARCHAR(50) NOT NULL,
    reason TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    status ENUM('waiting', 'contacted', 'scheduled', 'expired') DEFAULT 'waiting',
    contacted_at TIMESTAMP NULL,
    scheduled_appointment_id BIGINT UNSIGNED,
    
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (scheduled_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_preferred_date (preferred_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dentist Schedule/Availability Table
CREATE TABLE dentist_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT UNSIGNED NOT NULL,
    
    -- Schedule
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Breaks
    break_start_time TIME,
    break_end_time TIME,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_dentist_id (dentist_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_is_active (is_active),
    UNIQUE KEY unique_dentist_day (dentist_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dentist Time Off Table
CREATE TABLE dentist_time_off (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT UNSIGNED NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    reason VARCHAR(255),
    is_all_day BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_dentist_id (dentist_id),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment Reminders Log Table
CREATE TABLE appointment_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT UNSIGNED NOT NULL,
    
    reminder_type ENUM('sms', 'email', 'both') NOT NULL,
    reminder_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_status (status),
    INDEX idx_reminder_time (reminder_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SEED DATA INSERTION
-- ===================================

-- 1. Roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES 
('admin', 'Administrator', 'Full system access', TRUE),
('dentist', 'Dentist', 'Medical provider access', FALSE),
('receptionist', 'Receptionist', 'Front desk and scheduling', FALSE),
('patient', 'Patient', 'Patient portal access', FALSE);

-- 2. Permissions
INSERT INTO permissions (name, display_name, resource, action, description) VALUES
('users.create', 'Create Users', 'users', 'create', 'Can create new system users'),
('users.read', 'View Users', 'users', 'read', 'Can view user list'),
('users.update', 'Update Users', 'users', 'update', 'Can update user details'),
('users.delete', 'Delete Users', 'users', 'delete', 'Can delete users'),
('patients.create', 'Create Patients', 'patients', 'create', 'Can register new patients'),
('patients.read', 'View Patients', 'patients', 'read', 'Can view patient records'),
('patients.update', 'Update Patients', 'patients', 'update', 'Can update patient medical info'),
('patients.delete', 'Delete Patients', 'patients', 'delete', 'Can archive patients'),
('appointments.create', 'Book Appointment', 'appointments', 'create', 'Can book appointments'),
('appointments.read', 'View Schedule', 'appointments', 'read', 'Can view calendar'),
('appointments.update', 'Update Appointment', 'appointments', 'update', 'Can reschedule/cancel'),
('records.read', 'View Medical Records', 'records', 'read', 'Can view dental history'),
('records.write', 'Write Medical Records', 'records', 'write', 'Can add diagnosis and treatment');

-- 3. Users
-- We use subqueries to get Role IDs, and HARDCODE the password hash to prevent variable scope issues
INSERT INTO users (
    email, password_hash, first_name, last_name, phone, role_id, status, email_verified, email_verified_at
) VALUES 
-- Admin
('admin@dental.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Admin', '09170000001', (SELECT id FROM roles WHERE name = 'admin'), 'active', TRUE, NOW()),
-- Dr. Smith
('dr.smith@dental.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Smith', '09170000002', (SELECT id FROM roles WHERE name = 'dentist'), 'active', TRUE, NOW()),
-- Dr. Garcia
('dr.garcia@dental.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria', 'Garcia', '09170000003', (SELECT id FROM roles WHERE name = 'dentist'), 'active', TRUE, NOW()),
-- Sarah
('sarah@dental.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Jones', '09170000004', (SELECT id FROM roles WHERE name = 'receptionist'), 'active', TRUE, NOW());

-- 4. Treatment Templates
INSERT INTO treatment_templates (name, description, default_cost, estimated_duration, category) VALUES 
('Comprehensive Exam', 'Full mouth examination and charting', 500.00, 30, 'Diagnostic'),
('Prophylaxis (Cleaning)', 'Standard dental cleaning', 1200.00, 45, 'Preventive'),
('Tooth Extraction (Simple)', 'Simple removal of tooth', 1500.00, 60, 'Surgery'),
('Composite Filling (1 Surface)', 'White filling for one surface', 2000.00, 45, 'Restorative'),
('Root Canal (Anterior)', 'Root canal therapy for front teeth', 8000.00, 90, 'Endodontics'),
('Teeth Whitening', 'In-office chemical whitening', 15000.00, 90, 'Cosmetic');

-- 5. Patients
INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, 
    blood_type, email, phone, address_line1, city, 
    emergency_contact_name, emergency_contact_phone, 
    allergies, status, created_by
) VALUES 
('P-2023-001', 'Juan', 'Dela Cruz', '1985-06-15', 'male', 'O+', 'juan@email.com', '09181112222', '123 Rizal St', 'Manila', 'Maria Dela Cruz', '09183334444', 'Penicillin', 'active', (SELECT id FROM users WHERE email = 'sarah@dental.com')),
('P-2023-002', 'Elena', 'Santos', '1992-11-02', 'female', 'A+', 'elena@email.com', '09192223333', '456 Mabini Ave', 'Quezon City', 'Pedro Santos', '09195556666', NULL, 'active', (SELECT id FROM users WHERE email = 'sarah@dental.com')),
('P-2023-003', 'Miguel', 'Reyes', '2015-03-10', 'male', 'unknown', NULL, '09203334444', '789 Luna St', 'Makati', 'Parent: Ana Reyes', '09203334444', 'Peanuts', 'active', (SELECT id FROM users WHERE email = 'sarah@dental.com'));

-- 6. Medical History
INSERT INTO medical_history (patient_id, category, title, description, status, severity) VALUES 
((SELECT id FROM patients WHERE patient_number = 'P-2023-001'), 'allergy', 'Penicillin Allergy', 'Patient develops rash and swelling', 'active', 'high'),
((SELECT id FROM patients WHERE patient_number = 'P-2023-001'), 'condition', 'Hypertension', 'Controlled with medication', 'managed', 'medium'),
((SELECT id FROM patients WHERE patient_number = 'P-2023-002'), 'surgery', 'Appendectomy', 'Removed in 2010', 'resolved', 'low');

-- 7. Dental Records
INSERT INTO dental_records (
    patient_id, visit_date, tooth_number, diagnosis, treatment_provided, 
    cost, paid, balance, dentist_id, created_by
) VALUES 
((SELECT id FROM patients WHERE patient_number = 'P-2023-001'), DATE_SUB(NOW(), INTERVAL 6 MONTH), '16', 'Caries', 'Composite Filling', 2000.00, 2000.00, 0.00, (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), (SELECT id FROM users WHERE email = 'dr.smith@dental.com')),
((SELECT id FROM patients WHERE patient_number = 'P-2023-002'), DATE_SUB(NOW(), INTERVAL 1 MONTH), 'All', 'Gingivitis', 'Prophylaxis', 1200.00, 1000.00, 200.00, (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), (SELECT id FROM users WHERE email = 'dr.smith@dental.com'));

-- 8. Dentist Schedules
INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time) VALUES 
((SELECT id FROM users WHERE email = 'dr.smith@dental.com'), 'monday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'),
((SELECT id FROM users WHERE email = 'dr.smith@dental.com'), 'tuesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'),
((SELECT id FROM users WHERE email = 'dr.smith@dental.com'), 'wednesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'),
((SELECT id FROM users WHERE email = 'dr.smith@dental.com'), 'thursday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'),
((SELECT id FROM users WHERE email = 'dr.smith@dental.com'), 'friday', '09:00:00', '17:00:00', '12:00:00', '13:00:00');

-- 9. Appointments
INSERT INTO appointments (
    appointment_number, patient_id, dentist_id, appointment_date, 
    start_time, end_time, duration, appointment_type, 
    status, reason, created_by
) VALUES 
-- Completed
('APT-1001', (SELECT id FROM patients WHERE patient_number = 'P-2023-001'), (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), DATE_SUB(CURDATE(), INTERVAL 7 DAY), '10:00:00', '11:00:00', 60, 'checkup', 'completed', 'Routine Checkup', (SELECT id FROM users WHERE email = 'sarah@dental.com')),
-- Upcoming
('APT-1002', (SELECT id FROM patients WHERE patient_number = 'P-2023-002'), (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 60, 'cleaning', 'confirmed', 'Yearly Cleaning', (SELECT id FROM users WHERE email = 'sarah@dental.com')),
-- Scheduled
('APT-1003', (SELECT id FROM patients WHERE patient_number = 'P-2023-001'), (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:00:00', '10:00:00', 60, 'filling', 'scheduled', 'Filling repair', (SELECT id FROM users WHERE email = 'sarah@dental.com'));

-- 10. Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, new_values) VALUES 
((SELECT id FROM users WHERE email = 'admin@dental.com'), 'create', 'user', (SELECT id FROM users WHERE email = 'dr.smith@dental.com'), '192.168.1.1', '{"email": "dr.smith@dental.com", "role": "dentist"}'),
((SELECT id FROM users WHERE email = 'sarah@dental.com'), 'create', 'patient', (SELECT id FROM patients WHERE patient_number = 'P-2023-001'), '192.168.1.5', '{"name": "Juan Dela Cruz"}');

-- Final check
SELECT 'Seed data inserted successfully.' as status;
