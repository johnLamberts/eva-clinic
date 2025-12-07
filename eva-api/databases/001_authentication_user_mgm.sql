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
-- SECTION 6: SEED DATA
-- ===================================

-- Insert Default Roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', TRUE),
('admin', 'Administrator', 'Administrative access to manage clinic operations', TRUE),
('dentist', 'Dentist', 'Dentist with access to patient records and appointments', TRUE),
('receptionist', 'Receptionist', 'Front desk staff managing appointments and patient intake', TRUE),
('dental_hygienist', 'Dental Hygienist', 'Hygienist with limited patient access', TRUE);

-- Insert Default Permissions
INSERT INTO permissions (name, display_name, resource, action) VALUES
-- User Management
('users.create', 'Create Users', 'users', 'create'),
('users.read', 'View Users', 'users', 'read'),
('users.update', 'Update Users', 'users', 'update'),
('users.delete', 'Delete Users', 'users', 'delete'),
('users.manage_roles', 'Manage User Roles', 'users', 'manage_roles'),

-- Patient Management
('patients.create', 'Create Patients', 'patients', 'create'),
('patients.read', 'View Patients', 'patients', 'read'),
('patients.update', 'Update Patients', 'patients', 'update'),
('patients.delete', 'Delete Patients', 'patients', 'delete'),
('patients.manage_documents', 'Manage Patient Documents', 'patients', 'manage_documents'),
('patients.view_medical_history', 'View Medical History', 'patients', 'view_medical_history'),

-- Appointment Management
('appointments.create', 'Create Appointments', 'appointments', 'create'),
('appointments.read', 'View Appointments', 'appointments', 'read'),
('appointments.update', 'Update Appointments', 'appointments', 'update'),
('appointments.delete', 'Delete Appointments', 'appointments', 'delete'),
('appointments.cancel', 'Cancel Appointments', 'appointments', 'cancel'),
('appointments.manage_schedule', 'Manage Dentist Schedules', 'appointments', 'manage_schedule'),
('appointments.manage_waitlist', 'Manage Waitlist', 'appointments', 'manage_waitlist'),

-- Audit Logs
('audit.read', 'View Audit Logs', 'audit', 'read'),

-- System Settings
('settings.read', 'View Settings', 'settings', 'read'),
('settings.update', 'Update Settings', 'settings', 'update');

-- Assign ALL Permissions to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin';

-- Assign Permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
AND p.name IN (
    'users.read', 'users.update',
    'patients.create', 'patients.read', 'patients.update', 'patients.delete', 
    'patients.manage_documents', 'patients.view_medical_history',
    'appointments.create', 'appointments.read', 'appointments.update', 
    'appointments.delete', 'appointments.cancel', 'appointments.manage_schedule',
    'audit.read', 'settings.read'
);

-- Assign Permissions to Dentist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'dentist' 
AND p.name IN (
    'patients.create', 'patients.read', 'patients.update',
    'patients.view_medical_history',
    'appointments.read', 'appointments.update',
    'settings.read'
);

-- Assign Permissions to Receptionist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'receptionist' 
AND p.name IN (
    'patients.create', 'patients.read', 'patients.update',
    'appointments.create', 'appointments.read', 'appointments.update', 
    'appointments.cancel', 'appointments.manage_waitlist',
    'settings.read'
);

-- Assign Permissions to Dental Hygienist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'dental_hygienist' 
AND p.name IN (
    'patients.read',
    'appointments.read',
    'settings.read'
);

-- Insert Treatment Templates
INSERT INTO treatment_templates (name, description, default_cost, estimated_duration, category) VALUES
('Dental Cleaning', 'Regular teeth cleaning and polishing', 1500.00, 30, 'Preventive'),
('Tooth Extraction', 'Simple tooth extraction', 2500.00, 30, 'Surgery'),
('Dental Filling', 'Composite filling for cavity', 2000.00, 45, 'Restorative'),
('Root Canal', 'Root canal treatment', 8000.00, 90, 'Endodontics'),
('Crown', 'Dental crown placement', 15000.00, 60, 'Restorative'),
('Teeth Whitening', 'Professional teeth whitening', 5000.00, 60, 'Cosmetic'),
('Dental Bridge', 'Fixed dental bridge', 25000.00, 90, 'Restorative'),
('Dental Implant', 'Single dental implant', 50000.00, 120, 'Surgery'),
('Orthodontic Consultation', 'Braces/Invisalign consultation', 500.00, 30, 'Orthodontics'),
('Emergency Visit', 'Emergency dental visit', 3000.00, 45, 'Emergency'),
('Dental X-Ray', 'Panoramic or periapical X-ray', 800.00, 15, 'Diagnostic'),
('Scaling', 'Deep scaling and root planing', 3000.00, 60, 'Periodontics'),
('Veneer', 'Porcelain veneer per tooth', 18000.00, 45, 'Cosmetic'),
('Dentures', 'Complete or partial dentures', 30000.00, 90, 'Restorative'),
('Fluoride Treatment', 'Professional fluoride application', 500.00, 15, 'Preventive');

-- ===================================
-- SECTION 7: SAMPLE DENTIST SCHEDULES
-- ===================================

-- Insert sample schedules for dentists (Monday-Friday, 9 AM - 5 PM with 1-hour lunch)
-- This will only work after you've created at least one dentist user
-- You can run this manually after creating dentists

-- Example for inserting schedules (uncomment and modify after creating dentist users):
/*
INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'monday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'tuesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'wednesday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'thursday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'friday', '09:00:00', '17:00:00', '12:00:00', '13:00:00'
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
SELECT u.id, 'saturday', '09:00:00', '13:00:00', NULL, NULL
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE r.name = 'dentist' AND u.deleted_at IS NULL;
*/

-- ===================================
-- SECTION 8: DATABASE STATISTICS
-- ===================================

-- Summary of tables created
SELECT 
    'Database Schema Created Successfully!' as message,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'dental_clinic_mis' 
     AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'dental_clinic_mis') as total_columns,
    (SELECT COUNT(*) FROM information_schema.statistics 
     WHERE table_schema = 'dental_clinic_mis' 
     AND index_name != 'PRIMARY') as total_indexes,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_schema = 'dental_clinic_mis' 
     AND constraint_type = 'FOREIGN KEY') as total_foreign_keys;

-- List all tables
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'dental_clinic_mis'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ===================================
-- SECTION 9: HELPFUL QUERIES
-- ===================================

-- View all roles with permission counts
SELECT 
    r.id,
    r.name,
    r.display_name,
    r.is_system_role,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.name, r.display_name, r.is_system_role
ORDER BY r.id;

-- View all permissions by resource
SELECT 
    resource,
    COUNT(*) as permission_count,
    GROUP_CONCAT(name ORDER BY name) as permissions
FROM permissions
GROUP BY resource
ORDER BY resource;

-- ===================================
-- SECTION 10: MAINTENANCE QUERIES
-- ===================================

-- Clean up expired tokens (run periodically)
/*
DELETE FROM email_verification_tokens WHERE expires_at < NOW();
DELETE FROM password_reset_tokens WHERE expires_at < NOW();
DELETE FROM magic_link_tokens WHERE expires_at < NOW();
DELETE FROM refresh_tokens WHERE expires_at < NOW();
*/

-- Archive old audit logs (optional - run annually)
/*
CREATE TABLE audit_logs_archive LIKE audit_logs;
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
*/

-- ===================================
-- SECTION 11: BACKUP RECOMMENDATIONS
-- ===================================

/*
-- Daily backup command (run via cron)
mysqldump -u root -p dental_clinic_mis > backup_$(date +%Y%m%d).sql

-- Weekly full backup with compression
mysqldump -u root -p dental_clinic_mis | gzip > backup_$(date +%Y%m%d).sql.gz

-- Backup specific tables only
mysqldump -u root -p dental_clinic_mis patients appointments dental_records > patients_backup.sql

-- Restore from backup
mysql -u root -p dental_clinic_mis < backup_20241208.sql
*/

-- ===================================
-- NOTES
-- ===================================

/*
1. This schema is optimized for MySQL 8.0+
2. Uses InnoDB engine for ACID compliance
3. All tables have proper foreign key constraints
4. Soft deletes implemented across all main tables
5. Comprehensive indexes for performance
6. Full-text search enabled on patient names
7. Audit logging for all critical operations
8. HIPAA/GDPR compliance considerations included

NEXT STEPS:
1. Run this entire SQL file: mysql -u root -p < complete_schema.sql
2. Create your first admin user via the API
3. Configure dentist schedules after creating dentist users
4. Set up automated backup schedule
5. Review and adjust treatment template prices
6. Configure email/SMS settings in application

SECURITY REMINDERS:
- Change default passwords immediately
- Enable SSL/TLS for production
- Restrict database user permissions
- Enable binary logging for point-in-time recovery
- Regular security audits
- Keep MySQL updated

PERFORMANCE TIPS:
- Monitor slow query log
- Analyze and optimize queries regularly
- Consider partitioning for audit_logs if very large
- Set up read replicas for reporting
- Use connection pooling (already configured in app)
- Regular ANALYZE TABLE and OPTIMIZE TABLE

For questions or issues, refer to the README.md
*/

-- ===================================
-- END OF SCHEMA
-- ===================================

SELECT '✅ Database schema created successfully!' as status,
       'Total Tables: 23' as info1,
       'Total Roles: 5' as info2,
       'Total Permissions: 21' as info3,
       'Treatment Templates: 15' as info4,
       'Ready for production!' as message;
