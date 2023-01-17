/* eslint-disable no-constant-condition */
import { forever, waitForEvent } from 'abort-controller-x';

import { config } from './infrastructure/config';
import { entrypoint } from './infrastructure/entrypoint';
import { runWirenboard } from './infrastructure/external-resource-adapters/wirenboard';
import { initRethinkdbSchema } from './infrastructure/rethinkdb';
import {
  connectToRethinkDb as connectToRethinkDatabase,
  reconnectToRethinkDb as reconnectToRethinkDatabase,
} from './infrastructure/rethinkdb/common';
import { LightingRepository } from './infrastructure/rethinkdb/lighting/lighting-repository';
import { createHttpInterface } from './interfaces/http';

entrypoint(async ({ signal, logger, defer, fork }) => {
  const rethinkdbConnection = await connectToRethinkDatabase(
    signal,
    {
      host: config.rethinkdb.host,
      port: config.rethinkdb.port,
    },
    logger.child({ name: 'connectToRethinkDb' }),
  );

  fork(async (signal) => {
    while (true) {
      await waitForEvent(signal, rethinkdbConnection, 'close');
      await reconnectToRethinkDatabase(signal, rethinkdbConnection, logger.child({ name: 'reconnectToRethinkDb' }));
    }
  });

  defer(() => rethinkdbConnection.close());

  await initRethinkdbSchema(rethinkdbConnection);

  const lightingRepository = new LightingRepository(rethinkdbConnection, logger);

  const fastify = await createHttpInterface({
    config,
    rethinkdbConnection,
    logger: logger.child({ name: 'http-server' }),
    lightingRepository,
  });

  await fastify.listen(config.fastify.port, config.fastify.host);

  defer(() => fastify.close());

  const { stopWirenboard } = await runWirenboard({ config });

  defer(() => stopWirenboard());

  await forever(signal);
});