-- Inventory only; this script never seeds, updates, or deletes rows.
-- Run against an explicitly identified, authorized database and retain its output.
-- Local test/dev inventory is not a production inventory.
BEGIN TRANSACTION READ ONLY;
SELECT clock_timestamp() AS audited_at,
       current_database() AS database_name,
       inet_server_addr() AS server_address,
       inet_server_port() AS server_port;

SELECT count(*) AS events_above_60 FROM events WHERE capacity > 60;

SELECT e.id AS event_id, e.capacity, e.organizer_id, e.publication_status,
       count(r.id) FILTER (WHERE r.status = 'ACTIVE') AS active_registrations,
       e.capacity - count(r.id) FILTER (WHERE r.status = 'ACTIVE') AS remaining_seats
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
WHERE e.capacity > 60
GROUP BY e.id, e.capacity, e.organizer_id, e.publication_status
ORDER BY e.id;
COMMIT;
