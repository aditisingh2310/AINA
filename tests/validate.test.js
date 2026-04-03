const validate = require('../middleware/validate');
const { z } = require('zod');

describe('Validate middleware', () => {
  const testSchema = z.object({
    email: z.string().email(),
    age: z.number().int().min(0),
  });

  it('passes valid data through', (done) => {
    const req = { body: { email: 'test@example.com', age: 25 } };
    const res = {};
    const next = jest.fn(() => {
      expect(req.body.email).toBe('test@example.com');
      expect(req.body.age).toBe(25);
      done();
    });

    validate(testSchema)(req, res, next);
  });

  it('rejects invalid data with 400', (done) => {
    const req = { body: { email: 'not-an-email', age: 'not-a-number' } };
    const res = {
      status: jest.fn(function (code) {
        this.code = code;
        return this;
      }),
      json: jest.fn(function (body) {
        expect(this.code).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.details).toBeDefined();
        done();
      }),
    };
    const next = jest.fn();

    validate(testSchema)(req, res, next);
  });

  it('includes validation error details', (done) => {
    const req = { body: { email: 'invalid' } };
    const res = {
      status: jest.fn(function (code) {
        this.code = code;
        return this;
      }),
      json: jest.fn(function (body) {
        expect(body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.any(String),
              message: expect.any(String),
            }),
          ])
        );
        done();
      }),
    };
    const next = jest.fn();

    validate(testSchema)(req, res, next);
  });
});
