# test1 테이블 클릭스트림 수집 시스템

## 개요

이 시스템은 웹사이트의 사용자 행동을 추적하기 위한 클릭스트림 데이터 수집 시스템입니다. `test1` 테이블을 사용하여 사용자의 페이지 뷰, 클릭, 세션 등의 이벤트를 수집합니다.

## 데이터베이스 설정

### 1. PostgreSQL 설치 및 데이터베이스 생성

```sql
-- 데이터베이스 생성
CREATE DATABASE your_database_name;
```

### 2. test1 테이블 생성

```bash
# PostgreSQL에 연결
psql -U postgres -d your_database_name

# SQL 스크립트 실행
\i test1_schema.sql
```

또는 직접 SQL 실행:

```sql
-- test1_schema.sql의 내용을 복사하여 실행
```

### 3. 새로운 컬럼 추가 (선택사항)

```sql
-- 더 상세한 요소 정보를 위한 추가 컬럼들
ALTER TABLE test1
ADD COLUMN element_tag TEXT,
ADD COLUMN element_id TEXT,
ADD COLUMN element_class TEXT,
ADD COLUMN element_text TEXT,
ADD COLUMN element_path TEXT;
```

### 4. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_password
DB_PORT=5434
```

## 시스템 구조

### 클라이언트 측 (React)

- `client/src/analytics.js`: Analytics SDK
- `client/src/autoAnalytics.js`: 자동 이벤트 수집 스크립트
- `client/src/App.jsx`: 이벤트 추적 설정
- `client/src/main.jsx`: Redux store 전역 노출

### 서버 측 (Express)

- `server/routes/analytics.js`: 이벤트 수집 API
- `server/db.js`: PostgreSQL 연결 설정

## 수집되는 이벤트

### 자동 수집 이벤트 (autoAnalytics.js)

1. **page_view**: 페이지 로드 시 자동 수집
2. **user_session_restored**: 사용자 세션 복구 시
3. **user_session_expired**: 사용자 세션 만료 시
4. **user_session_error**: 세션 오류 시
5. **auto_click**: 모든 클릭 이벤트 자동 수집
6. **button_click**: 버튼 클릭 자동 감지
7. **link_click**: 링크 클릭 자동 감지
8. **input_click**: 입력 필드 클릭 자동 감지
9. **form_submit**: 폼 제출 자동 감지
10. **input_focus**: 입력 필드 포커스 자동 감지
11. **input_blur**: 입력 필드 블러 자동 감지
12. **input_typing_complete**: 타이핑 완료 자동 감지
13. **scroll_position**: 스크롤 위치 자동 추적
14. **page_exit**: 페이지 이탈 시 체류 시간
15. **page_visibility_change**: 페이지 가시성 변경 (탭 전환 등)
16. **window_resize**: 윈도우 크기 변경

### 수동 추적 이벤트 (기존)

- 헤더 네비게이션, 홈페이지, 로그인/회원가입, 포스트 관련 등 모든 기존 이벤트

## 수집되는 데이터

### 기본 정보

- `event_name`: 이벤트 이름
- `timestamp`: 이벤트 발생 시간
- `client_id`: 클라이언트 고유 ID (UUID)
- `user_id`: 사용자 ID (로그인 시)
- `session_id`: 세션 ID

### 페이지 정보

- `page_path`: 현재 페이지 경로
- `page_title`: 페이지 제목
- `referrer`: 이전 페이지 URL

### 디바이스 정보

- `device_type`: 디바이스 타입 (mobile/desktop)
- `os`: 운영체제
- `browser`: 브라우저
- `language`: 언어 설정
- `timezone`: 시간대

### 트래픽 정보

- `traffic_medium`: UTM 매체
- `traffic_source`: UTM 소스
- `traffic_campaign`: UTM 캠페인

### 요소 정보 (새로운 컬럼들)

- `element_tag`: HTML 태그 (예: BUTTON, A, INPUT)
- `element_id`: HTML ID 속성
- `element_class`: CSS 클래스
- `element_text`: 요소의 텍스트 내용
- `element_path`: CSS 선택자 경로 (예: div.container > button#submit)

### 사용자 정의 데이터

- `properties`: 사용자 정의 속성 (JSON)
- `context`: 추가 컨텍스트 정보 (JSON)

### 클릭 상세 정보

- `click_x`, `click_y`: 클릭 좌표
- `page_x`, `page_y`: 페이지 기준 클릭 좌표
- `target_href`: 링크의 href 속성
- `target_type`: 입력 필드의 type 속성
- `target_value`: 입력 필드의 값

## 사용 방법

### 1. 자동 이벤트 수집 (권장)

한 줄의 스크립트만 추가하면 모든 이벤트가 자동으로 수집됩니다:

```html
<!-- HTML에서 -->
<script src="/src/autoAnalytics.js"></script>
```

또는 React에서:

```javascript
// main.jsx에서
import "./autoAnalytics.js";
```

### 2. 수동 이벤트 전송 (선택사항)

```javascript
// 커스텀 이벤트
AnalyticsSDK.sendEvent(
  "custom_event",
  {
    custom_property: "value",
  },
  userId
);
```

### 3. 버튼 추적 (선택사항)

```javascript
// 기본 클릭 추적
AnalyticsSDK.trackClick(element, "button_click", {
  button_name: "submit",
});

// 상세 버튼 추적
AnalyticsSDK.trackButton(element, "submit_button", {
  form_type: "contact",
});
```

## 자동 수집되는 이벤트 상세

### 클릭 이벤트

- **모든 클릭**: 페이지의 모든 클릭 이벤트가 자동으로 수집됩니다
- **버튼 클릭**: `<button>`, `type="submit"` 요소 자동 감지
- **링크 클릭**: `<a>` 태그 자동 감지
- **입력 필드 클릭**: `<input>`, `<textarea>`, `<select>` 자동 감지

### 폼 이벤트

- **폼 제출**: 모든 `<form>` 제출 자동 감지
- **입력 필드 포커스**: 필드 클릭 시 자동 감지
- **입력 필드 블러**: 필드에서 포커스 해제 시 자동 감지
- **타이핑 완료**: 1초간 타이핑이 없으면 완료로 간주

### 페이지 이벤트

- **스크롤**: 스크롤 위치 실시간 추적
- **페이지 이탈**: 페이지를 떠날 때 체류 시간 기록
- **탭 전환**: 다른 탭으로 이동할 때 감지
- **윈도우 리사이즈**: 브라우저 창 크기 변경 감지

## API 엔드포인트

### 이벤트 수집

```
POST /api/analytics/collect
Content-Type: application/json

{
  "event_name": "button_click",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "client_id": "uuid-here",
  "user_id": 123,
  "session_id": "sess_123",
  "page_path": "/home",
  "page_title": "Home Page",
  "element_tag": "BUTTON",
  "element_id": "submit-btn",
  "element_class": "btn btn-primary",
  "element_text": "제출하기",
  "element_path": "div.container > form > button#submit-btn",
  "properties": { "button_name": "submit" },
  "device_type": "desktop",
  "os": "Windows",
  "browser": "Chrome"
}
```

### 이벤트 조회

```
GET /api/analytics/events?event_name=button_click&limit=10&offset=0
```

### 통계 조회

```
GET /api/analytics/stats?start_date=2024-01-01&end_date=2024-01-31
```

## 개발 환경에서 테스트

### 1. 서버 실행

```bash
cd server
npm install
npm run dev
```

### 2. 클라이언트 실행

```bash
cd client
npm install
npm run dev
```

### 3. 이벤트 확인

- 브라우저 개발자 도구 콘솔에서 이벤트 로그 확인
- PostgreSQL에서 직접 데이터 확인:

```sql
SELECT * FROM test1 ORDER BY timestamp DESC LIMIT 10;
```

### 4. 자동 이벤트 확인

```sql
-- 자동 수집된 클릭 이벤트 확인
SELECT event_name, element_tag, element_text, timestamp
FROM test1
WHERE event_name LIKE 'auto_%' OR event_name IN ('button_click', 'link_click', 'input_click')
ORDER BY timestamp DESC
LIMIT 20;
```

## 성능 최적화

### 인덱스

다음 인덱스가 자동으로 생성됩니다:

- `idx_test1_event_name`: 이벤트 이름 검색 최적화
- `idx_test1_timestamp`: 시간 기반 검색 최적화
- `idx_test1_client_id`: 클라이언트별 검색 최적화
- `idx_test1_user_id`: 사용자별 검색 최적화
- `idx_test1_session_id`: 세션별 검색 최적화
- `idx_test1_page_path`: 페이지별 검색 최적화

### 추가 인덱스 (새로운 컬럼들)

```sql
-- 요소별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_test1_element_tag ON test1(element_tag);
CREATE INDEX IF NOT EXISTS idx_test1_element_id ON test1(element_id);
CREATE INDEX IF NOT EXISTS idx_test1_element_class ON test1(element_class);
```

### 데이터 보관 정책

- 오래된 데이터는 정기적으로 아카이브하거나 삭제
- 파티셔닝을 고려하여 월별/년별 테이블 분리 가능

## 보안 고려사항

1. **개인정보 보호**: 민감한 개인정보는 수집하지 않음
2. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
3. **API 인증**: 관리자 API는 적절한 인증 필요
4. **데이터 암호화**: 민감한 데이터는 암호화 저장
5. **자동 수집 제한**: 민감한 필드(password 등)는 자동 수집에서 제외

## 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 오류**

   - 환경 변수 확인
   - PostgreSQL 서비스 실행 상태 확인
   - 방화벽 설정 확인

2. **이벤트가 수집되지 않음**

   - 브라우저 콘솔에서 오류 확인
   - 네트워크 탭에서 API 호출 확인
   - CORS 설정 확인

3. **자동 이벤트가 수집되지 않음**

   - autoAnalytics.js가 제대로 로드되었는지 확인
   - 콘솔에서 "Auto Analytics 초기화 완료" 메시지 확인

4. **성능 문제**
   - 인덱스 확인
   - 쿼리 최적화
   - 데이터베이스 연결 풀 설정 확인

## 분석 예시

### 사용자 행동 분석

```sql
-- 가장 많이 클릭된 버튼 순위
SELECT element_text, element_id, COUNT(*) as click_count
FROM test1
WHERE event_name = 'button_click'
  AND element_text IS NOT NULL
GROUP BY element_text, element_id
ORDER BY click_count DESC
LIMIT 10;

-- 페이지별 클릭 분포
SELECT page_path, COUNT(*) as click_count
FROM test1
WHERE event_name = 'auto_click'
GROUP BY page_path
ORDER BY click_count DESC;

-- 사용자별 활동 패턴
SELECT user_id, COUNT(*) as event_count,
       COUNT(DISTINCT event_name) as unique_events,
       MIN(timestamp) as first_activity,
       MAX(timestamp) as last_activity
FROM test1
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY event_count DESC;
```
