const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Create serial port connection
const port = new SerialPort({ path: 'COM4', baudRate: 9600 });

// Create a parser for reading data line-by-line
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Export parser to use in server.js
module.exports = parser;
