const expect = require('expect')
const mock = require('mock-require')
const util = mock.reRequire('../ring/util')

describe('Search Client', () => {
  it('Should return the value if client is present', () => {
    const ds = []
    const c = {}
    ds.push({ client: c })
    const res = util.searchClient(c, ds)
    expect(res).toBeTruthy()
    expect(res).toMatchObject(c)
  })

  it('Should return undefined if client is not present', () => {
    const ds = []
    const c = {}
    const res = util.searchClient(c, ds)
    expect(res).toBeFalsy()
  })
})

describe('searchClientByPriority', () => {
  it('Should return the value if client is present', () => {
    const ds = []
    const c = { priority: 1 }
    ds.push(c)
    const res = util.searchClientByPriority(1, ds)
    expect(res).toBeTruthy()
    expect(res).toMatchObject(c)
    expect(res.priority).toBe(1)
  })

  it('Should return undefined if client is not present', () => {
    const ds = []
    const c = { priority: 1 }
    ds.push(c)
    const res = util.searchClientByPriority(2, ds)
    expect(res).toBeFalsy()
  })
})

describe('searchClientById', () => {
  it('Should return the value if client is present', () => {
    const ds = []
    const c = { id: 'asdl' }
    ds.push(c)
    const res = util.searchClientById('asdl', ds)
    expect(res).toBeTruthy()
    expect(res).toMatchObject(c)
  })

  it('Should return undefined if client is not present', () => {
    const ds = []
    const c = { id: 'asdl' }
    ds.push(c)
    const res = util.searchClientById('NOTPRESENT', ds)
    expect(res).toBeFalsy()
  })
})

describe('broadcastMessage', () => {
  it('Should do nothing if no nodes are present in the cluster', () => {
    const ds = []
    util.broadcastMessage(ds, 'hi')
  })

  it('Should broadcast message to each node', () => {
    const ds = []
    let count = 0
    const client = {
      write: () => {
        count++
      }
    }
    ds.push({ client: client })
    util.broadcastMessage(ds, 'hi')
    expect(count).toBe(1)
  })
})

describe('checkDiff', () => {
  it('Should return revoked partitions', () => {
    const old = [1, 2, 3, 4, 5]
    const assigned = [1, 2, 4, 6]
    const diff = util.checkDiff(old, assigned)
    expect(diff).toBeTruthy()
    expect(diff.length).toBe(2)
    expect(diff.includes(3)).toBeTruthy()
    expect(diff.includes(5)).toBeTruthy()
  })

  it('Should return assigned partitions', () => {
    const old = [1, 2, 3, 4, 5]
    const assigned = [1, 2, 4, 6, 7]
    const diff = util.checkDiff(assigned, old)
    expect(diff).toBeTruthy()
    expect(diff.length).toBe(2)
    expect(diff.includes(6)).toBeTruthy()
    expect(diff.includes(7)).toBeTruthy()
  })
})
