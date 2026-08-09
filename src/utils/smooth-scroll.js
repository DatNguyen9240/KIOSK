/**
 * Custom Silky-Smooth Controlled Scroll Utility
 * Replaces instant/jarring browser scrollWithView with a gentle easeInOutCubic animation.
 */

export function smoothScrollTo(target, duration = 850, offset = 0) {
  let targetY = 0;

  if (typeof target === 'number') {
    targetY = target;
  } else if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) return;
    targetY = getCenteredY(el, offset);
  } else if (target && target.nodeType === 1) { // HTMLElement
    targetY = getCenteredY(target, offset);
  } else {
    return;
  }

  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  targetY = Math.max(0, Math.min(targetY, maxY));

  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const distance = targetY - startY;

  if (Math.abs(distance) < 5) return;

  let startTime = null;

  // Custom easeInOutCubic curve for ultra-silky, gentle motion
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easeProgress);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function getCenteredY(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const elementHeight = rect.height;
  const windowHeight = window.innerHeight;
  // Center element vertically on the screen
  return scrollTop + rect.top - (windowHeight / 2) + (elementHeight / 2) + offset;
}
