# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Supabase integration (without auth)

This project is already wired to Supabase with a simple connection smoke test.

### 1) Create local environment file

Create a `.env` file in the project root and copy values from `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

You can find these values in Supabase: Project Settings > API.

### 2) Where integration lives

- Supabase client: `lib/supabase.ts`
- Connection test screen: `app/(tabs)/index.tsx`

### 3) Run app

```bash
npm run start
```

When the app opens, the Home screen runs a no-auth connection check and shows the HTTP status.

## SQL Arena MVP (Supabase)

This repository now includes a first playable SQL-RPG test surface in `app/(tabs)/arena.tsx`.

### What it does

- Loads challenges from `public.challenges`
- Accepts only `SELECT` queries on the client side
- Sends the attempt to Supabase Edge Function `submit-sql`
- Displays hit/critical/xp style game feedback
- Includes `Cevaplar` tab where challenge SQL answers can be selected and copied
- Saves arena results locally and provides an `İstatistikler` tab showing totals (requires @react-native-async-storage/async-storage)

### Supabase bootstrap

Run the SQL file below in Supabase SQL Editor to create seed tables and initial challenge data:

```bash
scripts/sql-rpg-supabase.sql
```

### Edge function contract

The app expects an Edge Function named `submit-sql`:

Function source is included at:

```bash
supabase/functions/submit-sql/index.ts
```

Deploy command:

```bash
supabase functions deploy submit-sql
```

Request body:

```json
{ "challengeId": 1, "sql": "SELECT * FROM goblins ORDER BY hp ASC LIMIT 1" }
```

Response body:

```json
{
  "success": true,
  "feedback": "Dogru sonuc, gobline hasar verdin.",
  "damage": 35,
  "critical": true,
  "xpAwarded": 20
}
```

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
