// const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  // const fileStream = fs.createReadStream('input.txt');
  fileStream = process.stdin;

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    var header = Buffer.allocUnsafe(2);
    header.writeUInt16LE(line.length);
    process.stdout.write(header)
    process.stdout.write(line);
  }
}

processLineByLine();