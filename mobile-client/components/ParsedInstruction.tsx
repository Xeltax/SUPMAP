import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface ParsedInstructionProps {
  instruction: string;
  textStyle?: object;
}

/**
 * Composant qui parse les instructions de navigation balisées (tagged instructions)
 * Compatible avec le format utilisé par TomTom et le web-client
 */
export const ParsedInstruction: React.FC<ParsedInstructionProps> = ({ instruction, textStyle = {} }) => {
  // Si l'instruction est vide, retourner null
  if (!instruction) return null;
  
  const parseInstruction = (text: string): React.ReactNode[] => {
    // Même regex que dans le web-client pour détecter les balises
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    const parts: { type: string; content: string }[] = [];

    let lastIndex = 0;
    let match;

    // Prétraiter le texte pour enlever les barres obliques isolées
    text = text.replace(/ \/ /g, '\n'); // Remplacer les '/' isolés par des sauts de ligne

    // Analyser toutes les balises dans le texte
    while ((match = tagRegex.exec(text)) !== null) {
      // Ajouter le texte avant la balise actuelle
      if (match.index > lastIndex) {
        const rawContent = text.substring(lastIndex, match.index);
        
        parts.push({
          type: 'text',
          content: rawContent
        });
      }

      // Ajouter la partie balisée
      parts.push({
        type: match[1], // Le type de balise (street, roadNumber, etc.)
        content: match[2] // Le contenu à l'intérieur de la balise
      });

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le texte restant après la dernière balise
    if (lastIndex < text.length) {
      const rawContent = text.substring(lastIndex);
      parts.push({
        type: 'text',
        content: rawContent
      });
    }

    // Convertir les parties analysées en éléments React Native
    return parts.map((part, index) => {
      if (part.type === 'text') {
        // Traiter les sauts de ligne dans le texte
        if (part.content.includes('\n')) {
          const lines = part.content.split('\n');
          return (
            <React.Fragment key={index}>
              {lines.map((line, i) => (
                <React.Fragment key={`${index}-${i}`}>
                  {i > 0 && <View style={styles.separator} />}
                  <Text style={textStyle}>{line.trim()}</Text>
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
        // Texte normal sans saut de ligne
        return <Text key={index} style={textStyle}>{part.content}</Text>;
      } else {
        // Texte mis en évidence selon le type de balise
        let style;
        switch (part.type) {
          case 'street':
            style = styles.street;
            break;
          case 'roadNumber':
            style = styles.roadNumber;
            break;
          case 'exit':
            style = styles.exit;
            break;
          case 'direction':
            style = styles.direction;
            break;
          case 'signpost':
            style = styles.signpost;
            break;
          default:
            style = styles.highlight;
        }
        
        return (
          <Text key={index} style={[textStyle, style]}>
            {part.content}
          </Text>
        );
      }
    });
  };

  return (
    <>
      {parseInstruction(instruction)}
    </>
  );
};

const styles = StyleSheet.create({
  highlight: {
    fontWeight: 'bold',
  },
  street: {
    fontWeight: 'bold',
    color: '#3F51B5', // Bleu pour les noms de rues
  },
  roadNumber: {
    fontWeight: 'bold',
    backgroundColor: '#4CAF50', // Vert pour les numéros de routes
    color: 'white',
    paddingHorizontal: 4,
    borderRadius: 4,
    margin: 2,
  },
  exit: {
    fontWeight: 'bold',
    backgroundColor: '#FFD600', // Jaune pour les sorties
    color: 'black',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  direction: {
    fontWeight: 'bold',
    color: '#FF5722', // Orange pour les directions
  },
  signpost: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#7B1FA2', // Violet pour les panneaux
  },
  separator: {
    height: 6, // Espace vertical entre les éléments
    width: '100%',
  },
});
