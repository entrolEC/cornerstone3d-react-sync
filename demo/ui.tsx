import { Highlight, themes } from 'prism-react-renderer';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

/* ---------------- theme ---------------- */

type Theme = 'light' | 'dark';

const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  const toggle = useCallback(() => {
    const next = read() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode — the page still works, the choice just won't stick */
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}

/* ---------------- code ---------------- */

/**
 * Pulls a `// #region name` … `// #endregion` block out of a source file
 * imported with `?raw`, so a code panel can never drift from the component
 * running beside it.
 */
export function region(source: string, name: string): string {
  const match = source.match(
    new RegExp(`// #region ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// #endregion`),
  );
  return match ? match[1] : `// region "${name}" not found`;
}

export function Code({
  code,
  title,
  theme,
}: {
  code: string;
  title: string;
  theme: Theme;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="code">
      <div className="code__head">
        <span>{title}</span>
        <button
          className="code__copy"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <Highlight
        code={code}
        language="tsx"
        theme={theme === 'dark' ? themes.dracula : themes.github}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={{ ...style, backgroundColor: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="line-no">{i + 1}</span>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/* ---------------- panel shell ---------------- */

export function Panel({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="wrap">
        <div className="panel__eyebrow">{eyebrow}</div>
        <h2 className="panel__title">{title}</h2>
        <p className="panel__lead">{lead}</p>
        {children}
      </div>
    </section>
  );
}
