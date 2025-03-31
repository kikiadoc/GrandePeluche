#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

C'est la Grande Peluche.

Je tente une diffusion multi-temporelle de ce message.

aaflkjmlksfmkljqmfjklqesùjmùmkmùpoair

Si tu es dans l'Ortho-Temps, consulte ton Harmonique.

Peut-être a-t-elle enregistré les flux éthérés de ce message.

Fin de transmission.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
