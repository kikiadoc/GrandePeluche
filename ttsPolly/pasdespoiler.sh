#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Mathieu --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
<break time=\"500ms\"/>
Il discorde, 

je t'ai déjà dit:

PAS DE SPOILER

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
