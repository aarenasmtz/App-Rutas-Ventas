import assert from 'assert';
import { cleanAddress, validCoordinates, mapsDestination, buildMapsUrl, normalizeNominatim } from '../utils/location';

// Test 1: Clean Address
assert.strictEqual(cleanAddress('  Av. México 123, null, León, undefined  '), 'Av. México 123, León');

// Test 2: Valid Coordinates
assert.strictEqual(validCoordinates(21.1234, -101.6854), true);
assert.strictEqual(validCoordinates(95, -101.6854), false);
assert.strictEqual(validCoordinates('21.1234', -101.6854), false);
assert.strictEqual(validCoordinates(null, undefined), false);

// Test 3: Maps Destination with coords
const clientWithCoords = { latitud: 21.1221, longitud: -101.6789, direccion: 'Calle 1' };
assert.strictEqual(mapsDestination(clientWithCoords), '21.1221,-101.6789');
assert.strictEqual(buildMapsUrl(clientWithCoords), 'https://www.google.com/maps/dir/?api=1&destination=21.1221%2C-101.6789&travelmode=driving');

// Test 4: Maps Destination with address fallback
const clientWithAddress = { direccion: 'Calle Madero 405', colonia: 'Centro', ciudad: 'León' };
assert.strictEqual(mapsDestination(clientWithAddress), 'Calle Madero 405, Centro, León');
assert.strictEqual(buildMapsUrl(clientWithAddress), 'https://www.google.com/maps/dir/?api=1&destination=Calle%20Madero%20405%2C%20Centro%2C%20Le%C3%B3n&travelmode=driving');

// Test 5: Empty location returns null
assert.strictEqual(mapsDestination({}), null);
assert.strictEqual(buildMapsUrl({}), null);

console.log('ALL GPS & LOCATION TESTS PASSED SUCCESSFULLY!');