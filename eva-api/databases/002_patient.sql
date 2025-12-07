-- Patient Management Schema

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
    
    -- Insurance (optional)
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

-- Treatment Templates Table (for common treatments)
CREATE TABLE treatment_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_cost DECIMAL(10, 2),
    estimated_duration INT, -- in minutes
    category VARCHAR(100),
    requires_multiple_visits BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_name (name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common treatment templates
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
('Emergency Visit', 'Emergency dental visit', 3000.00, 45, 'Emergency');

-- Update permissions for patients
INSERT INTO permissions (name, display_name, resource, action) VALUES
('patients.create', 'Create Patients', 'patients', 'create'),
('patients.read', 'View Patients', 'patients', 'read'),
('patients.update', 'Update Patients', 'patients', 'update'),
('patients.delete', 'Delete Patients', 'patients', 'delete'),
('patients.manage_documents', 'Manage Patient Documents', 'patients', 'manage_documents'),
('patients.view_medical_history', 'View Medical History', 'patients', 'view_medical_history')
ON DUPLICATE KEY UPDATE name=name;
