# Visual thesis — the checkpoint workbench

## Direction and rationale

Code Lesson Checkpoints is a **paper-cut diorama**, not a browser IDE. A coding lesson is shown as a small, learner-built path of layered paper steps: each run leaves one finite artifact that can be held up, inspected, and answered without taking control. The handmade edges make the experience feel pedagogical and human; the precise utility type, status stamps, and straight timeline keep it trustworthy as a development tool.

The application is deliberately single-mode, painted as warm desk paper. This avoids theme-dependent status ambiguity during screen sharing and gives the generated diorama a coherent world. Depth survives without animation through outlines, offset shadows, overlaps, and scale.

## Palette

All colors are opaque tokens; there is no gradient.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#F7F1E3` | page background, warm lesson paper |
| `paper-raised` | `#FFFDF7` | focused work surfaces |
| `ink` | `#202820` | primary text and strong rules |
| `ink-muted` | `#586258` | secondary copy (≥ 4.5:1 on paper) |
| `moss` | `#285B45` | primary action and focus |
| `moss-dark` | `#173D2D` | pressed state / deep layer |
| `sun` | `#E9B949` | selected paper tabs and waiting states |
| `clay` | `#B84A32` | errors and blocked checkpoints |
| `sky` | `#34708E` | informational and instructor response |
| `leaf` | `#397052` | passed checkpoint stamp |
| `line` | `#C8C1B0` | separators and form boundaries |

Status always includes an icon and word (`Passed`, `Blocked`, `Not run`), never color alone. White text appears only on moss/dark clay surfaces at accessible contrast.

## Type

- **Fraunces**, self-hosted variable serif, for the single display voice: wordmark, page title, and large numerals. Its soft, cut-paper shapes suggest a tutor’s annotated workbook.
- **Atkinson Hyperlegible**, self-hosted regular/bold, for body, controls, tables, and code-adjacent metadata. It was designed for character distinction, appropriate for fast scanning and learners with low vision.
- Native monospace (`ui-monospace, SFMono-Regular, Consolas`) for commands and selected output. Numeric data uses tabular figures.
- Scale: 14 metadata, 16 body, 20 section, 28 card title, `clamp(40, 7vw, 72)` page title. Body leading 1.55; readable copy measure 68ch.

## Spacing and shape

- 4 px base unit; main rhythm 8 / 12 / 16 / 24 / 32 / 48 / 72.
- Interactive targets are at least 44 px, adjacent targets at least 8 px apart.
- Page max width 1200 px. Desktop workspace uses a 300 px lesson rail and a fluid timeline; at ≤780 px it becomes one stack and low-priority descriptions disappear.
- Corners are modest (6–18 px) and intentionally uneven between layers. Paper layers use 1–2 px ink rules plus 4–8 px hard offset shadows—never floating blur cards.

## Interaction grammar

- Primary actions are solid moss “paper labels”; secondary actions are underlined or outlined.
- A checkpoint is a folded strip on a vertical lesson path. Opening it reveals the command, evidence, learner note, and instructor reply in that order.
- Running is learner-owned: the UI copies the command, then accepts locally produced status/output. It never executes arbitrary shell commands on the server.
- Consent is explicit at share time. Output is previewed after local redaction and trimming; source files are never requested.
- Teacher and learner views use the same record with role-specific verbs. Keyboard users traverse lesson tabs, checkpoint controls, dialogs, and forms in document order.
- Feedback appears inline in a polite live region. Destructive lesson deletion requires a named confirmation; submission deletion offers a short undo window.

## Motion policy

- 180 ms ease-out for button press and disclosure opacity; 240 ms cubic-bezier(0.2, 0.8, 0.2, 1) for paper layers entering from their owning control.
- The active timeline marker moves only when evidence changes; there are no loops, parallax, or decorative animation.
- Under `prefers-reduced-motion: reduce`, movement and smooth scrolling are removed; state changes use instant opacity and persistent outline/depth cues.

## Asset plan and prompt sheet

One generated landscape hero, displayed beside the public product explanation and reused as a small empty-state crop. It depicts a tabletop paper theatre where a learner’s terminal slip crosses three checkpoint stepping stones toward a tutor’s reply flag. It explains asynchronous evidence without depicting screen surveillance or invented functionality. Small interface marks (check, terminal, lock, reply, copy) are original inline SVG or CSS shapes, not generated raster icons.

**Generation spec**

- Use case: `stylized-concept`
- Asset type: responsive landing-page hero illustration
- Subject: an isometric miniature paper-cut coding lesson path; three layered checkpoint stepping stones, one tiny terminal-output slip with abstract code-like marks, and a reply flag at the far end; no people
- World/materials: handmade matte cardstock, deckled cut edges, folded tabs, subtle paper fibres, tabletop diorama
- Composition: landscape 3:2; central winding path; generous clear warm-paper margin; readable at 390 px; no UI screenshot
- Light/lens: soft directional desk-lamp light from upper left, shallow physical shadows, orthographic/isometric view, calm and tactile
- Palette words: warm oat paper, deep moss, mustard sun, brick clay, muted blue, charcoal ink
- Negative list: no readable text, letters, logos, watermark, brands, people, hands, photoreal computer, glossy 3D plastic, neon, gradients, surveillance camera, remote-control imagery

**Provenance**

- Generated specifically for this product with Azure OpenAI deployment `factory-image` via `/opt/fleet/lib/gen-image.sh` on 2026-08-28.
- Prompt is recorded verbatim in `assets/src/hero-paper-path.json`; generated output is original project artwork. No third-party visual assets are used.
- Production derivatives are encoded locally as WebP/AVIF with a PNG source retained for provenance and review.
- The 1200×630 social card is a center crop of the same original artwork. The 180 px touch icon is rendered from the hand-authored project favicon.
