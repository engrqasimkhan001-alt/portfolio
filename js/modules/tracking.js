import { getSupabase } from '../config/supabase.js';

let sessionStart = Date.now();
let currentSessionId = null;

// Generate unique tokens
function generateToken(prefix) {
    return prefix + '_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Parse UserAgent details
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

    if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

    if (/Mobi|Android|iPhone|iPod/i.test(ua)) deviceType = 'Mobile';
    else if (/iPad|Tablet/i.test(ua)) deviceType = 'Tablet';

    return { browser, os, deviceType };
}

// Fetch visitor location (country / city) via free geolocation api
async function fetchGeolocation() {
    try {
        const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return {
            country: data.countryName || 'Unknown',
            city: data.cityName || 'Unknown'
        };
    } catch {
        return { country: 'Unknown', city: 'Unknown' };
    }
}

// Main initializer
export async function initTracking() {
    // Ignore admin panel and authenticated admin pages
    if (window.location.pathname.includes('/admin.html') || sessionStorage.getItem('adminAuthenticated') === 'true') {
        console.log('[Tracking] Admin session ignored.');
        return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // Check / Create visitor token
    let visitorToken = localStorage.getItem('visitor_token');
    if (!visitorToken) {
        visitorToken = generateToken('vis');
        localStorage.setItem('visitor_token', visitorToken);
    }

    // Check / Create session ID
    let sessionId = sessionStorage.getItem('session_id');
    let isNewSession = false;
    if (!sessionId) {
        sessionId = generateToken('sess');
        sessionStorage.setItem('session_id', sessionId);
        isNewSession = true;
    }
    currentSessionId = sessionId;

    try {
        if (isNewSession) {
            // New Session: Insert Row
            const geo = await fetchGeolocation();
            const device = getDeviceInfo();
            const resolution = `${window.screen.width}x${window.screen.height}`;
            const language = navigator.language || 'Unknown';
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
            const referrer = document.referrer || 'Direct';
            const landingPage = window.location.pathname || '/';

            const sessionData = {
                visitor_token: visitorToken,
                session_id: sessionId,
                country: geo.country,
                city: geo.city,
                browser: device.browser,
                os: device.os,
                device_type: device.deviceType,
                screen_resolution: resolution,
                language,
                timezone,
                referrer,
                landing_page: landingPage,
                current_page: landingPage,
                pages_viewed: 1,
                session_duration: 0,
                blogs_viewed: [],
                projects_viewed: [],
                contact_submitted: false,
                resume_downloaded: false
            };

            await supabase.from('visitor_sessions').insert(sessionData);
        } else {
            // Returning Session: Update Row & Increment pageviews
            const { data: session } = await supabase
                .from('visitor_sessions')
                .select('pages_viewed')
                .eq('session_id', sessionId)
                .maybeSingle();

            const currentPages = session ? session.pages_viewed : 1;

            await supabase
                .from('visitor_sessions')
                .update({
                    pages_viewed: currentPages + 1,
                    current_page: window.location.pathname || '/',
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', sessionId);
        }

        // Heartbeat duration recorder (every 15s)
        setInterval(async () => {
            const duration = Math.round((Date.now() - sessionStart) / 1000);
            await supabase
                .from('visitor_sessions')
                .update({
                    session_duration: duration,
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', sessionId);
        }, 15000);

        // Bind global helper functions to window for other modules
        window.trackContactSubmit = async () => {
            await supabase
                .from('visitor_sessions')
                .update({ contact_submitted: true, updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);
        };

        window.trackResumeDownload = async () => {
            await supabase
                .from('visitor_sessions')
                .update({ resume_downloaded: true, updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);
        };

        window.trackBlogView = async (blogTitle) => {
            const { data: session } = await supabase
                .from('visitor_sessions')
                .select('blogs_viewed')
                .eq('session_id', sessionId)
                .maybeSingle();

            const viewed = session && Array.isArray(session.blogs_viewed) ? session.blogs_viewed : [];
            if (!viewed.includes(blogTitle)) {
                viewed.push(blogTitle);
                await supabase
                    .from('visitor_sessions')
                    .update({ blogs_viewed: viewed, updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);
            }
        };

        window.trackProjectView = async (projectTitle) => {
            const { data: session } = await supabase
                .from('visitor_sessions')
                .select('projects_viewed')
                .eq('session_id', sessionId)
                .maybeSingle();

            const viewed = session && Array.isArray(session.projects_viewed) ? session.projects_viewed : [];
            if (!viewed.includes(projectTitle)) {
                viewed.push(projectTitle);
                await supabase
                    .from('visitor_sessions')
                    .update({ projects_viewed: viewed, updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);
            }
        };

        // Listen for resume downloads automatically on document clicks
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;
            const href = anchor.getAttribute('href') || '';
            const isDownload = anchor.hasAttribute('download');
            const isPdf = href.toLowerCase().endsWith('.pdf') || href.toLowerCase().endsWith('.docx') || href.toLowerCase().endsWith('.doc');
            const isResumeKeyword = href.toLowerCase().includes('resume') || href.toLowerCase().includes('cv');
            
            if (isDownload || isPdf || isResumeKeyword) {
                window.trackResumeDownload();
            }
        });

    } catch (err) {
        console.error('[Tracking] Initialization error:', err);
    }
}
