-- Update payment_gateway table to support real payment gateway integration
ALTER TABLE payment_gateway
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_url TEXT,
    ADD COLUMN IF NOT EXISTS utr VARCHAR(255),
    ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 1.00;
-- Add index for order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_gateway_order_id ON payment_gateway(order_id);
-- Add unique constraint on order_id to prevent duplicates
ALTER TABLE payment_gateway
ADD CONSTRAINT IF NOT EXISTS unique_order_id UNIQUE (order_id);