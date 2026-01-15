export const welcomeMessages = [
    'Willkommen',
    'Ich hoffe Sie haben einen wundervollen Tag,',
    'Auf einen guten Unterrichtstag,',
    'Schön, dass Sie heute da sind,',
    ]

export function getRandomWelcome():string {
    return welcomeMessages[
        Math.floor(Math.random() * welcomeMessages.length)
    ]
}