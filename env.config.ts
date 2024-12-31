import { loadEnvConfig } from '@next/env';

loadEnvConfig(
  `${process.cwd()}/env`,
  process.env.NODE_ENV === 'development',
  {
    info: x => console.log(x),
    error: x => console.error(x),
  },
  true,
);
