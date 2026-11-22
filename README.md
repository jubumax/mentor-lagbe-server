# MentorLagbe Server

The API behind **MentorLagbe**, a Smart Tuition & Mentorship Platform. It is built with Express 5,
MongoDB, BetterAuth, JWT and Stripe.

## Purpose

Lets tutors post tuitions, admins moderate them, students apply, and both tutors and students
upgrade to a Pro plan through Stripe.

## Live URL

- Server: https://mentorlagbe-server-eight.vercel.app
- Client: https://mentorlagbe-jubumax.vercel.app

## Admin credentials

- Email: `admin@mentorlagbe.com`
- Password: `Admin@12345`

Other demo accounts (created by `npm run seed`):

| Role    | Email                                                                                                 | Password        |
| ------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| Tutor   | `mahmudul.tutor@mentorlagbe.com`, `rafiq.tutor@mentorlagbe.com`, `nadia.tutor@mentorlagbe.com`        | `Tutor@12345`   |
| Student | `tasnim.student@mentorlagbe.com`, `farhan.student@mentorlagbe.com`, `sumaiya.student@mentorlagbe.com` | `Student@12345` |

These passwords are for demos only. Change them on a real site.

## Key features

- Email/password sign up and sign in with BetterAuth (Google optional), with student, tutor and admin roles.
  Only student and tutor can be chosen at sign up, and users can never change their own role or plan
- JWT-protected API with role middleware (`verifyStudent`, `verifyTutor`, `verifyAdmin`). The role is read
  from the database on every request
- Tuition posts with admin approval, an open/closed switch and a free-plan limit of 2 posts
- Server-side search, filters, sorting and pagination for the public tuition list
- Student applications with duplicate prevention, cancel, and tutor accept/reject
- Pro students are listed first in a tutor's applicant list
- Stripe Checkout, payment verification, a webhook and an admin transaction history
- Admin statistics, user role management and tuition moderation
- Seed script with demo accounts, 15 tuitions and sample applications

## Tech stack

- Node.js
- Express 5
- MongoDB (Atlas)
- BetterAuth
- JSON Web Tokens
- Stripe

## npm packages used

| Package         | Used for                              |
| --------------- | ------------------------------------- |
| `express`       | Web framework                         |
| `cors`          | Cross-origin requests from the client |
| `dotenv`        | Environment variables                 |
| `mongodb`       | Database driver                       |
| `better-auth`   | Authentication and sessions           |
| `jsonwebtoken`  | JWT for protected API routes          |
| `stripe`        | Payments                              |
| `nodemon` (dev) | Auto-restart during development       |

## Database collections

| Collection     | Purpose                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `user`         | Accounts, roles and plan (managed by BetterAuth, extended with `role`, `plan`, `phone`, `bio`) |
| `tuitions`     | Tuition posts with approval status and open/closed state                                       |
| `applications` | Student applications and their status                                                          |
| `payments`     | Stripe payment records                                                                         |

BetterAuth also keeps its own `session` and `account` collections.

## API overview

| Area         | Routes                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth         | `/api/auth/*` (BetterAuth), `POST /api/jwt`, `GET /api/jwt/verify`                                                                              |
| Users        | `GET /api/users/me`, `PATCH /api/users/profile`                                                                                                 |
| Tuitions     | public: `GET /api/tuitions`, `/featured`, `/:id`. Tutor: `POST /`, `GET /mine`, `GET /mine/:id`, `PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id` |
| Applications | student: `POST /`, `GET /mine`, `GET /check/:tuitionId`, `DELETE /:id`. Tutor: `GET /tutor`, `PATCH /:id/status`                                |
| Payments     | `POST /api/payments/checkout`, `POST /api/payments/verify`, `POST /api/payments/webhook`                                                        |
| Admin        | `GET /api/admin/stats`, `/users`, `/tuitions`, `/tuitions/:id`, `/transactions`. `PATCH /users/:id/role`, `/tuitions/:id/status`                |
| Public       | `GET /api/stats/public`, `GET /api/health`                                                                                                      |

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

| Variable                                     | What it is                                     |
| -------------------------------------------- | ---------------------------------------------- |
| `PORT`                                       | Local port (default 5000)                      |
| `CLIENT_URL`                                 | Allowed client origin(s), comma separated      |
| `MONGODB_URI`, `DB_NAME`                     | MongoDB Atlas connection                       |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`      | BetterAuth secret and this server's public URL |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | Optional Google sign in                        |
| `JWT_SECRET`, `JWT_EXPIRES_IN`               | JWT signing                                    |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe keys                                    |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`    | Optional: change the seeded admin account      |

## Run locally

```bash
npm install
npm run seed   # optional: demo accounts, tuitions and applications
npm run dev
```

The server starts on [http://localhost:5000](http://localhost:5000). Running `npm run seed` again is safe:
it only adds what is missing.

## Project structure

```
src/
  config/        env, database, auth, Stripe, CORS and constants
  middlewares/   verifyToken, role checks, not found and error handling
  routes/        One file per area, mounted in routes/index.js
  controllers/   Request handlers
  services/      Payment fulfilment
  utils/         JWT, validation, pagination, query helpers
  seed/          Demo data and seed script
api/index.js     Vercel entry point
```

## Deploy to Vercel

1. Import the repository in Vercel. `vercel.json` and `api/index.js` are already set up.
2. Add every variable from the table above, with `NODE_ENV=production`. Set `BETTER_AUTH_URL` to the
   deployed server URL and `CLIENT_URL` to the deployed client URL.
3. In MongoDB Atlas, allow access from anywhere (`0.0.0.0/0`) under Network Access.
4. In Stripe, add a webhook for `https://<your-server>/api/payments/webhook` and put its signing
   secret in `STRIPE_WEBHOOK_SECRET`.

---

© 2026 MentorLagbe — [@jubumax](https://www.linkedin.com/in/jubumax) • All rights reserved