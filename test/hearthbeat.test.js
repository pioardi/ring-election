const expect = require('expect');
process.env['HEARTH_BEAT_FREQUENCY'] = 1;
const mock = require('mock-require');
mock.stopAll();
const hearthbeat = mock.reRequire('../ring/hearthbeat');

describe('Hearth beat', () => {
  it('Should send an hearth beat with correct frequency', done => {
    let count = 0;
    let client = {
      write: msg => {
        msg;
        count++;
      },
      writable: true
    };
    hearthbeat(client, 'asdl');
    setTimeout(() => {
      expect(count >= 10).toBeTruthy();
      done();
    }, 200);
  });

  it('Should do an hearth check with correct frequency', done => {
    let count = 0;
    let client = {
      write: () => {
        count++;
      },
      writable: false
    };
    hearthbeat(client, 'asdl');
    setTimeout(() => {
      expect(count).toBe(0);
      done();
    }, 200);
  });
});
