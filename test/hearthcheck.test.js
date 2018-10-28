const expect = require('expect');
process.env['HEARTH_BEAT_CHECK_FREQUENCY'] = 1;
process.env['MAX_INACTIVE_TIME'] = 3;
const mock = require('mock-require');


describe('Hearth beat', () => {
    
    it('Should be ok if no nodes are present in the ring', (done) => {
        let count = 0;
        mock.reRequire('../ring/logger');
        mock('../ring/logger', {
            debug : (msg) => {
                count++;
            }
        });
        const hearthcheck = mock.reRequire('../ring/hearthcheck')
        let ds = [];
        hearthcheck(new Map(),[]);
        setTimeout(()=> {
            expect(count > 1).toBeTruthy();
            done();
        },20)
    });

    it('Should do an hearth check with correct frequency and remove nodes if needed', (done) => {
        let count = 0;
        mock.stopAll();
        mock('../ring/partitioner' , {
            rebalancePartitions : (p1,p2) => {
                count++;
            }
        })
        const hearthcheck = mock.reRequire('../ring/hearthcheck')
        let ds = [];
        ds.push({
            id : 'asdl',
            client : {

            }
        })
        let hearth = new Map();
        hearth.set('asdl',new Date());
        hearthcheck(hearth,ds);
        setTimeout(()=> {
            expect(count).toBe(1);
            done();
        },20)
    });

});
