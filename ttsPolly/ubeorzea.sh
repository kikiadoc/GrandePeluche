#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Mathieu --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Coucou, c'est ubéorzéa.

La Grande Peluche m'a chargée d'effectuer de nombreuses livraisons.

Si tu souhaites recevoir de temps en temps un Codex dans un salon de ton discord, rien de plus simple.

Il faut que tu sois propriétaire ou admin du discord.

En haut à gauche, fait un clic droit sur le nom de ton serveur.

Sélectionne alors Paramères du serveur, puis Intégrations.

Clique alors sur Créer un WebHook.

Choisis le salon ou tu souhaites recevoir les Codex.

Quand le webhook est crée, clique sur Copier l'URL du webhook.

Reviens alors me voir sur le site.

Indique moi l'URL du webhook.

Et c'est tout!

Tu vas recevoir immédiatement le message de bienvenue dans la communauté des abonnés aux Codex.


</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
