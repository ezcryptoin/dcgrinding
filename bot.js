const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

// Colors
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";

// Config
const ACCOUNTS_FILE = "accounts.json";
const ENV_FILE = ".env";

// Global Variables
let CURRENT_KEY_INDEX = 0;
let GROQ_API_KEYS = [];
let LAST_ACCOUNT_REPLY = {};
let LAST_MESSAGE_REPLY = {};
let COOLDOWN = 20;

// Helper Functions
function clearConsole() {
    console.clear();
}

function ts() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

function formatTime(sec) {
    sec = Math.floor(sec);
    if (sec >= 60) {
        return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    }
    return `${sec}s`;
}

// Countdown Sleep Function
function sleepCountdown(duration, label = "Waiting") {
    return new Promise((resolve) => {
        if (duration <= 0) {
            resolve();
            return;
        }
        const endTime = Date.now() + (duration * 1000);
        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            const timerStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            process.stdout.write(`\r${GRAY}${label}: ${timerStr}   ${RESET}`);
            
            if (remaining <= 0) {
                clearInterval(interval);
                process.stdout.write(`\r${' '.repeat(50)}\r`);
                resolve();
            }
        }, 100);
    });
}

// Simple sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHeaders(token) {
    const props = {
        "os": "Windows",
        "browser": "Chrome",
        "system_locale": "en-US",
        "browser_user_agent": "Mozilla/5.0",
        "browser_version": "120.0.0.0",
        "os_version": "10",
        "release_channel": "stable",
        "client_build_number": 255289
    };
    const encoded = Buffer.from(JSON.stringify(props)).toString('base64');
    return {
        "Authorization": token,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "X-Super-Properties": encoded,
        "Referer": "https://discord.com/channels/@me"
    };
}

function loadEnv() {
    if (!fs.existsSync(ENV_FILE)) {
        console.log(`${YELLOW}.env not found${RESET}`);
        process.exit(1);
    }
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    GROQ_API_KEYS = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (GROQ_API_KEYS.length === 0) {
        console.log(`${YELLOW}No valid API keys found in .env${RESET}`);
        process.exit(1);
    }
}

function loadConfig() {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
        console.log(`${YELLOW}accounts.json not found${RESET}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
}

async function getRecentMessages(token, channel_id, limit = 20) {
    const url = `https://discord.com/api/v9/channels/${channel_id}/messages?limit=${limit}`;
    try {
        const r = await axios.get(url, {
            headers: getHeaders(token),
            timeout: 10000
        });
        if (r.status === 200) {
            return r.data;
        }
    } catch (e) {
        // Silent fail
    }
    return [];
}

async function sendReply(token, channel_id, guild_id, content, reply_to_id) {
    const url = `https://discord.com/api/v9/channels/${channel_id}/messages`;
    const payload = {
        "content": content,
        "message_reference": {
            "channel_id": channel_id,
            "message_id": reply_to_id,
            "guild_id": guild_id
        },
        "allowed_mentions": { "replied_user": false }
    };
    try {
        const r = await axios.post(url, payload, {
            headers: getHeaders(token),
            timeout: 10000
        });
        return r.status === 200;
    } catch (e) {
        return false;
    }
}

async function sendTyping(token, channel_id) {
    const url = `https://discord.com/api/v9/channels/${channel_id}/typing`;
    try {
        await axios.post(url, {}, {
            headers: getHeaders(token),
            timeout: 5000
        });
    } catch (e) {
        // Silent fail
    }
}

function cleanText(text) {
    text = text.replace(/[—–]/g, "");
    text = text.replace(/\*[^*]+\*/g, "");
    text = text.replace(/\s+/g, " ").trim();
    text = text.replace(/^\s*(?:yeah|Yeah|YEAH)\s*[,\.]?\s*/gi, '');
    text = text.replace(/(\w)!\s+/g, '$1, ');
    text = text.replace(/\.\s*$/, '');
    text = text.replace(/,\s*([\u{1F600}-\u{1F64F}])/gu, ' $1');
    text = text.replace(/\s+/g, " ").trim();
    
    const maxLen = 90;
    if (text.length > maxLen) {
        text = text.slice(0, maxLen).split(' ').slice(0, -1).join(' ');
    }
    return text.trim();
}

async function generateAiReply(prompt) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    const styleVariations = [
        "Reply like a normal Discord user.",
        "Reply casually like you're mid conversation.",
        "Reply naturally, not formal.",
        "Reply like you're actually interested.",
        "Reply short but human.",
    ];

    const maxAttempts = GROQ_API_KEYS.length;
    
    for (let i = 0; i < maxAttempts; i++) {
        const key = GROQ_API_KEYS[CURRENT_KEY_INDEX];
        const headers = {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        };

        const payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a real human chatting on Discord.\nNever sound like AI.\nKeep replies short and natural.\nMaximum 1 or 2 short sentences.\nDo not tell long stories.\nAvoid structured explanations.\nNever use em-dash.\nDo not use roleplay actions like *laughs*.\nYou may add ONE relevant emoji at the end if it fits naturally (e.g., 😊, 🤔, 💯, 🚀, 🔥, 👀, 🙏, 🤷‍♂️).\nNever force an emoji. If unsure, skip it."
                },
                {
                    "role": "user",
                    "content": `${styleVariations[Math.floor(Math.random() * styleVariations.length)]}\n\nMessage: ${prompt}`
                }
            ],
            "temperature": 1.05,
            "top_p": 0.95,
            "presence_penalty": 0.6,
            "frequency_penalty": 0.4,
            "max_tokens": 40
        };

        try {
            const r = await axios.post(url, payload, {
                headers: headers,
                timeout: 15000
            });
            
            if (r.status === 200) {
                const text = r.data.choices[0].message.content;
                return cleanText(text);
            }
        } catch (e) {
            // Continue to next key
        }
        
        CURRENT_KEY_INDEX = (CURRENT_KEY_INDEX + 1) % GROQ_API_KEYS.length;
    }

    return null;
}

function printBanner() {
    clearConsole();
    console.log(`${CYAN}${'='.repeat(60)}${RESET}`);
    console.log(`${CYAN}   ██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗${RESET}`);
    console.log(`${CYAN}   ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗${RESET}`);
    console.log(`${CYAN}   ██║  ██║██║███████╗██║     ██║   ██║██████╔╝██║  ██║${RESET}`);
    console.log(`${CYAN}   ██║  ██║██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║${RESET}`);
    console.log(`${CYAN}   ██████╔╝██║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝${RESET}`);
    console.log(`${CYAN}   ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝${RESET}`);
    console.log(`${CYAN}${'='.repeat(60)}${RESET}`);
    console.log(`Created by      : ezcryptoin`);
    console.log(`Telegram Channel: https://t.me/EZ_CRYPTOIN`);
    console.log(`${CYAN}${'='.repeat(60)}${RESET}`);
}

async function askCooldown() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${GREEN}Enter cooldown in seconds (default 20): ${RESET}`, (answer) => {
            rl.close();
            const input = answer.trim();
            let cooldown = input ? parseInt(input) : 20;
            if (isNaN(cooldown) || cooldown < 1) {
                cooldown = 20;
            }
            resolve(cooldown);
        });
    });
}

async function main() {
    printBanner();
    COOLDOWN = await askCooldown();
    
    printBanner();
    
    const cfg = loadConfig();
    const guild_id = cfg.guild_id;
    const channel_id = cfg.channel_id;
    const accounts = cfg.accounts;
    const self_ids = new Set(accounts.map(a => a.user_id));

    console.log(`Created by      : ezcryptoin`);
    console.log(`Telegram Channel: https://t.me/EZ_CRYPTOIN`);
    console.log(`${CYAN}${'='.repeat(60)}${RESET}`);
    console.log(`Accounts Loaded : ${accounts.length}`);
    console.log(`Cooldown        : ${COOLDOWN}s`);
    console.log(`Status          : Ready`);
    console.log(`${CYAN}${'='.repeat(60)}${RESET}\n`);

    while (true) {
        const now = Date.now() / 1000;

        // Calculate ready times for all accounts
        const accountReadyTimes = accounts.map(a => {
            const lastReply = LAST_ACCOUNT_REPLY[a.name] || 0;
            return lastReply + COOLDOWN;
        });

        // Find nearest ready time
        const minReadyTime = Math.min(...accountReadyTimes);
        const waitTime = minReadyTime - now;

        // If all accounts on cooldown, show countdown
        if (waitTime > 0) {
            await sleepCountdown(waitTime, `${GRAY}Next action in`);
            continue;
        }

        // Get ready accounts
        const readyAccounts = accounts.filter(a => {
            const lastReply = LAST_ACCOUNT_REPLY[a.name] || 0;
            return now - lastReply >= COOLDOWN;
        });

        if (readyAccounts.length === 0) {
            await sleep(500);
            continue;
        }

        const acc = readyAccounts[Math.floor(Math.random() * readyAccounts.length)];
        const messages = await getRecentMessages(acc.token, channel_id);

        let mentionTarget = null;
        let normalTarget = null;

        for (const m of messages) {
            if (!m.content) continue;
            if (LAST_MESSAGE_REPLY[m.id]) continue;
            if (self_ids.has(m.author.id)) continue;

            const hasMention = m.mentions?.some(u => self_ids.has(u.id));
            if (hasMention) {
                mentionTarget = m;
                break;
            }

            if (!normalTarget) {
                normalTarget = m;
            }
        }

        const target = mentionTarget || normalTarget;

        if (!target) {
            await sleepCountdown(2, "No messages");
            continue;
        }

        const reply = await generateAiReply(target.content);
        if (!reply) {
            await sleepCountdown(1, "API Retry");
            continue;
        }

        console.log(`${GREEN}[${ts()}] [${acc.name}] ${reply}${RESET}`);

        const baseTime = reply.length * 0.1;
        const punctCount = (reply.match(/[.,!?]/g) || []).length;
        let typingDelay = Math.max(baseTime + punctCount * 0.2, 1.0);
        typingDelay = Math.round(typingDelay * 100) / 100;

        await sendTyping(acc.token, channel_id);
        await sleepCountdown(typingDelay, "Typing");

        const success = await sendReply(acc.token, channel_id, guild_id, reply, target.id);
        
        if (success) {
            const t = Date.now() / 1000;
            LAST_ACCOUNT_REPLY[acc.name] = t + COOLDOWN;
            LAST_MESSAGE_REPLY[target.id] = t;
            console.log(`${GRAY}           └─ ${acc.name} cooldown: ${formatTime(COOLDOWN)}${RESET}`);
        } else {
            await sleepCountdown(1, "Send Failed");
            continue;
        }
    }
}

// Main Execution
(async () => {
    try {
        loadEnv();
        await main();
    } catch (e) {
        if (e.code === 'SIGINT' || e.message.includes('KeyboardInterrupt')) {
            console.log(`\n${YELLOW}Process terminated by user${RESET}`);
        } else {
            console.error(`${YELLOW}Error: ${e.message}${RESET}`);
        }
    }
})();
