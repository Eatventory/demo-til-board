// JavaScript Analytics SDK

(function(global) {
  const AnalyticsSDK = {};

  // Utility function to generate UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or set unique client ID
  AnalyticsSDK.getClientId = function() {
    let clientId = localStorage.getItem('analytics_client_id');
    if (!clientId) {
      clientId = generateUUID();
      localStorage.setItem('analytics_client_id', clientId);
    }
    return clientId;
  };

  // Session ID management
  AnalyticsSDK.getSessionId = function() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + new Date().toISOString() + '_' + generateUUID().split('-')[0];
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  // Device detection
  AnalyticsSDK.getDeviceInfo = function() {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(ua);
    const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : 'Desktop';
    const browser = /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : /Firefox/.test(ua) ? 'Firefox' : 'Other';

    return {
      type: isMobile ? 'mobile' : 'desktop',
      os: os,
      browser: browser,
      language: navigator.language
    };
  };

  // Traffic source extraction
  AnalyticsSDK.parseTrafficSource = function() {
    const params = new URLSearchParams(window.location.search);
    return {
      medium: params.get('utm_medium') || 'direct',
      source: params.get('utm_source') || document.referrer || 'direct',
      campaign: params.get('utm_campaign'),
      utm: {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_term: params.get('utm_term'),
        utm_content: params.get('utm_content')
      }
    };
  };

  // Main event sender
  AnalyticsSDK.sendEvent = function(eventName, properties = {}) {
    const eventData = {
      event_name: eventName,
      timestamp: Date.now(),
      client_id: AnalyticsSDK.getClientId(),
      user_id: null, // Replace with actual user id fetching logic
      session_id: AnalyticsSDK.getSessionId(),
      properties: {
        page_path: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer,
        ...properties
      },
      context: {
        geo: {
          country: null, // Prefer server-side IP-based detection
          city: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        device: AnalyticsSDK.getDeviceInfo(),
        traffic_source: AnalyticsSDK.parseTrafficSource()
      }
    };

    // 개발 환경에서는 콘솔에 출력 (localhost인지 확인)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Analytics Event:', eventData);
    }
    
    // 실제 서버로 전송
    fetch('/api/analytics/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    }).catch(error => {
      console.error('Analytics 전송 실패:', error);
    });
  };

  // Click tracking helper
  AnalyticsSDK.trackClick = function(element, eventName, properties = {}) {
    if (element) {
      element.addEventListener('click', function(e) {
        AnalyticsSDK.sendEvent(eventName, {
          element_text: e.target.textContent?.trim(),
          element_tag: e.target.tagName,
          element_class: e.target.className,
          element_id: e.target.id,
          ...properties
        });
      });
    }
  };

  // Automatically send page_view event on page load
  document.addEventListener('DOMContentLoaded', function() {
    AnalyticsSDK.sendEvent('page_view');
  });

  // Expose SDK to global scope
  global.AnalyticsSDK = AnalyticsSDK;
})(window);

export default window.AnalyticsSDK; 