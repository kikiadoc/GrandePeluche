//
// Construction des parametres pour les iptables
// pour optimisation de la recherche des packets par un binaryTree.
//
// Tables INxxx: table d'indirection des packets selon un b-tree.
// Tables NTxxx: regles finales dont lecontenu est modifié en temps réel si besoin par checkSec


let lstTables = []
let lstRules = []
let lstNets = []

function pad(x) {
	return ("000"+x).substr(-3);
}
// ligne depuis f, avec plage 2*powe, fin indique qu'il faut une regle NT et non un LV
function line(d,power,fin) {
	let increment = 2**power
	// nom de la table
	for (let f = d; f < 256; f+= increment) {
		let l= f + increment;
		let m = (f+l) / 2
		let table = "IN"+(7-power)+"x"+pad(f)+"x"+pad(l-1)
		let target1 = (!fin)? "IN"+(8-power)+"x"+pad(f)+"x"+pad(m-1) : "NT"+pad(f)
		let target2 = (!fin)? "IN"+(8-power)+"x"+pad(m)+"x"+pad(l-1) : "NT"+pad(m)
		lstTables.push(':'+table+' - [0:0]');
		if (fin) lstNets.push(':'+target1+' - [0:0]')
		if (fin) lstNets.push(':'+target2+' - [0:0]')

		lstRules.push('-A '+table+' -p tcp -m iprange --src-range '+f+'.0.0.0-'+(m-1)+'.255.255.255 -m tcp --dport 443 -g '+target1  )
		lstRules.push('-A '+table+' -p tcp -m iprange --src-range '+m+'.0.0.0-'+(l-1)+'.255.255.255 -m tcp --dport 443 -g '+target2  )
	}
}


line(0,7)
line(0,6)
line(0,5,true)


lstTables.forEach((e) => { console.log(e)})
lstNets.forEach((e) => { console.log(e)})
lstRules.forEach((e) => { console.log(e)})
