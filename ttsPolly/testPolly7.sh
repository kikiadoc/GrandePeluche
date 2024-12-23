#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Mathieu --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Salut les peluches!

C'est <lang xml:lang=\"en-US\">Alan</lang>.

Vous savez que j'ai cassé le code d'Enigma il y a de nombreuses années.

Aujourd'hui, je viens de comprendre ce langage étrange et en concevoir l'Algorithme de décryptage.

Archéologie, Linguistique et Mathématique vont nous permettre de comprendre le langage des Nouveaux Anciens.

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
