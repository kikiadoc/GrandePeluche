#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Ton âme a été capturée.

Pour qu'elle puisse s'échaper de la prison des âmes, il faut éviter les gardiens et courir jusqu'à ce que tu traverses une porte magique.

Pour te déplacer, utilises les touches de ton clavier ou clique sur les boutons de direction.

Si les gardiens sont trop rapides, tu peux activer le mode <lang xml:lang=\"en-US\">NOOB</lang>

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
