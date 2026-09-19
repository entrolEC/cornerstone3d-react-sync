import { getRenderingEngine } from '@cornerstonejs/core';
import { useEffect, useState } from 'react';
import { setup, renderingEngineId } from './cornerstone';
import { Breakdown } from './Breakdown';
import { Hero } from './Hero';
import { MountRace } from './MountRace';
import { LangProvider, LangSwitch, useCopy, useLang, useTheme } from './ui';

const REPO = 'https://github.com/entrolEC/react-cornerstone3d';
const NPM = 'https://www.npmjs.com/package/react-cornerstone3d';
const INSTALL = 'npm install react-cornerstone3d';

export function App() {
  const [lang, setLang] = useLang();
  return (
    <LangProvider lang={lang}>
      <Page lang={lang} onLang={setLang} />
    </LangProvider>
  );
}

function Page({ lang, onLang }: { lang: 'ko' | 'en'; onLang: (next: 'ko' | 'en') => void }) {
  const t = useCopy();
  const { theme, toggle } = useTheme();
  const [imageIds, setImageIds] = useState<string[]>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setup().then(setImageIds, (cause: Error) => setError(cause.message));
  }, []);

  useEffect(() => {
    const onResize = () => getRenderingEngine(renderingEngineId)?.resize(true, false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <>
      <nav className="navbar">
        <div className="wrap navbar__inner">
          <a className="navbar__brand" href={REPO}>
            react-cornerstone3d
          </a>
          <span className="navbar__spacer" />
          <a className="navbar__link" href="https://www.cornerstonejs.org/">
            Cornerstone3D
          </a>
          <a className="navbar__link" href={NPM}>
            npm
          </a>
          <a className="navbar__link" href={REPO}>
            GitHub
          </a>
          <LangSwitch lang={lang} onChange={onLang} />
          <button className="iconbutton" onClick={toggle} aria-label={t.nav.theme}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div className="hero__chips">
            {t.hero.chips.map((chip) => (
              <span key={chip} className="chip">
                {chip}
              </span>
            ))}
          </div>
          <h1>{t.hero.title}</h1>
          <p className="hero__sub">{t.hero.sub}</p>

          <button
            className="install"
            onClick={() => {
              void navigator.clipboard.writeText(INSTALL);
              setCopied(true);
            }}
          >
            <code>{INSTALL}</code>
            <span className="install__action">{copied ? t.common.copied : t.common.copy}</span>
          </button>

          <div className="hero__buttons">
            <a className="button button--primary" href="#demo">
              {t.hero.demo}
            </a>
            <a className="button button--secondary" href={REPO}>
              {t.hero.github}
            </a>
          </div>
        </div>
      </header>

      <main id="demo">
        {error && (
          <div className="notice">
            {t.failed} — {error}
          </div>
        )}
        {!error && !imageIds && (
          <div className="notice">
            <span className="spinner" aria-hidden /> {t.loading}
          </div>
        )}
        {imageIds && (
          <>
            <Hero imageIds={imageIds} theme={theme} />
            <Breakdown imageIds={imageIds} theme={theme} />
            <MountRace imageIds={imageIds} />
          </>
        )}
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer__links">
            <a href={REPO}>GitHub</a>
            <a href={NPM}>npm</a>
            <a href={`${REPO}/blob/main/LICENSE`}>MIT</a>
          </div>
          <p>{t.footer}</p>
        </div>
      </footer>
    </>
  );
}
