-- Setup script for Personal Expense Tracker database
-- Run this in the SQL Editor of your Supabase dashboard (https://supabase.com)

-- Drop table if it already exists to reset
DROP TABLE IF EXISTS expenses;

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CONSTRAINT positive_amount CHECK (amount >= 0),
  category VARCHAR(50) NOT NULL CONSTRAINT valid_category CHECK (category IN ('Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching and filtering performance
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Insert sample seed data for the current month
INSERT INTO expenses (title, amount, category, date, note)
VALUES 
  ('Weekly Groceries', 1845.50, 'Food', CURRENT_DATE - INTERVAL '1 day', 'Organic groceries from local market'),
  ('Uber to Office', 350.20, 'Transport', CURRENT_DATE, 'Commute to office'),
  ('Internet Bill', 799.00, 'Bills', CURRENT_DATE - INTERVAL '3 days', 'Monthly fiber internet broadband subscription'),
  ('Movie Tickets', 540.00, 'Entertainment', CURRENT_DATE - INTERVAL '5 days', 'Popcorn and tickets for movie night'),
  ('New Sneakers', 2999.00, 'Shopping', CURRENT_DATE - INTERVAL '6 days', 'New running shoes'),
  ('Coffee with client', 180.50, 'Food', CURRENT_DATE - INTERVAL '2 days', 'Meeting at Starbucks');
