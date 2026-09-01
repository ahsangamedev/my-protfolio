# Game Developer Portfolio

A professional scroll-based portfolio with a pixel character that walks down the sidebar as visitors explore each section.

## Preview locally

```bash
npx serve .
```

Open the URL shown in the terminal (usually http://localhost:3000).

## Sections

| Section | Content |
|---------|---------|
| **Home** | Hero intro, photo, quick stats |
| **About** | Bio, location, highlights |
| **Projects** | Game screenshots with demo/code/video links |
| **Skills** | Animated skill bars |
| **Resume** | Experience timeline + PDF download |
| **Contact** | Email + social links |

## Customize

Edit **`data/portfolio.json`** for all text, links, and image paths.

### Upload your files

| File | Path |
|------|------|
| Profile photo | `assets/images/profile/avatar.png` |
| Project screenshots | `assets/images/projects/` |
| Contact icons | `assets/images/icons/` |
| Resume PDF | `assets/resume/resume.pdf` |

Update the paths in `portfolio.json` to match your filenames.

### Contact icons

Each social link uses an image icon. In `portfolio.json`:

```json
{
  "name": "GitHub",
  "url": "https://github.com/yourusername",
  "icon": "assets/images/icons/github.png"
}
```

- Put your icons in `assets/images/icons/`
- Best size: **32×32** or **64×64** pixels (PNG or SVG)
- Replace the placeholder SVGs or point `icon` to your own file
- Add or remove entries in the `social` array as needed

## Interactive character

On desktop, a pixel character walks along the left rail as you scroll. It:

- Moves smoothly with scroll position
- Plays a walk animation while moving
- Idles with a subtle bounce when you stop
- Highlights checkpoints for each section

## Deploy free on GitHub Pages

1. Create a repo on GitHub (e.g. `portfolio`)
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Add portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
   git push -u origin main
   ```
3. Repo → **Settings** → **Pages** → deploy from `main` / root
4. Visit `https://YOUR_USERNAME.github.io/portfolio/`

No custom domain needed.

## Structure

```
├── index.html
├── css/styles.css
├── data/portfolio.json    ← your content
├── js/
│   ├── main.js            ← content + scroll logic
│   └── character.js       ← pixel character animation
└── assets/
    ├── images/profile/
    ├── images/projects/
    └── resume/
```
