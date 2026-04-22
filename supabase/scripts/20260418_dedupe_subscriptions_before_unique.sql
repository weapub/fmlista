-- Remove duplicate subscription rows before enforcing radio_id uniqueness.
-- Keeps the most recently updated record per radio.

WITH ranked_subscriptions AS (
  SELECT
    id,
    radio_id,
    ROW_NUMBER() OVER (
      PARTITION BY radio_id
      ORDER BY
        updated_at DESC NULLS LAST,
        next_billing_date DESC NULLS LAST,
        current_period_end DESC NULLS LAST,
        created_at DESC NULLS LAST,
        id DESC
    ) AS row_num
  FROM public.subscriptions
  WHERE radio_id IS NOT NULL
)
DELETE FROM public.subscriptions s
USING ranked_subscriptions r
WHERE s.id = r.id
  AND r.row_num > 1;
