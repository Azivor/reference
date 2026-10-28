# Reference

An image-first reference gallery.

Public site: https://azivor.github.io/reference/


## Experience

The browsing model follows the Watch Face Gallery: move vertically through categories, then horizontally through images within each category. Select a category to see its complete image grid. Breadcrumbs and a Filter menu connect the broader subject groups and their collections.

Images open in a full-screen viewer with previous/next navigation, save, source attribution, and automatically visible design notes and image details. Mobile and touch viewers give the image the full width, with no side-arrow gutters. Previous/next controls remain available to assistive technology and appear only when keyboard-focused. Swipe or drag horizontally on the full-screen image to move between references; vertical scrolling and pinch zoom remain native. The transition follows the gesture, settles onto the adjacent image. Quick search is available through the search button, `/`, or Command/Ctrl-K. Saved selections persist on the current browser/device and stay consistent across open tabs; they do not synchronize across devices. Search includes the visual image descriptions as well as titles and design notes.

Navigation uses shared control sizes, an SVG icon family, keyboard focus states, anchored menus, and restrained opening/closing transitions. Horizontal rows support trackpads, touch, mouse drag, arrow keys, and aligned paging controls. Soft edge fades appear only where more images remain. Mobile rows snap to complete images, cap wide cards to the available screen width, and advance one image per arrow press. Mobile controls use 44-pixel targets and vector icons that cannot switch to emoji rendering. Each visit starts with the system color scheme. The header sun/moon button switches directly between light and dark for that visit, without a menu. Full animations are always enabled, including when the device requests reduced motion. Row buttons use a cancellable animation instead of platform-dependent native smooth scrolling. Menu chevrons and bookmark feedback acknowledge state changes without cropping the artwork. Rapid row presses retain their intended destination, and Saved preserves keyboard focus when an image is removed.

## Curation

References prioritize recognizable company art direction: official advertising, cinematic launch artwork, and branded campaign applications. Attribution alone does not make a customer photograph or generated showcase a brand reference. The user-approved Claude collection and spaceflight photo book are retained as explicit selections. Selectivity takes priority over matching image counts across companies.

## Structure

- `dist/`: complete buildless static website.
- `dist/collections.json`: broader groups and their collections. Add future subjects here without creating new UI templates.
- `data/references.json`: editable credited source records.
- `dist/library.json`: generated shared image metadata.
- `dist/assets/originals/`: retained reference source files.
- `dist/assets/images/`: high-quality, aspect-preserving viewer images.
- `dist/assets/previews/`: gallery-sized WebP images.
- `scripts/import-images.py`: import and preview preparation; requires Pillow.

Serve `dist/` with a static HTTP server. No dependency installation or build is needed. Run `python3 scripts/import-images.py` after editing source records; retained originals are reused. The importer also refreshes content-based entry-point revisions so published reference updates do not reuse an older browser-cached collection.

This site is public; its noindex metadata is a search-engine request, not access control. The public GitHub Pages site uses Google Analytics through the shared Azivor property (`G-7E6HW5VEPF`). Tracking activates only on `azivor.github.io`; local previews and the owner-private Sites deployment do not send traffic. Reports distinguish gallery visits by the `/reference/` page path. Images remain locally hosted, with no third-party image loading. Reference images and their original sources remain credited to their respective creators. Design notes are independent visual observations, not statements of internal brand strategy. Dates appear only when verified.


## GitHub Pages publication

This repository publishes `dist/` to https://azivor.github.io/reference/. The workflow tests navigation and deploys on pushes to `main`. All app, font, image, and data paths are relative, so the gallery works under `/reference/` without URL rewriting.

## Image delivery

The importer retains untouched originals and produces 480 px / 960 px previews plus 1440 px / 2560 px viewer images. Cards and search use responsive preview sources; the viewer chooses a size for the display and warms the adjacent images after the current image finishes. Adjacent-image loading is skipped when the browser reports data saving or a 2G connection. The first three gallery images load eagerly. Generated image URLs include their encoding settings so a release does not reuse an older encoding from cache.

For the 90-image collection on 2026-10-27, large preview bytes decreased from 11.76 MB to 5.37 MB (54%); the small-preview set totals 1.25 MB (89% below the previous preview set). Full-size viewer bytes decreased from 49.42 MB to 36.90 MB (25%). These are asset-size measurements, not measured page-load speedups. Original source files are preserved.
