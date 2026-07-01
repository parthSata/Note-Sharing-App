export interface AppBindings {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  FRONTEND_URL?: string;
  APP_URL?: string;
  APP_ENV?: string;
}

export interface AppEnv {
  Bindings: AppBindings;
}
