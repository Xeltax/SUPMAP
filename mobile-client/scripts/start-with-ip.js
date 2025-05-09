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
    // Préparer la commande Expo à exécuter
    let command;
    let envVars = '';
    
    if (selectedIP === 'localhost') {
      command = 'expo start --host localhost';
    } else {
      // Définir la variable d'environnement REACT_NATIVE_PACKAGER_HOSTNAME
      envVars = `set REACT_NATIVE_PACKAGER_HOSTNAME=${selectedIP} && `;
      command = 'expo start --lan';
      console.log(`Utilisation de l'adresse IP ${selectedIP} via REACT_NATIVE_PACKAGER_HOSTNAME`);
    }
    
    // Ouvrir un nouvel invite de commande avec la commande Expo
    const fullCommand = `start cmd.exe /K "cd ${process.cwd()} && ${envVars}${command}"`;
    console.log('Ouverture d\'un nouvel invite de commande avec Expo...');
    execSync(fullCommand);
    
    console.log('Un nouvel invite de commande a été ouvert pour exécuter Expo.');
    console.log('Vous pouvez fermer cette fenêtre ou l\'utiliser pour d\'autres commandes.');
    console.log('Pour arrêter Expo, fermez simplement la nouvelle fenêtre de commande.')
  } catch (error) {
    console.error('Erreur lors du démarrage d\'Expo:', error);
  }
});
