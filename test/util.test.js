const expect = require('expect');
const mock = require('mock-require');
const util = mock.reRequire('../ring/util');

describe('Search Client', () => {
  it('Should return the value if client is present', () => {
    let ds = [];
    let c = {};
    ds.push({ client: c });
    let res = util.searchClient(c, ds);
    expect(res).toBeTruthy();
    expect(res).toMatchObject(c);
  });

  it('Should return undefined if client is not present', () => {
    let ds = [];
    let c = {};
    let res = util.searchClient(c, ds);
    expect(res).toBeFalsy();
  });
});

describe('searchClientByPriority', () => {
  it('Should return the value if client is present', () => {
    let ds = [];
    let c = { priority: 1 };
    ds.push(c);
    let res = util.searchClientByPriority(1, ds);
    expect(res).toBeTruthy();
    expect(res).toMatchObject(c);
    expect(res.priority).toBe(1);
  });

  it('Should return undefined if client is not present', () => {
    let ds = [];
    let c = { priority: 1 };
    ds.push(c);
    let res = util.searchClientByPriority(2, ds);
    expect(res).toBeFalsy();
  });
});

describe('searchClientById', () => {
  it('Should return the value if client is present', () => {
    let ds = [];
    let c = { id: 'asdl' };
    ds.push(c);
    let res = util.searchClientById('asdl', ds);
    expect(res).toBeTruthy();
    expect(res).toMatchObject(c);
  });

  it('Should return undefined if client is not present', () => {
    let ds = [];
    let c = { id: 'asdl' };
    ds.push(c);
    let res = util.searchClientById('NOTPRESENT', ds);
    expect(res).toBeFalsy();
  });
});

describe('broadcastMessage', () => {
  it('Should do nothing if no nodes are present in the cluster', () => {
    let ds = [];
    util.broadcastMessage(ds, 'hi');
  });

  it('Should broadcast message to each node', () => {
    let ds = [];
    let count = 0;
    let client = {
      write: () => {
        count++;
      }
    };
    ds.push({ client: client });
    util.broadcastMessage(ds, 'hi');
    expect(count).toBe(1);
  });
});
