// analyticsSdk.js
// React에서 import해서 사용할 수 있는 Analytics SDK 유틸

export const getClientId = () => {
    let clientId = localStorage.getItem("analytics_client_id");
    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem("analytics_client_id", clientId);
    }
    return clientId;
};

export const getSessionId = () => {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
        sessionId = `sess_${new Date().toISOString()}_${
            crypto.randomUUID().split("-")[0]
        }`;
        sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
};

export const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(ua);
    const os = /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : "Desktop";
    const browser = /Chrome/.test(ua)
        ? "Chrome"
        : /Safari/.test(ua)
        ? "Safari"
        : /Firefox/.test(ua)
        ? "Firefox"
        : "Other";

    return {
        type: isMobile ? "mobile" : "desktop",
        os,
        browser,
        language: navigator.language,
    };
};

export const parseTrafficSource = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        medium: params.get("utm_medium") || "direct",
        source: params.get("utm_source") || document.referrer || "direct",
        campaign: params.get("utm_campaign"),
        utm: {
            utm_source: params.get("utm_source"),
            utm_medium: params.get("utm_medium"),
            utm_campaign: params.get("utm_campaign"),
            utm_term: params.get("utm_term"),
            utm_content: params.get("utm_content"),
        },
    };
};

export const sendEvent = (eventName, properties = {}, userId = null) => {
    const eventData = {
        event_name: eventName,
        timestamp: Date.now(),
        client_id: getClientId(),
        user_id: userId,
        session_id: getSessionId(),
        properties: {
            page_path: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer,
            ...properties,
        },
        context: {
            geo: {
                country: null,
                city: null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            device: getDeviceInfo(),
            traffic_source: parseTrafficSource(),
        },
    };

    fetch("http://localhost:3001/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    }).catch(console.error);
    // console.log(JSON.stringify(eventData));
};
