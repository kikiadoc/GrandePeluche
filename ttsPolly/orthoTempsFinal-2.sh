#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Mathieu --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Je m'appelle Thor.

Je viens d'un univers que vous ne pouvez pas encore percevoir.

Je suis ici pour vous indiquer que Méphistophélès a tenter de détruire une autre dimension, l'Hyper-temps.

Nous l'avons neutralisé et enfermé dans une prison Hypo-temporelle.

Pour Méphistophélès, le temps, l'Ortho-temps ou l'Hyper-temps n'existent plus.

Continue d'explorer les 5 dimensions de ton Univers Connu .

Dans mon Univers, d'autres dimensions existent.

La Peluche Daniel Jackson rêve de les découvrir.

Soyez sur, tel les Quatre, explorant l'Ortho-temps, qu'il reviendra bientôt, ivre de nouvelles connaissances.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
