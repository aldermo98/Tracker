const supertest = require('supertest');
const app = require('../server');

test('POST user tracking information', async()=>{
    await supertest(app)
        .post(`/track`)
        .send({
            latitude: 52.520007,
            longitude: 13.404954
        })
        .expect(200)
        .then(result=>{
            expect(result && 
                result.body.location == {
                    type: 'Point',
                coordinates: [52.520007, 13.404954]
                }
            )
        })
});

test('Get inactivated user information', async() => {
    await supertest(app)
        .get(`/stop-tracking`)
        .expect(200)
        .then(result => {
            expect(result.body.location).toEqual({
                    type: 'Point',
                    coordinates: [13.404954, 52.520007]
            });
            expect(result.body.isActive).toEqual(false);
        })
});

test('Get nearby users specified by distance', async() => {
    await supertest(app)
        .post(`/get-nearby-users`)
        .send({
            latitude: 52.520007,
            longitude: 13.404954,
            distance: 5000
        })
        .expect(200)
        .then(result => {
            expect(result &&
                result.body.length == 2 &&
                result.body[0].coordinates == [13.404955, 52.511912]
            )
        })
});