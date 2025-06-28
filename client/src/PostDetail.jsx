import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { sendEvent } from './feat/analyticsSdk';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import deletePost from "./app/deletePost";

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [tags, setTags] = useState([]);

  const authorId = useSelector((state) => state.auth.id);
  const username = useSelector((state) => state.auth.username);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => setPost(data));
    fetch(`/api/posts/${id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data));
    fetch(`/api/posts/${id}/tags`)
      .then(res => res.json())
      .then(setTags);
  }, [id]);

  if (!post) return <div>로딩 중…</div>;
  const isAuthor = post.author_id === authorId;
  const isPostAuthor = post.author_id === authorId;

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return;

    await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author_id: authorId,
        content: commentInput,
      }),
    });

    setCommentInput("");
    // 댓글 새로고침
    const res = await fetch(`/api/posts/${id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleEditSave = async (commentId) => {
    await fetch(`/api/posts/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: editingContent,
        author_id: authorId,
      }),
    });

    setEditingCommentId(null);
    refreshComments();
  };

  const handleDeleteComments = async (commentId) => {
    const ok = window.confirm("정말 삭제하시겠습니까?");
    if (!ok) return;

    await fetch(`/api/posts/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_id: authorId }),
    });

    refreshComments();
  };

  const refreshComments = async () => {
    const res = await fetch(`/api/posts/${id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const handleDeletePost = async () => {
    const ok = window.confirm(
      "정말 게시글을 삭제하시겠습니까? 삭제 후에는 복원할 수 없습니다."
    );
    if (!ok) return;

    try {
      await deletePost(post.id, authorId);
      alert("삭제가 완료되었습니다.");
      navigate("/");
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="board-wrapper" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
      <div style={{ textAlign: "left" }}>
        <Link to="/"><small>← 목록으로 돌아가기</small></Link>
      </div>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <h2 style={{ marginBottom: 0, whiteSpace: "nowrap" }}>{post.title}</h2>
          <p className="read-the-docs" style={{ marginTop: "4px", fontSize: "0.9rem" }}>
            <strong>작성자:</strong> {post.author} | <strong>작성일:</strong> {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        {isAuthor && (
          <div style={{ display: "flex", flexDirection:"row", gap:"0.5rem" }}>
            <Link to={`/posts/${post.id}/edit`}><button style={{ whiteSpace: "nowrap" }}>게시글 수정</button></Link>
            <button style={{ whiteSpace: "nowrap" }} onClick={handleDeletePost}>게시글 삭제</button>
          </div>
        )}
      </div>

      <div
        style={{
          width: "100%",
          minHeight: "200px",
          padding: "12px",
          background: "#f9f9f9",
          border: "1px solid #ccc",
          marginTop: "1rem",
          marginBottom: "1rem",
          textAlign: "left",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* 태그 표시 */}
      {tags.length > 0 && (
        <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "row", alignItems: "flex-start" }}>
          {tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                display: "inline-block",
                marginRight: "8px",
                padding: "4px 8px",
                backgroundColor: "#f0f0f0",
                borderRadius: "12px",
                fontSize: "0.9rem",
              }}
            >
              <Link to={`/?tag=${tag.name}`} style={{ textDecoration: "none", color: "#007bff" }}>
                #{tag.name}
              </Link>
            </span>
          ))}
        </div>
      )}

      <hr />
      <h3 style = {{ textAlign: "left" }}>댓글</h3>
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {comments.map((c) => (
          <li key={c.id} style={{ marginBottom: "1rem", background: "#fafafa", padding: "12px", border:"1px solid #cccccc", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{c.author}</strong>
              <small className="read-the-docs">{new Date(c.created_at).toLocaleString()}</small>
            </div>
            {editingCommentId === c.id ? (
              <>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{ width: "100%", marginTop: "6px" }}
                />
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => handleEditSave(c.id)}>저장</button>
                  <button onClick={() => setEditingCommentId(null)}>취소</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: "6px 0", textAlign: "left" }}>{c.content}</p>
                {c.author_id === authorId && (
                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => startEdit(c)}>수정</button>
                    <button onClick={() => handleDeleteComments(c.id)} style={{ marginLeft: "8px" }}>삭제</button>
                  </div>
                )}
                {(c.author_id !== authorId && isPostAuthor) && (
                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => handleDeleteComments(c.id)}>삭제</button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {authorId ? (
          <>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="댓글을 입력하세요"
              style={{ flex: 1, height: "60px" }}
            />
            <button
              onClick= {() => {
                sendEvent('add_comment', { author_id: authorId, content: commentInput, }, username);
                handleCommentSubmit();
              }}
              style={{ padding: "8px 16px", height: "60px" }}
              className="cta-btn"
            >
              댓글 등록
            </button>
          </>
        ) : (
          <p>댓글을 작성하려면 로그인해주세요.</p>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
