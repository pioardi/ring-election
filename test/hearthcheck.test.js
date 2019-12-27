const expect = require('expect')
process.env.HEARTH_BEAT_CHECK_FREQUENCY = 1
process.env.MAX_INACTIVE_TIME = 3
const mock = require('mock-require')

describe('Hearth check', () => {
  it('Should be ok if no nodes are present in the ring', done => {
    let count = 0
    mock.reRequire('../ring/logger')
    mock('../ring/logger', {
      debug: () => {
        count++
      }
    })
    const hearthcheck = mock.reRequire('../ring/hearthcheck')
    hearthcheck(new Map(), [])
    setTimeout(() => {
      expect(count > 1).toBeTruthy()
      clearInterval()
      done()
    }, 20)
  })

  it('Should do an hearth check with correct frequency and remove nodes if needed', done => {
    let count = 0
    mock.stopAll()
    mock('../ring/partitioner', {
      rebalancePartitions: () => {
        count++
      }
    })
    const hearthcheck = mock.reRequire('../ring/hearthcheck')
    const ds = []
    ds.push({
      id: 'asdl',
      client: {
        write: () => {}
      }
    })
    const hearth = new Map()
    hearth.set('asdl', new Date())
    hearthcheck(hearth, ds)
    setTimeout(() => {
      clearInterval()
      expect(count).toBe(1)
      done()
    }, 20)
  })
})
