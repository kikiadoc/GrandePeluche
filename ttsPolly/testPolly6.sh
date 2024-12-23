#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Organiser une conférence scientifique n'est pas une chose facile.

Mais j'ai bon espoir.

La Peluche Archéologue Jean-François Champollion a confirmé sa présence.

La Peluche Mathématicienne <lang xml:lang=\"de-DE\">Lothar Collatz</lang> également.

J'espère que l'immense Peluche <lang xml:lang=\"en-US\">Alan Turing</lang> pourra se joindre à nous.

<lang xml:lang=\"en-US\">Alan</lang>, c'est celui qui a conçu les bases de l'informatique moderne et poser les premieres pierres de ce qui est maintenant l'Intelligence Artificielle.

Au vu des dangers actuels, je vais organiser cette conférence dans un endroit secret, et tu ne pourras pas y participer.

Mais t'inquiètes, ile discorde te tiendra informé de son déroulement.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
