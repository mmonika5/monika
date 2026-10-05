/* ====== Supabase Google Sign-In ======
   1. Create a project at supabase.com
   2. Paste your Project URL and anon (public) key below
   3. Follow README-AUTH.md to enable the Google provider */
const SUPABASE_URL = 'https://sepdcoqmbncuylykjyhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcGRjb3FtYm5jdXlseWtqeWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTUzODcsImV4cCI6MjEwNjc3MTM4N30.EA3edRxz1iqB1CVoQFiYCbn6lVjLpZNkYdcHdSJB2kg';

(() => {
    const $ = id => document.getElementById(id);
    const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); };
    const configured = !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-ANON');
    const signinBtn = $('signin-btn'), menu = $('user-menu');

    const render = (user) => {
        const signedIn = !!user;
        signinBtn.hidden = signedIn; menu.hidden = !signedIn;
        if (!signedIn) return;
        const m = user.user_metadata || {};
        const name = m.full_name || m.name || (user.email || 'Seeker').split('@')[0];
        $('user-name').textContent = name.split(' ')[0];
        $('user-email').textContent = user.email || '';
        const av = $('user-avatar'), pic = m.avatar_url || m.picture;
        av.style.display = pic ? '' : 'none'; if (pic) av.src = pic;
        // Prefill booking form
        const fn = $('fullName'); if (fn && !fn.value) fn.value = name;
    };

    if (!window.supabase || !configured) {
        signinBtn.addEventListener('click', () => toast(window.supabase ? '⚙️ Add your Supabase URL and anon key in auth.js' : '⚠️ Supabase library failed to load'));
        return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL.replace(/\/(rest|auth)\/v1\/?$/, ''), SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.sb = sb; // available for other scripts (e.g. saving bookings)

    signinBtn.addEventListener('click', async () => {
        signinBtn.disabled = true;
        const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } }
        });
        if (error) { toast('❌ ' + error.message); signinBtn.disabled = false; }
    });

    $('signout-btn').addEventListener('click', async () => {
        const { error } = await sb.auth.signOut();
        if (error) toast('❌ ' + error.message);
    });

    $('user-btn').addEventListener('click', e => { e.stopPropagation(); $('user-drop').classList.toggle('open'); });
    document.addEventListener('click', () => $('user-drop').classList.remove('open'));

    sb.auth.getSession().then(({ data }) => render(data.session && data.session.user));
    sb.auth.onAuthStateChange((event, session) => {
        render(session && session.user);
        if (event === 'SIGNED_IN') { toast('✨ Welcome, ' + ((session.user.user_metadata || {}).full_name || 'Seeker') + '!'); history.replaceState(null, '', location.pathname + location.hash.replace(/access_token.*/, '')); }
        if (event === 'SIGNED_OUT') toast('👋 Signed out. See you under the stars!');
        signinBtn.disabled = false;
    });
})();
