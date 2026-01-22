const contactsService = require('../services/contacts');
const { buildError } = require('../middleware/errors');

/**
 * Very small validation layer without extra dependencies.
 * @param {any} body
 * @returns {{ok:true,value:{name:string,phone:string,email:string|null}}|{ok:false,errors:Array<{field:string,message:string}>}}
 */
function validateContactBody(body) {
  const errors = [];

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  let email =
    body?.email === undefined || body?.email === null
      ? null
      : (typeof body.email === 'string' ? body.email.trim() : '');

  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  if (!phone) errors.push({ field: 'phone', message: 'Phone is required' });

  // Very light email validation: allow empty/null; if provided must contain @.
  if (email !== null && email !== '' && !email.includes('@')) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }
  if (email === '') email = null;

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name, phone, email } };
}

/**
 * @param {any} value
 * @returns {number|null}
 */
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

class ContactsController {
  async list(req, res, next) {
    try {
      const contacts = await contactsService.list();
      return res.status(200).json({ data: contacts });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const validated = validateContactBody(req.body);
      if (!validated.ok) {
        const apiError = buildError(
          'validation_error',
          'Invalid request body',
          400,
          { fields: validated.errors }
        );
        const err = new Error('Validation failed');
        err.apiError = apiError;
        throw err;
      }

      const created = await contactsService.create(validated.value);
      return res.status(201).json({ data: created });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        const apiError = buildError(
          'validation_error',
          'Invalid contact id',
          400,
          { fields: [{ field: 'id', message: 'id must be a positive integer' }] }
        );
        const err = new Error('Invalid id');
        err.apiError = apiError;
        throw err;
      }

      const validated = validateContactBody(req.body);
      if (!validated.ok) {
        const apiError = buildError(
          'validation_error',
          'Invalid request body',
          400,
          { fields: validated.errors }
        );
        const err = new Error('Validation failed');
        err.apiError = apiError;
        throw err;
      }

      const updated = await contactsService.update(id, validated.value);
      if (!updated) {
        const apiError = buildError(
          'not_found',
          'Contact not found',
          404,
          { id }
        );
        const err = new Error('Not found');
        err.apiError = apiError;
        throw err;
      }

      return res.status(200).json({ data: updated });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        const apiError = buildError(
          'validation_error',
          'Invalid contact id',
          400,
          { fields: [{ field: 'id', message: 'id must be a positive integer' }] }
        );
        const err = new Error('Invalid id');
        err.apiError = apiError;
        throw err;
      }

      const deleted = await contactsService.remove(id);
      if (!deleted) {
        const apiError = buildError(
          'not_found',
          'Contact not found',
          404,
          { id }
        );
        const err = new Error('Not found');
        err.apiError = apiError;
        throw err;
      }

      return res.status(200).json({ data: { id, deleted: true } });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ContactsController();
