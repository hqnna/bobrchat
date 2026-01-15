import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2c54c9b6b7e056d5775e6c9e0eb347b@o4510704677683200.ingest.us.sentry.io/4510716823994368",

  tracesSampleRate: 1.0,

  enableLogs: true,
});
