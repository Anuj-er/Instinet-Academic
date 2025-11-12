const Announcement = require('../../models/Announcement');

describe('Announcement model validation', () => {
  it('requires title, message, createdBy', async () => {
    const doc = new Announcement({});
    try {
      await doc.validate();
      throw new Error('Validation should have failed');
    } catch (err) {
      const fields = Object.keys(err.errors);
      expect(fields).toEqual(expect.arrayContaining(['title', 'message', 'createdBy']));
    }
  });

  it('sets createdAt default', () => {
    const fakeId = '507f1f77bcf86cd799439011'; // 24-char hex ObjectId string
    const doc = new Announcement({ title: 'T', message: 'M', createdBy: fakeId });
    expect(doc.createdAt).toBeInstanceOf(Date);
  });
});
