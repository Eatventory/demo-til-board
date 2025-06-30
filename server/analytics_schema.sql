-- Analytics 데이터베이스 스키마

-- 1. 이벤트 테이블 (모든 이벤트의 기본 정보)
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    timestamp BIGINT NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    user_id INTEGER,
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 이벤트 속성 테이블 (이벤트별 추가 데이터)
CREATE TABLE IF NOT EXISTS analytics_event_properties (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES analytics_events(id) ON DELETE CASCADE,
    property_key VARCHAR(100) NOT NULL,
    property_value TEXT,
    property_type VARCHAR(20) DEFAULT 'string' -- string, number, boolean, json
);

-- 3. 페이지 정보 테이블
CREATE TABLE IF NOT EXISTS analytics_page_info (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES analytics_events(id) ON DELETE CASCADE,
    page_path VARCHAR(500),
    page_title VARCHAR(500),
    referrer VARCHAR(1000)
);

-- 4. 디바이스 정보 테이블
CREATE TABLE IF NOT EXISTS analytics_device_info (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES analytics_events(id) ON DELETE CASCADE,
    device_type VARCHAR(20), -- mobile, desktop
    os VARCHAR(50),
    browser VARCHAR(50),
    language VARCHAR(10)
);

-- 5. 지리 정보 테이블
CREATE TABLE IF NOT EXISTS analytics_geo_info (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES analytics_events(id) ON DELETE CASCADE,
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(100)
);

-- 6. 트래픽 소스 테이블
CREATE TABLE IF NOT EXISTS analytics_traffic_source (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES analytics_events(id) ON DELETE CASCADE,
    medium VARCHAR(50),
    source VARCHAR(200),
    campaign VARCHAR(200),
    utm_source VARCHAR(200),
    utm_medium VARCHAR(200),
    utm_campaign VARCHAR(200),
    utm_term VARCHAR(200),
    utm_content VARCHAR(200)
);

-- 인덱스 생성 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_client_id ON analytics_events(client_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_event_properties_event_id ON analytics_event_properties(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_properties_key ON analytics_event_properties(property_key);

-- 뷰 생성 (자주 사용하는 쿼리를 위한 뷰)
CREATE OR REPLACE VIEW analytics_events_full AS
SELECT 
    e.id,
    e.event_name,
    e.timestamp,
    e.client_id,
    e.user_id,
    e.session_id,
    e.created_at,
    p.page_path,
    p.page_title,
    p.referrer,
    d.device_type,
    d.os,
    d.browser,
    d.language,
    g.country,
    g.city,
    g.timezone,
    t.medium,
    t.source,
    t.campaign
FROM analytics_events e
LEFT JOIN analytics_page_info p ON e.id = p.event_id
LEFT JOIN analytics_device_info d ON e.id = d.event_id
LEFT JOIN analytics_geo_info g ON e.id = g.event_id
LEFT JOIN analytics_traffic_source t ON e.id = t.event_id;

-- 샘플 데이터 삽입을 위한 함수
CREATE OR REPLACE FUNCTION insert_analytics_event(
    p_event_name VARCHAR(100),
    p_timestamp BIGINT,
    p_client_id VARCHAR(36),
    p_user_id INTEGER,
    p_session_id VARCHAR(100),
    p_properties JSONB,
    p_page_info JSONB,
    p_device_info JSONB,
    p_geo_info JSONB,
    p_traffic_source JSONB
) RETURNS INTEGER AS $$
DECLARE
    event_id INTEGER;
    property_key VARCHAR(100);
    property_value TEXT;
BEGIN
    -- 이벤트 기본 정보 삽입
    INSERT INTO analytics_events (event_name, timestamp, client_id, user_id, session_id)
    VALUES (p_event_name, p_timestamp, p_client_id, p_user_id, p_session_id)
    RETURNING id INTO event_id;
    
    -- 이벤트 속성 삽입
    IF p_properties IS NOT NULL THEN
        FOR property_key, property_value IN SELECT * FROM jsonb_each_text(p_properties)
        LOOP
            INSERT INTO analytics_event_properties (event_id, property_key, property_value)
            VALUES (event_id, property_key, property_value);
        END LOOP;
    END IF;
    
    -- 페이지 정보 삽입
    IF p_page_info IS NOT NULL THEN
        INSERT INTO analytics_page_info (event_id, page_path, page_title, referrer)
        VALUES (
            event_id,
            p_page_info->>'page_path',
            p_page_info->>'page_title',
            p_page_info->>'referrer'
        );
    END IF;
    
    -- 디바이스 정보 삽입
    IF p_device_info IS NOT NULL THEN
        INSERT INTO analytics_device_info (event_id, device_type, os, browser, language)
        VALUES (
            event_id,
            p_device_info->>'type',
            p_device_info->>'os',
            p_device_info->>'browser',
            p_device_info->>'language'
        );
    END IF;
    
    -- 지리 정보 삽입
    IF p_geo_info IS NOT NULL THEN
        INSERT INTO analytics_geo_info (event_id, country, city, timezone)
        VALUES (
            event_id,
            p_geo_info->>'country',
            p_geo_info->>'city',
            p_geo_info->>'timezone'
        );
    END IF;
    
    -- 트래픽 소스 정보 삽입
    IF p_traffic_source IS NOT NULL THEN
        INSERT INTO analytics_traffic_source (
            event_id, medium, source, campaign,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content
        )
        VALUES (
            event_id,
            p_traffic_source->>'medium',
            p_traffic_source->>'source',
            p_traffic_source->>'campaign',
            p_traffic_source->'utm'->>'utm_source',
            p_traffic_source->'utm'->>'utm_medium',
            p_traffic_source->'utm'->>'utm_campaign',
            p_traffic_source->'utm'->>'utm_term',
            p_traffic_source->'utm'->>'utm_content'
        );
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql; 