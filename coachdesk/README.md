# CoachDesk

Personal training platform — workout builder, client messaging, and check-ins.

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Add environment variables
Copy `.env.example` to `.env` and fill in your values:
```
VITE_SUPABASE_URL=https://veaefircnwtwnskiymmv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_settings
```

### 3. Set up the database
- Go to your Supabase project → SQL Editor → New query
- Paste the contents of `supabase_schema.sql` and click Run

### 4. Set yourself as a trainer
After signing in for the first time, run this in Supabase SQL Editor (replace with your email):
```sql
update profiles set role = 'trainer' where email = 'your@email.com';
```

### 5. Run locally
```
npm run dev
```

## Deploy to Vercel
1. Push this repo to GitHub
2. Import the repo at vercel.com
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy!
