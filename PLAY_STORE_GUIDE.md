
# Guide: Packaging for the Google Play Store with Bubblewrap

This guide will walk you through the process of taking your Progressive Web App (PWA) and packaging it as an Android App Bundle (AAB) for submission to the Google Play Store using a Trusted Web Activity (TWA).

A TWA allows your web app to run in a fullscreen, chromeless browser, giving it a native look and feel.

### Prerequisites

1.  **Node.js and npm:** You must have Node.js (which includes npm) installed on your system.
2.  **Deployed PWA:** Your app must be deployed to a live, HTTPS-enabled URL (e.g., your Vercel URL). The Play Store needs to access it to verify ownership.
3.  **Java Development Kit (JDK):** Bubblewrap requires the JDK to build the Android app. You can download it from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use a package manager like `brew` or `apt`.

---

### Step 1: Install Bubblewrap

Bubblewrap is a command-line tool from Google that simplifies the TWA creation process. Install it globally using npm:

```bash
npm install -g @bubblewrap/cli
```

---

### Step 2: Initialize Your Project

Navigate to your project's root directory in your terminal and run the `init` command. Bubblewrap will ask you a series of questions to configure your Android app.

```bash
bubblewrap init --manifest https://YOUR_VERCEL_URL/manifest.json
```

**Replace `https://YOUR_VERCEL_URL` with your actual deployed app URL.**

Bubblewrap will ask you for the following information (defaults are often fine):

*   **Domain:** (e.g., `your-app-name.vercel.app`) - Auto-detected from your manifest.
*   **App Name:** (e.g., `Tha Booth`) - Auto-detected.
*   **Launcher Name:** (e.g., `Tha Booth`) - The name that appears under the icon.
*   **Package ID:** (e.g., `app.vercel.your_app_name.twa`) - A unique identifier for your app. The default is usually okay.
*   **Display Mode:** (e.g., `standalone`) - Auto-detected.
*   **Signing Key Information:** You will be asked to create or provide a signing key. For a new app, choose the default to create a new one and set a password. **Remember this password! You will need it to update your app.**

---

### Step 3: Generate and Update `assetlinks.json`

After the `init` command finishes, Bubblewrap will generate a file named `assetlinks.json` in your project directory. This file proves you own the website.

1.  **Copy the Contents:** Open the newly generated `assetlinks.json` and copy its entire contents.

2.  **Paste into Project:** Open `public/.well-known/assetlinks.json` in your project and **replace the placeholder content** with the content you just copied.

3.  **Deploy:** Commit and push this change to your repository. Vercel will redeploy your site with the updated `assetlinks.json` file. This is a critical step; Google must be able to access this file at `https://YOUR_VERCEL_URL/.well-known/assetlinks.json`.

---

### Step 4: Build the Android App Bundle

Once your site is redeployed with the correct `assetlinks.json`, run the build command:

```bash
bubblewrap build
```

This will create a file named **`app-release-bundle.aab`**. This is the Android App Bundle you will upload to the Google Play Console. It will also create a signed APK (`app-release-signed.apk`) which you can use for testing on a physical device.

---

### Step 5: Upload to Google Play Console

1.  Go to the [Google Play Console](https://play.google.com/console).
2.  Create a new app.
3.  Fill out all the required store listing information (app name, descriptions, screenshots, privacy policy, etc.).
4.  Go to the "Production" tab and create a new release.
5.  Upload the **`app-release-bundle.aab`** file.
6.  Follow the on-screen instructions to review and roll out your release.

Congratulations! You've successfully packaged and prepared your PWA for the Google Play Store.
