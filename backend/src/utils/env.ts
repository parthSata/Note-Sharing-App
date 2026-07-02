import type { AppBindings, AppEnv } from '../env';

type ContextWithEnv = {
  env?: AppEnv['Bindings'];
};

export function getAppEnv(c: ContextWithEnv): AppBindings {
  return {
    ...process.env,
    ...(c.env ?? {}),
  };
}
