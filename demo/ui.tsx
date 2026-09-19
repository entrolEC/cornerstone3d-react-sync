import { Highlight, themes } from 'prism-react-renderer';
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { COPY, type Copy, type Lang } from './copy';

/* ---------------- language ---------------- */

const LangContext = createContext<Copy>(COPY.ko);

/** Every string on the page comes from here, so the two locales can't drift. */
export const useCopy = () => useContext(LangContext);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={COPY[lang]}>{children}</LangContext.Provider>;
}

const readLang = (): Lang => {
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'ko' || stored === 'en') return stored;
  } catch {
    /* private mode — fall through to the browser's preference */
  }
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
};

export function useLang() {
  const [lang, set] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = COPY[lang].htmlLang;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* the page still works; the choice just won't stick */
    }
  }, [lang]);

  return [lang, set] as const;
}

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  return (
    <div className="langswitch" role="group" aria-label="Language">
      {(['en', 'ko'] as const).map((candidate) => (
        <button
          key={candidate}
          className="langswitch__option"
          aria-pressed={candidate === lang}
          onClick={() => onChange(candidate)}
        >
          {candidate.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

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

export function Code({ code, title, theme }: { code: string; title: string; theme: Theme }) {
  const t = useCopy().common;
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
          {copied ? t.copied : t.copy}
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
  alt = false,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: ReactNode;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`panel${alt ? ' panel--alt' : ''}`}>
      <div className="wrap">
        <header className="panel__head">
          <div className="panel__eyebrow">{eyebrow}</div>
          <h2 className="panel__title">{title}</h2>
          <p className="panel__lead">{lead}</p>
        </header>
        {children}
      </div>
    </section>
  );
}

/* ---------------- error boundary ---------------- */

/**
 * Without one of these, the naive binding in panel 2 takes the whole page
 * down with it — which is exactly what it does in a real app.
 */
export class Catch extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // React already logged it; the fallback shows the message on the page.
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

/* ---------------- stepper ---------------- */

/** Shared by panels 2 and 3 so a walkthrough always looks and works the same. */
export function Steps({
  count,
  index,
  caption,
  preparing,
  next,
  restart,
  onNext,
  onRestart,
}: {
  count: number;
  /** -1 while the panel is still setting itself up. */
  index: number;
  caption: ReactNode;
  preparing: string;
  next: string;
  restart: string;
  onNext: () => void;
  onRestart: () => void;
}) {
  const done = index === count - 1;
  return (
    <div className="steps">
      <div className="steps__dots" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`dot ${i <= index ? 'dot--on' : ''}`} />
        ))}
      </div>
      <p className="steps__caption">
        {index >= 0 ? (
          <>
            <b>{index + 1}.</b> {caption}
          </>
        ) : (
          preparing
        )}
      </p>
      <div className="steps__buttons">
        {!done && (
          <button
            className="button button--primary button--sm"
            disabled={index < 0}
            onClick={onNext}
          >
            {next}
          </button>
        )}
        {index > 0 && (
          <button className="button button--secondary button--sm" onClick={onRestart}>
            {restart}
          </button>
        )}
      </div>
    </div>
  );
}
