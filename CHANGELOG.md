# Changelog

Entries types:

- `ADDED` for new features.
- `CHANGED` for changes in existing functionality.
- `DEPRECATED` for soon-to-be removed features.
- `REMOVED` for now removed features.
- `FIXED` for any bug fixes.
- `SECURITY` to invite users to upgrade in case of vulnerabilities.
- `CHORE` for maintenance tasks.

## [Unreleased]

## [1.6.1]

- MERGE : MAE main after 1.4.1 (overlay tool bar Grid props: TETRAS-IIIF/mirador-annotation-editor#278)
- FIXED : MUI 9: the overlay tool bar no longer passes Grid's legacy `item` / `xs` props, which reached the DOM. MUI 7 already ignored them, so the layout is unchanged

## [1.6.0]

- MERGE : MAE main after 1.4.1 (MUI 9 layout props, hotkey hints: TETRAS-IIIF/mirador-annotation-editor#277)
- CHANGED : Runs on mirador-video 4.3 / MUI 9. The peer range stays `mirador-video@^4.2.1`: 4.2 / MUI 7 still works
- FIXED : MUI 9: MAEV's own forms (video time range, drawing, image, network, manifest link) no longer pass Grid's legacy `item` / `xs` props, which MUI 9 sends to the DOM. MUI 7 already ignored them, so the layout is unchanged
- FIXED : MUI 9: layout props (`alignItems`, `justifyContent`, `padding`) moved into `sx` in the draft actions, the annotation form header and footer, and the unsupported-media panel; they were reaching the DOM
- FIXED : Hotkey hints in tooltips render as `<kbd>` (they rendered an unknown `<hotkey>` element)
- MERGE : MAE 1.4.1 and MAE main (draft annotations, #196 upstream fixes)
- CHANGED : Templates now come from MAE's template registry. MAEV's image, drawing and manifest-link templates are registered in it, and the template picker offers the same templates per media as before (tag stays hidden). Annotations saved by earlier versions open and save exactly as before (`__tests__/templateBackwardCompat.test.js`)
- SECURITY : The current note shown in the template merge dialog is sanitized too
- ADDED : Draft annotations (`annotations.draftMarker`): badge and Accept / Reject in the annotation list, Accept all / Reject all, editor banner; Save publishes a draft. Drafts without `maeData` open in the regular editor

- FIXED : Compatibility with Mirador 4.3 / MUI 9 (#273). Drop the `@mui/system` peer dependency so the MUI version follows Mirador's (MUI 7 for Mirador 4.2.x, MUI 9 for Mirador 4.3+)
- SECURITY : Sanitize comment-template HTML before rendering it in the merge-confirmation dialog (stored XSS) (#196)
- ADDED : Ask for confirmation before deleting an annotation, from the Delete/Backspace hotkey and the annotation list (#196)
- ADDED : Export `convertIIIFAnnoToMaeData` from the package entry point (#196)
- ADDED : `build:watch` npm script (#196)
- CHANGED : `react-redux` is now a peer dependency (`^8 || ^9`, same as Mirador) instead of being bundled (#196)
- CHANGED : Annotation template files grouped under `src/annotationForm/templates/` (`builtin/`, `examples/`, `templateComponents/`, `kit.js`, `registry.jsx`) (#196)
- CHANGED : `LocalStorageAdapter.all()` adds `maeData` to annotations not created through MAE so they are editable (#196)
- FIXED : Backspace/Delete typed in a text field no longer deletes the selected shape (#196)
- FIXED : Saga-only plugin no longer enters Mirador's Window render chain (#196)
- FIXED : `CanvasListItem` forwarded ref lost by `withTranslation()` (MUI focus warning, `t` prop leaked onto `<li>`) (#196)
- FIXED : `types` condition added to the package `exports` map (#196)
- FIXED : Wrong `toolState` / `selectedShapeId` prop types (#196)
- REMOVED : Unused `AdvancedAnnotationEditor` component (#196)

## [ 1.5.1]

- MERGE : MAE 1.3.3
- CHORE : mirador-video 4.2.1 support
- CHANGED : merge branch jerry-hotfix 

## [ 1.5.0]

- MERGE : MAE 1.3.2

## [ 1.3.1]

- CHORE : support for Mirador video 4.1.1
- SECURITY update npm deps

## [ 1.3.0]

- MERGE : MAE 1.3.0
- CHORE : support for Mirador vidéo 4.1.0

## [ 1.2.17]

- MERGE : MAE 1.2.5
- SECURITY update npm deps


## [ 1.2.16]

- MERGE : MAE 1.2.4
- SECURITY update npm deps

## [ 1.2.15]

- MERGE : MAE 1.2.3
- FIXED : exports in package.json

## [ 1.2.12 ]

- MERGE : MAE 1.2.2
- SECURITY update npm deps

## [ 1.2.11 ]

- FIXED : resize image in image template

## [ 1.2.6 - 1.2.10 ]

- MERGE : MAE 1.2.1 (Probably a breaking change, I keep 1.2.x notation here to have coherent notation between MAE and MAEV)

## [ 1.2.5 ]

- MERGE : MAE 1.1.5

## [ 1.2.4 ]

- MERGE : MAE 1.1.4

## [1.3.3 ]

- SECURITY : Update dependencies to fix vulnerabilities
- FIXED : Fix white background on generated annotation
- FIXED : Polygon tools

## [1.3.2 ]

- SECURITY : Update dependencies to fix vulnerabilities

## [ 1.3.1 ]

- SECURITY : Update dependencies to fix vulnerabilities
- REMOVED : Draftsj deps removed from package.json

## [ 1.2.3 ]

- MERGE : MAE 1.1.3

## [ 1.1.7]

- MERGE : MAE 1.1.2

## [ 1.1.6]

- MERGE : MAE 1.0.88
