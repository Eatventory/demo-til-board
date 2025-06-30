import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useLogout from "./app/logout";
import "./css/Header.css";
import logo from "./assets/logo.png";
import AnalyticsSDK from "./analytics";

function Header () {
    const handleLogout = useLogout();
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

    const handleLogoClick = () => {
        AnalyticsSDK.sendEvent('header_logo_click');
    };

    const handleAboutClick = () => {
        AnalyticsSDK.sendEvent('header_about_click');
    };

    const handleMypageClick = () => {
        AnalyticsSDK.sendEvent('header_mypage_click');
    };

    const handleLogoutClick = () => {
        AnalyticsSDK.sendEvent('header_logout_click');
        handleLogout();
    };

    const handleLoginClick = () => {
        AnalyticsSDK.sendEvent('header_login_click');
    };

    const handleSignupClick = () => {
        AnalyticsSDK.sendEvent('header_signup_click');
    };

    const handleAnalyticsClick = () => {
        AnalyticsSDK.sendEvent('header_analytics_click');
    };

    return (
        <header>
            <div>
                <div>
                    <Link to = "/" onClick={handleLogoClick}>
                        <img src={logo} id="mainLogo"/>
                    </Link>
                </div>
                <nav>
                    <Link to="/about" onClick={handleAboutClick}>About</Link> |{" "}
                    <Link to="/analytics" onClick={handleAnalyticsClick}>Analytics</Link> |{" "}
                    {isLoggedIn ? (
                        <>
                            <Link to="/mypage" onClick={handleMypageClick}>마이페이지</Link> | <Link onClick={handleLogoutClick}>로그아웃</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={handleLoginClick}><b>로그인</b></Link> | <Link to="/signup" onClick={handleSignupClick}>회원가입</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>

    );
}

export default Header;