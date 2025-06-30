import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import "./css/Home.css";
import shortenWords from "./feat/shortenWords";
import AnalyticsSDK from "./analytics";

function Home() {
    const [posts, setPosts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page")) || 1;
    const tag = searchParams.get("tag");
    const navigate = useNavigate();

    const fetchPosts = async (pageNum) => {
        try {
            setLoading(true);
            setError(null);
            const query = tag ? `?tag=${tag}&page=${pageNum}` : `?page=${pageNum}`;
            const res = await fetch(`/api/posts${query}`);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
            setSearchParams({ page: pageNum, ...(tag ? { tag } : {}) });
        } catch (err) {
            console.error('포스트 조회 실패:', err);
            setError('포스트를 불러오는데 실패했습니다.');
            setPosts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (post) => {
        AnalyticsSDK.sendEvent('post_click', {
            post_id: post.id,
            post_title: post.title,
            post_author: post.author,
            current_page: page,
            tag: tag
        });
        navigate(`/posts/${post.id}`);
    };

    const handleWriteButtonClick = () => {
        AnalyticsSDK.sendEvent('write_button_click', {
            current_page: page,
            tag: tag
        });
    };

    const handleTagResetClick = () => {
        AnalyticsSDK.sendEvent('tag_reset_click', {
            tag: tag,
            current_page: page
        });
        setSearchParams({ page: 1 });
    };

    const handlePaginationClick = (pageNum) => {
        AnalyticsSDK.sendEvent('pagination_click', {
            from_page: page,
            to_page: pageNum,
            tag: tag
        });
        fetchPosts(pageNum);
    };

    const renderPagination = () => {
        const buttons = [];
        const maxPage = totalPages;
        const current = page;
        // 이전 버튼
        buttons.push(
            <button
                key="prev"
                onClick={() => handlePaginationClick(current - 1)}
                disabled={current === 1}
                className={current === 1 ? "disabled" : ""}
            >
                ◀︎ 이전
            </button>
        );
        // 1번 페이지
        buttons.push(
            <button
                key={1}
                onClick={() => handlePaginationClick(1)}
                className={current === 1 ? "active cta-btn" : "cta-btn"}
            >
                1
            </button>
        );
        // … 왼쪽
        if (current > 3) {
            buttons.push(<span key="start-ellipsis">…</span>);
        }
        // 현재 기준 ±1 페이지
        for (let i = current - 1; i <= current + 1; i++) {
            if (i > 1 && i < maxPage) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => handlePaginationClick(i)}
                        className={current === i ? "active cta-btn" : "cta-btn"}
                    >
                        {i}
                    </button>
                );
            }
        }
        // … 오른쪽
        if (current < maxPage - 2) {
            buttons.push(<span key="end-ellipsis">…</span>);
        }
        // 마지막 페이지
        if (maxPage > 1) {
            buttons.push(
                <button
                    key={maxPage}
                    onClick={() => handlePaginationClick(maxPage)}
                    className={current === maxPage ? "active" : ""}
                >
                    {maxPage}
                </button>
            );
        }
        // 다음 버튼
        buttons.push(
            <button
                key="next"
                onClick={() => handlePaginationClick(current + 1)}
                disabled={current === maxPage}
                className={current === maxPage ? "disabled" : "cta-btn"}
            >
                다음 ▶︎
            </button>
        );
        return <div className="pagination">{buttons}</div>;
    };

    useEffect(() => {
        fetchPosts(page);
    }, [page, tag]);

    if (loading) {
        return (
            <div className="board-wrapper">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>로딩 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="board-wrapper">
                <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>
                    <p>{error}</p>
                    <button onClick={() => fetchPosts(page)} style={{ marginTop: '10px' }}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="board-wrapper">
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                }}
            >
                <Link to="/" style={{ textDecoration: "none" }}>
                    <h1 className="board-title">TIL Board</h1>
                </Link>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-end",
                    }}
                >
                    {tag && (
                        <div
                            style={{
                                marginBottom: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                            }}
                        >
                            <span
                                title={`#${tag}`}
                                style={{
                                    fontWeight: "bold",
                                    color: "#007bff",
                                    maxWidth: "120px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                #{tag}
                            </span>
                            <button
                                onClick={handleTagResetClick}
                                style={{
                                    marginLeft: "0.5rem",
                                    background: "#eee",
                                    border: "none",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    fontSize: "0.85rem",
                                    transition: "background 0.2s ease",
                                }}
                                onMouseOver={(e) =>
                                    (e.target.style.background = "#ddd")
                                }
                                onMouseOut={(e) =>
                                    (e.target.style.background = "#eee")
                                }
                            >
                                태그 초기화 ✕
                            </button>
                        </div>
                    )}
                    <Link to="/posts/new" onClick={handleWriteButtonClick}>
                        <button className="cta-btn" style={{ margin: "8px" }}>
                            작성하기
                        </button>
                    </Link>
                </div>
            </div>
            <table className="board-table">
                <thead>
                    <tr>
                        <th>번호</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>작성일</th>
                    </tr>
                </thead>
                <tbody>
                    {posts && posts.length > 0 ? (
                        posts.map((post) => (
                            <tr
                                key={post.id}
                                onClick={() => handlePostClick(post)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{post.id}</td>
                                <td>{shortenWords(post.title, 20)}</td>
                                <td>{post.author}</td>
                                <td>
                                {new Date(post.created_at).toLocaleString("ko-KR", {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                })}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                아직 작성된 포스트가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination-wrapper">{renderPagination()}</div>
            )}
        </div>
    );
}

export default Home;
