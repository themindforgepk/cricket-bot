const http = require("http");
http.createServer((req, res) => {
    res.write("Bot is alive!");
    res.end();
}).listen(8080);
require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

// NAYA: Jo users live score dekh rahe hain, unka record rakhne ke liye
const activeIntervals = new Map();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-extensions",
        ],
    },
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Naya QR code scan karein!");
});

client.on("ready", () => {
    console.log("Zabardast! Bot chal pada hai.");
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.on("message", async (message) => {
    let msgText = message.body.toLowerCase();
    const chatId = message.from;

    // 🛑 NAYA: Score rokne ke liye "0" ki command
    if (msgText === "0") {
        if (activeIntervals.has(chatId)) {
            clearInterval(activeIntervals.get(chatId)); // Auto-loop rok do
            activeIntervals.delete(chatId); // User ko list se nikal do
            client.sendMessage(
                chatId,
                "🛑 *Updates Rok Di Gayi Hain*\n\nDobara live menu dekhne ke liye *score* bhejein.",
            );
        }
        return; // Aage ka code run na ho
    }

    // Main Menu
    if (msgText === "score") {
        let menu = `*🏏 Live Cricket Menu 🏏*\n\nAap konsi category dekhna chahte hain?\n\n*1.* 🏆 International\n*2.* 🏟️ Leagues\n*3.* 👩 Women\n\n_Reply mein 1, 2 ya 3 likhein._`;
        message.reply(menu);
    }

    // Category select hone par auto-matches laane ka hissa
    else if (msgText === "1" || msgText === "2" || msgText === "3") {
        // Agar pehle se koi loop chal raha hai toh usay rok do taake double messages na jayen
        if (activeIntervals.has(chatId)) {
            clearInterval(activeIntervals.get(chatId));
        }

        message.reply(
            "⏳ *Live scoring shuru...* (Har 2 minute baad auto-update aayegi)",
        );
        await sleep(2000);

        // API se data laane wala function (Isey loop mein chalayenge)
        const fetchAndSendScore = async () => {
            try {
                const options = {
                    method: "GET",
                    url: "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live",
                    headers: {
                        "x-rapidapi-key": process.env.API_KEY,
                        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                    },
                };

                const response = await axios.request(options);
                let allMatchTypes = response.data.typeMatches;

                let targetType = "";
                if (msgText === "1") targetType = "International";
                else if (msgText === "2") targetType = "League";
                else if (msgText === "3") targetType = "Women";

                let categoryData = allMatchTypes.find(
                    (match) => match.matchType === targetType,
                );

                if (categoryData && categoryData.seriesMatches.length > 0) {
                    let liveScoreMessage = `*🏆 TOP 3 ${targetType.toUpperCase()} MATCHES 🏆*\n\n`;
                    let matchCount = 0;

                    for (let series of categoryData.seriesMatches) {
                        if (
                            series.seriesAdWrapper &&
                            series.seriesAdWrapper.matches
                        ) {
                            for (let match of series.seriesAdWrapper.matches) {
                                if (matchCount < 3) {
                                    let team1 = match.matchInfo.team1.teamName;
                                    let team2 = match.matchInfo.team2.teamName;
                                    let status = match.matchInfo.status;

                                    // NAYA: Teams ke naam BOLD kar diye hain (*) laga kar
                                    liveScoreMessage += `🔹 *${team1}* vs *${team2}*\n*Status:* ${status}\n\n`;
                                    matchCount++;
                                }
                            }
                        }
                    }

                    // NAYA: Footer message add kar diya
                    liveScoreMessage += `_Arzi tor pr rokne k liye 0 bhejo_`;

                    // message.reply ki jagah sendMessage use kiya taake auto-loop mein error na aaye
                    client.sendMessage(chatId, liveScoreMessage.trim());
                } else {
                    client.sendMessage(
                        chatId,
                        `*🏏 Update 🏏*\n\nAbhi is category mein koi match nahi mil raha.\n\n_Arzi tor pr rokne k liye 0 bhejo_`,
                    );
                }
            } catch (error) {
                console.log("Data laane mein masla:", error.message);
                client.sendMessage(
                    chatId,
                    "Abhi API se data laane mein masla aa raha hai.",
                );
            }
        };

        // 1. Pehli dafa foran score bhej do
        await fetchAndSendScore();

        // 2. Uske baad har 120,000 milliseconds (2 minutes) baad auto-score bhejte raho
        const intervalId = setInterval(fetchAndSendScore, 120000);

        // 3. Is user ke loop ko save kar lo taake 0 dabane par roka ja sake
        activeIntervals.set(chatId, intervalId);
    }
});

client.initialize();
