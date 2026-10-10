import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Oddiy va yengil matn bo'laklarini tahlil qilish
  const renderFormattedText = (text: string): React.ReactNode[] => {
    // Bold: **text** yoki __text__
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ fontWeight: 700, color: '#0F172A' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            style={{
              background: '#F1F5F9',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.85em',
              fontFamily: 'monospace',
              color: '#DC2626',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');

  return (
    <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'inherit' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Bo'sh qator
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        // Sarlavha ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ fontSize: '1.05rem', fontWeight: 700, margin: '10px 0 6px', color: '#0F172A' }}>
              {renderFormattedText(trimmed.replace('### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} style={{ fontSize: '1.15rem', fontWeight: 800, margin: '12px 0 8px', color: '#0F172A' }}>
              {renderFormattedText(trimmed.replace('## ', ''))}
            </h3>
          );
        }

        // Ro'yxat elementi: - yoki * yoki raqamli 1.
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginLeft: '4px', marginBottom: '4px' }}>
              <span style={{ color: '#DC2626', fontWeight: 700, lineHeight: 1.5 }}>•</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (orderedMatch) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginLeft: '4px', marginBottom: '4px' }}>
              <span style={{ color: '#DC2626', fontWeight: 700, minWidth: '18px' }}>{orderedMatch[1]}.</span>
              <div>{renderFormattedText(orderedMatch[2])}</div>
            </div>
          );
        }

        // Sitata: >
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              style={{
                borderLeft: '3px solid #DC2626',
                margin: '8px 0',
                paddingLeft: '12px',
                color: '#64748B',
                fontStyle: 'italic',
              }}
            >
              {renderFormattedText(trimmed.replace('> ', ''))}
            </blockquote>
          );
        }

        // Oddiy paragraf
        return (
          <p key={idx} style={{ margin: '0 0 6px' }}>
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}
