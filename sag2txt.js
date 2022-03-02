var fs = require('fs');

var buf = Buffer.allocUnsafe(64*1024);
var header = Buffer.allocUnsafe(2);

var first = true;

while(true) {
  process.stdin.resume();
  var headerbytes = fs.readSync(0, header, 0, 2);
  var bufbytes = fs.readSync(0, buf, 0, header.readUInt16LE(0));
  process.stdin.pause();

  if (headerbytes != 2) {
    break;
  }
  if (bufbytes != header.readUInt16LE(0)) {
    break;
  }

  if (first) {
    first = false;
  } else {
    process.stdout.write("\n");
  }
  process.stdout.write(buf.subarray(0, header.readUInt16LE(0)));
}
