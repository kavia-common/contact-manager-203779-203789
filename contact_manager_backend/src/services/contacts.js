const { getDb, run, get, all } = require('../db/sqlite');

class ContactsService {
  /**
   * @returns {Promise<Array<{id:number,name:string,phone:string,email:string|null,created_at:string,updated_at:string}>>}
   */
  async list() {
    const db = await getDb();
    return all(
      db,
      `SELECT id, name, phone, email, created_at, updated_at
       FROM contacts
       ORDER BY id DESC`
    );
  }

  /**
   * @param {number} id
   * @returns {Promise<any|null>}
   */
  async getById(id) {
    const db = await getDb();
    return get(
      db,
      `SELECT id, name, phone, email, created_at, updated_at
       FROM contacts
       WHERE id = ?`,
      [id]
    );
  }

  /**
   * @param {{name:string, phone:string, email?:string|null}} data
   * @returns {Promise<any>}
   */
  async create(data) {
    const db = await getDb();
    const { name, phone, email = null } = data;

    const result = await run(
      db,
      `INSERT INTO contacts (name, phone, email, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      [name, phone, email]
    );

    return this.getById(result.lastID);
  }

  /**
   * @param {number} id
   * @param {{name:string, phone:string, email?:string|null}} data
   * @returns {Promise<any|null>}
   */
  async update(id, data) {
    const db = await getDb();
    const { name, phone, email = null } = data;

    const result = await run(
      db,
      `UPDATE contacts
       SET name = ?, phone = ?, email = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [name, phone, email, id]
    );

    if (result.changes === 0) return null;
    return this.getById(id);
  }

  /**
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async remove(id) {
    const db = await getDb();
    const result = await run(db, 'DELETE FROM contacts WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new ContactsService();
