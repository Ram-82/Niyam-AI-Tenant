-- Niyam AI CA Tool — Database Schema
-- Run this in Supabase SQL Editor

-- CAs (primary users)
CREATE TABLE cas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  firm_name VARCHAR(255),
  membership_number VARCHAR(50),
  city VARCHAR(100),
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(500),
  refresh_token VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients belonging to a CA
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_id UUID REFERENCES cas(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gstin VARCHAR(15),
  pan VARCHAR(10),
  email VARCHAR(255),
  phone VARCHAR(15),
  business_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload sessions per client per month
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_id UUID REFERENCES cas(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual uploaded files
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES upload_sessions(id) ON DELETE CASCADE,
  ca_id UUID REFERENCES cas(id),
  client_id UUID REFERENCES clients(id),
  original_filename VARCHAR(500) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  file_type VARCHAR(50),
  file_size_bytes INTEGER,
  parse_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted invoice records
CREATE TABLE extracted_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES upload_sessions(id) ON DELETE CASCADE,
  file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  invoice_number VARCHAR(255),
  invoice_date VARCHAR(50),
  seller_gstin VARCHAR(15),
  buyer_gstin VARCHAR(15),
  seller_name VARCHAR(255),
  buyer_name VARCHAR(255),
  hsn_code VARCHAR(20),
  taxable_amount DECIMAL(15,2),
  cgst DECIMAL(15,2),
  sgst DECIMAL(15,2),
  igst DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  raw_extracted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation flags per invoice
CREATE TABLE validation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES upload_sessions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES extracted_invoices(id) ON DELETE CASCADE,
  flag_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  field_name VARCHAR(100),
  expected_value TEXT,
  actual_value TEXT,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES upload_sessions(id) ON DELETE CASCADE,
  ca_id UUID REFERENCES cas(id),
  client_id UUID REFERENCES clients(id),
  month VARCHAR(7) NOT NULL,
  total_invoices INTEGER DEFAULT 0,
  total_flags INTEGER DEFAULT 0,
  critical_flags INTEGER DEFAULT 0,
  warning_flags INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  storage_path VARCHAR(1000),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_clients_ca_id ON clients(ca_id);
CREATE INDEX idx_upload_sessions_ca_id ON upload_sessions(ca_id);
CREATE INDEX idx_upload_sessions_client_id ON upload_sessions(client_id);
CREATE INDEX idx_uploaded_files_session_id ON uploaded_files(session_id);
CREATE INDEX idx_extracted_invoices_session_id ON extracted_invoices(session_id);
CREATE INDEX idx_validation_flags_session_id ON validation_flags(session_id);
CREATE INDEX idx_reports_ca_id ON reports(ca_id);
CREATE INDEX idx_reports_session_id ON reports(session_id);

-- Row Level Security (optional - use service role key to bypass)
ALTER TABLE cas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Storage bucket (create in Supabase Dashboard > Storage)
-- Bucket name: ca-uploads
-- Set to private (not public)
