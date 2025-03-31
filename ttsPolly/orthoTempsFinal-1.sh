#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Toutes les Runes maléfiques ont été identifiées.

Ainsi, j'ai pu les détruire toutes simultanément.

Grâce à toi, éorzéa est sauvée une nouvelle fois.

Mais je n'avais pas imaginé que notre chronogyre puisse s'activer sans chevrons, depuis une autre dimension.

Et encore moins la visite de tor.

Notre ami Tore.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
