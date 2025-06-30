import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MarkdownEditor from "./MarkdownEditor";
import AnalyticsSDK from "./analytics";

const PostCreate = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();

    const authorId = useSelector((state) => state.auth.id);
    const [tags, setTags] = useState("");

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            AnalyticsSDK.sendEvent('post_create_validation_error', {
                missing_title: !title.trim(),
                missing_content: !content.trim()
            });
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        AnalyticsSDK.sendEvent('post_create_attempt', {
            title_length: title.length,
            content_length: content.length,
            tags_count: tags.split(",").map((tag) => tag.trim()).filter(Boolean).length,
            author_id: authorId
        });

        const res = await fetch("/api/posts", {
            method: "POST",
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
            AnalyticsSDK.sendEvent('post_create_error', {
                error: err.error,
                title_length: title.length,
                content_length: content.length
            });
            alert("작성 실패: " + err.error);
            return;
        }

        const { id } = await res.json();
        AnalyticsSDK.sendEvent('post_create_success', {
            post_id: id,
            title_length: title.length,
            content_length: content.length,
            tags_count: tags.split(",").map((tag) => tag.trim()).filter(Boolean).length,
            author_id: authorId
        });
        navigate(`/posts/${id}`);
    };

    const handleCancelClick = () => {
        AnalyticsSDK.sendEvent('post_create_cancel', {
            title_length: title.length,
            content_length: content.length,
            has_content: content.trim().length > 0
        });
        navigate("/");
    };

    return (
        <div className="board-wrapper">
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                style={{ width: "100%", padding: "8px", marginTop: "1rem", marginBottom: "1rem" }}
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
                <button onClick={handleSubmit}>저장</button>
                <button
                    onClick={handleCancelClick}
                    style={{ marginLeft: "8px" }}
                >
                    취소
                </button>
            </div>
        </div>
    );
};

export default PostCreate;
