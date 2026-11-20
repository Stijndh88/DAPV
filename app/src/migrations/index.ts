import * as migration_20261120_232251_initial from './20261120_232251_initial';

export const migrations = [
  {
    up: migration_20261120_232251_initial.up,
    down: migration_20261120_232251_initial.down,
    name: '20261120_232251_initial'
  },
];
