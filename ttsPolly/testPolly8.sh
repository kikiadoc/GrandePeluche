#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">

Bientôt commencera le <lang xml:lang=\"en-US\">Kiki's Event</lang> 9.

Prépare-toi à te mesurer aux nouveaux anciens, pendant une dizaine de jours, lors d'aventures épiques.

Pendant cette décade, rien ne devra être plus important que cet événement.

<lang xml:lang=\"en-US\">Nothing else matters</lang>. 

Le vendredi 10 janvier, à 21 heures, débutera le premier challenge.

Puis, presque tous les jours, tu pourras participer à un nouveau challenge.

Et celà, jusqu'à un weekend bien particulier, commençant Samedi 18.

Tu pourras alors configurer ton jeu et te préparer pour le Dimanche à 20 heures.

Dimanche, tu participeras à un challenge de rapidité, en collaboration, en temps-réel, et avec une immersion <lang xml:lang=\"en-US\">in game</lang> telle que tu n'en as jamais connu!

Le lundii 20, à partir de 21 heures, tu pourras collaborer au final de l'événement.

L'Hégémonie, 

Tout commencera le vendredi 10 janvier à 21 heures.

Avant celà, termine ta quête initiatique et invite tes amis sur Discorde et le site.

Réserve dès à présent cette semaine et tes soirées du dimanche 19 à partir de 19 heures 45 et lundi 20 à partir de 21 heures.

J'espère qu'ensemble, nous vaincrons l'Hégémonie des Nouveaux Anciens!

</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/test.mp3 
