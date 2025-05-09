import React from 'react';
import styles from '../styles/GuidanceInstruction.module.css';

interface GuidanceInstructionProps {
    instruction: string;
    className?: string;
}

const GuidanceInstruction: React.FC<GuidanceInstructionProps> = ({ instruction, className = '' }) => {
    const parseInstruction = (text: string): JSX.Element[] => {
        const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
        const parts: { type: string; content: string }[] = [];

        let lastIndex = 0;
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index)
                });
            }

            parts.push({
                type: match[1], // Le type de balise (street, roadNumber, etc.)
                content: match[2] // Le contenu à l'intérieur de la balise
            });

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex)
            });
        }

        return parts.map((part, index) => {
            if (part.type === 'text') {
                return <React.Fragment key={index}>{part.content}</React.Fragment>;
            } else {
                return (
                    <span key={index} className={styles[`guidance-${part.type}`] || styles.highlight}>
            {part.content}
          </span>
                );
            }
        });
    };

    return (
        <div className={`${styles.guidanceInstruction} ${className}`}>
            {parseInstruction(instruction)}
        </div>
    );
};

export default GuidanceInstruction;