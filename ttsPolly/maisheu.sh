#
#
aws polly synthesize-speech --engine standard --language-code de-DE --output-format mp3 --voice-id Hans --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
<break time=\"500ms\"/>
<lang xml:lang=\"fr-FR\">
Mais, Kikiadoc!
</lang>
</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
