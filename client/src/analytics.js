// JavaScript Analytics SDK + Auto Tracking 통합

(function (global) {
  const AnalyticsSDK = {};

  // Utility function to generate UUID
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Get or set unique client ID
  AnalyticsSDK.getClientId = function () {
    let clientId = localStorage.getItem("analytics_client_id");
    if (!clientId) {
      clientId = generateUUID();
      localStorage.setItem("analytics_client_id", clientId);
    }
    return clientId;
  };

  // Session ID management
  AnalyticsSDK.getSessionId = function () {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId =
        "sess_" + new Date().toISOString() + "_" + generateUUID().split("-")[0];
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  };

  // Device detection
  AnalyticsSDK.getDeviceInfo = function () {
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
      device_type: isMobile ? "mobile" : "desktop",
      os: os,
      browser: browser,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  // Traffic source extraction
  AnalyticsSDK.parseTrafficSource = function () {
    const params = new URLSearchParams(window.location.search);
    return {
      traffic_medium: params.get("utm_medium") || "direct",
      traffic_source: params.get("utm_source") || document.referrer || "direct",
      traffic_campaign: params.get("utm_campaign"),
    };
  };

  // Get user ID from various sources
  AnalyticsSDK.getUserId = function () {
    // 1. Redux store에서 가져오기 (store가 전역에 노출되어 있다면)
    if (window.__REDUX_STORE__) {
      const state = window.__REDUX_STORE__.getState();
      if (state.auth && state.auth.id) {
        return state.auth.id;
      }
    }

    // 2. localStorage에서 가져오기
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || null;
      } catch (e) {
        return null;
      }
    }

    return null;
  };

  // Get element path (CSS selector path)
  AnalyticsSDK.getElementPath = function (element) {
    if (!element) return null;

    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += "#" + current.id;
      } else if (current.className) {
        const classes = current.className.split(" ").filter((c) => c.trim());
        if (classes.length > 0) {
          selector += "." + classes.join(".");
        }
      }

      // Add nth-child if needed
      const siblings = Array.from(current.parentNode.children).filter(
        (child) => child.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }

      path.unshift(selector);
      current = current.parentNode;
    }

    return path.join(" > ");
  };

  // Main event sender
  AnalyticsSDK.sendEvent = function (
    eventName,
    properties = {},
    userId = null,
    element = null
  ) {
    const deviceInfo = AnalyticsSDK.getDeviceInfo();
    const trafficInfo = AnalyticsSDK.parseTrafficSource();

    // userId가 전달되지 않았다면 자동으로 가져오기
    const finalUserId = userId !== null ? userId : AnalyticsSDK.getUserId();

    // element 정보 추출
    let elementInfo = {};
    if (element) {
      elementInfo = {
        element_tag: element.tagName,
        element_id: element.id || null,
        element_class: element.className || null,
        element_text: element.textContent?.trim() || null,
        element_path: AnalyticsSDK.getElementPath(element),
      };
    }

    const eventData = {
      event_name: eventName,
      timestamp: new Date().toISOString(), // ISO string format for TIMESTAMPTZ
      client_id: AnalyticsSDK.getClientId(),
      user_id: finalUserId,
      session_id: AnalyticsSDK.getSessionId(),
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      properties: properties,
      device_type: deviceInfo.device_type,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      language: deviceInfo.language,
      timezone: deviceInfo.timezone,
      traffic_medium: trafficInfo.traffic_medium,
      traffic_source: trafficInfo.traffic_source,
      traffic_campaign: trafficInfo.traffic_campaign,
      context: {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        utm_params: {
          utm_source: new URLSearchParams(window.location.search).get(
            "utm_source"
          ),
          utm_medium: new URLSearchParams(window.location.search).get(
            "utm_medium"
          ),
          utm_campaign: new URLSearchParams(window.location.search).get(
            "utm_campaign"
          ),
          utm_term: new URLSearchParams(window.location.search).get("utm_term"),
          utm_content: new URLSearchParams(window.location.search).get(
            "utm_content"
          ),
        },
      },
      ...elementInfo,
    };

    // 개발 환경에서는 콘솔에 출력 (localhost인지 확인)
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log("Analytics Event:", eventData);
    }

    // 실제 서버로 전송
    fetch("http://localhost:3000/api/analytics/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }).catch((error) => {
      console.error("Analytics 전송 실패:", error);
    });
  };

  // Click tracking helper
  AnalyticsSDK.trackClick = function (element, eventName, properties = {}) {
    if (element) {
      element.addEventListener("click", function (e) {
        AnalyticsSDK.sendEvent(
          eventName,
          {
            element_text: e.target.textContent?.trim(),
            element_tag: e.target.tagName,
            element_class: e.target.className,
            element_id: e.target.id,
            click_x: e.clientX,
            click_y: e.clientY,
            ...properties,
          },
          null,
          e.target
        );
      });
    }
  };

  // Enhanced button tracking with more details
  AnalyticsSDK.trackButton = function (element, buttonName, properties = {}) {
    if (element) {
      element.addEventListener("click", function (e) {
        const buttonInfo = {
          button_name: buttonName,
          button_text: e.target.textContent?.trim(),
          button_tag: e.target.tagName,
          button_class: e.target.className,
          button_id: e.target.id,
          click_x: e.clientX,
          click_y: e.clientY,
          button_position: {
            top: e.target.offsetTop,
            left: e.target.offsetLeft,
            width: e.target.offsetWidth,
            height: e.target.offsetHeight,
          },
          ...properties,
        };

        AnalyticsSDK.sendEvent("button_click", buttonInfo, null, e.target);
      });
    }
  };

  // Track form interactions
  AnalyticsSDK.trackForm = function (formElement, formName, properties = {}) {
    if (formElement) {
      // Form submit tracking
      formElement.addEventListener("submit", function (e) {
        const formData = new FormData(formElement);
        const formFields = {};

        for (let [key, value] of formData.entries()) {
          // 민감한 정보는 제외
          if (!["password", "confirmPw", "currentPw", "newPw"].includes(key)) {
            formFields[key] = value;
          }
        }

        AnalyticsSDK.sendEvent(
          "form_submit",
          {
            form_name: formName,
            form_fields: formFields,
            form_field_count: formData.entries().length,
            ...properties,
          },
          null,
          e.target
        );
      });

      // Form field focus tracking
      const inputs = formElement.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        input.addEventListener("focus", function (e) {
          AnalyticsSDK.sendEvent(
            "form_field_focus",
            {
              form_name: formName,
              field_name: e.target.name,
              field_type: e.target.type,
              field_id: e.target.id,
              ...properties,
            },
            null,
            e.target
          );
        });

        input.addEventListener("blur", function (e) {
          AnalyticsSDK.sendEvent(
            "form_field_blur",
            {
              form_name: formName,
              field_name: e.target.name,
              field_type: e.target.type,
              field_id: e.target.id,
              field_value_length: e.target.value.length,
              ...properties,
            },
            null,
            e.target
          );
        });
      });
    }
  };

  // Track navigation clicks
  AnalyticsSDK.trackNavigation = function (
    element,
    destination,
    properties = {}
  ) {
    if (element) {
      element.addEventListener("click", function (e) {
        AnalyticsSDK.sendEvent(
          "navigation_click",
          {
            destination: destination,
            element_text: e.target.textContent?.trim(),
            element_tag: e.target.tagName,
            element_class: e.target.className,
            element_id: e.target.id,
            click_x: e.clientX,
            click_y: e.clientY,
            ...properties,
          },
          null,
          e.target
        );
      });
    }
  };

  // Track scroll depth
  AnalyticsSDK.trackScrollDepth = function () {
    let maxScroll = 0;
    let scrollEvents = [25, 50, 75, 90, 100];
    let sentEvents = new Set();

    window.addEventListener("scroll", function () {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      scrollEvents.forEach((threshold) => {
        if (scrollPercent >= threshold && !sentEvents.has(threshold)) {
          sentEvents.add(threshold);
          AnalyticsSDK.sendEvent("scroll_depth", {
            scroll_percentage: threshold,
            max_scroll_percentage: maxScroll,
            page_path: window.location.pathname,
          });
        }
      });
    });
  };

  // Track time on page
  AnalyticsSDK.trackTimeOnPage = function () {
    const startTime = Date.now();

    window.addEventListener("beforeunload", function () {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      AnalyticsSDK.sendEvent("page_exit", {
        time_on_page_seconds: timeOnPage,
        page_path: window.location.pathname,
      });
    });
  };

  // Auto-track all clicks
  AnalyticsSDK.autoTrackClicks = function () {
    document.addEventListener("click", function (e) {
      const target = e.target;

      // 기본적인 클릭 이벤트 수집
      AnalyticsSDK.sendEvent(
        "auto_click",
        {
          click_x: e.clientX,
          click_y: e.clientY,
          page_x: e.pageX,
          page_y: e.pageY,
          target_text: target.textContent?.trim(),
          target_tag: target.tagName,
          target_class: target.className,
          target_id: target.id,
          target_href: target.href || null,
          target_type: target.type || null,
          target_value: target.value || null,
          is_button: target.tagName === "BUTTON" || target.type === "submit",
          is_link: target.tagName === "A",
          is_input: target.tagName === "INPUT",
          is_textarea: target.tagName === "TEXTAREA",
          is_select: target.tagName === "SELECT",
        },
        null,
        target
      );
    });
  };

  // Auto-track form submissions
  AnalyticsSDK.autoTrackForms = function () {
    document.addEventListener("submit", function (e) {
      const form = e.target;
      const formData = new FormData(form);
      const formFields = {};

      for (let [key, value] of formData.entries()) {
        // 민감한 정보는 제외
        if (!["password", "confirmPw", "currentPw", "newPw"].includes(key)) {
          formFields[key] = value;
        }
      }

      AnalyticsSDK.sendEvent(
        "auto_form_submit",
        {
          form_action: form.action,
          form_method: form.method,
          form_id: form.id,
          form_class: form.className,
          form_fields: formFields,
          form_field_count: formData.entries().length,
        },
        null,
        form
      );
    });
  };

  // Initialize auto-tracking
  AnalyticsSDK.init = function () {
    // Start scroll and time tracking
    AnalyticsSDK.trackScrollDepth();
    AnalyticsSDK.trackTimeOnPage();

    // Start auto-click tracking
    AnalyticsSDK.autoTrackClicks();
    AnalyticsSDK.autoTrackForms();

    console.log("Analytics SDK 초기화 완료 - 자동 추적 활성화");
  };

  // Automatically send page_view event on page load
  document.addEventListener("DOMContentLoaded", function () {
    AnalyticsSDK.sendEvent("page_view");

    // Initialize auto-tracking
    AnalyticsSDK.init();
  });

  // Expose SDK to global scope
  global.AnalyticsSDK = AnalyticsSDK;
})(window);

export default window.AnalyticsSDK;
