// This script reads SAG (Systemanalyse und Programmentwicklung) format from stdin,
// extracts the text content from each record, and prints it to stdout.
// SAG format consists of records, where each record is prefixed by a 2-byte
// little-endian unsigned integer specifying the length of the record's body.

let recordBuffer = Buffer.alloc(64 * 1024); // Buffer for storing the record data.
let lengthHeaderBuffer = Buffer.alloc(2); // Buffer for storing the 2-byte length header.
let firstRecord = true; // Flag to track if the current record is the first one.

let currentRecordLength = 0; // Stores the length of the current record being processed.
let readingHeader = true; // Flag to indicate if we are currently trying to read the header or the body.
let headerBufferBytesRead = 0; // How many bytes of the header have been read so far
let recordBufferBytesRead = 0; // How many bytes of the record body have been read so far

// Error handling for stdin
process.stdin.on('error', (err) => {
  console.error("Error reading from stdin:", err.message);
  process.exit(1);
});

// Error handling for stdout
process.stdout.on('error', (err) => {
  // Node.js might not be able to print to stderr if stdout is broken (e.g. EPIPE)
  // but we try anyway.
  console.error("Error writing to stdout:", err.message);
  process.exit(1);
});

process.stdin.on('readable', () => {
  let chunk;
  // Loop to process available data as long as there's data and we can make progress
  while (null !== (chunk = process.stdin.read())) {
    let offset = 0; // Current position in the chunk

    while (offset < chunk.length) {
      if (readingHeader) {
        // Try to read the rest of the header from the current chunk
        const bytesToCopy = Math.min(chunk.length - offset, 2 - headerBufferBytesRead);
        chunk.copy(lengthHeaderBuffer, headerBufferBytesRead, offset, offset + bytesToCopy);
        headerBufferBytesRead += bytesToCopy;
        offset += bytesToCopy;

        if (headerBufferBytesRead === 2) {
          // Header fully read, parse length and prepare to read record body
          currentRecordLength = lengthHeaderBuffer.readUInt16LE(0); // SAG uses 2-byte little-endian for length
          readingHeader = false;
          recordBufferBytesRead = 0; // Reset for the new record body

          // Handle zero-length records: these are valid and mean an empty string,
          // which effectively means just printing a newline if it's not the first record.
          if (currentRecordLength === 0) {
            if (firstRecord) {
              firstRecord = false;
            } else {
              process.stdout.write("\n");
            }
            // After handling a zero-length record, we immediately look for the next header.
            readingHeader = true;
            headerBufferBytesRead = 0; // Reset header read state
          } else if (currentRecordLength > recordBuffer.length) {
            // Safety check: if record length exceeds buffer size, log error and stop.
            // This prevents a buffer overflow if the input data is malicious or malformed.
            console.error(`Record length ${currentRecordLength} exceeds buffer size ${recordBuffer.length}. Aborting.`);
            process.stdin.destroy(); // Stop reading further input.
            // No more processing should happen after this critical error.
            return;
          }
        }
      }

      // This block executes if we are trying to read the record body AND there's still data in the current chunk.
      // It's important that this is not an 'else if' to readingHeader, because readingHeader might change
      // from true to false within the same chunk processing iteration (if the header is completed).
      if (!readingHeader && offset < chunk.length && currentRecordLength > 0) {
        // Try to read the rest of the record body from the current chunk or subsequent chunks.
        const bytesToCopy = Math.min(chunk.length - offset, currentRecordLength - recordBufferBytesRead);
        chunk.copy(recordBuffer, recordBufferBytesRead, offset, offset + bytesToCopy);
        recordBufferBytesRead += bytesToCopy;
        offset += bytesToCopy;

        if (recordBufferBytesRead === currentRecordLength) {
          // Record body fully read, process it.
          if (firstRecord) {
            firstRecord = false;
          } else {
            process.stdout.write("\n"); // Print a newline before each record's content, except for the first.
          }
          process.stdout.write(recordBuffer.subarray(0, currentRecordLength)); // Write the actual record content.

          // After successfully processing a record, reset state to look for the next header.
          readingHeader = true;
          headerBufferBytesRead = 0;
          // currentRecordLength is implicitly reset when a new header is read.
        }
      }
    }
  }
  // If process.stdin.read() returns null, it means there's no more data *currently* available.
  // The 'readable' event will fire again when more data arrives, or 'end' will fire if the stream closes.
  // Partial reads (e.g., half a header, or part of a record body) are handled by preserving
  // headerBufferBytesRead, recordBufferBytesRead, and currentRecordLength across 'readable' events.
});

process.stdin.on('end', () => {
  // This event is fired when the input stream is closed (e.g., EOF).
  // No more 'readable' events will occur.
  // If there was any partially read data (e.g., an incomplete header or record body right at EOF),
  // it will be implicitly discarded. This is generally acceptable as the input would be malformed.
  // console.error("End of input stream reached."); // Optional: for debugging purposes.
});
