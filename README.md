# GymWise

A simple, mobile-first web app for planning and tracking gym training.

- **Email sign-in, no passwords.** Users enter their email and get a 6-digit code.
- **A personal training plan.** A 5-step questionnaire (body stats, goal, experience, days/time available, equipment, injuries, lifestyle, diet) produces a plan based on proven programs:
  | Days/week | Split | Based on |
  |---|---|---|
  | 2 | Full Body A/B | Starting Strength / StrongLifts |
  | 3 | Full Body A/B/C | StrongLifts 5×5, GZCLP |
  | 4 | Upper/Lower | PHUL |
  | 5 | Upper/Lower + Push/Pull/Legs | PHAT-style hybrid |
  | 6 | Push/Pull/Legs ×2 | Reddit PPL |

  Sets, reps and rest follow the goal (strength, muscle, fat loss or fitness) and experience level. Exercises are picked to suit the available equipment (full gym, dumbbells or bodyweight), and exercises that load an injured area are left out or swapped for safer options. The number of exercises fits the session length.
- **Injury-aware.** Users mark injured or painful areas (neck, shoulders, elbows, wrists, lower back, hips, knees, ankles) during setup or any time via "Injured or in pain?". Users can also describe the injury in their own words ("tennis elbow, gripping hurts", "meniscus surgery 3 months ago"): with `ANTHROPIC_API_KEY` set, Claude reads it and returns the affected areas, specific exercises to avoid, a short summary, training tips and a see-a-professional flag (`src/lib/injury-analysis.ts`); without a key, a built-in parser recognises common injury terms. A description can only add restrictions, never remove them. Every exercise the planner uses is tagged with the joints it loads (`src/lib/injuries.ts`), and the rest of the library is screened with cautious keyword rules. Plans, swaps and "Change all exercises" only use safe exercises; updating injuries adjusts the current plan (keeping the user's own edits) and lists what changed; the library and exercise pages warn about exercises that may aggravate an injury.
- **Make the plan your own.** Tap any exercise to swap it (recommended alternatives for the same movement, or anything in the library), change its sets/reps/rest, reorder or remove it, or add exercises to a day. "Change all exercises" swaps a whole day for similar exercises in one tap (also on the Today screen). Swap exercises mid-workout when equipment is busy. "Change plan" offers fresh exercises (same main lifts) or a different split for the same number of days, e.g. Push/Pull/Legs instead of Full Body.
- **Nutrition plan.** Calories (Mifflin-St Jeor + activity + goal), protein/carbs/fat, fiber and water targets, plus an example day of eating with portions worked out to hit the targets. Supports no restrictions, vegetarian and vegan diets.
- **Workout logging.** Start the next workout in one tap, log weight and reps per set, see what you lifted last time, use the rest timer, add sets or exercises.
- **Exercise library.** 876 exercises with start/end photos, step-by-step instructions, muscles worked, a link to video demonstrations and your own history. You can search and filter by muscle, equipment and type.
- **Progress.** Workout history, a weekly streak, total weight lifted, and a body-weight log with a chart.

## Tech

Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS 4 · Prisma + Postgres · Nodemailer.

Exercise data and images come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is released into the public domain (Unlicense).

## Run locally

You need a Postgres database: the linked Neon project (`neon deploy` fills in `.env`) or a local Postgres.

```bash
npm install
cp .env.example .env      # set DATABASE_URL, DATABASE_URL_UNPOOLED and AUTH_SECRET
npm run setup             # creates the database tables
npm run dev               # http://localhost:3000
```

If no SMTP server is configured, development mode shows the sign-in code on screen and prints it to the terminal.

## Deploy (Vercel + Neon + SendGrid)

Vercel and Neon have free plans that are more than enough to get started.

### 1. Database: Neon
This repo is linked to a Neon project (`.neon`, `neon.ts`). With the [Neon CLI](https://neon.com/docs/cli) (`npm i -g neon`):

```bash
neon login
neon deploy      # applies neon.ts and writes DATABASE_URL + DATABASE_URL_UNPOOLED to .env
```

Without the CLI: in the Neon console click **Connect** and copy two connection strings, one with **Connection pooling on** (`DATABASE_URL`) and one with it **off** (`DATABASE_URL_UNPOOLED`).

The app connects through the pooled URL using `pg` + Prisma's driver adapter (`src/lib/db.ts`); migrations use the direct URL.

### 2. Email: SendGrid (sends the sign-in codes)
1. In SendGrid go to **Settings → Sender Authentication**. Either verify a single sender (the address the codes come from), or authenticate your domain for better deliverability.
2. **Settings → API Keys → Create API Key**: choose Restricted Access with only **Mail Send** enabled, and copy the key.

Any other SMTP provider works too (Brevo, Postmark, Amazon SES…); just change the `SMTP_*` values.

### 3. App: Vercel
1. Sign up at https://vercel.com with your GitHub account.
2. **Add New → Project**, import this repository. Framework is detected as Next.js; keep the defaults.
3. Under **Environment Variables** add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string from step 1 |
   | `DATABASE_URL_UNPOOLED` | Neon direct connection string from step 1 |
   | `AUTH_SECRET` | a long random string (`openssl rand -hex 32`, or any password generator, 40+ characters) |
   | `SMTP_HOST` | `smtp.sendgrid.net` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `apikey` (literally this word) |
   | `SMTP_PASS` | your SendGrid API key (`SG.…`) |
   | `MAIL_FROM` | `GymWise <no-reply@gymwise.co.za>` (an address on your SendGrid-verified domain) |
   | `ANTHROPIC_API_KEY` | optional — enables AI analysis of injury descriptions ([console.anthropic.com](https://console.anthropic.com)) |

4. Click **Deploy**. The build creates the database tables automatically (`prisma migrate deploy`). Your app is live at `https://<project>.vercel.app`, and every push to `main` redeploys it.

Optional: add your own domain under **Project → Settings → Domains**.

**Optional:** run `npm run images` to download all exercise images into `public/exercise-images`, commit them, then set `NEXT_PUBLIC_EXERCISE_IMAGE_BASE="/exercise-images"`. Images are then served from your own site instead of GitHub.

### Changing the database schema
Edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name <change>` against a development database and commit the new folder in `prisma/migrations`. It is applied in production on the next deploy.

## Project layout

```
data/exercises.json        exercise database (876 exercises)
prisma/schema.prisma       users, sessions, profiles, plans, workouts, sets, body weight
src/lib/planner.ts         training plan generator
src/lib/nutrition.ts       calorie/macro targets and meal plan
src/lib/auth.ts            email-code login and sessions
src/app/(app)/…            signed-in pages: today, plan, workout, exercises, nutrition, progress, profile
```

## Disclaimer

The plans and nutrition targets are general guidance, not medical advice.
