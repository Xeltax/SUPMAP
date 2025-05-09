import React from 'react';
import { Text, Box, useColorModeValue } from "@chakra-ui/react";

interface GuidanceInstructionProps {
    instruction: string;
    className?: string;
}

const GuidanceInstruction: React.FC<GuidanceInstructionProps> = ({ instruction, className = '' }) => {
    const textColor = useColorModeValue("gray.800", "white");
    const streetColor = useColorModeValue("gray.700", "white");
    const streetDecoration = useColorModeValue("underline", "underline");
    const roadNumberBg = useColorModeValue("orange.200", "orange.700");
    const roadNumberColor = useColorModeValue("blue.600", "blue.300");
    const exitNumberColor = useColorModeValue("green.600", "green.300");
    const roadShieldBg = useColorModeValue("gray.200", "gray.700");
    const roadShieldBorder = useColorModeValue("gray.300", "gray.600");
    const signpostBg = useColorModeValue("yellow.50", "yellow.900");
    const signpostBorder = useColorModeValue("yellow.200", "yellow.700");

    const tagStyleMap = {
        street: {
            fontWeight: "bold",
            color: streetColor,
            textDecoration: streetDecoration,
            display: "inline"
        },
        roadNumber: {
            fontWeight: "bold",
            color: roadNumberColor,
            bg: roadNumberBg,
            px: 1,
            py: 0.5,
            borderRadius: "sm",
            mx: 0.5,
            display: "inline"
        },
        roundaboutExitNumber: {
            fontWeight: "bold",
            color: exitNumberColor,
            display: "inline"
        },
        direction: {
            fontStyle: "italic",
            display: "inline"
        },
        roadShield: {
            display: "inline",
            bg: roadShieldBg,
            px: 1.5,
            py: 0.5,
            borderRadius: "md",
            mx: 0.5,
            border: "1px",
            borderColor: roadShieldBorder
        },
        exitNumber: {
            fontWeight: "bold",
            color: useColorModeValue("orange.500", "orange.300"),
            display: "inline"
        },
        signpost: {
            bg: signpostBg,
            px: 1,
            py: 0.5,
            border: "1px",
            borderColor: signpostBorder,
            borderRadius: "sm",
            display: "inline"
        }
    };

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
                type: match[1],
                content: match[2]
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
                return <Text as="span" key={index} display="inline" color={textColor}>{part.content}</Text>;
            } else {
                const style = tagStyleMap[part.type as keyof typeof tagStyleMap] || {
                    fontWeight: "bold",
                    color: useColorModeValue("blue.500", "blue.300"),
                    display: "inline"
                };

                return (
                    <Text
                        as="span"
                        key={index}
                        {...style}
                    >
                        {part.content}
                    </Text>
                );
            }
        });
    };

    return (
        <Box className={className} display="flex" alignItems="center" my={2}>
            <Text fontSize="md">
                {parseInstruction(instruction)}
            </Text>
        </Box>
    );
};

export default GuidanceInstruction;