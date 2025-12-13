# JpMaster Web (Next.js Version)

This is the new web application for JpMaster, built with Next.js 14 (App Router).

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy `env-example` to `.env.local` and add your Firebase API Key.
    ```bash
    cp env-example .env.local
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Vercel Deployment

Since this Next.js app is inside the `jp-master-web` folder (not the root):

1.  Go to **Vercel Dashboard** -> **Add New Project**.
2.  Select the **Japanese_Master** repository.
3.  **Important**: In **Root Directory** settings, click Edit and select `jp-master-web`.
4.  **Environment Variables**: Add all variables from `.env.local` to Vercel.
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - ...etc
5.  Click **Deploy**.
