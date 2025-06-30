-- test1 테이블 생성 (클릭스트림 수집용)
CREATE TABLE IF NOT EXISTS test1 (
  id SERIAL PRIMARY KEY,
  -- 이벤트 기본 정보
  event_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  -- 식별자
  client_id UUID NOT NULL,
  user_id INTEGER,
  session_id TEXT,
  -- 기본 페이지 정보
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  -- 사용자 정의 속성(properties)
  properties JSONB,
  -- 디바이스/트래픽 정보 (context)
  device_type TEXT,
  os TEXT,
  browser TEXT,
  language TEXT,
  timezone TEXT,
  traffic_medium TEXT,
  traffic_source TEXT,
  traffic_campaign TEXT,
  context JSONB,
  -- 생성 시간 (DB 수신 기준)
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_test1_event_name ON test1(event_name);
CREATE INDEX IF NOT EXISTS idx_test1_timestamp ON test1(timestamp);
CREATE INDEX IF NOT EXISTS idx_test1_client_id ON test1(client_id);
CREATE INDEX IF NOT EXISTS idx_test1_user_id ON test1(user_id);
CREATE INDEX IF NOT EXISTS idx_test1_session_id ON test1(session_id);
CREATE INDEX IF NOT EXISTS idx_test1_page_path ON test1(page_path);

-- 테이블 설명
COMMENT ON TABLE test1 IS '클릭스트림 데이터 수집용 테이블';
COMMENT ON COLUMN test1.event_name IS '이벤트 이름 (예: page_view, button_click)';
COMMENT ON COLUMN test1.timestamp IS '이벤트 발생 시간 (클라이언트 기준)';
COMMENT ON COLUMN test1.client_id IS '클라이언트 고유 식별자 (UUID)';
COMMENT ON COLUMN test1.user_id IS '사용자 ID (로그인한 경우)';
COMMENT ON COLUMN test1.session_id IS '세션 ID';
COMMENT ON COLUMN test1.page_path IS '페이지 경로';
COMMENT ON COLUMN test1.page_title IS '페이지 제목';
COMMENT ON COLUMN test1.referrer IS '이전 페이지 URL';
COMMENT ON COLUMN test1.properties IS '사용자 정의 속성 (JSON)';
COMMENT ON COLUMN test1.device_type IS '디바이스 타입 (mobile/desktop)';
COMMENT ON COLUMN test1.os IS '운영체제';
COMMENT ON COLUMN test1.browser IS '브라우저';
COMMENT ON COLUMN test1.language IS '언어 설정';
COMMENT ON COLUMN test1.timezone IS '시간대';
COMMENT ON COLUMN test1.traffic_medium IS '트래픽 매체 (utm_medium)';
COMMENT ON COLUMN test1.traffic_source IS '트래픽 소스 (utm_source)';
COMMENT ON COLUMN test1.traffic_campaign IS '트래픽 캠페인 (utm_campaign)';
COMMENT ON COLUMN test1.context IS '추가 컨텍스트 정보 (JSON)';
COMMENT ON COLUMN test1.received_at IS '서버 수신 시간'; 