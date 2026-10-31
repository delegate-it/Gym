# Gym

A simple, mobile-first web app for planning and tracking gym training.

- **Email sign-in, no passwords.** Users enter their email and get a 6-digit code.
- **A personal training plan.** A 5-step questionnaire (body stats, goal, experience, days/time available, equipment, problem areas, lifestyle, diet) produces a plan based on proven programs:
  | Days/week | Split | Based on |
  |---|---|---|
  | 2 | Full Body A/B | Starting Strength / StrongLifts |
  | 3 | Full Body A/B/C | StrongLifts 5×5, GZCLP |
  | 4 | Upper/Lower | PHUL |
  | 5 | Upper/Lower + Push/Pull/Legs | PHAT-style hybrid |
  | 6 | Push/Pull/Legs ×2 | Reddit PPL |

  Sets, reps and rest follow the goal (strength, muscle, fat loss or fitness) and experience level. Exercises are picked to suit the available equipment (full gym, dumbbells or bodyweight), and ones that commonly aggravate knees, lower back or shoulders are swapped for safer options. The number of exercises fits the session length.
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

## Deploy for free (Vercel + Neon + Brevo)

All three services have free plans that are more than enough to get started.

### 1. Database: Neon
This repo is linked to a Neon project (`.neon`, `neon.ts`). With the [Neon CLI](https://neon.com/docs/cli) (`npm i -g neon`):

```bash
neon login
neon deploy      # applies neon.ts and writes DATABASE_URL + DATABASE_URL_UNPOOLED to .env
```

Without the CLI: in the Neon console click **Connect** and copy two connection strings, one with **Connection pooling on** (`DATABASE_URL`) and one with it **off** (`DATABASE_URL_UNPOOLED`).

The app connects through the pooled URL using `pg` + Prisma's driver adapter (`src/lib/db.ts`); migrations use the direct URL.

### 2. Email: Brevo (sends the sign-in codes)
1. Sign up at https://www.brevo.com (free: 300 emails/day).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: add the address emails should come from (e.g. `you@yourcompany.com`) and confirm it from your inbox.
3. **SMTP & API → SMTP**: note the login and click **Generate a new SMTP key**.

### 3. App: Vercel
1. Sign up at https://vercel.com with your GitHub account.
2. **Add New → Project**, import this repository. Framework is detected as Next.js; keep the defaults.
3. Under **Environment Variables** add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string from step 1 |
   | `DATABASE_URL_UNPOOLED` | Neon direct connection string from step 1 |
   | `AUTH_SECRET` | a long random string (`openssl rand -hex 32`, or any password generator, 40+ characters) |
   | `SMTP_HOST` | `smtp-relay.brevo.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | Brevo SMTP login |
   | `SMTP_PASS` | Brevo SMTP key |
   | `MAIL_FROM` | `Gym <the-sender-you-verified@yourcompany.com>` |

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
