import * as Sentry from '@sentry/react';

// Helper function to get element details
const getElementDetails = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    className: element.className || null,
    textContent: element.textContent?.substring(0, 100) || null,
    position: {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    attributes: {
      href: element.getAttribute('href'),
      type: element.getAttribute('type'),
      name: element.getAttribute('name'),
      value: element.getAttribute('value')?.substring(0, 50),
      placeholder: element.getAttribute('placeholder')
    }
  };
};

// Helper function to get page context
const getPageContext = () => ({
  url: window.location.href,
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  title: document.title,
  referrer: document.referrer,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  }
});

export const initializeInteractionTracking = () => {
  console.log('🔍 Initializing comprehensive UI interaction tracking...');

  // 1. Track all click events
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    const elementDetails = getElementDetails(target);
    const pageContext = getPageContext();

    Sentry.addBreadcrumb({
      message: `Click: ${elementDetails.tagName}${elementDetails.id ? `#${elementDetails.id}` : ''}`,
      category: 'ui.click',
      level: 'info',
      data: {
        element: elementDetails,
        page: pageContext,
        timestamp: new Date().toISOString(),
        mousePosition: {
          x: event.clientX,
          y: event.clientY
        }
      }
    });

    // Special tracking for important elements
    if (elementDetails.tagName === 'button' || elementDetails.tagName === 'a') {
      Sentry.captureMessage(`UI Interaction: ${elementDetails.tagName.toUpperCase()} clicked - ${elementDetails.textContent}`, 'info');
    }
  }, true);

  // 2. Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const formDetails = getElementDetails(form);
    
    // Get form field names (without values for privacy)
    const fieldNames = Array.from(formData.keys());

    Sentry.addBreadcrumb({
      message: `Form Submission: ${formDetails.id || 'unnamed-form'}`,
      category: 'ui.form',
      level: 'info',
      data: {
        form: formDetails,
        fieldCount: fieldNames.length,
        fieldNames,
        page: getPageContext(),
        timestamp: new Date().toISOString()
      }
    });

    Sentry.captureMessage(`Form Submitted: ${fieldNames.length} fields`, 'info');
  });

  // 3. Track input changes (debounced)
  let inputTimeout: NodeJS.Timeout;
  document.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement;
    clearTimeout(inputTimeout);
    
    inputTimeout = setTimeout(() => {
      const inputDetails = getElementDetails(input);
      
      Sentry.addBreadcrumb({
        message: `Input Change: ${inputDetails.name || inputDetails.id || 'unnamed-input'}`,
        category: 'ui.input',
        level: 'info',
        data: {
          input: {
            ...inputDetails,
            value: input.value ? `${input.value.length} characters` : 'empty' // Privacy-safe
          },
          page: getPageContext(),
          timestamp: new Date().toISOString()
        }
      });
    }, 500); // Debounce 500ms
  });

  // 4. Track focus events (form field interactions)
  document.addEventListener('focus', (event) => {
    const element = event.target as Element;
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const elementDetails = getElementDetails(element);
      
      Sentry.addBreadcrumb({
        message: `Focus: ${elementDetails.name || elementDetails.id || elementDetails.tagName}`,
        category: 'ui.focus',
        level: 'info',
        data: {
          element: elementDetails,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, true);

  // 5. Track scroll events (throttled)
  let scrollTimeout: NodeJS.Timeout;
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      const scrollPercentage = Math.round((currentScrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      
      Sentry.addBreadcrumb({
        message: `Scroll: ${scrollDirection} to ${scrollPercentage}%`,
        category: 'ui.scroll',
        level: 'info',
        data: {
          direction: scrollDirection,
          position: currentScrollY,
          percentage: scrollPercentage,
          page: getPageContext(),
          timestamp: new Date().toISOString()
        }
      });
      
      lastScrollY = currentScrollY;
    }, 250); // Throttle 250ms
  });

  // 6. Track navigation/route changes
  const trackPageView = (url: string) => {
    const transaction = Sentry.startTransaction({
      name: `Page Load: ${url}`,
      op: 'navigation'
    });

    Sentry.addBreadcrumb({
      message: `Navigation: ${url}`,
      category: 'navigation',
      level: 'info',
      data: {
        ...getPageContext(),
        timestamp: new Date().toISOString()
      }
    });

    Sentry.captureMessage(`Page View: ${url}`, 'info');

    // Finish transaction after a short delay to capture initial rendering
    setTimeout(() => {
      transaction.finish();
    }, 500);
  };

  // Initial page load
  trackPageView(window.location.pathname);

  // Track browser navigation (back/forward buttons)
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname);
  });

  // Override pushState and replaceState to track programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => trackPageView(window.location.pathname), 0);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => trackPageView(window.location.pathname), 0);
  };

  // 7. Track visibility changes (tab switching)
  document.addEventListener('visibilitychange', () => {
    const isVisible = !document.hidden;
    
    Sentry.addBreadcrumb({
      message: `Page ${isVisible ? 'visible' : 'hidden'}`,
      category: 'ui.visibility',
      level: 'info',
      data: {
        visible: isVisible,
        timestamp: new Date().toISOString()
      }
    });
  });

  // 8. Track window resize
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
      Sentry.addBreadcrumb({
        message: `Window Resize: ${window.innerWidth}x${window.innerHeight}`,
        category: 'ui.resize',
        level: 'info',
        data: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        }
      });
    }, 300);
  });

  // 9. Track errors in interaction context
  window.addEventListener('error', (event) => {
    Sentry.addBreadcrumb({
      message: `JavaScript Error: ${event.error?.message || 'Unknown error'}`,
      category: 'error',
      level: 'error',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        page: getPageContext(),
        timestamp: new Date().toISOString()
      }
    });
  });

  // 10. Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.addBreadcrumb({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      category: 'error',
      level: 'error',
      data: {
        reason: event.reason?.toString(),
        page: getPageContext(),
        timestamp: new Date().toISOString()
      }
    });
  });

  console.log('✅ UI interaction tracking initialized successfully');
};