# Jake's life dashboard

Today, week, classes, involvements, and an MBB networking tracker. Vite + React + Tailwind front end, Vercel functions in `/api`.

## Deploy (one time, about 5 minutes)

1. Go to https://vercel.com/new while signed in to the **Next Up Prospects' projects** team.
2. Click **Choose a folder to deploy** and pick this folder (`jake-life-dashboard`).
3. On the configure screen:
   - Project name: `jake-life-dashboard`
   - Framework: Vite (detected automatically)
   - Environment Variables: add `DASHBOARD_PASSCODE` with your passcode
   - Click **Deploy**
4. When it finishes, open the project, go to **Storage**, click **Create**, choose **Blob**, name it `jake-life-dashboard`, set access to **Private**, and connect it to the project for all environments. This adds `BLOB_READ_WRITE_TOKEN`.
5. Go to **Deployments**, open the menu on the latest deployment, and click **Redeploy** so the site picks up the storage.
6. Open the site, sign in with your passcode, click the gear, and add your calendar links:
   - Google Calendar: calendar.google.com > Settings > your calendar > Integrate calendar > Secret address in iCal format
   - Canvas: Calendar > Calendar Feed (bottom right)

## Two-way Google Calendar (one time, about 10 minutes)

This lets the dashboard add and delete events on your main Google Calendar.

1. Go to https://console.cloud.google.com signed in as jakegr0711@gmail.com and create a project called `Jake Dashboard`.
2. Open **APIs & Services > Library**, search for **Google Calendar API**, and click **Enable**.
3. Open **Google Auth Platform** (also called OAuth consent screen) and click **Get started**. App name: `Jake's dashboard`. Audience: **External**. Use your email for the contact fields, then **Create**.
4. Go to **Audience** and click **Publish app**. This keeps you signed in. If it stays in Testing mode, Google signs you out every 7 days.
5. Go to **Clients > Create client**. Type: **Web application**. Under **Authorized redirect URIs** add:
   `https://life-dashboard-mu-three.vercel.app/api/google/callback`
   Click **Create** and copy the **Client ID** and **Client secret**.
6. In Vercel, open the `life-dashboard` project, then **Settings > Environment Variables**. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with those values, then **Redeploy**.
7. Open the dashboard at https://life-dashboard-mu-three.vercel.app, click the gear, and click **Connect Google Calendar**. Google will say it hasn't verified the app because it's your own private app. Click **Advanced**, then **Go to Jake's dashboard**, then **Continue**.

Always open the dashboard at that exact address. Google only accepts the redirect address you registered.

## Editing

- Classes, involvements, key dates, links, and which to-do tabs show: `api/_lib/life.js`
- Networking contacts, to-dos, and calendar links are edited in the app and saved to private Blob storage.
- Sign-in pauses for 15 minutes after 5 wrong passcodes in a row.
- Change the passcode anytime: Settings > Environment Variables > `DASHBOARD_PASSCODE`, then redeploy.

## Run locally

```
npm install
npm run build
```
