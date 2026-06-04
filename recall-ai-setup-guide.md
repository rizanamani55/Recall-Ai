# 🧠 Recall AI — Local Setup Guide
**Run it on your own machine in under 10 minutes**

---

## What You Need Before Starting

Make sure you have these installed:

- **Node.js** — version 18 or higher → [nodejs.org](https://nodejs.org)
- **npm** — comes with Node.js automatically
- **Git** → [git-scm.com](https://git-scm.com)

To check if you already have them, open your terminal and run:
```bash
node -v
npm -v
git --version
```
If all three print a version number, you're good to go.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/rendrlabs00-code/Recall-Ai.git
cd Recall-Ai
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

This will download all the packages the project needs. It may take a minute or two.

---

## Step 3 — Set Up Your Environment Variables

The app needs API keys to work. Create a file called `.env.local` in the root of the project folder:

```bash
# On Mac/Linux
touch .env.local

# On Windows (Command Prompt)
echo. > .env.local
```

Then open `.env.local` in any text editor and add the following. You only **need** the ones relevant to the features you want to use:

```env
# ── AI (required for quiz generation) ──────────────────
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# ── Authentication (required for login/accounts) ────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# ── Database (required for saving quizzes) ───────────────
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ── Rate limiting (optional) ─────────────────────────────
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Where to Get Each Key

**Anthropic API Key** (for AI quiz generation)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys** → click **Create Key**
4. Copy it into `ANTHROPIC_API_KEY`

**Clerk Keys** (for user authentication)
1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Go to **API Keys** in the dashboard
4. Copy both the **Publishable Key** and **Secret Key**

**Supabase Keys** (for database)
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **Project Settings → API**
3. Copy your **Project URL**, **anon/public key**, and **service_role key**
4. Run the migration files in `supabase/migrations/` to set up tables (see Step 4)

**Upstash Redis** (optional — only needed for rate limiting)
1. Go to [upstash.com](https://upstash.com) and create a free Redis database
2. Copy the **REST URL** and **REST Token** from the database dashboard

---

## Step 4 — Set Up the Database (Supabase)

If you're using Supabase, you need to run the database migrations.

Go to your Supabase project → **SQL Editor**, then open the files inside `supabase/migrations/` from the cloned repo and run them in order (sort by filename — they're numbered).

You can also use the Supabase CLI if you have it installed:
```bash
npx supabase db push
```

---

## Step 5 — Start the Development Server

```bash
npm run dev
```

Open your browser and go to:
```
http://localhost:3000
```

You should see Recall AI running locally. Paste any text and it will generate fill-in-the-blank questions for you.

---

## Step 6 — Try It Out

1. Open [http://localhost:3000](http://localhost:3000)
2. Paste any paragraph from a textbook, notes, or article into the input box
3. Click generate
4. Fill in the blanks that appear — the AI has turned your text into a study game

---

## Troubleshooting

**`npm install` fails or errors out**
Make sure you're running Node.js 18 or higher (`node -v`). If you're on an older version, download the latest LTS from [nodejs.org](https://nodejs.org).

**"Invalid API key" error in the browser**
Double-check your `.env.local` file. Make sure there are no extra spaces around the `=` sign and no quotes around the values unless they're in the key itself.

**Port 3000 is already in use**
Run on a different port:
```bash
npm run dev -- -p 3001
```
Then visit `http://localhost:3001` instead.

**Authentication not working (Clerk errors)**
Make sure your Clerk application has `http://localhost:3000` added as an allowed redirect URL in the Clerk dashboard under **Paths**.

**Database connection errors**
Check that your Supabase project is active (free tier projects pause after inactivity). Wake it up by visiting your Supabase dashboard.

---

## Building for Production (Optional)

To build a production-optimized version locally:

```bash
npm run build
npm run start
```

This runs on `http://localhost:3000` — useful for testing the production build before deploying.

---

## Deploying to Vercel (Recommended)

The easiest way to share your own version with others:

1. Push the repo to your GitHub account
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add all your environment variables in the Vercel dashboard (same keys as `.env.local`)
4. Click **Deploy**

Vercel will give you a live URL in about 2 minutes.

---

## Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 |
| AI | Anthropic Claude SDK |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| Rate Limiting | Upstash Redis |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Language | TypeScript |

---

## Need Help?

- Open an issue on GitHub: [github.com/rendrlabs00-code/Recall-Ai/issues](https://github.com/rendrlabs00-code/Recall-Ai/issues)
- Or reach out to **afterbell** on Instagram

---

*Built by afterbell 🔔*
