const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');

// Fonction pour obtenir toutes les adresses IP disponibles
function getAvailableIPs() {
  const interfaces = os.networkInterfaces();
  const ipAddresses = [];

  // Ajouter localhost par défaut
  ipAddresses.push({
    name: 'localhost',
    address: 'localhost',
    netmask: '255.0.0.0'
  });

  for (const [name, interfaceInfo] of Object.entries(interfaces)) {
    if (!interfaceInfo) continue;
    
    // Sur Windows, family peut être une chaîne ('IPv4') ou un nombre (4)
    const ipv4Interfaces = interfaceInfo.filter(info => {
      return (info.family === 'IPv4' || info.family === 4) && !info.internal;
    });

    for (const info of ipv4Interfaces) {
      ipAddresses.push({
        name,
        address: info.address,
        netmask: info.netmask
      });
    }
  }

  return ipAddresses;
}

// Créer une interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Afficher les adresses IP disponibles
const availableIPs = getAvailableIPs();
console.log('\nAdresses IP disponibles:');
availableIPs.forEach((ip, index) => {
  console.log(`${index + 1}. ${ip.name}: ${ip.address}`);
});

// Demander à l'utilisateur de choisir une adresse IP
rl.question('\nChoisissez le numéro de l\'adresse IP à utiliser (ou appuyez sur Entrée pour utiliser localhost): ', (answer) => {
  let selectedIP = 'localhost';
  
  if (answer && !isNaN(answer) && parseInt(answer) > 0 && parseInt(answer) <= availableIPs.length) {
    const index = parseInt(answer) - 1;
    selectedIP = availableIPs[index].address;
  }
  
  console.log(`\nDémarrage d'Expo avec l'adresse IP: ${selectedIP}`);
  rl.close();
  
  try {
    // Pour Expo, on ne peut pas utiliser directement une adresse IP avec --host
    // On doit utiliser --lan pour le réseau local
    if (selectedIP === 'localhost') {
      execSync('expo start --host localhost', { stdio: 'inherit' });
    } else {
      // Définir la variable d'environnement REACT_NATIVE_PACKAGER_HOSTNAME
      // pour forcer l'utilisation de l'adresse IP spécifique
      const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: selectedIP };
      console.log(`Utilisation de l'adresse IP ${selectedIP} via REACT_NATIVE_PACKAGER_HOSTNAME`);
      execSync('expo start --lan', { stdio: 'inherit', env });
    }
  } catch (error) {
    console.error('Erreur lors du démarrage d\'Expo:', error);
  }
});
