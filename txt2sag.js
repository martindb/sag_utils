// This script reads text lines from standard input, converts each line into a
// SAG (Systemanalyse und Programmentwicklung) format record, and prints it to standard output.
// The SAG format output consists of records where each record (line of text)
// is prefixed by a 2-byte little-endian unsigned integer specifying the length of the line.

const readline = require('readline'); // Used for reading input line by line.

// Add stdout error handler early to catch potential errors during script execution.
process.stdout.on('error', (err) => {
  // Node.js might not be able to print to stderr if stdout is broken (e.g. EPIPE)
  // but we try anyway.
  console.error("Error writing to stdout:", err.message);
  process.exit(1); // Exit with a non-zero status code.
});

async function processLineByLine() {
  // The readline.createInterface is configured to read from process.stdin.
  // crlfDelay: Infinity ensures that it handles various line endings correctly.
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  });

  try {
    // Process each line read from the input stream.
    for await (const line of rl) {
      // Create a 2-byte buffer for the length header.
      const header = Buffer.alloc(2);
      // Write the length of the current line as a 16-bit unsigned little-endian integer into the header.
      // Note: Node.js strings are UTF-8 by default. line.length gives the number of characters.
      // Buffer.byteLength(line, 'utf8') would give the number of bytes if characters could be multi-byte.
      // For SAG format, typically the length refers to the byte length of the string content.
      // Assuming line.length is sufficient, but for true SAG compatibility with arbitrary text,
      // byte length might be more appropriate. For this refactoring, we stick to line.length.
      header.writeUInt16LE(line.length); // Using character length as per original logic.

      // Write the 2-byte header to stdout.
      process.stdout.write(header);
      // Write the actual line content to stdout.
      process.stdout.write(line);
    }
  } catch (err) {
    // Catch errors from readline interface or stdin stream during the loop.
    console.error("Error processing input:", err.message);
    process.exit(1); // Exit with a non-zero status code.
  }
}

// Call the main processing function.
// If processLineByLine itself throws (e.g., an issue before the try/catch),
// Node.js will terminate and report an unhandled promise rejection.
processLineByLine().catch(err => {
  // This secondary catch is for any errors that might occur in processLineByLine
  // but outside the for-await loop's try-catch, or if rl.createInterface fails.
  // Though, readline.createInterface itself is not promise-based and unlikely to reject here.
  console.error("Unhandled error in processLineByLine:", err.message);
  process.exit(1);
});