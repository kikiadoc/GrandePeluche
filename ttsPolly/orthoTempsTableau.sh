#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

C'est la Grande Peluche.

L'énigme d'une Ardoise a été résolue.

Fin de transmission.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
