# AI Daily Planner - Project Structure

```text
ai-daily-planner/
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── AppBlocker.jsx
│   │   ├── Chatbot.jsx
│   │   ├── FloatingTimer.jsx
│   │   ├── Planner.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Analytics.jsx
│   │   ├── History.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── VerifyEmail.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   └── utils/
│       ├── api.js
│       ├── crypto.js
│       └── token.js
└── server/
    ├── package.json
    ├── package-lock.json
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── app.js
        ├── config/
        │   ├── database.js
        │   ├── email.js
        │   └── env.js
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── chat.controller.js
        │   └── schedule.controller.js
        ├── middleware/
        │   ├── auth.middleware.js
        │   ├── errorHandler.js
        │   ├── rateLimiter.js
        │   └── validate.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── chat.routes.js
        │   └── schedule.routes.js
        ├── services/
        │   ├── auth.service.js
        │   ├── email.service.js
        │   ├── schedule.service.js
        │   └── token.service.js
        └── utils/
            └── logger.js
```
