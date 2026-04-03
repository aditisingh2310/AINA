const sanitizeInput = require('../middleware/sanitizeInput');

describe('sanitizeInput middleware', () => {
  it('strips html tags from strings', () => {
    const req = { body: { text: '<script>alert(1)</script> hello' }, query: {} };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.text.includes('<script>')).toBe(false);
  });

  it('removes control characters', () => {
    const req = { body: { text: 'hello\u0000\u001Fworld' }, query: {} };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.text).not.toContain('\u0000');
  });

  it('sanitizes nested objects', () => {
    const req = {
      body: { user: { name: '<b>Test</b>', email: 'test@example.com' } },
      query: {},
    };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.user.name).not.toContain('<b>');
    expect(req.body.user.email).toBe('test@example.com');
  });

  it('sanitizes arrays', () => {
    const req = {
      body: { items: ['<script>a</script>', 'clean'] },
      query: {},
    };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.items[0]).not.toContain('<script>');
    expect(req.body.items[1]).toBe('clean');
  });

  it('trims whitespace', () => {
    const req = { body: { text: '  hello  ' }, query: {} };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.text).toBe('hello');
  });

  it('leaves non-string values untouched', () => {
    const req = {
      body: { count: 42, active: true, data: null },
      query: {},
    };
    const res = {};
    sanitizeInput(req, res, () => {});
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.data).toBeNull();
  });
});
