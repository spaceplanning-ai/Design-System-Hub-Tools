import { useState } from 'react';
import {
  Header,
  Button,
  IconButton,
  Icon,
  Text,
  Badge,
  Card,
  Input,
  FormField,
  Switch,
  Tabs,
  Alert,
  Avatar,
  Divider,
} from './components';
import { componentMetas } from './components/metas';
import './App.css';

type Theme = 'light' | 'dark';

export function App() {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const counts = {
    atoms: componentMetas.filter((m) => m.category === 'atom').length,
    molecules: componentMetas.filter((m) => m.category === 'molecule').length,
    organisms: componentMetas.filter((m) => m.category === 'organism').length,
  };

  return (
    <div className="app">
      <Header
        sticky
        brand={
          <>
            <Icon name="star" filled color="var(--tds-color-brand-solid)" /> TDS
          </>
        }
        nav={
          <>
            <Button variant="ghost" tone="neutral" size="sm">
              Foundations
            </Button>
            <Button variant="ghost" tone="neutral" size="sm">
              Components
            </Button>
            <Button variant="ghost" tone="neutral" size="sm">
              Figma
            </Button>
          </>
        }
        actions={
          <>
            <IconButton
              label="Toggle theme"
              icon={<Icon name={theme === 'light' ? 'moon' : 'sun'} size="sm" />}
              onClick={toggleTheme}
            />
            <Avatar name="Sohyun B" size="sm" />
          </>
        }
      />

      <main className="app__main">
        <section className="app__hero">
          <Badge tone="brand" variant="soft" dot>
            Metadata-driven
          </Badge>
          <Text variant="display" as="h1">
            One source of truth for React, Storybook &amp; Figma
          </Text>
          <Text variant="bodyLg" tone="muted">
            {counts.atoms} atoms · {counts.molecules} molecules · {counts.organisms} organisms — every
            component self-describes its variants and tokens so a Figma plugin can regenerate the whole
            system.
          </Text>
          <div className="app__hero-actions">
            <Button iconEnd={<Icon name="arrow-right" size="sm" />}>Get started</Button>
            <Button variant="outline" tone="neutral" iconStart={<Icon name="external-link" size="sm" />}>
              Open Storybook
            </Button>
          </div>
        </section>

        <Divider label="Live components" />

        <section className="app__grid">
          <Card>
            <Card.Header title="Sign in" subtitle="Access your workspace" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
                <FormField label="Email">
                  <Input placeholder="you@example.com" iconStart={<Icon name="mail" size="sm" />} />
                </FormField>
                <FormField label="Password">
                  <Input type="password" placeholder="••••••••" iconStart={<Icon name="lock" size="sm" />} />
                </FormField>
                <Switch defaultChecked>Remember me</Switch>
              </div>
            </Card.Body>
            <Card.Footer>
              <Button fullWidth>Sign in</Button>
            </Card.Footer>
          </Card>

          <div className="app__stack">
            <Alert tone="success" title="Tokens generated" closable>
              258+ tokens exported to CSS variables and a Figma-ready JSON.
            </Alert>
            <Card variant="outlined">
              <Card.Body>
                <Tabs defaultValue="react">
                  <Tabs.List aria-label="Targets">
                    <Tabs.Tab value="react">React</Tabs.Tab>
                    <Tabs.Tab value="storybook">Storybook</Tabs.Tab>
                    <Tabs.Tab value="figma">Figma</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="react">
                    <Text tone="muted">Token-driven components with a variant-based architecture.</Text>
                  </Tabs.Panel>
                  <Tabs.Panel value="storybook">
                    <Text tone="muted">Controls, autodocs and a11y derived from component metadata.</Text>
                  </Tabs.Panel>
                  <Tabs.Panel value="figma">
                    <Text tone="muted">A manifest a plugin turns into Variables, Styles and Component Sets.</Text>
                  </Tabs.Panel>
                </Tabs>
              </Card.Body>
            </Card>
            <div className="app__tones">
              {(['brand', 'success', 'warning', 'danger', 'neutral'] as const).map((t) => (
                <Button key={t} tone={t} size="sm">
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="app__footer">
        <Text variant="bodySm" tone="subtle">
          TDS — run <code>npm run storybook</code> for full documentation · <code>npm run ds:build</code> to
          regenerate tokens &amp; the Figma manifest.
        </Text>
      </footer>
    </div>
  );
}
