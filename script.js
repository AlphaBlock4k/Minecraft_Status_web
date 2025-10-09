/* Theme Toggle Funktion */
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    body.classList.toggle('dark-mode');

    // Icon wechseln
    if (body.classList.contains('dark-mode')) {
        if (themeIcon) themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        if (themeIcon) themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

/* Theme beim Laden wiederherstellen */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.querySelector('.theme-icon');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
    }
}

let updateInterval;

function parseMOTD(motd) {
    if (typeof motd === 'object') {
        if (motd.extra) {
            let result = '';
            if (motd.text) result += parseMotdText(motd.text, motd);
            motd.extra.forEach(part => {
                result += parseMotdText(part.text || '', part);
            });
            return result;
        } else if (motd.text) {
            return parseMotdText(motd.text, motd);
        }
    }

    // Legacy Format mit § Codes
    if (typeof motd === 'string') {
        return parseLegacyMotd(motd);
    }

    return motd;
}

function parseMotdText(text, formatting) {
    let classes = [];

    if (formatting.color) {
        const colorMap = {
            'black': '0', 'dark_blue': '1', 'dark_green': '2', 'dark_aqua': '3',
            'dark_red': '4', 'dark_purple': '5', 'gold': '6', 'gray': '7',
            'dark_gray': '8', 'blue': '9', 'green': 'a', 'aqua': 'b',
            'red': 'c', 'light_purple': 'd', 'yellow': 'e', 'white': 'f'
        };
        classes.push('mc-' + (colorMap[formatting.color] || 'f'));
    }

    if (formatting.bold) classes.push('mc-bold');
    if (formatting.italic) classes.push('mc-italic');
    if (formatting.underlined) classes.push('mc-underline');
    if (formatting.strikethrough) classes.push('mc-strikethrough');

    return `<span class="${classes.join(' ')}">${escapeHtml(text)}</span>`;
}

function parseLegacyMotd(motd) {
    const colorCodes = {
        '0': 'mc-0', '1': 'mc-1', '2': 'mc-2', '3': 'mc-3',
        '4': 'mc-4', '5': 'mc-5', '6': 'mc-6', '7': 'mc-7',
        '8': 'mc-8', '9': 'mc-9', 'a': 'mc-a', 'b': 'mc-b',
        'c': 'mc-c', 'd': 'mc-d', 'e': 'mc-e', 'f': 'mc-f',
        'l': 'mc-bold', 'o': 'mc-italic', 'n': 'mc-underline', 'm': 'mc-strikethrough'
    };

    let result = '';
    let currentClasses = [];
    let i = 0;

    while (i < motd.length) {
        if (motd[i] === '§' && i + 1 < motd.length) {
            const code = motd[i + 1].toLowerCase();
            if (code === 'r') {
                currentClasses = [];
            } else if (colorCodes[code]) {
                if (code.match(/[0-9a-f]/)) {
                    currentClasses = currentClasses.filter(c => !c.startsWith('mc-') || c.length > 4);
                    currentClasses.push(colorCodes[code]);
                } else {
                    currentClasses.push(colorCodes[code]);
                }
            }
            i += 2;
        } else {
            let text = '';
            while (i < motd.length && motd[i] !== '§') {
                text += motd[i];
                i++;
            }
            if (text) {
                result += `<span class="${currentClasses.join(' ')}">${escapeHtml(text)}</span>`;
            }
        }
    }

    return result;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function checkServer() {
    const input = document.getElementById('serverHost').value.trim();

    if (!input) {
        alert('Bitte gib eine Server-IP oder Domain ein!');
        return;
    }

    // Parse Host und Port aus dem Input (z.B. "mc.hypixel.net:25565" oder "mc.hypixel.net")
    let host, port;
    if (input.includes(':')) {
        const parts = input.split(':');
        host = parts[0];
        port = parts[1] || '25565';
    } else {
        host = input;
        port = '25565';
    }

    const loadingElement = document.getElementById('loading');
    const statusCard = document.getElementById('statusCard');
    const errorMessage = document.getElementById('errorMessage');

    // Sanft ausblenden
    statusCard.classList.remove('active');
    errorMessage.style.display = 'none';

    // Kurz warten, dann loading anzeigen
    setTimeout(() => {
        loadingElement.style.display = 'block';
    }, 100);

    try {
        // Verwende eine öffentliche Minecraft Server Status API
        const response = await fetch(`https://api.mcsrvstat.us/3/${host}:${port}`);
        const data = await response.json();

        loadingElement.style.display = 'none';

        // Kurz warten, dann Status-Card einblenden
        setTimeout(() => {
            statusCard.classList.add('active');
        }, 100);

        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const serverInfo = document.getElementById('serverInfo');
        const motdContainer = document.getElementById('motdContainer');

        if (data.online) {
            statusIndicator.className = 'status-indicator online';
            statusText.className = 'status-text online';
            statusText.textContent = 'Server Online';

            let infoHTML = `
                <div class="info-row">
                    <span class="info-label">Server:</span>
                    <span class="info-value">${host}:${port}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Spieler:</span>
                    <span class="info-value">${data.players.online} / ${data.players.max}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Version:</span>
                    <span class="info-value">${data.version || 'Unbekannt'}</span>
                </div>
            `;

            if (data.software) {
                infoHTML += `
                    <div class="info-row">
                        <span class="info-label">Software:</span>
                        <span class="info-value">${data.software}</span>
                    </div>
                `;
            }

            serverInfo.innerHTML = infoHTML;

            // MOTD anzeigen
            if (data.motd) {
                let motdHTML = '<div class="motd">';
                if (data.motd.html) {
                    motdHTML += data.motd.html.join('<br>');
                } else if (data.motd.clean) {
                    motdHTML += data.motd.clean.join('<br>');
                } else if (Array.isArray(data.motd)) {
                    motdHTML += data.motd.join('<br>');
                }
                motdHTML += '</div>';
                motdContainer.innerHTML = motdHTML;
            }

        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.className = 'status-text offline';
            statusText.textContent = 'Server Offline';

            serverInfo.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Server:</span>
                    <span class="info-value">${host}:${port}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">Nicht erreichbar</span>
                </div>
            `;
            motdContainer.innerHTML = '';
        }

        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('de-DE');

    } catch (error) {
        loadingElement.style.display = 'none';

        setTimeout(() => {
            statusCard.classList.add('active');
        }, 100);

        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Fehler beim Abrufen des Server-Status: ' + error.message;
    }
}

// Auto-Update alle 10 Sekunden
function startAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        if (document.getElementById('serverHost').value.trim()) {
            checkServer();
        }
    }, 10000);
}

// Initial check beim Laden
window.onload = () => {
    loadTheme();
    checkServer();
    startAutoUpdate();
};
