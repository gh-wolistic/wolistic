This is a [Next.js](https://nextjs.org) frontend for the Wolistic stack.

## Getting Started

First, configure env values:

```bash
copy .env.example .env.local
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

Run unit tests:

```bash
npm run test
```

The homepage calls the backend health endpoint at:

- `${NEXT_PUBLIC_API_BASE_URL}/api/v1/healthz`

You can edit the page at `app/page.tsx`. The page auto-updates as you edit the file.

## CORS Notes

The backend allows these origins by default (configured in `backend/.env` via `BACKEND_CORS_ORIGINS`):

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://rbbomxwgtjlziifkqkyv.supabase.co`

For production, set your deployed frontend domain in `BACKEND_CORS_ORIGINS`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
