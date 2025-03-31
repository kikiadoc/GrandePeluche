#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Coucou, c'est la Grande Peluche.

Tu vas bientôt utiliser le Chronogyre pour te rendre dans l'Ortho-temps.

Tu vas peut-être devoir surmonter des turbulences techniques.

Pour assurer ta sécurité et celles de tous tes amis, prend le temps de lire attentivement les consignes de survie, rédigées par Kikiadoc.

Bon séjour dans l'Ortho-temps!
</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
