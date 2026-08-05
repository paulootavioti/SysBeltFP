import "./styles.css";

const REDES = [
  {
    nome: "LinkedIn",
    href: "https://www.linkedin.com/in/paulootavioti/",
    path: "M5.2 7.7H1.4V22h3.8V7.7ZM3.3 2A2.2 2.2 0 1 0 3.3 6.4 2.2 2.2 0 0 0 3.3 2ZM22.6 13.8c0-4.3-2.3-6.4-5.4-6.4-2.5 0-3.6 1.4-4.2 2.3v-2H9.2V22H13v-7.1c0-1.9.4-3.8 2.8-3.8 2.4 0 2.4 2.2 2.4 3.9v7h3.8l.6-8.2Z",
  },
  {
    nome: "Instagram",
    href: "https://www.instagram.com/paulootavioti/",
    path: "M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.2 2A3 3 0 0 0 4 7v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm10.5 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  },
];

// Assinatura do desenvolvedor. A marca "PO" fica entre os dois links de rede
// (no lugar onde antes havia o GitHub) — é um selo, não um link. O ano vem de
// new Date() em vez de ficar escrito no HTML, pra não envelhecer sozinho.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <p>
          Paulo Otávio
          <small>Analista de Sistemas • Full Stack</small>
        </p>
      </div>

      <nav className="site-footer-socials" aria-label="Redes sociais">
        <a
          href={REDES[0].href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={REDES[0].nome}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={REDES[0].path} />
          </svg>
        </a>

        <span className="site-footer-mark" aria-hidden="true">
          PO
        </span>

        <a
          href={REDES[1].href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={REDES[1].nome}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={REDES[1].path} />
          </svg>
        </a>
      </nav>

      <p className="site-footer-copy">© {new Date().getFullYear()} Paulo Otávio. Construído com intenção.</p>
    </footer>
  );
}
