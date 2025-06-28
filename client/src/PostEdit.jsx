import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import MarkdownEditor from "./MarkdownEditor";

const PostEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [checkingLogin, setCheckingLogin] = useState(true);
    const authorId = useSelector((state) => state.auth.id);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");

    useEffect(() => {
        if (checkingLogin && authorId === null) return;
        fetch(`/api/posts/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.author_id !== authorId) {
                    alert("수정 권한이 없습니다.");
                    navigate("/");
                } else {
                    setTitle(data.title);
                    setContent(data.content);
                }
            });
        setCheckingLogin(false);
        
        fetch(`/api/posts/${id}/tags`)
            .then((res) => res.json())
            .then((data) => {
            const tagNames = data.map((tag) => tag.name).join(", ");
            setTags(tagNames);
        });
    }, [id, authorId, checkingLogin, navigate]);

    const handleUpdate = async () => {
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        const res = await fetch(`/api/posts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                content,
                author_id: authorId,
                tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            alert("수정 실패: " + err.error);
            return;
        }

        // alert("게시글이 수정되었습니다.");
        navigate(`/posts/${id}`);
    };

    return (
        <>
        <div style={{ height: "80px" }}></div>
        <div className="board-wrapper">
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
                maxLength={28}
            />
            <MarkdownEditor content={content} setContent={setContent} />
            <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="태그 입력 (쉼표로 구분)"
                style={{ width: "100%", padding: "8px" }}
            />
            <div style={{ marginTop: "1rem" }}>
                <button onClick={handleUpdate}>수정 완료</button>
                <button onClick={() => navigate(`/posts/${id}`)} style={{ marginLeft: "8px" }}>
                    취소
                </button>
            </div>
        </div>
        <div style={{ height: "80px" }}></div>
        </>
    );
};

export default PostEdit;
