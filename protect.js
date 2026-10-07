/* Deterrent only: blocks right-click, view-source/DevTools shortcuts and silences console on the live site. Not real security. */
(() => {
    const stop = e => e.preventDefault();
    document.addEventListener('contextmenu', stop);
    document.addEventListener('dragstart', e => e.target.tagName === 'IMG' && stop(e));
    document.addEventListener('keydown', e => {
        const k = e.key.toLowerCase(), c = e.ctrlKey || e.metaKey;
        if (e.key === 'F12' || (c && e.shiftKey && 'ijc'.includes(k)) || (c && k === 'u') || (e.metaKey && e.altKey && 'iju'.includes(k))) stop(e);
    });
    if (!/^(localhost|127\.|\[::1\])/.test(location.hostname)) ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir', 'trace'].forEach(m => console[m] = () => {});
})();
