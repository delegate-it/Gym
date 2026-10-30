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

Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS 4 · Prisma (SQLite locally, Postgres in production) · Nodemailer.

Exercise data and images come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is released into the public domain (Unlicense).

## Run locally

```bash
npm install
cp .env.example .env      # then set AUTH_SECRET
npm run setup             # creates the SQLite database
npm run dev               # http://localhost:3000
```

If no SMTP server is configured, development mode shows the sign-in code on screen and prints it to the terminal.

## Deploy

1. **Database:** in `prisma/schema.prisma`, change `provider = "sqlite"` to `"postgresql"` and set `DATABASE_URL` (Neon, Supabase, Railway, etc.). Then run `npx prisma db push`.
2. **Email:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` (e.g. Resend, Postmark, SendGrid, Amazon SES). In production, sign-in won't work without these.
3. **Secret:** set `AUTH_SECRET` to a long random value (`openssl rand -hex 32`).
4. `npm run build && npm start`, or deploy to Vercel or any Node host.

**Optional:** run `npm run images` to download all exercise images into `public/exercise-images`, then set `NEXT_PUBLIC_EXERCISE_IMAGE_BASE="/exercise-images"`, so images are served from your own site rather than GitHub.

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
