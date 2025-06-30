import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "./feat/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import whiteLogo from "./assets/logo-white.png";
import "./css/LoginForm.css";
import AnalyticsSDK from "./analytics";

function LoginForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

    const path = location.pathname.replace('/', '') || 'about';
    const isAbout = path === 'about';
    const isSignup = path === 'signup';

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    const [loginCheck, setLoginCheck] = useState(false);
    const [UsernameCheck, setUsernameCheck] = useState(false);
    const [pwCheck, setPwCheck] = useState(false);
    const [usernameTest, setUsernameTest] = useState(false);
    const [pwTest, setPwTest] = useState(false);

    const usernameForm = /^[a-zA-Z0-9-_]{5,20}$/;
    const pwForm = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/;
    const errorMessages = [
        { condition: loginCheck, message: "ID 또는 비밀번호가 틀렸습니다." },
        { condition: UsernameCheck, message: "이미 사용중인 ID입니다." },
        { condition: pwCheck, message: "비밀번호가 일치하지 않습니다." },
        { condition: usernameTest, message: "유효한 ID를 사용해주세요: 5~20자의 영문자, 숫자와 특수기호(_, -)" },
        { condition: pwTest, message: "유효한 비밀번호를 사용해주세요: 8~16자의 영문 대/소문자, 숫자, 특수문자" },
    ];

    const setFunc = (idcheck, pwcheck, idtest, pwtest) => {
        setUsernameCheck(idcheck);
        setPwCheck(pwcheck);
        setUsernameTest(idtest);
        setPwTest(pwtest);
    };

    useEffect(() => {
        if (!isAbout && isLoggedIn) navigate("/");
        setLoginCheck(false);
        setFunc(false, false, false, false);
    }, [location.pathname, isLoggedIn, navigate, isAbout]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSignup) {
            if (!usernameForm.test(username)) {
                setFunc(false, false, true, false);
                AnalyticsSDK.sendEvent('signup_validation_error', {
                    error_type: 'username_format',
                    username: username
                });
                return;
            }
            if (!pwForm.test(password)) {
                setFunc(false, false, false, true);
                AnalyticsSDK.sendEvent('signup_validation_error', {
                    error_type: 'password_format'
                });
                return;
            }
            AnalyticsSDK.sendEvent('signup_attempt', {
                username: username,
                name: name
            });
            fetch("/api/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, password, confirmPw }),
            })
                .then((res) => res.json().then((data) => ({ status: res.status, data })))
                .then(({ status }) => {
                    if (status === 201) {
                        setFunc(false, false, false, false);
                        AnalyticsSDK.sendEvent('signup_success', {
                            username: username,
                            name: name
                        });
                        alert("회원가입이 완료되었습니다. 로그인 해주세요.");
                        navigate("/login");
                    } else if (status === 400) {
                        setFunc(false, true, false, false);
                        AnalyticsSDK.sendEvent('signup_error', {
                            error_type: 'password_mismatch',
                            username: username
                        });
                    } else if (status === 409) {
                        setFunc(true, false, false, false);
                        AnalyticsSDK.sendEvent('signup_error', {
                            error_type: 'username_exists',
                            username: username
                        });
                    } else {
                        setFunc(false, false, false, false);
                        AnalyticsSDK.sendEvent('signup_error', {
                            error_type: 'server_error',
                            username: username
                        });
                        alert("회원가입 실패");
                    }
                });
        } else {
            AnalyticsSDK.sendEvent('login_attempt', {
                username: username
            });
            fetch("/api/log-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })
                .then((res) => res.json().then((data) => ({ status: res.status, data })))
                .then(({ status, data }) => {
                    if (status === 200) {
                        AnalyticsSDK.sendEvent('login_success', {
                            username: data.username,
                            user_id: data.id
                        });
                        dispatch(setCredentials({
                            accessToken: data.accessToken,
                            username: data.username,
                            name: data.name,
                            id: data.id,
                        }));
                        navigate("/");
                    } else {
                        setLoginCheck(true);
                        AnalyticsSDK.sendEvent('login_error', {
                            username: username,
                            error_type: 'invalid_credentials'
                        });
                    }
                });
        }
    };

    const handleAboutButtonClick = () => {
        if (isAbout) {
            AnalyticsSDK.sendEvent('about_cta_click', {
                user_logged_in: isLoggedIn,
                action: isLoggedIn ? 'write_post' : 'signup'
            });
            navigate(isLoggedIn ? "/posts/new" : "/signup");
        }
    };

    const handleLoginLinkClick = () => {
        AnalyticsSDK.sendEvent('login_link_click', {
            from_page: 'signup'
        });
    };

    const handleSignupLinkClick = () => {
        AnalyticsSDK.sendEvent('signup_link_click', {
            from_page: 'login'
        });
    };

    return (
        <div className="login_body">
            <div className="login">
                <motion.form layout className="login_form" onSubmit={handleSubmit}>
                    {isAbout ? (
                        <>
                            <img src={whiteLogo} id="logoWhite" alt="logo" />
                            <h2>매일의 배움과 고민을 기록하고 공유하세요</h2>
                            <p><b>TIL Board</b>는 개발자들이 하루 동안 배운 것, 겪은 시행착오,<br />
                            그리고 깨달음을 쉽고 빠르게 기록하고 공유할 수 있는<br />
                            <b>개발자 중심의 데일리 회고 플랫폼</b>입니다.</p>
                            <h2>이런 분들께 추천합니다</h2>
                            <div style={{ textAlign: "left" }}>
                                ✔ 매일 배운 내용을 기록하고 싶은 개발자<br />
                                ✔ 혼자 공부하면서 느꼈던 시행착오를 정리하고 싶은 분<br />
                                ✔ 다른 개발자의 회고에서 영감을 얻고 싶은 분<br />
                                ✔ 마크다운으로 간단하게 기록하고 깔끔하게 공유하고 싶은 분<br />
                            </div>
                            <h2>기록은 곧 성장입니다</h2>
                            <span>개발자는 늘 배우고, 실수하고, 다시 일어섭니다.<br />
                            <strong>TIL Board</strong>는 그 과정을 함께합니다.<br />
                            오늘의 당신이 내일의 당신을 성장시킵니다.</span>
                        </>
                    ) : (
                        <h1 className="login_title">{isSignup ? "회원가입" : "로그인"}</h1>
                    )}

                    <div className="login_inputs" style={{ overflow: "hidden" }}>
                        <AnimatePresence mode="wait">
                            {isSignup && (
                                <motion.div key="name" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="login_box">
                                    <input type="text" placeholder="이름" className="login_input" required value={name} onChange={(e) => setName(e.target.value)} maxLength={10} />
                                    <i className="ri-account-circle-line"></i>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isAbout && (
                            <>
                                <motion.div layout className="login_box">
                                    <input type="text" placeholder="ID" className="login_input" required value={username} onChange={(e) => setUsername(e.target.value)} />
                                    <i className="ri-user-fill"></i>
                                </motion.div>
                                <motion.div layout className="login_box">
                                    <input type="password" placeholder="비밀번호" className="login_input" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                    <i className="ri-lock-2-fill"></i>
                                </motion.div>
                            </>
                        )}

                        <AnimatePresence mode="wait">
                            {isSignup && (
                                <motion.div key="confirmPw" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="login_box">
                                    <input type="password" placeholder="비밀번호 재입력" className="login_input" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                                    <i className="ri-lock-2-fill"></i>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {errorMessages.map(({ condition, message }, idx) => condition && <label key={idx}>{message}</label>)}
                    
                    <button
                        type={isAbout ? "button" : "submit"}
                        className="login_button"
                        onClick={handleAboutButtonClick}
                        style={isAbout ? { marginBottom: "0" } : {}}
                    >
                        {isAbout
                            ? isLoggedIn
                                ? "오늘의 TIL 쓰러가기"
                                : "무료로 TIL 써보기"
                            : isSignup
                            ? "회원가입"
                            : "로그인"}
                    </button>

                    {!isAbout && (
                        <div className="login_register">
                            {isSignup ? (
                                <>이미 계정이 있으신가요? <Link to="/login" onClick={handleLoginLinkClick}>로그인</Link></>
                            ) : (
                                <>아직 회원이 아니신가요? <Link to="/signup" onClick={handleSignupLinkClick}>회원가입</Link></>
                            )}
                        </div>
                    )}
                </motion.form>
            </div>
        </div>
    );
}

export default LoginForm;


