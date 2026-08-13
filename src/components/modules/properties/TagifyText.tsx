import { Fragment } from 'react';

interface TagifyTextProps {
  text?: string;
  color?: string;
  tagStyle?: React.CSSProperties;
  mentionStyle?: React.CSSProperties;
}

export function TagifyText({ text = '', color = '#3b82f6', tagStyle, mentionStyle }: TagifyTextProps) {
  const parts = text.split(/(#[\w\u00C0-\u024F]+|@[\w\u00C0-\u024F]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#') && part.length > 1) {
          return <span key={i} style={{ color, ...tagStyle }}>{part}</span>;
        }
        if (part.startsWith('@') && part.length > 1) {
          return <span key={i} style={{ color, ...mentionStyle }}>{part}</span>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
