#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
Bienvenue en ce prélude du Kikiz événement 9, l'Hégémonie.

Cela fait plusieurs mois que tu te languis de participer à un nouvel événement.

Ton attente a été longue. J'espère que participer à l'Hégémonie, dans quelques semaines, te comblera de plaisir.

Kikiadoc souhaite ne t'offrir que des challenges totalement inédits, et non de pâles copies des dizaines de challenges précédents auxquels tu as peut-être participé.

Je sais que cette longue attente, c'est aussi parce que moi, la Grande Peluche, j'ai été largement améliorée techniquement et dotée de capacités nouvelles.

Si tu m'entends en ce moment, c'est que Kikiadoc m'a offert la capacité de te parler!

Il m'a aussi connecté à de nombreuses fonctions du <lang xml:lang=\"en-US\">LodeStone</lang> et autre sites pour que l'étendue de nos Possibles soit considérablement augmentée.

Ainsi, tu vas participer à des challenges de styles très différents: Chasses aux trésors, challenge de réflexions solo, challenge d'explorations, challenge de rapidité avec handicap, challenge de coopération en temps réel avec immersion <lang xml:lang=\"en-US\">in game</lang>.

Il est même probable que tu deviennes un traducteur émérite du Langage des Nouveaux Anciens.

Ce sont toutes de nouvelles expériences, que tu découvriras à un rythme soutenu.

Si l'événement est maintenant totalement conçu et implémenté, il faut trouver le bon créneau pour que tu puisses y participer.

Ce n'est pas simple de faire avec les différentes annonces actuelles du jeu: 7.1, 7.11 et 7.15 .

Si tu as prévu de participer, je te propose deux choses:

La première est de m'indiquer si le créneau prévu début janvier te convient ou si tu préfères un autre créneau un peu plu tard.

La seconde est de participer en avant-première au challenge initiatique de cet événement, ce qui validera ton bonus de pré-inscription.

Ensemble, nous combattrons alors l'Hégémonie des Nouveaux Anciens.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
