const express = require("express");
const app = express();
const port = 3000;
const db = require("./db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
const { generateAccessToken, generateRefreshToken, REFRESH_SECRET } = require("./auth");

app.use(express.json());
app.use(cookieParser());

const cors = require("cors");
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express!" });
});

app.listen(port, () => {
    console.log(`[Server] listening on http://localhost:${port}`);
});

/* 로그인 */
app.post("/api/log-in", (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM USERINFO WHERE username = ?", [username])
        .then(([rows]) => {
			/* 유효하지 않은 ID */
            if (rows.length === 0) {
                return res.status(401).json({ error: "Invalid ID" });
            }
            const user = rows[0];
            const isPwCorrect = bcrypt.compareSync(password, user.password);
            /* 비밀번호가 틀린 경우 */
			if (!isPwCorrect) {
                return res.status(401).json({ error: "Invalid password" });
            }
			/* JWT 토큰 생성 */
            console.log(`[Server] Logged in: ${username}`)
			const payload = { id: user.id, username: user.username, name: user.name };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);
			return res.status(200)
                .cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: false, // 실제 배포할 때 true로 변경해야 함
                    sameSite: "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                })
				.json({ accessToken, id: user.id, username: user.username, name: user.name });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        });
});

/* 회원가입 */
app.post("/api/sign-up", (req, res) => {
    const { name, username, password, confirmPw } = req.body;

    /* 비밀번호 확인 */
    if (password !== confirmPw) {
        return res.status(400).json({ error: "Invalid password" });
    }

    /* 중복 아이디 체크 */
    db.query("SELECT * FROM USERINFO WHERE username = ?", [username])
        .then(([rows]) => {
            if (rows.length > 0)
                return res.status(409).json({ error: "Conflict username" });

            /* 비밀번호 암호화 */
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);

            /* DB에 회원 정보 추가 */
            return db.query(
                "INSERT INTO USERINFO (name, username, password) VALUES (?, ?, ?)",
                [name, username, hash]
            );
        })
        .then(() => {
            if (!res.headersSent)
                res.status(201).json({ message: "User created" });
        })
        .catch((err) => {
            console.error("Error occurred on sign-up:", err);
            if (!res.headersSent)
                res.status(500).json({ error: "Server error" });
        });
});

/* 토큰 재발급 */
app.post("/api/refresh-token", (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        // console.error("No refresh token");
        return res.status(401).json({ error: "No refresh token" });
    }
    try {
        const decode = jwt.verify(token, REFRESH_SECRET);
        const accessToken = generateAccessToken({ id: decode.id, username: decode.username, name:decode.name });
        console.log(`[Server] Access token refreshed: ${decode.username}`);
        res.json({ accessToken, username: decode.username, id: decode.id, name:decode.name });
    } catch (err) {
        // console.error("Refresh token expired or invalid");
        res.status(403).json({ error: "Invalid refresh token" });
    }
});

/* 로그아웃 */
app.post("/api/logout", (req, res) => {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
});

/* 게시판 기능 */
const postsRouter = require("./routes/posts");
app.use("/api/posts", postsRouter);

/* 댓글 기능 */
const commentRoutes = require("./routes/comments");
app.use("/api/posts", commentRoutes);

/* 마이페이지 기능 */
const mypageRoutes = require("./routes/mypage");
app.use("/api/mypage", mypageRoutes);

/* Analytics 기능 */
const analyticsRoutes = require("./routes/analytics");
app.use("/api/analytics", analyticsRoutes);