FROM node:20-alpine AS builder

WORKDIR /app

# Build-time env vars (baked into the Next.js bundle — NEXT_PUBLIC_* are inlined
# at `npm run build`, NOT read at runtime, so they MUST be present here).
# Defaults match the live warroom-498513 project so a plain `docker build`
# (e.g. Cloud Run continuous deployment, which passes NO --build-args) still
# produces a working bundle. cloudbuild-frontend.yaml overrides these.
ARG NEXT_PUBLIC_API_URL=https://warroom-backend-git-262374983592.us-central1.run.app/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Firebase web config (public client identifiers — safe to bake into the bundle).
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCsW8E4bqQWUSzuXmYZobZgZXmLG1aNkiI
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=warroom-498513.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=warroom-498513
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=warroom-498513.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=262374983592
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:262374983592:web:efbc1df702a94720bc3f9d
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Final stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from the builder
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
