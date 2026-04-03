const asyncHandler = require('../utils/asyncHandler');

describe('asyncHandler', () => {
  it('wraps async functions and catches errors', async () => {
    const testFn = jest.fn(async () => {
      throw new Error('Test error');
    });

    const wrapped = asyncHandler(testFn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(testFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles successful async functions', async () => {
    const testFn = jest.fn(async (req, res) => {
      res.json({ success: true });
    });

    const wrapped = asyncHandler(testFn);
    const req = {};
    const res = { json: jest.fn() };
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(testFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
