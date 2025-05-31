[![CI Tests](https://github.com/martindb/sag_utils/actions/workflows/ci.yml/badge.svg)](https://github.com/martindb/sag_utils/actions/workflows/ci.yml)

# SAG Utilities (sag_utils)

A collection of Node.js command-line utilities for converting data files between a Software AG-style binary format (SAG) and plain text.

## Description

These utilities are designed to process data where records in the SAG format are prefixed with a 2-byte little-endian integer specifying the length of the record that follows.

*   `sag2txt.js`: Reads SAG formatted data from stdin and converts it to plain text on stdout, with each record printed as a new line.
*   `txt2sag.js`: Reads plain text from stdin (line by line) and converts it to SAG format on stdout, prefixing each line's content with its length.

## SAG Format

The "SAG" format handled by these tools consists of sequential records. Each record has two parts:
1.  A **2-byte header**: This is a 16-bit unsigned integer, stored in little-endian byte order, representing the length (in bytes) of the data record that immediately follows.
2.  The **data record**: This is a sequence of bytes of the length specified in the header.

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 10.x or higher recommended, due to the use of `for await...of` in `txt2sag.js` and modern stream APIs)

## Usage

Both scripts read from standard input and write to standard output.

### `sag2txt.js`

Converts SAG formatted data to plain text.

**Syntax:**
```bash
node sag2txt.js < input.sag > output.txt
```

**Example:**
If `input.sag` contains a record representing "hello" (length 5) and then "world" (length 5):
`0500hello0500world` (hex representation of binary)

Running the command:
```bash
node sag2txt.js < input.sag
```
Would produce:
```
hello
world
```

### `txt2sag.js`

Converts plain text (line by line) to SAG formatted data.

**Syntax:**
```bash
node txt2sag.js < input.txt > output.sag
```

**Example:**
If `input.txt` contains:
```
hello
world
```

Running the command:
```bash
node txt2sag.js < input.txt > output.sag
```
Would produce a binary file `output.sag` where the content is equivalent to `0500hello0500world` (hex representation).

## Testing (Recommended)

Automated tests are highly recommended to ensure the utilities function correctly and to prevent regressions if changes are made in the future.

An automated test script, `run_tests.sh`, is provided to simplify this process. The script performs the following steps:
1.  Uses the `test1.txt` file as the initial input.
2.  Converts `test1.txt` to a temporary SAG file (`test1_generated.sag`) using `node txt2sag.js`.
3.  Converts `test1_generated.sag` back to a temporary text file (`test1_output.txt`) using `node sag2txt.js`.
4.  Compares `test1_output.txt` with the original `test1.txt` using `diff -u`.
5.  Reports whether the test passed or failed and cleans up temporary files.

To run the tests, simply execute the script from the root of the repository:

```bash
./run_tests.sh
```

Make sure the script has execute permissions (`chmod +x run_tests.sh`). If `diff` produces no output and the script reports success, the files are identical, and the test passes.

## Development Notes

This codebase has been refactored to incorporate several good software development practices:

*   **Modern JavaScript Features**:
    *   Utilizes `let` and `const` for variable declarations, improving scope management and preventing accidental re-declarations compared to `var`.
    *   Employs `async/await` in `txt2sag.js` for cleaner asynchronous code with `readline`.
*   **Robust Error Handling**:
    *   Implemented event handlers (`.on('error', ...)`) for input (`stdin`) and output (`stdout`) streams to catch and report issues.
    *   Used `try...catch` blocks for handling errors during file processing logic.
    *   Ensures the scripts exit with a non-zero status code on error.
*   **Code Clarity and Maintainability**:
    *   Improved variable names for better readability (e.g., `recordBuffer` instead of `buf`).
    *   Refactored input reading in `sag2txt.js` to use Node.js standard stream events (`'readable'`, `'end'`) instead of manual synchronous reads in a loop, making the I/O operations more idiomatic and non-blocking.
    *   Added detailed comments to explain the purpose of the scripts, the data format they handle, and complex logic sections.
*   **Safe Buffer Operations**:
    *   Switched from `Buffer.allocUnsafe` to `Buffer.alloc` to prevent potential data leaks by ensuring buffers are zero-filled upon allocation.
*   **Comprehensive Documentation**:
    *   The README provides a clear description of the utilities, the specific SAG format they work with, prerequisites, detailed usage instructions with examples, and suggestions for testing.
*   **Input/Output Conventions**:
    *   Scripts consistently use standard input (stdin) for reading data and standard output (stdout) for writing results, adhering to common command-line utility patterns. This allows them to be easily used in pipelines.
