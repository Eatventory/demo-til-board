import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./css/Mypage.css";
import deletePost from "./app/deletePost";
import shortenWords from "./feat/shortenWords";
import { setCredentials, clearAuth } from "./feat/authSlice";

function Mypage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken, username, name, id } = useSelector(
    (state) => state.auth
  );
  const [userPosts, setUserPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [postCount, setPostCount] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const pwForm =
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/;

  const fetchMyPosts = async (pageNum) => {
    const res = await fetch(`/api/mypage?page=${pageNum}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    setUserPosts(data.posts);
    setTotalPages(data.totalPages || 1);
    setSearchParams({ page: pageNum });
    setPostCount(data.postCount);
  };

  const renderPagination = () => {
    const buttons = [];
    const maxPage = totalPages;
    const current = page;

    buttons.push(
      <button
        key="prev"
        onClick={() => fetchMyPosts(current - 1)}
        disabled={current === 1}
        className={current === 1 ? "disabled" : ""}
      >
        ◀ 이전
      </button>
    );

    if (maxPage <= 5) {
      for (let i = 1; i <= maxPage; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => fetchMyPosts(i)}
            className={current === i ? "active" : ""}
          >
            {i}
          </button>
        );
      }
    } else {
      buttons.push(
        <button
          key={1}
          onClick={() => fetchMyPosts(1)}
          className={current === 1 ? "active" : ""}
        >
          1
        </button>
      );
      if (current > 3) buttons.push(<span key="start-ellipsis">…</span>);
      for (let i = current - 1; i <= current + 1; i++) {
        if (i > 1 && i < maxPage) {
          buttons.push(
            <button
              key={i}
              onClick={() => fetchMyPosts(i)}
              className={current === i ? "active" : ""}
            >
              {i}
            </button>
          );
        }
      }
      if (current < maxPage - 2)
        buttons.push(<span key="end-ellipsis">…</span>);
      buttons.push(
        <button
          key={maxPage}
          onClick={() => fetchMyPosts(maxPage)}
          className={current === maxPage ? "active" : ""}
        >
          {maxPage}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => fetchMyPosts(current + 1)}
        disabled={current === maxPage}
        className={current === maxPage ? "disabled" : ""}
      >
        다음 ▶
      </button>
    );

    return <div className="pagination">{buttons}</div>;
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchMyPosts(page);
  }, [accessToken, page]);

  const handleDeletePost = async (postId) => {
    const ok = window.confirm(
      "정말 게시글을 삭제하시겠습니까? 삭제 후에는 복원할 수 없습니다."
    );
    if (!ok) return;

    try {
      await deletePost(postId, id);
      alert("삭제가 완료되었습니다.");
      navigate("/mypage");
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };

  const withdrawUser = async () => {
    const ok = window.confirm(
      "정말 회원 탈퇴하시겠습니까?\n(작성한 게시글과 댓글은 자동으로 삭제되지 않습니다.)"
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/mypage/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        alert("탈퇴 실패: " + data.message);
        return;
      }

      alert("회원 탈퇴가 완료되었습니다.");
      dispatch(clearAuth());
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error("탈퇴 오류:", err);
      alert("서버 오류로 탈퇴에 실패했습니다.");
    }
  };

  const handleEditProfileClick = () => {
    setIsEditing(true);
  };

  const handleNameSave = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/mypage/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: newName,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          username: data.username,
          id: data.id,
          name: data.name,
        })
      );
      alert("이름이 변경되었습니다.");
      navigate("/mypage");
      setIsEditing(false);
    } else {
      alert(data.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      alert("모든 비밀번호 필드를 입력해주세요.");
      return;
    }
    if (!pwForm.test(newPw)) {
      alert(
        "유효한 비밀번호를 사용해주세요.\n(8~16자의 영문 대/소문자, 숫자, 특수문자)"
      );
      return;
    }
    if (newPw !== confirmPw) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    const res = await fetch("/api/mypage/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        currentPassword: currentPw,
        newPassword: newPw,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("비밀번호가 변경되었습니다.");
      setIsEditing(false);
    } else {
      alert("변경 실패: " + data.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handlePostClick = (post) => {
    navigate(`/posts/${post.id}`);
  };

  const handlePostEditClick = (post) => {};

  return (
    <div
      className="login_body"
      style={{
        minHeight: "calc(100vh - 160px)",
        paddingTop: "80px",
        paddingBottom: "80px",
      }}
    >
      <div className="mypage-container">
        <h1 className="mypage-title">마이페이지</h1>
        <div className="user-info">
          {!isEditing ? (
            <>
              <div className="user-details" style={{ textAlign: "left" }}>
                <p className="user-name">{`이름: ${name}`}</p>
                <p className="user-id">{`ID: ${username}`}</p>
              </div>
              <button className="edit-button" onClick={handleEditProfileClick}>
                프로필 수정
              </button>
            </>
          ) : (
            <>
              <form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "6px",
                }}
                onSubmit={handleNameSave}
              >
                <h3>이름 변경</h3>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  maxLength={10}
                />
                <button type="submit">이름 저장</button>
              </form>
              <form
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
                onSubmit={handlePasswordChange}
              >
                <h3 style={{ margin: "0" }}>비밀번호 변경</h3>
                <input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                />
                <button type="submit">비밀번호 저장</button>
              </form>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-end",
                }}
              >
                <small
                  className="read-the-docs"
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => withdrawUser()}
                >
                  회원 탈퇴
                </small>
                <button onClick={handleCancelEdit}>취소</button>
              </div>
            </>
          )}
        </div>

        <div className="user-posts">
          <h2>내가 쓴 글 ({postCount})</h2>
          {userPosts.length === 0 ? (
            <p className="no-posts">작성한 글이 없습니다.</p>
          ) : (
            <table className="board-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {userPosts.map((post) => (
                  <tr key={post.id} className="post-row">
                    <td
                      onClick={() => handlePostClick(post)}
                      style={{ cursor: "pointer" }}
                    >
                      {shortenWords(post.title, 20)}
                    </td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to={`/posts/${post.id}/edit`}
                        onClick={() => handlePostEditClick(post)}
                      >
                        <button
                          style={{
                            marginRight: "6px",
                          }}
                        >
                          수정
                        </button>
                      </Link>
                      <button onClick={() => handleDeletePost(post.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {userPosts.length > 0 && renderPagination()}
        </div>
      </div>
    </div>
  );
}

export default Mypage;
