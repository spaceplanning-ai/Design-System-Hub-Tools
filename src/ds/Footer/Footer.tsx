import styles from './Footer.module.css'

export type FooterLink = {
  label: string
  href?: string
}

export type FooterProps = {
  copyright: string
  links?: FooterLink[]
  description?: string
}

export function Footer({ copyright, links, description }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.info}>
        <span className={styles.copyright}>{copyright}</span>
        {description != null && <span className={styles.description}>{description}</span>}
      </div>
      {links != null && links.length > 0 && (
        <nav className={styles.links} aria-label="푸터 링크">
          {links.map((link) => (
            <a
              key={link.label}
              className={styles.link}
              href={link.href ?? '#'}
              onClick={(event) => event.preventDefault()}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </footer>
  )
}
