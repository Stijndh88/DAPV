import * as migration_20261120_232958_initial from './20261120_232958_initial';
import * as migration_20261121_062928_feed_rules_and_breaks from './20261121_062928_feed_rules_and_breaks';

export const migrations = [
  {
    up: migration_20261120_232958_initial.up,
    down: migration_20261120_232958_initial.down,
    name: '20261120_232958_initial',
  },
  {
    up: migration_20261121_062928_feed_rules_and_breaks.up,
    down: migration_20261121_062928_feed_rules_and_breaks.down,
    name: '20261121_062928_feed_rules_and_breaks'
  },
];
