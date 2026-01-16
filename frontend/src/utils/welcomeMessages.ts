export const welcomeMessages = [
    'Willkommen',
    'Ich hoffe, Sie haben einen wundervollen Tag,',
    'Auf einen guten Unterrichtstag,',
    'Schön, dass Sie heute da sind,',
    'Jetzt erstmal nen Kaffee für',
    'Einen erfolgreichen Tag wünsche ich,',
    'Auf einen produktiven Unterricht,',
    'Gemeinsam schaffen wir das,',
    'Heute wird Wissen geteilt,',
    'Lernen macht gemeinsam mehr Spaß,',
    'Mit Freude am Unterricht,',
    'Heute gibt es neue Chancen,',
    'Jeder Tag ist ein neuer Anfang,',
    'Lasst uns neugierig bleiben,',
    'Heute wird Teamgeist großgeschrieben,',
    'Mit Respekt und Motivation,',
    'Gemeinsam zum Ziel,',
    'Heute wird ein guter Tag,',
    'Mit frischem Elan in den Tag,',
    'Lasst uns gemeinsam wachsen,',
    'Heute zählt jeder Beitrag,',
    'Mit Offenheit und Neugier,',
    'Jeder Tag bringt neue Möglichkeiten,',
    'Lasst uns das Beste daraus machen,',
    'Heute wird ein Schritt nach vorn gemacht,',
]

export function getRandomWelcome():string {
    return welcomeMessages[
        Math.floor(Math.random() * welcomeMessages.length)
    ]
}