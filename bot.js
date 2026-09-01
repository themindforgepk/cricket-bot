require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios'); 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Naya QR code scan karein!');
});

client.on('ready', () => {
    console.log('Zabardast! Bot chal pada hai.');
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

client.on('message', async (message) => {
    let msgText = message.body.toLowerCase();

    // Main Menu
    if (msgText === 'score') {
        let menu = `*🏏 Live Cricket Menu 🏏*\n\nAap konsi category dekhna chahte hain?\n\n*1.* 🏆 International\n*2.* 🏟️ Leagues\n*3.* 👩 Women\n\n_Reply mein 1, 2 ya 3 likhein._`;
        message.reply(menu);
    }
    
    // Category select hone par matches laane ka hissa
    else if (msgText === '1' || msgText === '2' || msgText === '3') {
        await sleep(2000); 
        
        try {
            const options = {
                method: 'GET',
                url: 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
                headers: {
                    'x-rapidapi-key': 'process.env.API_KEY',
                    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
                }
            };

            const response = await axios.request(options);
            let allMatchTypes = response.data.typeMatches;
            
            let targetType = "";
            if (msgText === '1') targetType = "International";
            else if (msgText === '2') targetType = "League";
            else if (msgText === '3') targetType = "Women";

            let categoryData = allMatchTypes.find(match => match.matchType === targetType);

            if (categoryData && categoryData.seriesMatches.length > 0) {
                let liveScoreMessage = `*🏆 TOP 3 ${targetType.toUpperCase()} MATCHES 🏆*\n\n`;
                let matchCount = 0;

                for (let series of categoryData.seriesMatches) {
                    if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                        for (let match of series.seriesAdWrapper.matches) {
                            if (matchCount < 3) { // Yahan hum ne limit 3 kar di hai
                                let team1 = match.matchInfo.team1.teamName;
                                let team2 = match.matchInfo.team2.teamName;
                                let status = match.matchInfo.status;
                                
                                liveScoreMessage += `*🔹 ${team1} vs ${team2}*\n*Status:* ${status}\n\n`;
                                matchCount++;
                            }
                        }
                    }
                }
                
                message.reply(liveScoreMessage.trim());
            } else {
                message.reply(`*🏏 Update 🏏*\n\nAbhi is category mein koi match nahi mil raha.`);
            }

        } catch (error) {
            console.log("Data laane mein masla:", error.message);
            message.reply('Abhi API se data laane mein masla aa raha hai.');
        }
    }
});

client.initialize();