# Results — Before/After Images

This folder holds the before/after photos shown on `results.html`.

## Current files (16 placeholders — replace with real photos)

| Section          | Treatment           | Before file                       | After file                        |
|------------------|---------------------|-----------------------------------|-----------------------------------|
| Body Shaping     | Body Shaping        | `body-shaping-1-before.jpg`       | `body-shaping-1-after.jpg`        |
| Body Shaping     | Cryolipolysis       | `body-shaping-2-before.jpg`       | `body-shaping-2-after.jpg`        |
| Facial           | Lip Fillers         | `lip-fillers-1-before.jpg`        | `lip-fillers-1-after.jpg`         |
| Facial           | Botox               | `botox-1-before.jpg`              | `botox-1-after.jpg`               |
| Facial           | Hydrafacial         | `hydrafacial-1-before.jpg`        | `hydrafacial-1-after.jpg`         |
| Facial           | Cheek & Jaw Filler  | `cheek-filler-1-before.jpg`       | `cheek-filler-1-after.jpg`        |
| Hair             | FUE Transplant      | `fue-transplant-1-before.jpg`     | `fue-transplant-1-after.jpg`      |
| Hair             | PRP Therapy         | `prp-hair-1-before.jpg`           | `prp-hair-1-after.jpg`            |

## How to replace an image

1. Take/select your real client photo (with consent!)
2. Crop both **before** and **after** to the **same dimensions** (ideally 4:3, e.g. 1200×900 px)
3. Save as JPG at 80% quality (target ~150KB per file)
4. Name it to match exactly: e.g. `lip-fillers-1-before.jpg`
5. Drop it into this folder, overwriting the placeholder
6. Refresh `results.html` — that's it

## Important rules

- **Same dimensions** — Before and After of the same pair MUST be the same width and height, otherwise the slider will misalign
- **Same framing** — same crop, same distance, same angle. Patients should be in the same pose with the same lighting if possible
- **JPG or WebP** — both work. WebP is smaller but JPG has wider compatibility
- **No identifiable patient info** unless you have written consent (face visible, distinctive jewelry, etc.)

## Adding a new pair beyond the 8 current ones

1. Save two new images in this folder: `your-slug-before.jpg` and `your-slug-after.jpg`
2. Open `/results.html` and copy one of the existing slider blocks (a `<div class="fade-up">…</div>`)
3. Change the image filenames in both `<img>` tags
4. Change the caption text (meta, quote, author)
5. For full bilingual support, add the new strings to `assets/js/i18n.js` under both `en:` and `ar:` blocks
