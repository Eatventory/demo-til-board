import { useState, useEffect } from "react";
import "./css/AnalyticsDashboard.css";

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [realtime, setRealtime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/analytics/stats');
            const data = await response.json();
            setStats(data.stats);
        } catch (err) {
            console.error('통계 데이터 조회 실패:', err);
            setError('통계 데이터를 불러오는데 실패했습니다.');
        }
    };

    const fetchRealtime = async () => {
        try {
            const response = await fetch('/api/analytics/realtime');
            const data = await response.json();
            setRealtime(data.realtime);
        } catch (err) {
            console.error('실시간 데이터 조회 실패:', err);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchRealtime();
        setLoading(false);

        // 실시간 데이터 30초마다 업데이트
        const interval = setInterval(fetchRealtime, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="dashboard-loading">로딩 중...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
        <div className="analytics-dashboard">
            <h1>Analytics 대시보드</h1>
            
            {/* 실시간 통계 */}
            {realtime && (
                <div className="realtime-stats">
                    <h2>실시간 통계</h2>
                    <div className="realtime-cards">
                        <div className="stat-card">
                            <h3>활성 세션</h3>
                            <p className="stat-number">{realtime.active_sessions || 0}</p>
                        </div>
                        <div className="stat-card">
                            <h3>활성 사용자</h3>
                            <p className="stat-number">{realtime.active_users || 0}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 이벤트 통계 */}
            {stats && stats.events && stats.events.length > 0 && (
                <div className="stats-section">
                    <h2>이벤트 통계</h2>
                    <div className="stats-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>이벤트명</th>
                                    <th>총 발생 횟수</th>
                                    <th>고유 사용자</th>
                                    <th>고유 세션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.events.map((event, index) => (
                                    <tr key={index}>
                                        <td>{event.event_name}</td>
                                        <td>{event.count}</td>
                                        <td>{event.unique_users}</td>
                                        <td>{event.unique_sessions}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 페이지 통계 */}
            {stats && stats.pages && stats.pages.length > 0 && (
                <div className="stats-section">
                    <h2>페이지별 통계</h2>
                    <div className="stats-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>페이지 경로</th>
                                    <th>페이지뷰</th>
                                    <th>고유 사용자</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.pages.map((page, index) => (
                                    <tr key={index}>
                                        <td>{page.page_path}</td>
                                        <td>{page.page_views}</td>
                                        <td>{page.unique_users}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 디바이스 통계 */}
            {stats && stats.devices && stats.devices.length > 0 && (
                <div className="stats-section">
                    <h2>디바이스별 통계</h2>
                    <div className="stats-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>디바이스 타입</th>
                                    <th>OS</th>
                                    <th>브라우저</th>
                                    <th>사용 횟수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.devices.map((device, index) => (
                                    <tr key={index}>
                                        <td>{device.device_type}</td>
                                        <td>{device.os}</td>
                                        <td>{device.browser}</td>
                                        <td>{device.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 데이터가 없을 때 메시지 */}
            {stats && (!stats.events || stats.events.length === 0) && (
                <div className="stats-section">
                    <h2>데이터 현황</h2>
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        아직 수집된 Analytics 데이터가 없습니다.<br />
                        사이트를 사용해보시면 데이터가 수집됩니다.
                    </p>
                </div>
            )}

            <div className="dashboard-footer">
                <p>마지막 업데이트: {new Date().toLocaleString('ko-KR')}</p>
                <button onClick={() => { fetchStats(); fetchRealtime(); }}>
                    새로고침
                </button>
            </div>
        </div>
    );
}

export default AnalyticsDashboard; 