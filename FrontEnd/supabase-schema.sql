-- Create accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  type TEXT NOT NULL,
  profiles JSONB NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  reported BOOLEAN DEFAULT FALSE,
  reportReason TEXT
);

-- Create reported_accounts table
CREATE TABLE reported_accounts (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL REFERENCES accounts(id),
  email TEXT NOT NULL,
  reportReason TEXT NOT NULL,
  reportedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE
);

-- Create customer_assignments table with operator_name column
CREATE TABLE customer_assignments (
  id TEXT PRIMARY KEY,
  customerIdentifier TEXT NOT NULL,
  accountId TEXT NOT NULL REFERENCES accounts(id),
  accountEmail TEXT NOT NULL,
  accountType TEXT NOT NULL,
  profileName TEXT NOT NULL,
  operatorName TEXT, -- Added operator_name column
  assignedAt TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_reported_accounts_resolved ON reported_accounts(resolved);
CREATE INDEX idx_customer_assignments_customer ON customer_assignments(customerIdentifier);
CREATE INDEX idx_customer_assignments_operator ON customer_assignments(operatorName);

-- If the table already exists, add the column
ALTER TABLE customer_assignments ADD COLUMN IF NOT EXISTS operatorName TEXT;
