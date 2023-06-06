require('dotenv').config();
const { main, harvest, findPhoneNumber, writeFile, delay } = require('./scraper');

// Sample tests
describe('writeFile', () => {
    it('should write a file', () => {
        const collection = [{
            name: 'John Doe',
            age: 30
        }];
        const result = writeFile(collection);
        expect(result).toEqual(true);
    });

    it('should throw an error if the collection is empty', () => {
        const collection = [];
        expect(() => writeFile(collection)).toThrowError('Collection is empty');
    });

    it('should throw an error if the collection is not an array', () => {
        const collection = {};
        expect(() => writeFile(collection)).toThrowError('Collection is not an array');
    });
});

test('findPhoneNumber', () => {
     const input = 'Call me at +1 (555) 555-5555 or +1 (555) 555-5556';
     const output = '+1 (555) 555-5555, +1 (555) 555-5556';
     expect(findPhoneNumber(input)).toEqual(output);
});