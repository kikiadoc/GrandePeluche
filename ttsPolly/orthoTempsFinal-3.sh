#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Que sera notre futur?

Que sera notre Ortho-futur?

Que sera notre hyper-futur?

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
