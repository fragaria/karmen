-- adds support for multiple sites per application instance --

-- base table for sites --
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    created_on TIMESTAMP DEFAULT NOW()
);

-- first site all current row will be migrated to --
INSERT INTO sites (id, name) VALUES (0, 'Base');

-- site reference to necessary tables --
ALTER TABLE users ADD COLUMN site_id INTEGER REFERENCES sites NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN site_id DROP DEFAULT;

ALTER TABLE printers ADD COLUMN site_id INTEGER REFERENCES sites NOT NULL DEFAULT 0;
ALTER TABLE printers ALTER COLUMN site_id DROP DEFAULT;
DROP INDEX printer_hostname_ip_port;
CREATE UNIQUE INDEX ON printers (site_id, hostname, host, port);

ALTER TABLE settings ADD COLUMN site_id INTEGER REFERENCES sites NOT NULL DEFAULT 0;
ALTER TABLE settings ALTER COLUMN site_id DROP DEFAULT;

ALTER TABLE gcodes ADD COLUMN site_id INTEGER REFERENCES sites NOT NULL DEFAULT 0;
ALTER TABLE gcodes ALTER COLUMN site_id DROP DEFAULT;
