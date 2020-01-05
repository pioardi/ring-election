const expect = require('expect')
process.env.HEART_BEAT_FREQUENCY = 1
const mock = require('mock-require')
mock.stopAll()
const heartbeat = mock.reRequire('../ring/heartbeat')

describe('Heart beat', () => {
  it('Should send an heart beat with correct frequency', done => {
    let count = 0
    /* es-lint-disable no-unused-expressions */
    const client = {
      write: msg => {
        count++
      },
      writable: true
    }
    /* es-lint-enable no-unused-expressions */
    heartbeat(client, 'asdl')
    setTimeout(() => {
      expect(count >= 10).toBeTruthy()
      done()
    }, 200)
  })

  it('Should do an heart check with correct frequency', done => {
    let count = 0
    const client = {
      write: () => {
        count++
      },
      writable: false
    }
    heartbeat(client, 'asdl')
    setTimeout(() => {
      expect(count).toBe(0)
      done()
    }, 200)
  })
})
