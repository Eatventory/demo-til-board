# PostgreSQL 설치 및 설정 가이드

## 1. PostgreSQL 설치

### Windows에서 설치하기

1. **PostgreSQL 다운로드**
   - https://www.postgresql.org/download/windows/ 방문
   - "Download the installer" 클릭
   - 최신 버전 다운로드 (예: PostgreSQL 15.x)

2. **설치 과정**
   - 설치 프로그램 실행
   - 설치 디렉토리 선택 (기본값 권장)
   - **중요**: 다음 정보를 기억해주세요!
     - **포트**: 5432 (기본값)
     - **비밀번호**: 설정하신 비밀번호 (잃어버리면 안 됩니다!)
     - **사용자명**: postgres (기본값)

3. **설치 완료 후**
   - pgAdmin (GUI 도구)도 함께 설치됩니다
   - 시작 메뉴에서 "pgAdmin 4" 실행 가능

## 2. 데이터베이스 생성

### 방법 1: pgAdmin 사용 (GUI)

1. **pgAdmin 실행**
   - 시작 메뉴 → pgAdmin 4
   - 설치 시 설정한 비밀번호 입력

2. **데이터베이스 생성**
   - 왼쪽 트리에서 "PostgreSQL" → "Databases" 우클릭
   - "Create" → "Database"
   - Database name: `til_board`
   - "Save" 클릭

### 방법 2: 명령줄 사용

1. **psql 실행**
   ```bash
   # Windows 명령 프롬프트에서
   "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
   ```

2. **데이터베이스 생성**
   ```sql
   CREATE DATABASE til_board;
   \q
   ```

## 3. 서버 설정

### 1. 데이터베이스 연결 설정 수정

`server/db.js` 파일을 열어서 다음 정보를 수정하세요:

```javascript
const pool = new Pool({
    user: 'postgres',           // PostgreSQL 사용자명
    host: 'localhost',          // 데이터베이스 호스트
    database: 'til_board',      // 데이터베이스 이름
    password: 'your_password',  // 설치 시 설정한 비밀번호로 변경
    port: 5432,                 // PostgreSQL 포트
});
```

### 2. 스키마 생성

PostgreSQL에 연결한 후 다음 SQL 스크립트를 실행하세요:

```bash
# 방법 1: psql 명령줄에서
psql -U postgres -d til_board -f analytics_schema.sql

# 방법 2: pgAdmin에서
# - til_board 데이터베이스 선택
# - Query Tool 열기
# - analytics_schema.sql 내용 복사하여 실행
```

## 4. 테스트

### 1. 서버 실행
```bash
cd server
npm start
```

### 2. 연결 테스트
서버 콘솔에서 다음 메시지가 나타나면 성공입니다:
```
PostgreSQL 연결 성공: { now: '2024-01-01 12:00:00+09' }
```

### 3. Analytics API 테스트
브라우저에서 다음 URL로 테스트:
```
http://localhost:3000/api/analytics/stats
```

## 5. 유용한 PostgreSQL 명령어

### 기본 명령어
```sql
-- 데이터베이스 목록 보기
\l

-- 테이블 목록 보기
\dt

-- 테이블 구조 보기
\d analytics_events

-- 데이터 조회
SELECT * FROM analytics_events LIMIT 10;

-- 테이블 삭제 (주의!)
DROP TABLE analytics_events CASCADE;
```

### Analytics 데이터 조회 예제
```sql
-- 최근 이벤트 조회
SELECT event_name, timestamp, client_id 
FROM analytics_events 
ORDER BY timestamp DESC 
LIMIT 10;

-- 이벤트별 통계
SELECT event_name, COUNT(*) as count
FROM analytics_events 
GROUP BY event_name 
ORDER BY count DESC;

-- 페이지별 방문자 수
SELECT p.page_path, COUNT(DISTINCT e.client_id) as unique_users
FROM analytics_events e
JOIN analytics_page_info p ON e.id = p.event_id
GROUP BY p.page_path
ORDER BY unique_users DESC;
```

## 6. 문제 해결

### 연결 오류
- **비밀번호 확인**: `db.js`의 비밀번호가 올바른지 확인
- **포트 확인**: PostgreSQL이 5432 포트에서 실행 중인지 확인
- **서비스 확인**: Windows 서비스에서 PostgreSQL 서비스가 실행 중인지 확인

### 권한 오류
```sql
-- 사용자 권한 확인
SELECT usename, usesuper FROM pg_user;

-- 데이터베이스 권한 확인
SELECT datname, datacl FROM pg_database;
```

### 성능 최적화
- 인덱스가 자동으로 생성됩니다
- 대용량 데이터의 경우 파티셔닝 고려
- 정기적인 VACUUM 실행 권장

## 7. 백업 및 복원

### 백업
```bash
pg_dump -U postgres til_board > backup.sql
```

### 복원
```bash
psql -U postgres til_board < backup.sql
```

## 8. 모니터링

### 실시간 통계 확인
```bash
curl http://localhost:3000/api/analytics/realtime
```

### 이벤트 통계 확인
```bash
curl http://localhost:3000/api/analytics/stats
```

이제 PostgreSQL을 사용하여 Analytics 데이터를 저장할 수 있습니다! 