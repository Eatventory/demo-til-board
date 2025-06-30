import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';


const MarkdownEditor = ({ content, setContent }) => {
    const [activeTab, setActiveTab] = useState("write");
    const textareaRef = useRef();

    const insertMarkdown = (before, after) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.slice(start, end);

        const newText =
            content.slice(0, start) +
            before +
            selected +
            after +
            content.slice(end);

        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                end + before.length
            );
        }, 0);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isMarkdown = file.name.toLowerCase().endsWith(".md");
        if (!isMarkdown) {
            alert(".md 확장자 파일만 업로드할 수 있습니다.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const markdownText = event.target.result;
            if (content.trim()) {
                const ok = window.confirm(
                    "입력창에 이미 작성된 내용이 있습니다.\n이 파일 내용으로 덮어쓰시겠습니까?"
                );
                if (!ok) return;
            }
            setContent(markdownText);
        };
        reader.readAsText(file);
    };

    const buttonStyle = {
        background: "white",
        border: "none",
        padding: "8px 12px",
        fontSize: "14px",
        cursor: "pointer",
    };

    const dividerStyle = {
        width: "1px",
        backgroundColor: "#999",
        height: "auto",
    };

    return (
        <div className="markdown-editor">
            <div
                style={{
                    width: "100%",
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <button
                        onClick={() => setActiveTab("write")}
                        style={{
                            marginRight: "8px",
                            backgroundColor:
                                activeTab === "write" ? "#23a6d5" : "#e0e0e0",
                            color: activeTab === "write" ? "#fff" : "#000",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                        }}
                    >
                        작성
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        style={{
                            backgroundColor:
                                activeTab === "preview" ? "#23a6d5" : "#e0e0e0",
                            color: activeTab === "preview" ? "#fff" : "#000",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                        }}
                    >
                        미리보기
                    </button>
                </div>
                {activeTab === "write" && (
                    <div
                        style={{
                            display: "inline-flex",
                            border: "1px solid #cccccc",
                            borderRadius: "1rem",
                            overflow: "hidden",
                        }}
                    >
                        <button
                            style={buttonStyle}
                            onClick={() => insertMarkdown("**", "**")}
                        >
                            굵게
                        </button>
                        <div style={dividerStyle} />
                        <button style={buttonStyle} onClick={() => insertMarkdown("*", "*")}>
                            기울임
                        </button>
                        <div style={dividerStyle} />
                        <button
                            style={buttonStyle}
                            onClick={() => insertMarkdown("```\n", "\n```")}
                        >
                            코드블럭
                        </button>
                        <div style={dividerStyle} />
                        <button
                            style={buttonStyle}
                            onClick={() => insertMarkdown("# ", "")}
                        >
                            제목
                        </button>
                        <div style={dividerStyle} />
                        <button
                            style={buttonStyle}
                            onClick={() => insertMarkdown("[텍스트]", "(링크)")}
                        >
                            링크
                        </button>
                    </div>
                )}
            </div>

            {activeTab === "write" ? (
                <>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력하세요"
                        style={{
                            width: "100%",
                            height: "435px",
                            padding: "12px",
                            resize: "none",
                        }}
                    />
                    <div style={{ textAlign: "right", marginBottom: "5px" }}>
                        <input
                            type="file"
                            id="md-upload"
                            accept=".md"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => document.getElementById("md-upload").click()}
                            style={{ backgroundColor: "#23a6d5", color: "white", height: "40px" }}
                        >
                        .md 파일 불러오기
                        </button>
                        <input
                            type="file"
                            id="md-upload"
                            accept=".md"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                        />
                    </div>
                </>
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "480px",
                        overflowY: "auto",
                        border: "1px solid #ccc",
                        padding: "12px",
                        background: "#f9f9f9",
                        textAlign: "left",
                        marginBottom: "8px",
                    }}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                            }) {
                                const match = /language-(\w+)/.exec(
                                    className || ""
                                );
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
                        {content || "*내용을 입력하면 미리보기가 표시됩니다.*"}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default MarkdownEditor;
