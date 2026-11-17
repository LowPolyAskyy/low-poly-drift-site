
// ---- Low Poly Drift - Game Servers ----
window.SERVERS = {
    eu: {
        name: 'Frankfurt (Europe)',
        url: 'https://low-poly-drift-server-eu.onrender.com'
    },
    us: {
        name: 'Ashburn (America)',
        url: 'https://low-poly-drift-server-usa.onrender.com'
    },
    asia: {
        name: 'Singapore (Asia)',
        url: 'https://low-poly-drift-server-asia.onrender.com'
    },
    india: {
        name: 'Kolkata (India)',
        url: 'https://hexagon-bony-hippopotamus.abasthan.app'
    },
    oc: {
        name: 'Sydney (Oceania)',
        url: 'https://low-poly-drift-server-vercel.vercel.app'
    },
    africa: {
        name: 'Cape Town (Africa)',
        url: 'https://low-poly-drift-server-vercel-67bf6d1b9-ramenex14-5192.vercel.app'
    }
};

// ---- REGION DETECTION ----
(function () {
    const S = window.SERVERS;
    const live = k => S[k] && S[k].url;

    function guess() {
        let tz = '';

        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (e) {}

        // America
        if (
            /^America\//.test(tz) ||
            /^Atlantic\/Bermuda$/.test(tz) ||
            /^Pacific\/(Honolulu|Pago_Pago|Johnston)$/.test(tz)
        ) {
            return 'us';
        }

        // Oceania
        if (
            /^Australia\//.test(tz) ||
            /^Pacific\//.test(tz)
        ) {
            return 'oc';
        }

        // India
        if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
            return 'india';
        }

        // Asia
        if (
            /^Asia\//.test(tz) &&
            !/^Asia\/(Dubai|Muscat|Baghdad|Tehran|Riyadh|Kuwait|Qatar|Bahrain|Aden|Jerusalem|Tel_Aviv|Beirut|Amman|Damascus|Nicosia|Famagusta|Istanbul|Baku|Tbilisi|Yerevan|Gaza|Hebron)$/.test(tz)
        ) {
            return 'asia';
        }

        // Africa / Europe / Middle East
        return 'eu';
    }

    // Saved region
    let pick = 'eu';

    try {
        pick = localStorage.dn_region || 'eu';
    } catch (e) {}

    const near = live(guess()) ? guess() : 'eu';

    // URL override: ?srv=eu / us / asia / india / oc
    const m = /[?&]srv=([a-z]+)/i.exec(location.search);

    let key = m && live(m[1].toLowerCase())
        ? m[1].toLowerCase()
        : (pick === 'auto'
            ? near
            : (live(pick) ? pick : 'eu'));

    // Fallback
    if (!live(key)) {
        key = live('eu') ? 'eu' : Object.keys(S).find(live);
    }

    window.NEAREST_KEY = near;
    window.SERVER_KEY = key;
    window.SERVER_URL = S[key].url;

    window.setRegion = function (v) {
        if (v !== 'auto' && !live(v)) return;

        try {
            localStorage.dn_region = v;
        } catch (e) {}
    };
})();

// ---- APP DETECTION ----
window.IN_APP =
    /median|gonative|LowPolyDriftApp|Electron/i.test(navigator.userAgent) ||
    !!window.median ||
    !!window.gonative ||
    navigator.standalone === true ||
    (
        window.matchMedia &&
        matchMedia('(display-mode: standalone)').matches
    );

// ---- ARTIC ID ----
window.ARTIC_ID_URL = 'https://articid.vercel.app';
