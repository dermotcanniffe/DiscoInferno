const path = require('path');
const { Pact } = require('@pact-foundation/pact');
const { expect } = require('chai');
const axios = require('axios');

const provider = new Pact({
  consumer: 'ConfigConsumer',
  provider: 'ConfigService',
  port: 1234,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'INFO',
});

describe('Pact with ConfigService', () => {
  before(() => provider.setup());

  after(() => provider.finalize());

  describe('when a call to the ConfigService is made', () => {
    before(() =>
      provider.addInteraction({
        state: 'there is a configuration available',
        uponReceiving: 'a request for configuration',
        withRequest: {
          method: 'GET',
          path: '/config',
          headers: { Accept: 'application/json' },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { key: 'value' },
        },
      })
    );

    it('should return the configuration', async () => {
      const response = await axios.get('http://localhost:1234/config');
      expect(response.status).to.eql(200);
      expect(response.data).to.eql({ key: 'value' });
    });
  });
});
