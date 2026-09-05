# Running Hollywood Clinic Locally

You **must** run this through a local HTTP server. Just double-clicking `index.html` will break the blog and review system because browsers block `fetch()` calls on `file://` URLs.

## Easiest way: Double-click the launcher

### Windows
Double-click **`start-server.bat`** in the project folder.

Your default browser will open at `http://localhost:8000` showing the site.

### Mac / Linux
Open Terminal in the project folder and run:

```bash
./start-server.sh
```

Or double-click `start-server.sh` if your file manager allows executing shell scripts.

---

## What if it says "No server tool detected"?

Install **Python** — it's the simplest. Most Windows 10/11 systems already have it.

### Windows installation
1. Go to https://www.python.org/downloads/
2. Click the big yellow **Download Python** button
3. Run the installer
4. **⚠️ CHECK** the box that says **"Add Python to PATH"** at the bottom of the installer (very important!)
5. Click **Install Now**
6. Once finished, double-click `start-server.bat` again — it will work

---

## How to stop the server

Click on the black terminal window that opened, then press **`Ctrl + C`**.

Or just close that window.

---

## Editing the site

1. Open the project folder in **VS Code** (or any editor)
2. Make your changes to any file
3. **Save** the file
4. Switch to your browser tab
5. Hard refresh: **`Ctrl + Shift + R`** (Windows) or **`Cmd + Shift + R`** (Mac)
6. You'll see your changes immediately — no GitHub push needed for local testing

---

## VS Code Live Server alternative (no batch file needed)

If you're already using VS Code:

1. Open the **Extensions** panel (`Ctrl + Shift + X`)
2. Search for **"Live Server"** by Ritwick Dey
3. Install it
4. Right-click on `index.html` in the file tree
5. Click **"Open with Live Server"**

Live Server auto-refreshes the browser whenever you save a file — even better than the batch file for active development.

---

## When you're ready to deploy

After testing locally and everything looks good:

```bash
git add .
git commit -m "Describe your changes here"
git push
```

GitHub Pages will rebuild your live site within ~1 minute.

---

## Troubleshooting

**Server starts but page is blank / images missing:** Check the browser's developer console (`F12`). If you see `404` errors, you may have started the server from the wrong folder. Always run the launcher from inside the project folder (where `index.html` is).

**"Port 8000 is already in use":** Another program is using port 8000. Close any other local servers, or edit `start-server.bat` and change `8000` to `8080`.

**Browser shows old version after changes:** Hard refresh with `Ctrl + Shift + R`. If that doesn't work, open the site in an Incognito window.
