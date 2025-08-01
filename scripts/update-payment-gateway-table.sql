-- Update payment_gateway table to support real payment gateway integration
-- This script adds the necessary columns for payment gateway integration
-- Add new columns if they don't exist
ALTER TABLE payment_gateway
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_url TEXT,
    ADD COLUMN IF NOT EXISTS utr VARCHAR(255),
    ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 1.00;
-- Create index for order_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_payment_gateway_order_id ON payment_gateway(order_id);
-- Note: The unique constraint might fail if there are existing duplicate order_ids
-- You may need to handle this manually if there are existing records
-- ALTER TABLE payment_gateway ADD CONSTRAINT IF NOT EXISTS unique_order_id UNIQUE (order_id);