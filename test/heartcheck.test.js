const expect = require('expect')
process.env.HEART_BEAT_CHECK_FREQUENCY = 1
process.env.MAX_INACTIVE_TIME = 3
const mock = require('mock-require')

describe('Heart check', () => {
  it('Should be ok if no nodes are present in the ring', done => {
    let count = 0
    mock.reRequire('../ring/config')
    mock.reRequire('../ring/logger')
    mock('../ring/logger', {
      debug: () => {
        count++
      }
    })
    const heartcheck = mock.reRequire('../ring/heartcheck')
    heartcheck(new Map(), [])
    setTimeout(() => {
      expect(count > 1).toBeTruthy()
      clearInterval()
      done()
    }, 20)
  })

  it('Should do an heart check with correct frequency and remove nodes if needed', done => {
    let count = 0
    mock.stopAll()
    mock.reRequire('../ring/config')
    mock('../ring/partitioner', {
      rebalancePartitions: () => {
        count++
      }
    })
    const heartcheck = mock.reRequire('../ring/heartcheck')
    const ds = []
    ds.push({
      id: 'asdl',
      client: {
        write: () => {}
      }
    })
    const heart = new Map()
    heart.set('asdl', new Date())
    heartcheck(heart, ds)
    setTimeout(() => {
      clearInterval()
      expect(count).toBe(1)
      done()
    }, 20)
  })
})
