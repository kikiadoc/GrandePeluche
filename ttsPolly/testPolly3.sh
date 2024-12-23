#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
Bienvenue en ce prélude du Kikiz événement 9, l'Hégémonie.

Cela fait plusieurs mois que tu te languis de participer à un nouvel événement.

Ton attente a été longue, mais tu vas pouvoir participer à l'Hégémonie dans quelques jours, ce qui, je l'espère, te comblera de plaisirs.

Kikiadoc a souhaité ne t'offrir que des challenges totalement inédits, et non de pâles copies des 80 challenges précédents, auxquels tu as déjà pu participer.

Je sais que cette longue attente, c'est aussi parce que moi, la Grande Peluche, j'ai été largement améliorée techniquement et dotée de capacités nouvelles.

Si tu m'entends en ce moment, c'est que Kikiadoc m'a offert la capacité de te parler!

Il m'a aussi connecté à de nombreuses fonctions du <lang xml:lang=\"en-US\">LodeStone</lang> et autre sites pour que l'étendue de nos Possibles soit considérablement augmentée.

Ainsi, tu vas participer à des challenges de styles très différents: Chasses aux trésors, challenge de réflexions solo, challenge de rapidité avec handicap, challenge de coopération en temps réel avec immersion <lang xml:lang=\"en-US\">in game</lang>.

Tu deviendras peut-être le traducteur émérite du Langage des Anciens.

Ce seront toutes de nouvelles expériences, à un rythme plus soutenu que lors des précédents événements.

Si tu as prévu de participer, je te propose deux choses:

La première est d'indiquer ta préférence pour la plage de dates de l'événement: en Décembre ou en Janvier.

La seconde est de participer en avant-première au challenge initiatique de cet événement, ce qui validera ton bonus de pré-inscription.

Si telle est ta volonté, Ensemble, nous combattrons l'Hégémonie.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
