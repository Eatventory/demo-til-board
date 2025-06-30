const express = require("express");
const router = express.Router();
const pool = require("../db");

// Analytics 이벤트 수집 API - test1 테이블용
router.post("/collect", async (req, res) => {
  try {
    const {
      event_name,
      timestamp,
      client_id,
      user_id,
      session_id,
      page_path,
      page_title,
      referrer,
      properties,
      device_type,
      os,
      browser,
      language,
      timezone,
      traffic_medium,
      traffic_source,
      traffic_campaign,
      context,
    } = req.body;

    // 필수 필드 검증
    if (!event_name || !timestamp || !client_id) {
      return res.status(400).json({
        error: "필수 필드가 누락되었습니다.",
        required: ["event_name", "timestamp", "client_id"],
      });
    }

    // test1 테이블에 직접 삽입
    const query = `
            INSERT INTO test1 (
                event_name,
                timestamp,
                client_id,
                user_id,
                session_id,
                page_path,
                page_title,
                referrer,
                properties,
                device_type,
                os,
                browser,
                language,
                timezone,
                traffic_medium,
                traffic_source,
                traffic_campaign,
                context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING id
        `;

    const values = [
      event_name,
      timestamp,
      client_id,
      user_id || null,
      session_id || null,
      page_path || null,
      page_title || null,
      referrer || null,
      properties ? JSON.stringify(properties) : null,
      device_type || null,
      os || null,
      browser || null,
      language || null,
      timezone || null,
      traffic_medium || null,
      traffic_source || null,
      traffic_campaign || null,
      context ? JSON.stringify(context) : null,
    ];

    const result = await pool.query(query, values);
    const eventId = result.rows[0].id;

    console.log(`Analytics 이벤트 저장 완료: ${event_name} (ID: ${eventId})`);

    res.status(200).json({
      success: true,
      event_id: eventId,
      message: "이벤트가 성공적으로 저장되었습니다.",
    });
  } catch (error) {
    console.error("Analytics 이벤트 저장 오류:", error);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// Analytics 데이터 조회 API (관리자용) - test1 테이블용
router.get("/events", async (req, res) => {
  try {
    const {
      event_name,
      client_id,
      user_id,
      session_id,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = req.query;

    let query = `
            SELECT * FROM test1 
            WHERE 1=1
        `;
    const values = [];
    let valueIndex = 1;

    // 필터 조건 추가
    if (event_name) {
      query += ` AND event_name = $${valueIndex++}`;
      values.push(event_name);
    }

    if (client_id) {
      query += ` AND client_id = $${valueIndex++}`;
      values.push(client_id);
    }

    if (user_id) {
      query += ` AND user_id = $${valueIndex++}`;
      values.push(user_id);
    }

    if (session_id) {
      query += ` AND session_id = $${valueIndex++}`;
      values.push(session_id);
    }

    if (start_date) {
      query += ` AND timestamp >= $${valueIndex++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND timestamp <= $${valueIndex++}`;
      values.push(end_date);
    }

    // 정렬 및 페이징
    query += ` ORDER BY timestamp DESC LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Analytics 데이터 조회 오류:", error);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// 이벤트 통계 API - test1 테이블용
router.get("/stats", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = "";
    const values = [];

    if (start_date && end_date) {
      whereClause = "WHERE timestamp BETWEEN $1 AND $2";
      values.push(start_date, end_date);
    }

    // 이벤트별 통계
    const eventStatsQuery = `
            SELECT 
                event_name,
                COUNT(*) as count,
                COUNT(DISTINCT client_id) as unique_users,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM test1
            ${whereClause}
            GROUP BY event_name
            ORDER BY count DESC
        `;

    // 페이지별 통계
    const pageStatsQuery = `
            SELECT 
                page_path,
                COUNT(*) as page_views,
                COUNT(DISTINCT client_id) as unique_users
            FROM test1
            WHERE page_path IS NOT NULL
            ${whereClause ? "AND " + whereClause.replace("WHERE", "") : ""}
            GROUP BY page_path
            ORDER BY page_views DESC
        `;

    // 디바이스별 통계
    const deviceStatsQuery = `
            SELECT 
                device_type,
                os,
                browser,
                COUNT(*) as count
            FROM test1
            WHERE device_type IS NOT NULL
            ${whereClause ? "AND " + whereClause.replace("WHERE", "") : ""}
            GROUP BY device_type, os, browser
            ORDER BY count DESC
        `;

    const [eventStats, pageStats, deviceStats] = await Promise.all([
      pool.query(eventStatsQuery, values),
      pool.query(pageStatsQuery, values),
      pool.query(deviceStatsQuery, values),
    ]);

    res.json({
      success: true,
      stats: {
        events: eventStats.rows,
        pages: pageStats.rows,
        devices: deviceStats.rows,
      },
    });
  } catch (error) {
    console.error("Analytics 통계 조회 오류:", error);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// 실시간 사용자 수 API
router.get("/realtime", async (req, res) => {
  try {
    // 최근 5분 내 활성 세션 수
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const query = `
            SELECT 
                COUNT(DISTINCT session_id) as active_sessions,
                COUNT(DISTINCT client_id) as active_users
            FROM analytics_events
            WHERE timestamp >= $1
        `;

    const result = await pool.query(query, [fiveMinutesAgo]);

    res.json({
      success: true,
      realtime: {
        active_sessions: parseInt(result.rows[0].active_sessions),
        active_users: parseInt(result.rows[0].active_users),
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("실시간 통계 조회 오류:", error);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

module.exports = router;
