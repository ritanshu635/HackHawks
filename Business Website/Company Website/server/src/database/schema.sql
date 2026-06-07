-- Carbon Bloom Connect Database Schema (Updated for Auth)
-- SQLite Version

-- Tables

CREATE TABLE IF NOT EXISTS government_wallet (
    id INTEGER PRIMARY KEY DEFAULT 1,
    cc_balance REAL DEFAULT 0,
    money_balance REAL DEFAULT 0,
    total_cc_generated REAL DEFAULT 0,
    total_cc_allocated REAL DEFAULT 0,
    total_cc_used REAL DEFAULT 0,
    total_cc_expired REAL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS government_admins (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'government',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT UNIQUE,
    password TEXT NOT NULL,
    aadhaar TEXT NOT NULL UNIQUE,
    land_size REAL NOT NULL,
    land_id TEXT NOT NULL UNIQUE,
    bank_details TEXT,
    wallet_balance REAL DEFAULT 0,
    current_crop TEXT NOT NULL,
    sowing_year INTEGER DEFAULT 2026,
    total_cc_generated REAL DEFAULT 0,
    aadhaar_doc TEXT,
    land_doc TEXT,
    bank_doc TEXT,
    disaster_status TEXT DEFAULT 'none',
    disaster_description TEXT,
    december_logged INTEGER DEFAULT 0,
    insurance_fund REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (land_size > 0)
);

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT UNIQUE,
    password TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    compliance_year INTEGER DEFAULT 2024,
    required_cc REAL NOT NULL,
    allocated_cc REAL DEFAULT 0,
    used_cc REAL DEFAULT 0,
    wallet_balance REAL DEFAULT 0,
    approved INTEGER DEFAULT 0,
    registration_doc TEXT,
    request_status TEXT DEFAULT 'none',
    payment_status TEXT DEFAULT 'unpaid',
    status TEXT DEFAULT 'pending',
    registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (required_cc > 0)
);

CREATE TABLE IF NOT EXISTS annual_cc_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    crop_type TEXT,
    land_size REAL,
    cc_produced REAL DEFAULT 0,
    payout_amount REAL DEFAULT 0,
    interest_amount REAL DEFAULT 0,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monthly_crop_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    cc_generated REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    CHECK (month BETWEEN 1 AND 12),
    CHECK (year >= 2024)
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    cc_amount REAL DEFAULT 0,
    from_entity TEXT NOT NULL,
    to_entity TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('cc_generation', 'cc_allocation', 'cc_payment', 'farmer_payment', 'emergency_loan', 'cc_usage'))
);

CREATE TABLE IF NOT EXISTS cc_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    cc_amount REAL NOT NULL,
    used_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    allocation_year INTEGER NOT NULL,
    expiry_date TEXT NOT NULL,
    allocated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CHECK (status IN ('active', 'used', 'expired'))
);

CREATE TABLE IF NOT EXISTS emergency_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id TEXT NOT NULL,
    cc_reserved REAL NOT NULL,
    loan_amount REAL NOT NULL,
    interest_rate REAL DEFAULT 10.0,
    total_interest REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    loan_year INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    CHECK (status IN ('active', 'paid'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_farmers_aadhaar ON farmers(aadhaar);
CREATE INDEX IF NOT EXISTS idx_companies_approved ON companies(approved);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Initial Data
INSERT OR IGNORE INTO government_wallet (id, cc_balance, money_balance) VALUES (1, 0, 0);
