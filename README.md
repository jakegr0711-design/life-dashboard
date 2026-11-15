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

## Editing

- Classes, involvements, key dates, links: `api/_lib/life.js`
- Networking contacts, to-dos, and calendar links are edited in the app and saved to private Blob storage.
- Change the passcode anytime: Settings > Environment Variables > `DASHBOARD_PASSCODE`, then redeploy.

## Run locally

```
npm install
npm run build
```
