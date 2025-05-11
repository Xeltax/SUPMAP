import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface ParsedInstructionProps {
  instruction: string;
  textStyle?: object;
  forceWhite?: boolean;
}

/**
 * Composant qui parse les instructions de navigation balisées (tagged instructions)
 * Compatible avec le format utilisé par TomTom et le web-client
 */
export const ParsedInstruction: React.FC<ParsedInstructionProps> = ({ instruction, textStyle = {}, forceWhite = false }) => {
  if (!instruction) return null;
  
  const parseInstruction = (text: string): React.ReactNode[] => {
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    const parts: { type: string; content: string }[] = [];

    let lastIndex = 0;
    let match;

    text = text.replace(/ \/ /g, '\n');

    while ((match = tagRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const rawContent = text.substring(lastIndex, match.index);
        
        parts.push({
          type: 'text',
          content: rawContent
        });
      }

      parts.push({
        type: match[1],
        content: match[2]
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const rawContent = text.substring(lastIndex);
      parts.push({
        type: 'text',
        content: rawContent
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'text') {
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
        return <Text key={index} style={textStyle}>{part.content}</Text>;
      } else {
        let style;
        if (forceWhite) {
          style = styles.whiteText;
        } else {
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
  whiteText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  street: {
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  roadNumber: {
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    paddingHorizontal: 4,
    borderRadius: 4,
    margin: 2,
  },
  exit: {
    fontWeight: 'bold',
    backgroundColor: '#FFD600',
    color: 'black',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  direction: {
    fontWeight: 'bold',
    color: '#FF5722',
  },
  signpost: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#7B1FA2',
  },
  separator: {
    height: 6,
    width: '100%',
  },
});
