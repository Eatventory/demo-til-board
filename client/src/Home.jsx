import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { sendEvent } from './feat/analyticsSdk';
import "./css/Home.css";
import shortenWords from "./feat/shortenWords";

function Home() {
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const tag = searchParams.get("tag");
  const navigate = useNavigate();

  const fetchPosts = async (pageNum) => {
    const query = tag ? `?tag=${tag}&page=${pageNum}` : `?page=${pageNum}`;
    const res = await fetch(`/api/posts${query}`);
    const data = await res.json();
    setPosts(data.posts);
    setTotalPages(data.totalPages);
    setSearchParams({ page: pageNum, ...(tag ? { tag } : {}) });
  };

  const renderPagination = () => {
    const buttons = [];
    const maxPage = totalPages;
    const current = page;
    // 이전 버튼
    buttons.push(
      <button
        key="prev"
        onClick={() => fetchPosts(current - 1)}
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
        onClick={() => fetchPosts(1)}
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
            onClick={() => fetchPosts(i)}
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
          onClick={() => fetchPosts(maxPage)}
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
        onClick={() => fetchPosts(current + 1)}
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
    sendEvent('page_view', {}, 'user_1234');
  }, [page, tag]);

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
                onClick={() => setSearchParams({ page: 1 })}
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
          <Link to="/posts/new">
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
          {posts.map((post) => (
            <tr
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              style={{ cursor: "pointer" }}
            >
              <td>{post.id}</td>
              <td>{shortenWords(post.title, 20)}</td>
              <td>{post.author}</td>
              <td>
                {new Date(post.created_at).toLocaleString(
                  "ko-KR",
                  {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  }
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-wrapper">{renderPagination()}</div>
    </div>
  );
}

export default Home;
