# WhatsApp Cricket Bot

## Run

- Start the `WhatsApp Cricket Bot` workflow, which runs `node bot.js`.
- The bot runs as a console/background process and does not open a web preview.

## Required configuration

- Store the Cricbuzz RapidAPI credential in the Replit Secret named `API_KEY`.
- Do not add API credentials to source files or commit them.

## WhatsApp authentication

- On a new WhatsApp session, open the workflow console and scan the printed QR code with WhatsApp's **Linked devices** feature.
- Authentication is stored locally by `whatsapp-web.js` using `LocalAuth`, so later restarts should reuse the session.

## Usage

- Send `score` to the connected WhatsApp account to open the cricket menu.
- Reply `1` for International, `2` for Leagues, or `3` for Women.