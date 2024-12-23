#
#
aws polly synthesize-speech --engine standard --language-code fr-FR --output-format mp3 --voice-id Lea --text-type ssml  \
	--text "<speak><prosody volume=\"x-loud\"><amazon:effect name=\"drc\">
Alors que je sortais de mon bureau, pensant savoir comment identifier la station Oméga, j'ai été assaillie par un Nouvel Ancien.
Depuis, dès que je me déplace, je perçois l'Unicast de la Possession d'âme depuis tout l'Univers Connu.
Heureusement, j'ai trouvé refuge sur ce trône.
Il semble que ce soit le seul endroit de l'Univers connu où la Possession des âmes ne m'atteint pas.
Hélas, d'ici, je ne puis écrire. D'ici, je ne puis consulter un quelconque Grimoire.
D'ici, je ne peux rien faire mais il me reste la voix. Ma voix.
En utilisant ma voix, je peux te donner quelques directives qui te permettront, je l'espère, de constituer la carte permettant de se rendre à la station Oméga.
Tous mes espoirs reposent sur toi!.
Station Oméga est le dernier lieu de l'Hégémonie. Détruire la station Oméga sera ton. Non, elle sera à nous tous, nôtre ultime mission.
Mais pour l'heure, il te faudra, en collaborant avec tous, constituer la carte qui nous permettra de découvrir le lieu où se trouve la station Oméga.
Dif tor heh smusmar. Paix et longue vie, à toi, à nous, à tout Eorzéa et l'Univers Connu.
</amazon:effect></prosody></speak>" \
	/var/www/static/grimoire/polly2.mp3 
