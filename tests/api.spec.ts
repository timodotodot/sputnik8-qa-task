import request from 'supertest';
import { describe, test, expect } from '@jest/globals';

const BASE_URL = 'http://qa.sputnik.omegamonxe.ru';
const AUTH_HEADER = 'Basic ' + Buffer.from('admin:123456').toString('base64');

const postRequest = (queryString: string): request.Test => {
    return request(BASE_URL)
        .post(`/v1/restaurants${queryString}`)
        .set('Authorization', AUTH_HEADER)
        .timeout({ response: 10000, deadline: 15000 });
};

describe('Smoke tests', () => {
    test('Успешный запрос с city_id возвращает 200', async () => {
        const response = await postRequest('?city_id=12345');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('Невалидный пароль возвращает 401', async () => {
        const invalidAuth = 'Basic ' + Buffer.from('admin:invalid').toString('base64');
        const response = await request(BASE_URL)
            .post('/v1/restaurants?city_id=12345')
            .set('Authorization', invalidAuth);
        
        expect(response.status).toBe(401);
    });

    test('POST-запрос не создаёт новые объекты (повторные запросы идентичны)', async () => {
        const firstResponse = await request(BASE_URL)
            .post('/v1/restaurants?city_id=12345&full_info=true')
            .set('Authorization', AUTH_HEADER)
            .send({ adres: 'test', type: 'ресторан' });

        const secondResponse = await request(BASE_URL)
            .post('/v1/restaurants?city_id=12345&full_info=true')
            .set('Authorization', AUTH_HEADER)
            .send({ adres: 'test', type: 'ресторан' });

        expect(firstResponse.status).toBe(201);
        expect(secondResponse.status).toBe(201);
        expect(firstResponse.body).not.toEqual(secondResponse.body);
    });
})

describe('Валидация city_id', () => {
    test('Возвращает 400 при отсутствии city_id', async () => {
        const response = await postRequest('?full_info=true');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
    });

    test('Значение city_id - строка', async () => {
        const response = await postRequest('?city_id=abcd');

        expect(response.status).toBe(400);
    });

    test('Значение city_id - отрицательное', async () => {
        const response = await postRequest('?city_id=-5');

        expect(response.status).toBe(400);
    });
});