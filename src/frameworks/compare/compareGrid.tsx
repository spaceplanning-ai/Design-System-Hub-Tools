import type { ReactElement } from 'react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { formSkinCss } from '../../shared/formSkin'
import * as bootstrap from '../bootstrap/showcase'
import * as bulma from '../bulma/showcase'
import * as foundation from '../foundation/showcase'
import * as materialize from '../materialize/showcase'
import * as semanticUi from '../semantic-ui/showcase'
import * as skeleton from '../skeleton/showcase'
import * as tailwind from '../tailwind/showcase'

export type CompareComponent = 'Button' | 'Alert' | 'Card' | 'Form' | 'Navbar'

type Showcase = {
  css: string
  rootClassName?: string
  ButtonShowcase: () => ReactElement
  AlertShowcase: () => ReactElement
  CardShowcase: () => ReactElement
  FormShowcase: () => ReactElement
  NavbarShowcase: () => ReactElement
}

// 각 셀은 해당 프레임워크 CSS만 담은 독립 Shadow DOM(FrameworkScope)이라 충돌이 없다.
const FRAMEWORKS: { name: string; mod: Showcase }[] = [
  { name: 'Bootstrap', mod: bootstrap },
  { name: 'Bulma', mod: bulma },
  { name: 'Foundation', mod: foundation },
  { name: 'Materialize', mod: materialize },
  { name: 'Semantic UI', mod: semanticUi },
  { name: 'Skeleton', mod: skeleton },
  { name: 'Tailwind', mod: tailwind },
]

const PICK: Record<CompareComponent, (m: Showcase) => () => ReactElement> = {
  Button: (m) => m.ButtonShowcase,
  Alert: (m) => m.AlertShowcase,
  Card: (m) => m.CardShowcase,
  Form: (m) => m.FormShowcase,
  Navbar: (m) => m.NavbarShowcase,
}

export function CompareGrid({ component }: { component: CompareComponent }) {
  return (
    <SheetCanvas>
      {FRAMEWORKS.map(({ name, mod }) => {
        const Piece = PICK[component](mod)
        return (
          <SheetCard key={name} title={name}>
            <FrameworkScope styles={[mod.css, formSkinCss]} rootClassName={mod.rootClassName}>
              <Piece />
            </FrameworkScope>
          </SheetCard>
        )
      })}
    </SheetCanvas>
  )
}
