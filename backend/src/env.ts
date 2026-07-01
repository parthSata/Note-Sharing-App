export interface AppBindings {
  DATABASE_URL?: string;
  APP_ENV?: string;
}

export interface AppEnv {
  Bindings: AppBindings;
}