-- ===================================================================
-- SpectraGRID TimescaleDB Hypertable Migration
-- Run AFTER `prisma migrate dev` sets up the relational schema.
--
-- This converts the `telemetry` table to a TimescaleDB hypertable,
-- enabling automatic partitioning by time for time-series queries.
-- ===================================================================

-- 1. Load TimescaleDB extension (requires TimescaleDB installed on PG)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Convert the telemetry table to a hypertable (partitioned by timestamp)
--    chunk_time_interval = 7 days (recommended for 15-minute sensor data)
SELECT create_hypertable(
    'telemetry',
    'timestamp',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- 3. Similarly convert weather table to a hypertable
SELECT create_hypertable(
    'weather',
    'timestamp',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- 4. Create continuous aggregate view for hourly production summary
--    (useful for dashboard KPIs without scanning all 15-min rows)
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS bucket,
    "assetId",
    AVG("acPower") AS avg_ac_power_kw,
    SUM("acPower" * 0.25) AS total_kwh, -- 15-min intervals → kWh
    AVG("inverterTemperature") AS avg_inv_temp,
    AVG("irradianceGhi") AS avg_ghi,
    COUNT(*) AS sample_count
FROM telemetry
GROUP BY bucket, "assetId"
WITH NO DATA;

-- 5. Enable compression for telemetry chunks older than 30 days
ALTER TABLE telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = '"assetId"',
    timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('telemetry', INTERVAL '30 days');

-- 6. Create indexes optimized for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time ON telemetry ("assetId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_asset ON incidents ("assetId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_asset ON recommendations ("assetId", "createdAt" DESC);
