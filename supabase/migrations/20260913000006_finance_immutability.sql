BEGIN;

-- 1. Create function to guard posted transactions against mutations/deletion
CREATE OR REPLACE FUNCTION prevent_posted_transaction_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'posted' THEN
      RAISE EXCEPTION 'Cannot modify a posted transaction';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'posted' THEN
      -- Immutable fields: amount, account_id, type, and posted status itself cannot be changed
      IF NEW.amount <> OLD.amount OR NEW.account_id <> OLD.account_id OR NEW.type <> OLD.type OR NEW.status <> 'posted' THEN
        RAISE EXCEPTION 'Cannot modify a posted transaction';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to transactions table
DROP TRIGGER IF EXISTS trg_posted_transaction_immutable ON transactions;
CREATE TRIGGER trg_posted_transaction_immutable
  BEFORE UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_posted_transaction_modification();

COMMIT;
