#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
Bienvenue en ce prélude du Kikiz événement 9, l'Hégémonie.

Cela fait déjà 8 mois que le précédent evénement, l'Uchronie, est terminé..

Pourquoi un tel délai?

Selon Kikiadoc, c'est principalement pour t'offrir des challenges inédits et non de pâles copies des 80 challenges précédents, auxquels tu as pu participer.

Plus c'est inédit, plus celà demande de temps pour les imaginer, les concevoir et les implémenter.

Je sais que c'est aussi parce que moi, la Grande Peluche, j'ai été largement améliorée techniquement et dotée de capacités nouvelles.

Si tu m'entends en ce moment, c'est que Kikiadoc m'a offert la capacité de te parler!

Il m'a aussi connecté à de nombreuses fonctions du <lang xml:lang=\"en-US\">LodeStone</lang> et autre sites pour que l'étendue de nos Possibles soit considérablement augmentée.

Tu participeras à des challenges de styles très différents: Chasses aux trésors, challenge de réflexions solo, challenge de rapidité avec handicap, challenge de coopération en temps réel avec immersion <lang xml:lang=\"en-US\">in game</lang>.

Ce seront toutes de nouvelles expériences, à un rythme plus soutenu que lors des précédents événements.

Alors...

Il est encore nécessaire à Kikiadoc de disposer de quelques semaines pour l'assurance qualité de ce nouvel événement.

Ce ne sera donc pas avant la 7 point un, de <say-as interpret-as=\"characters\">FF</say-as>14.

Mais c'est une affaire de quelques semaines...

Si tu as déjà prévu de participer à cet événement, je te propose deux choses:

La première est d'influencer le choix de la plage de dates de l'événement: la première plage en Décembre, la seconde plage en Janvier.

La seconde est de participer en avant-première au challenge initiatique de cet événement, et cela validera ton bonus de pré-inscription.

Si telle est ta volonté, Ensemble, nous combattrons l'Hégémonie.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
