require('dotenv').config({ override: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { globalLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const routeNotFound = require('./middleware/routeNotFound');
const errorHandler = require('./middleware/errorHandler');
const compression = require('compression');

// Route imports
const healthRouter = require('./routes/healthRoutes');
const authRouter = require('./routes/authRoutes');
const profileRouter = require('./routes/profileRoutes');
const dailyLogRouter = require('./routes/dailyLogRoutes');
const adminRouter = require('./routes/adminRoutes');
const quranRouter = require('./routes/quranRoutes');
const hadithRouter = require('./routes/hadithRoutes');
const tasbihRouter = require('./routes/tasbihRoutes');
const calendarRouter = require('./routes/calendarRoutes');
const progressRouter = require('./routes/progressRoutes');

const config = require('./config/env');
const ALLOWED_ORIGINS = config.cors.allowedOrigins;

const app = express();

// Trust Proxy: Required for rate limiter behind proxies (e.g. Nginx, Load Balancers)
// Defaults to 1 if config is missing (trusts the first proxy hop)
const trustProxy = config.trustProxy || 1;
app.set('trust proxy', trustProxy);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null') return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.error('Blocked by CORS. Origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(compression());

app.use(globalLimiter);

app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/logs', dailyLogRouter);
app.use('/api/quran', quranRouter);
app.use('/api/hadith', hadithRouter);
app.use('/api/tasbih', tasbihRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/progress', progressRouter);

app.use('/', healthRouter);

app.use(routeNotFound);

app.use(errorHandler);

module.exports = app;

